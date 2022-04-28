import { Schema } from '@jxdb/core'
import * as sql from './queries/SelectQuery.js'
import Node from './Node.js'
import Database from './Database.js'


export default class Client{
	constructor({ file, schema }){
		this.schema = new Schema(schema)
		this.database = new Database({ file, schema: this.schema })
		this.#createRoots()
	}

	#createRoots(){
		
	}
}