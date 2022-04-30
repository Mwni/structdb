import { Schema } from '@jxdb/core'
import * as sql from './queries/SelectQuery.js'
import compileModel from './Model.js'
import Database from './Database.js'


export default class Client{
	#schema
	#database
	#model

	constructor({ file, schema }){
		this.#schema = new Schema(schema)
		this.#database = new Database({ file, schema: this.#schema })
		this.#compileModel()
		this.#exposeRoots()
	}

	async close(){
		this.#database.close()
	}

	#compileModel(){
		let { Instance } = compileModel({
			database: this.#database,
			config: this.#schema.tree
		})

		this.#model = new Instance({})
	}

	#exposeRoots(){
		for(let key of Object.keys(this.#schema.tree.children)){
			this[key] = this.#model[key]
		}

		console.log(this)
	}
}