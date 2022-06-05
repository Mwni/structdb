export function create({ database, struct }){
	
	return {
		async createOne(args){
			return await createDeep({
				...args,
				database,
				struct
			})
		},

		async readOne(args = {}){
			return (
				await readDeep({
					...args,
					take: args.last ? -1 : 1,
					database,
					struct
				})
			)[0]
		},

		async readLast(){
			return (
				await readDeep({
					...args,
					take: -1,
					database,
					struct
				})
			)[0]
		},

		async readMany(args = {}){
			return await readDeep({
				...args,
				database,
				struct
			})
		},

		async readGrouped({ by, ...args }){
			return await readDeep({
				...args,
				groupBy: by,
				database,
				struct
			})
		},

		async update(args){
			return await updateDeep({
				...args,
				database,
				struct
			})
		},

		async delete(args = {}){
			return await deleteDeep({
				...args,
				database,
				struct
			})
		},

		async count(args = {}){
			return await count({
				...args,
				database,
				struct
			})
		},

		async iter(args = {}){
			return {
				[Symbol.asyncIterator]() {
					let offset = 0
					let limit = Math.abs(args.take || Infinity)
					let queue = []
					
					return {
						async next(){
							if(queue.length === 0){
								let slice = await readDeep({
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



async function createDeep({ database, struct, data: inputData, include = {}, conflict = {} }){
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

				let childInstance = await createDeep({
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
		let [ existingItem ] = await readDeep({
			database,
			struct,
			include: inputData,
			where,
			take: -1
		})

		if(existingItem && hasIdenticalData({ struct, item: existingItem, data: tableData }))
			return existingItem
	}


	await database
		.insert(struct.encode(tableData))
		.into(struct.table.name)
		.onConflict()
		.merge()


	let [ createdItem ] = await readDeep({
		database,
		struct,
		include: inputData,
		where,
		take: -1
	})
	
	if(postInsertCreate.length > 0){
		for(let { struct: childStruct, data } of postInsertCreate){
			for(let item of data){
				await createDeep({
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

async function readDeep({ database, struct, forParent, where = {}, select, include, distinct, orderBy, groupBy, skip, take }){
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

	let selectQuery = database.select()
		.from(struct.table.name)
		.where(builder => composeFilter({ database, builder, where, struct }))


	if(distinct){
		selectQuery = selectQuery.distinct(distinct)
	}

	if(orderBy){
		let invert = take < 0

		for(let [key, dir] of Object.entries(orderBy)){
			if(invert)
				dir = dir === 'asc' ? 'desc' : 'asc'
		
			selectQuery = selectQuery.orderBy(key, dir)
		}
	}

	if(groupBy){
		selectQuery = selectQuery.groupBy(groupBy)
	}

	if(skip){
		selectQuery = selectQuery.offset(skip)
	}
	
	if(take){
		selectQuery = selectQuery.limit(Math.abs(take))
	}
	
	let items = (await selectQuery)
		.map(row => makeRowIntegerSafe(row))
		.map(row => struct.decode(row))


	if(items.length === 0)
		return []
	

	if(include){
		for(let [key, selection] of Object.entries(include)){
			let childConf = struct.nodes[key]

			if(!childConf)
				continue

			let children = await readDeep({
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

async function updateDeep({ database, struct, data: inputData, where }){
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

				await updateDeep({
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

	await database(struct.table.name)
		.update(struct.encode(tableData))
		.where(builder => composeFilter({ database, builder, where, struct }))
}

async function deleteDeep({ database, struct, where = {} }){
	let items = await readDeep({
		database,
		struct,
		where
	})

	await database(struct.table.name)
		.where(builder => composeFilter({ database, builder, where, struct }))
		.delete()

	return items
}

async function count({ database, struct, where = {} }){
	let result = await database.count(struct.table.idKey)
		.from(struct.table.name)
		.where(builder => composeFilter({ database, builder, where, struct }))

	return Object.values(result[0])[0]
}

function composeFilter({ database, builder, where, struct }){
	let { AND, OR, NOT } = where
	
	if(AND){
		for(let condition of AND){
			builder.andWhere(builder => composeFilter({ database, builder, where: condition, struct }))
		}
		return
	}

	if(OR){
		for(let condition of OR){
			builder.orWhere(builder => composeFilter({ database, builder, where: condition, struct }))
		}
		return
	}

	if(NOT){
		builder.whereNot(builder => composeFilter({ database, builder, where: NOT, struct }))
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
				isNull: true
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
					query: database
						.select([childConf.table.idKey])
						.from(childConf.table.name)
						.where(builder => composeFilter({ database, builder, where: value, struct: childConf}))
						.limit(1)
				})
			}
		}else if(fieldConf){
			if(value.like){
				value = value.like
				operator = 'LIKE'
			}

			if(value.lessThanOrEqual){
				value = value.lessThanOrEqual
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

	for(let { key, operator, isNull } of fields){
		if(isNull)
			builder.whereNull(key)
		else
			builder.where(key, operator, encoded[key])
	}

	for(let { key, operator, query } of subqueries){
		builder.where(key, operator, query)
	}
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