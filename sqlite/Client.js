import { parse as parseSchema } from './schema.js'
import { open as openDatabase } from './database.js'
import { construct as constructTables } from './construction.js'
import { create as createModel } from './model.js'



export function open({ file, schema, ...options }){
	let { tree, tables } = parseSchema(schema)
	let database = openDatabase({ file, ...options })

	if(database.blank){
		constructTables({ database, tables })
	}

	for(let [key, config] of Object.entries(tree.children)){
		this[key] = createModel({ database, config })
	}

	return {
		async close(){
			database.close()
		},
	
		async compact(){
			database.compact()
		},
	
		async tx(executor){
			return await database.tx(async () => await executor(this))
		},
	}
}