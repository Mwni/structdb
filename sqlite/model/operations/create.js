import sql from '../../sql/index.js'
import { read } from './read.js'
import { unflatten } from '../common.js'


export function createOne({ database, struct, data: inputData, include = {} }){
	let tableData = {}
	let postInsertCreate = []

	for(let [key, value] of Object.entries(inputData)){
		let childConf = struct.nodes[key]
		let fieldConf = struct.table.fields[key]

		if(childConf && value){
			if(childConf.many){
				if(!Array.isArray(value)){
					throw new TypeError(`field "${key}" has to be an array, as defined in the schema`)
				}

				postInsertCreate.push({
					struct: childConf,
					data: value
				})
			}else{
				if(typeof value !== 'object'){
					throw new TypeError(`field "${key}" has to be a object, as defined in the schema`)
				}

				let childInstance = createOne({
					database,
					struct: childConf,
					data: value,
				})
	
				tableData[key] = childInstance[childConf.table.idKey]
			}

			include[key] = true
		}else if(fieldConf){
			tableData[key] = value
		}
	}

	let where = unflatten({
		struct,
		item: pullUniques({ struct, data: tableData })
	})

	if(Object.keys(where).length > 0){
		let [ existingItem ] = read({
			database,
			struct,
			include: inputData,
			where,
			take: -1
		})

		if(existingItem && hasIdenticalData({ struct, item: existingItem, data: tableData }))
			return existingItem
	}

	database.run(
		sql.upsert({
			table: struct.table.name,
			data: struct.encode(tableData)
		})
	)

	let [ createdItem ] = read({
		database,
		struct,
		include: inputData,
		where,
		orderBy: {
			[struct.table.idKey]: 'desc'
		},
		take: 1
	})
	
	if(postInsertCreate.length > 0){
		for(let { struct: childStruct, data } of postInsertCreate){
			for(let item of data){
				createOne({
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

function hasIdenticalData({ struct, item, data }){
	for(let [key, value] of Object.entries(data)){
		let childConf = struct.nodes[key]

		if(item[key] == null){
			if(value != null)
				return false
		}else{
			if(childConf){
				if(item[key][childConf.table.idKey] !== value)
					return false
			}else{
				if(item[key] !== value)
					return false
			}
		}
	}

	return true
}