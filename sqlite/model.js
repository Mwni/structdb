export function create({ database, struct }){
	
	return {
		async createOne(args){
			return await createDeep({
				...args,
				database,
				struct
			})
		},

		async readOne(args){
			return (
				await readDeep({
					...args,
					take: args.last ? -1 : 1,
					database,
					struct
				})
			)[0]
		},

		async readMany(args){
			return await readDeep({
				...args,
				database,
				struct
			})
		},

		async iter(args){
			return {
				[Symbol.asyncIterator]() {
					let offset = 0
					let limit = Math.abs(args.take || Infinity)
					
					return {
						async next(){
							let slice = await readDeep({
								...args,
								skip: offset++,
								take: Math.sign(args.take || 1),
								database,
								struct
							})
	
							if(slice.length === 0 || --limit === 0)
								return { done: true }
	
							return {
								done: false,
								value: slice[0]
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
	let postInsertWhere = {}
	let insertQuery = qb.upsert()
		.into(struct.table.name)

	for(let [key, value] of Object.entries(inputData)){
		let childConf = struct.nodes[key]
		let fieldConf = struct.table.fields[key]

		if(childConf && value){
			let childInstance = await createDeep({
				database,
				struct: childConf,
				include: {},
				data: value,
			})

			tableData[key] = childInstance[childConf.table.idKey]
			include[key] = true
		}else if(fieldConf){
			tableData[key] = value
		}
	}

	database.run(
		insertQuery
			.setFields(
				struct.encode(tableData)
			)
	)

	for(let key of Object.keys(tableData)){
		let field = struct.table.fields[key]
		
		if(field.id || field.unique)
			postInsertWhere[key] = tableData[key]
	}

	return (await readDeep({
		database,
		struct,
		include: inputData,
		where: postInsertWhere,
		take: -1
	}))[0]
}

async function readDeep({ database, struct, forParent, where = {}, select, include, distinct, orderBy, skip, take }){
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
	
	let selectQuery = qb.select()
		.from(struct.table.name)
		.where(composeFilter({ where, struct }))


	if(distinct){
		selectQuery = selectQuery
			.fields(distinct)
			.distinct()
	}

	if(orderBy){
		let invert = take < 0

		for(let [key, dir] of Object.entries(orderBy)){
			let asc = dir === 'asc'
			let finalAsc = invert ? !asc : asc
			
			selectQuery = selectQuery.order(key, finalAsc)
		}
	}

	if(skip){
		selectQuery = selectQuery.offset(skip)
	}
	
	if(take){
		selectQuery = selectQuery.limit(Math.abs(take))
	}


	let items = database.all(selectQuery)
		.map(row => struct.decode(row))
	

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

	return items
}

function composeFilter({ where, struct }){
	let expr = qb.expr()
	let { AND, OR } = where
	
	if(AND){
		for(let condition of AND){
			expr = expr.and(composeFilter({ where: condition, struct }))
		}
	}

	if(OR){
		for(let condition of OR){
			expr = expr.or(composeFilter({ where: condition, struct }))
		}
	}

	let fields = []
	let subqueries = []
	
	for(let [key, value] of Object.entries(where)){
		let fieldConf = struct.table.fields[key]
		let childConf = struct.nodes[key]
		let operator = '='

		if(childConf && typeof value === 'object'){
			let subFilter = composeFilter({
				where: value,
				struct: childConf
			})

			subqueries.push({
				key,
				operator,
				query: qb.select()
					.field(childConf.table.idKey)
					.from(childConf.table.name)
					.where(subFilter)
					.limit(1)
			})
		}else if(fieldConf){
			if(value.in){
				value = value.in
				operator = 'IN'
			}
	
			if(value.like){
				value = value.like
				operator = 'LIKE'
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
		expr = expr.and(`"${key}" ${operator} ?`, encoded[key])
	}

	for(let { key, operator, query } of subqueries){
		expr = expr.and(`"${key}" ${operator} ?`, query)
	}
	

	return expr
}