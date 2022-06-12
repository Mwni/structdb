import sql from '../../sql/index.js'
import { read } from './read.js'
import { composeFilter } from '../common.js'


export function update({ database, struct, data: inputData, where, limit }){
	let tableData = {}

	for(let [key, value] of Object.entries(inputData)){
		let childConf = struct.nodes[key]
		let fieldConf = struct.table.fields[key]

		if(childConf && value){
			if(childConf.many){
				if(!Array.isArray(value)){
					throw new TypeError(`field "${key}" has to be an array, as defined in the schema`)
				}

				// todo
			}else{
				if(typeof value !== 'object'){
					throw new TypeError(`field "${key}" has to be a object, as defined in the schema`)
				}

				throw Error(`nested updates not yet implemented`)

				/*update({
					database,
					struct: childConf,
					data: value,
					where: 
				})*/
			}

			include[key] = true
		}else if(fieldConf){
			tableData[key] = value
		}
	}

	database.run(
		sql.update({
			table: struct.table.name,
			data: struct.encode(tableData),
			where: composeFilter({ where, struct }),
			limit
		})
	)

	return read({
		database,
		struct,
		where: {
			...where,
			...tableData
		},
		include: inputData
	})
}


