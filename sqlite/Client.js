import fs from 'fs'
import DB from 'better-sqlite3'
import { Model } from '@crisma/core'
import * as sql from './sql.js'


export default class Client{
	constructor({ file, schema }){
		this.file = file
		this.model = new Model(schema)
		this.openDatabase()
	}

	openDatabase(){
		let schema = this.model.schema
		let fresh = false
		
		if(!fs.existsSync(this.file)){
			fresh = true
		}

		this.db = new DB(this.file)

		if(fresh){
			for(let table of schema.tables){
				this.db.exec(sql.createTable(table))
			}

			for(let index of schema.indices){
				this.db.exec(sql.createIndex(index))
			}
		}
	}
}