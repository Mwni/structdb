import { generate as generateStruct } from './struct.js'
import { open as openDatabase } from './database.js'
import { construct as constructTables } from './construction.js'
import { create as createModel } from './model/index.js'
import databaseCodecs from './codecs/index.js'


export function open({ file, schema, codecs = [], ...options }){
	let { struct, tables } = generateStruct({ schema, codecs: [...databaseCodecs, ...codecs] })
	let database = openDatabase({ file, ...options })
	let models = {}

	if(database.blank){
		constructTables({ database, tables })
	}

	for(let [key, node] of Object.entries(struct.nodes)){
		models[key] = createModel({ database, struct: node })
	}

	return {
		file,
		database,
		...models, 

		close(){
			database.close()
		},
	
		compact(){
			database.compact()
		},
	
		async tx(executor){
			return await database.tx(executor)
		},
	}
}