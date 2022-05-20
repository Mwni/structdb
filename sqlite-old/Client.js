import { Schema } from '@structdb/core'
import * as sql from './queries/SelectQuery.js'
import Database from './Database.js'
import View from './models/View.js'


export default class Client{
	#schema
	#database
	#model

	constructor({ file, schema, journalMode }){
		this.#schema = new Schema(schema)
		this.#database = new Database({ file, schema: this.#schema, journalMode })
		this.#exposeViews()
	}

	async close(){
		this.#database.close()
	}

	async compact(){
		this.#database.compact()
	}

	async tx(executor){
		return await this.#database.tx(async () => await executor(this))
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