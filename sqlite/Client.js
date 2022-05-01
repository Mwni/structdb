import { Schema } from '@jxdb/core'
import * as sql from './queries/SelectQuery.js'
import Database from './Database.js'
import View from './models/View.js'


export default class Client{
	#schema
	#database
	#model

	constructor({ file, schema }){
		this.#schema = new Schema(schema)
		this.#database = new Database({ file, schema: this.#schema })
		this.#exposeViews()
	}

	async close(){
		this.#database.close()
	}

	#exposeViews(){
		for(let [key, config] of Object.entries(this.#schema.tree.children)){
			this[key] = new View({
				database: this.#database,
				config
			})
		}
	}
}