import fs from 'fs'
import NativeDB from 'better-sqlite3'
import { table } from 'console'
import CreateTableQuery from './queries/CreateTableQuery.js'
import CreateIndexQuery from './queries/CreateIndexQuery.js'


export default class Database{
	constructor({ file, schema }){
		this.file = file
		this.schema = schema
		this.#open()
	}

	run(query){
		console.log(query.sql())
		return this.connection
			.prepare(query.sql())
			.run(...query.values())
	}

	get(query){
		console.log(query.sql())
		return this.connection
			.prepare(query.sql())
			.get(...query.values())
	}

	#open(){
		let startedBlank = !fs.existsSync(this.file)

		try{
			this.connection = new NativeDB(this.file)

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

		for(let { key, type, required, id } of schema.fields){
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
				type,
				notNull,
				primary,
				autoincrement,
			})
		}

		this.run(
			new CreateTableQuery(schema.name)
				.fields(fields)
		)

		for(let { name, unique, fields } of schema.indices){
			this.run(
				new CreateIndexQuery(name, unique)
					.on(schema.name)
					.fields(fields)
			)
		}
	}
}