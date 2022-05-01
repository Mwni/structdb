import InsertQuery from '../queries/InsertQuery.js'
import SelectQuery from '../queries/SelectQuery.js'
import Collection from './Collection.js'
import Instance from './Instance.js'



export default class View{
	#database
	#config
	#parent

	constructor({ database, config, parent }){
		this.#database = database
		this.#config = config
		this.#parent = parent
	}

	async createOne({ data: inputData, include = {}, conflict = {} }){
		let tableData = {}

		for(let [key, value] of Object.entries(inputData)){
			let childConf = this.#config.children[key]
			let fieldConf = this.#config.table.fields[key]

			if(childConf){
				let leafView = new View({
					database: this.#database,
					config: childConf,
				})

				let leafInstance = await leafView.createOne({
					data: value
				})

				tableData[key] = leafInstance[childConf.table.idKey]
				include[key] = true
			}else if(fieldConf){
				tableData[key] = inputData[key]
			}
		}

		let where = {}
		let { lastInsertRowid } = this.#database.run(
			new InsertQuery()
				.data(tableData)
				.into(this.#config.table.name)
				.upsert(true)
		)

		if(lastInsertRowid > 0){
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
		})
	}

	async readOne({ where = {}, include = {} }){
		return (await this.readMany({ where, include, take: 1 }))[0]
	}

	async readMany({ where = {}, include = {}, take } = {}){
		let query = new SelectQuery()
			.from(this.#config.table.name)
			.where(where)

		if(this.#parent){
			let relationToParent = this.#parent.config.children[this.#config.key]

			if(relationToParent.referenceKey){
				console.log('TODO')
			}else{
				let ids = [].concat(
					...this.#parent.collection
						.map(row => row[this.#config.key])
				)

				query.where({
					[this.#config.table.idKey]: {
						in: ids
					}
				})
			}
		}

		if(take)
			query.limit(take)

		let collection = new Collection({
			items: this.#database.all(query),
			database: this.#database,
			config: this.#config,
			parent: this.#parent
		})

		for(let [key, selection] of Object.entries(include)){
			let childConf = this.#config.children[key]
			let children = await collection[key].readMany()

			if(childConf.referenceKey){

			}else{
				for(let item of collection){
					item[key] = children
						.find(child => child[childConf.table.idKey] === item[key])
				}
			}
		}

		return collection
	}

	get [Symbol.toStringTag]() {
		return this.#config.table.name
	}
}