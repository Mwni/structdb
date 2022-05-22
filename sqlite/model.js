import qb from './query/index.js'


export function create({ database, config }){
	

	return {
		async createOne(args){
			return await createDeep({
				...args,
				database,
				config
			})
		},

		async readOne(args){
			return (
				await readDeep({
					...args,
					take: args.last ? -1 : 1,
					database,
					config
				})
			)[0]
		},

		async readMany(args){
			return await readDeep({
				...args,
				database,
				config
			})
		}
	}
}



async function createDeep({ database, config, data: inputData, include = {}, conflict = {} }){
	let tableData = {}
	let postInsertWhere = {}
	let insertQuery = qb.upsert()
		.into(config.table.name)

	for(let [key, value] of Object.entries(inputData)){
		let childConf = config.children[key]
		let fieldConf = config.table.fields[key]

		if(value === undefined || value === null)
			continue

		if(childConf){
			let childInstance = await createDeep({
				database,
				config: childConf,
				include: {},
				data: value,
			})

			tableData[key] = childInstance[childConf.table.idKey]
			include[key] = true
		}else if(fieldConf){
			if(fieldConf.type === 'boolean')
				value = value ? 1 : 0
			else if(fieldConf.type === 'any')
				value = JSON.stringify(value)

			tableData[key] = value
		}
	}

	insertQuery.setFields(tableData)
	database.run(insertQuery)

	for(let key of Object.keys(tableData)){
		let field = config.table.fields[key]
		
		if(field.id || field.unique)
			postInsertWhere[key] = tableData[key]
	}

	return (await readDeep({
		database,
		config,
		include: inputData,
		where: postInsertWhere,
		take: 1
	}))[0]
}

async function readDeep({ database, config, forParent, where = {}, select, include = {}, distinct, orderBy, take }){
	orderBy = orderBy || { rowid: 'asc' }

	if(forParent){
		let { items: parentItems, config: parentConfig } = forParent
		let relationToParent = parentConfig.children[config.key]

		if(relationToParent.referenceKey){
			let ids = [].concat(
				...parentItems
					.map(row => row[parentConfig.table.idKey])
			)

			where[relationToParent.referenceKey] = { in: ids }
		}else{
			let ids = [].concat(
				...parentItems
					.map(row => row[config.key])
			)

			where[config.table.idKey] = { in: ids }
		}
	}
	
	let selectQuery = qb.select()
		.from(config.table.name)
		.where(composeFilter({ where, config }))

	if(distinct){
		selectQuery = selectQuery.distinct()
	}

	if(orderBy){
		let invert = take < 0

		for(let [key, dir] of Object.entries(orderBy)){
			let asc = dir === 'asc'
			let finalAsc = invert ? !asc : asc
			
			selectQuery = selectQuery.order(key, finalAsc)
		}
	}
	
	if(take){
		selectQuery = selectQuery.limit(Math.abs(take))
	}

	let items = database.all(selectQuery)
		
	for(let [key, selection] of Object.entries(include)){
		let childConf = config.children[key]

		if(!childConf)
			continue

		let children = await readDeep({
			database,
			config: childConf,
			include: selection,
			forParent: {
				items,
				config
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

	return items
}

function composeFilter({ where, config }){
	console.log('compose', where)

	let expr = qb.expr()
	let { AND, OR } = where
	
	if(AND){
		for(let condition of AND){
			expr = expr.and(composeFilter({ where: condition, config }))
		}
	}

	if(OR){
		for(let condition of OR){
			expr = expr.or(composeFilter({ where: condition, config }))
		}
	}
	
	for(let [key, value] of Object.entries(where)){
		let fieldConf = config.table.fields[key]
		let childConf = config.children[key]
		let operator = '='

		if(childConf && typeof value === 'object'){
			let subFilter = composeFilter({
				where: value,
				config: childConf
			})

			value = qb.select()
				.field(childConf.table.idKey)
				.from(childConf.table.name)
				.where(subFilter)
				.limit(1)

		}else if(fieldConf){
			if(value.in){
				value = value.in
				operator = 'IN'
			}
	
			if(value.like){
				value = value.like
				operator = 'LIKE'
			}
		}

		expr = expr.and(`"${key}" ${operator} ?`, value)
	}
	

	return expr
}