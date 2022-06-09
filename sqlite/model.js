import sql from './sql/index.js'



export function create({ database, struct }){
	return {
		createOne(args){
			return createDeep({
				...args,
				database,
				struct
			})
		},

		readOne(args = {}){
			return (
				readDeep({
					...args,
					take: args.last ? -1 : 1,
					database,
					struct
				})
			)[0]
		},

		readLast(){
			return (
				readDeep({
					...args,
					take: -1,
					database,
					struct
				})
			)[0]
		},

		readMany(args = {}){
			return readDeep({
				...args,
				database,
				struct
			})
		},

		readGrouped({ by, ...args }){
			return readDeep({
				...args,
				groupBy: by,
				database,
				struct
			})
		},

		update(args){
			return updateDeep({
				...args,
				database,
				struct
			})
		},

		delete(args = {}){
			return deleteDeep({
				...args,
				database,
				struct
			})
		},

		count(args = {}){
			return count({
				...args,
				database,
				struct
			})
		},

		iter(args = {}){
			return {
				length: count({
					...args,
					database,
					struct
				}),
				[Symbol.asyncIterator]() {
					let offset = 0
					let limit = Math.abs(args.take || Infinity)
					let queue = []
					
					return {
						next(){
							if(queue.length === 0){
								let slice = readDeep({
									...args,
									skip: offset,
									take: Math.min(limit, Math.sign(args.take || 1) * 1000),
									database,
									struct
								})
		
								if(slice.length === 0)
									return { done: true }

								limit -= slice.length
								offset += slice.length
								queue.push(...slice)
							}
	
							return {
								done: false,
								value: queue.shift()
							}
						}
					}
				}
			}
		}
	}
}



