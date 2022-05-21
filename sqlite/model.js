import qb from './query/index.js'


export function create({ database, config }){
	

	return {
		async createOne({ data, include = {}, conflict = {} }){
			return await createDeep({
				database,
				config,
				data,
				include,
				conflict,
			})


			/*let where = {}
			let { lastInsertRowid } = this.#database.run(
				new InsertQuery()
					.data(tableData)
					.into(this.#config.table.name)
					.upsert(true)
			)

			if(lastInsertRowid > 0 && false){
				where.rowid = lastInsertRowid
			}else{
				for(let key of Object.keys(tableData)){
					let field = this.#config.table.fields[key]
					
					if(field.id || field.unique)
						where[key] = tableData[key]
				}
			}

			return await this.readOne({ 
				where,
				include
			})*/
		},

		async loadOne(){

		},

		async loadMany(){

		}
	}
}



async function createDeep({ database, config, data: inputData, include, conflict }){
	let tableData = {}
	let postInsertWhere = {}
	let insertQuery = qb.insert()
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

			console.log('child:', childInstance)

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

	return (await loadDeep({
		database,
		config,
		include: inputData,
		where: postInsertWhere,
		take: 1
	}))[0]
}

async function loadDeep({ database, config, forParent, where, select, include, distinct, orderBy, take }){
	let selectQuery = qb.select()
		.from(config.table.name)

	let items = database.all(selectQuery)
		
	for(let [key, selection] of Object.entries(include)){
		let childConf = config.children[key]

		if(!childConf)
			continue

		let children = await loadDeep({
			database,
			config: childConf,
			include: selection,
			forParent: {
				data: items,
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