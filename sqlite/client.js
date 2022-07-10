import { generate as generateStruct } from './struct.js'
import { open as openDatabase, tracing as wrapTracing } from './database.js'
import { construct as constructTables } from './construction.js'
import { create as createModel } from './model/index.js'
import databaseCodecs from './codecs/index.js'


export function open({ file, schema, codecs = [], ...options }){
	let { struct, tables } = generateStruct({ schema, codecs: [...databaseCodecs, ...codecs] })
	let models = {}
	let database = {
		write: openDatabase({ file, ...options }),
		read: openDatabase({ file, ...options, readonly: true })
	}

	if(options.debug){
		database.write = wrapTracing(database.write)
		database.read = wrapTracing(database.read)
	}

	if(database.blank){
		constructTables({ 
			database: database.write,
			tables 
		})
	}

	for(let [key, node] of Object.entries(struct.nodes)){
		models[key] = createModel({ database, struct: node })
	}


	return {
		file,
		database,
		...models, 

		close(){
			database.write.close()
			database.read.close()
		},
	
		compact(){
			database.write.compact()
		},
	
		tx(executor){
			return database.write.tx(executor)
		},
	}
}