function createDeep({ database, struct, data: inputData, include = {}, conflict = {} }){
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

				let childInstance = createDeep({
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
		let [ existingItem ] = readDeep({
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

	let [ createdItem ] = readDeep({
		database,
		struct,
		include: inputData,
		where,
		take: -1
	})
	
	if(postInsertCreate.length > 0){
		for(let { struct: childStruct, data } of postInsertCreate){
			for(let item of data){
				createDeep({
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

function readDeep({ database, struct, forParent, where = {}, select, include, distinct, orderBy, groupBy, skip, take }){
	if(take === 0)
		return []
	
	orderBy = orderBy || { rowid: 'asc' }

	if(forParent){
		let { items: parentItems, struct: parentStruct } = forParent
		let relationToParent = parentStruct.nodes[struct.key]

		if(relationToParent.referenceKey){
			let ids = [].concat(
				...parentItems
					.map(row => row[parentStruct.table.idKey])
			)
			
			where[relationToParent.referenceKey] = { in: ids }
		}else{
			let ids = [].concat(
				...parentItems
					.map(row => row[struct.key])
			)

			where[struct.table.idKey] = { in: ids }
		}
	}

	let fields = []

	for(let [name, field] of Object.entries(struct.table.fields)){
		fields.push({ name, alias: name })
	}

	

	if(orderBy){
		let invert = take < 0

		for(let [key, dir] of Object.entries(orderBy)){
			if(invert)
				orderBy[key] = dir === 'asc' ? 'desc' : 'asc'
		}
	}


	let query = sql.select({
		table: struct.table.name,
		fields,
		where: composeFilter({ where, struct }),
		distinct,
		groupBy,
		orderBy,
		limit: Math.abs(take),
		offset: skip
	})

	let items = database.all(query)
		.map(row => makeRowIntegerSafe(row))
		.map(row => struct.decode(row))


	if(items.length === 0)
		return []

	if(include){
		for(let [key, selection] of Object.entries(include)){
			let childConf = struct.nodes[key]

			if(!childConf)
				continue

			let children = readDeep({
				database,
				struct: childConf,
				include: selection,
				forParent: {
					items,
					struct
				}
			})

			if(childConf.referenceKey){
				
			}else{
				for(let item of items){
					item[key] = children
						.find(child => child[childConf.table.idKey] === item[key])
				}
			}
		}
	}

	return items.map(item => unflatten({ struct, item }))
}

function updateDeep({ database, struct, data: inputData, where }){
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

				updateDeep({
					database,
					struct: childConf,
					data: value,
				})
			}

			include[key] = true
		}else if(fieldConf){
			tableData[key] = value
		}
	}

	database(struct.table.name)
		.update(struct.encode(tableData))
		.where(builder => composeFilter({ database, builder, where, struct }))
}

function deleteDeep({ database, struct, where = {} }){
	let items = readDeep({
		database,
		struct,
		where
	})

	database(struct.table.name)
		.where(builder => composeFilter({ database, builder, where, struct }))
		.delete()

	return items
}

function count({ database, struct, where, distinct }){
	let query

	if(distinct){
		query = database.count('*')
			.from(
				database(struct.table.name)
					.distinct(...distinct)
					.where(builder => composeFilter({ database, builder, where, struct }))
			)
	}else{
		query = database(struct.table.name)
			.count('*')
			.where(builder => composeFilter({ database, builder, where, struct }))
	}

	return Number(Object.values((query)[0])[0])
}

function composeFilter({ where, struct }){
	if(!where)
		return

	let { AND, OR, NOT } = where
	let conditions = []
	
	if(AND){
		for(let condition of AND){
			return [{
				text: `(%)`,
				join: `AND`,
				items: composeFilter({ where: condition, struct })
			}]
		}
	}

	if(OR){
		for(let condition of OR){
			return [{
				text: `(%)`,
				join: `OR`,
				items: composeFilter({ where: condition, struct })
			}]
		}
	}

	if(NOT){
		conditions.push({
			text: `NOT (%)`,
			join: `AND`,
			items: composeFilter({ where: NOT, struct })
		})
	}

	let fields = []
	let subqueries = []
	
	for(let [key, value] of Object.entries(where)){
		let fieldConf = struct.table.fields[key]
		let childConf = struct.nodes[key]
		let operator = '='

		if(value === null || value === undefined){
			fields.push({ 
				key, 
				operator: 'IS',
				value: null
			})
		}else if(childConf && typeof value === 'object'){
			if(value[childConf.table.idKey]){
				fields.push({ 
					key, 
					operator, 
					value: value[childConf.table.idKey]
				})
			}else{
				subqueries.push({
					key,
					operator,
					query: sql.select({
						table: childConf.table.name,
						fields: [childConf.table.idKey],
						where: composeFilter({ where: value, struct: childConf}),
						limit: 1
					})
				})
			}
		}else if(fieldConf){
			if(value.like){
				value = value.like
				operator = 'LIKE'
			}

			if(value.greaterThan){
				value = value.greaterThan
				operator = '>'
			}

			if(value.greaterOrEqual){
				value = value.greaterOrEqual
				operator = '>='
			}

			if(value.lessThan){
				value = value.lessThan
				operator = '<'
			}

			if(value.lessOrEqual){
				value = value.lessOrEqual
				operator = '<='
			}

			if(value.in){
				if(value.in.length === 1){
					value = value.in[0]
				}else{
					value = value.in
					operator = 'IN'
				}
			}

			fields.push({ 
				key, 
				operator, 
				value 
			})
		}
	}

	let encoded = struct.encode(
		fields.reduce(
			(data, { key, value }) => ({ ...data, [key]: value }),
			{}
		)
	)

	for(let { key, operator } of fields){
		conditions.push({
			text: `"${key}" ${operator} ?`,
			values: [encoded[key]]
		})
	}

	for(let { key, operator, query } of subqueries){
		conditions.push({
			text: `"${key}" ${operator} (%)`,
			items: [query]
		})
	}

	return conditions
}

function unflatten({ struct, item }){
	for(let [key, value] of Object.entries(item)){
		let childConf = struct.nodes[key]

		if(childConf && typeof value === 'number'){
			item[key] = { [childConf.table.idKey]: value }
		}
	}

	return item
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

		if(index.fields.every(field => data.hasOwnProperty(field))){
			for(let field of index.fields){
				uniques[field] = data[field]
			}
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

function makeRowIntegerSafe(row){
	for(let [key, value] of Object.entries(row)){
		if(typeof value === 'bigint' && value < 9007199254740991n)
			row[key] = Number(value)
	}

	return row
}