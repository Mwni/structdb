import { Schema } from '@jxdb/core'
import * as sql from './queries/SelectQuery.js'
import Model from './Model.js'
import Database from './Database.js'


export default class Client{
	constructor({ file, schema }){
		this.schema = new Schema(schema)
		this.database = new Database({ file, schema: this.schema })
		this.models = {}
		this.#compileModels()
		this.#exposeRoots()
	}

	#compileModels(){
		for(let root of this.schema.roots){
			this.models[root.key] = new Model({
				database: this.database,
				config: root,
			})
		}
	}

	#exposeRoots(){
		for(let [key, CompiledModel] of Object.entries(this.models)){
			this[key] = new CompiledModel()
		}
	}
}