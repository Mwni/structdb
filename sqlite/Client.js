import fs from 'fs'
import DB from 'better-sqlite3'
import { Schema } from '@jxdb/core'
import * as sql from './sql.js'
import Node from './Node.js'


export default class Client{
	constructor({ file, schema }){
		this.file = file
		this.schema = new Schema(schema)
		this.#openDatabase()
		this.#createNodes()
	}

	#openDatabase(){
		let fresh = false
		
		if(!fs.existsSync(this.file)){
			fresh = true
		}

		this.db = new DB(this.file)

		if(fresh){
			for(let table of this.schema.tables){
				this.db.exec(sql.createTable(table))
			}

			for(let index of this.schema.indices){
				this.db.exec(sql.createIndex(index))
			}
		}
	}

	#createNodes(){
		for(let [key, schema] of this.schema.nodes){
			this[key] = new Node({
				client: this,
				table
			})
		}
	}
}