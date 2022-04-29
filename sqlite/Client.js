import { Schema } from '@jxdb/core'
import * as sql from './queries/SelectQuery.js'
import Model from './Model.js'
import Database from './Database.js'


export default class Client{
	constructor({ file, schema }){
		this.schema = new Schema(schema)
		this.database = new Database({ file, schema: this.schema })
		this.#createRoots()
	}

	#createRoots(){
		for(let root of this.schema.roots){
			this.model = new Model(root)
		}
	}
}