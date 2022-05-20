import fs from 'fs'
import NativeDB from 'better-sqlite3'
import { table } from 'console'
import CreateTableQuery from './queries/CreateTableQuery.js'
import CreateIndexQuery from './queries/CreateIndexQuery.js'

const typeMap = {
	"integer": "INTEGER",
	"string": "TEXT",
	"number": "REAL",
	"boolean": "INTEGER",
	"blob": "BLOB",
	"any": "TEXT"
}


export default class Database{
	#inTx

	constructor({ file, schema, journalMode }){
		this.file = file
		this.schema = schema
		this.journalMode = journalMode
		this.connection = null
		this.#open()
	}

	close(){
		this.connection.close()
	}

	compact(){
		this.connection.pragma('wal_checkpoint(TRUNCATE)')
	}

	tx(executor){
		if(this.#inTx)
			return executor()

		this.connection.exec('BEGIN IMMEDIATE')
		this.#inTx = true
		
		try{
			var ret = executor()

			if(ret instanceof Promise){
				ret
					.then(ret => {
						this.connection.exec('COMMIT')
					})
					.catch(error => {
						throw error
					})
			}else{
				this.connection.exec('COMMIT')
			}
		}catch(error){
			this.connection.exec('ROLLBACK')

			throw error
		}finally{
			this.#inTx = false
		}

		return ret
	}

	run(query){
		let { sql, data } = query.render()

		return this.connection
			.prepare(sql)
			.run(data)
	}

	get(query){
		let { sql, data } = query.render()

		return this.connection
			.prepare(sql)
			.get(data)
	}

	all(query){
		let { sql, data } = query.render()

		return this.connection
			.prepare(sql)
			.all(data)
	}

	#open(){
		let startedBlank = !fs.existsSync(this.file)

		try{
			this.connection = new NativeDB(this.file)

			if(this.journalMode){
				this.connection.pragma(`journal_mode = ${this.journalMode}`)
			}

			if(startedBlank)
				this.#construct()
		}catch(error){
			this.connection.close()

			if(startedBlank){
				fs.unlinkSync(this.file)
			}

			throw error
		}
	}

	#construct(){
		for(let table of this.schema.tables){
			this.#constructTable(table)
		}
	}

	#constructTable(schema){
		let fields = []

		for(let { key, type, required, id, default: defaultValue } of Object.values(schema.fields)){
			let primary = false
			let autoincrement = false
			let notNull = required

			if(id){
				primary = true
				notNull = true
				autoincrement = !required
			}

			fields.push({
				name: key,
				type: typeMap[type],
				notNull,
				primary,
				autoincrement,
				default: defaultValue
			})
		}

		this.run(
			new CreateTableQuery()
				.name(schema.name)
				.fields(fields)
		)

		for(let { name, unique, fields } of schema.indices){
			this.run(
				new CreateIndexQuery()
					.name(name)
					.unique(unique)
					.on(schema.name)
					.fields(fields)
			)
		}
	}
}