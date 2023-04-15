import { generate as generateStruct } from './struct.js'
import { open as openDatabase } from './database.js'
import { create as createModel } from './model/index.js'
import databaseCodecs from './codecs/index.js'


export function open({ credentials, schema, codecs = [], ...options }){
	let { struct } = generateStruct({ schema, codecs: [...databaseCodecs, ...codecs] })
	let database = openDatabase({ ...options, ...credentials })
	let models = {}

	for(let [key, node] of Object.entries(struct.nodes)){
		models[key] = createModel({ database, struct: node })
	}

	return {
		database,
		...models, 

		close(){
			database.close()
		},
	
		tx(executor){
			return database.tx(executor)
		},
	}
}