import sql from '../../sql/index.js'
import { read } from './read.js'
import { unflatten } from '../common.js'


export async function createOne({ database, struct, data: inputData, include = {}, returnUnchanged = true }){
	let tableData = {}
	let nodes = []
	let postInsertCreate = []

	for(let [key, value] of Object.entries(inputData)){
		let childConf = struct.nodes[key]
		let fieldConf = struct.table.fields[key]

		if(childConf && value){
			if(childConf.many){
				if(!Array.isArray(value)){
					throw new TypeError(`The field "${key}" has to be an array, as defined in the schema`)
				}

				postInsertCreate.push({
					struct: childConf,
					data: value
				})
			}else{
				if(typeof value !== 'object'){
					throw new TypeError(`The field "${key}" has to be a object, as defined in the schema`)
				}

				//if(value[childConf.table.idKey] !== undefined){
				//	tableData[key] = value[childConf.table.idKey]
				//}else{
					nodes.push({
						key,
						struct: childConf,
						value
					})
				//}
			}

			include[key] = true
		}else if(fieldConf){
			tableData[key] = value
		}else{
			throw new Error(`The field "${key}" is not defined in the schema`)
		}
	}

	for(let node of nodes){
		let childInstance = await createOne({
			database,
			struct: node.struct,
			data: node.value,
			returnUnchanged: true
		})

		tableData[node.key] = childInstance[node.struct.table.idKey]
	}

	let where = unflatten({
		struct,
		item: pullUniques({ struct, data: tableData })
	})

	if(Object.keys(where).length > 0){
		let [ existingItem ] = await read({
			database,
			struct,
			where,
			take: -1
		})

		if(existingItem)
			return returnUnchanged
				? existingItem
				: undefined
	}

	let insertId = await database.insert(
		sql.upsert({
			table: struct.table.name,
			data: struct.encode(tableData)
		})
	)

	let [ createdItem ] = await read({
		database,
		struct,
		include: inputData,
		where: {
			[struct.table.idKey]: insertId
		},
		take: 1
	})
	
	if(postInsertCreate.length > 0){
		for(let { struct: childStruct, data } of postInsertCreate){
			for(let item of data){
				await createOne({
					database,
					struct: childStruct,
					data: {
						...item,
						[childStruct.referenceKey]: createdItem
					}
				})
			}
		}
	}

	return createdItem
}


function pullUniques({ struct, data }){
	let uniques = {}

	for(let [key, value] of Object.entries(data)){
		if(struct.table.fields[key].id)
			uniques[key] = value
	}

	for(let index of struct.table.indices){
		if(!index.unique)
			continue

		for(let key of index.fields){
			if(data.hasOwnProperty(key))
				uniques[key] = data[key]
		}
	}

	return uniques
}