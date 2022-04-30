import InsertQuery from './queries/InsertQuery.js'
import SelectQuery from './queries/SelectQuery.js'


export default function compile({ database, config, chain = [] }){
	let childModels = {}

	const View = class{
		constructor({ config, parent }){
			
		}

		async createOne({ data: inputData, include = {} }){
			let tableData = {}

			for(let [key, value] of Object.entries(inputData)){
				let childConf = config.children[key]
				let fieldConf = config.table.fields[key]

				if(childConf){
					let { Leaf } = childModels[key]
					let leaf = new Leaf()
					let childInstance = await leaf.createOne({
						data: value
					})

					tableData[key] = childInstance[childConf.table.idKey]
					include[key] = true
				}else if(fieldConf){
					tableData[key] = inputData[key]
				}
			}

			let { lastInsertRowid } = database.run(
				new InsertQuery()
					.data(tableData)
					.into(config.table.name)
			)

			return await this.readOne({ 
				rowid: lastInsertRowid,
				include
			})
		}

		async readMany({ where = {}, include = {}, take }){
			let query = new SelectQuery()
				.from(config.table.name)
				.where(where)

			if(take)
				query.limit(take)

			let rows = database.all(query)

			for(let [key, selection] of Object.entries(include)){

				let childConf = config.children[key]

				if(childConf.referenceKey){

				}else{
					let ids = [].concat(...rows.map(row => row[config.table.idKey]))
					
					
				}
			}

			return new Collection(rows)
		}

		async readOne({ where = {}, include = {} }){
			return (await this.readMany({ where, include, take: 1 }))[0]
		}
	}

	const Collection = class extends Array{
		get name(){
			return `${config.table.name}Collection`
		}

		constructor({ data, parent }){
			super(...items.map(item => new Instance({ data: item, parent: this })))
			
			for(let child of Object.values(config.children)){
				let view = new View({ 
					parent: this,
					config: child,
				})

				Object.defineProperty(this, child.key, {
					get(){
						return view
					}
				})
			}
		}
	}

	const Instance = class{
		get name(){
			return config.table.name
		}

		constructor({ data, parent }){
			Object.assign(this, data)

			for(let child of Object.values(config.children)){
				let view = new View({ 
					parent: this,
					config: child,
				})

				Object.defineProperty(this, child.key, {
					get(){
						return view
					}
				})
			}
		}
	}

	/*class Leaf{
		constructor(parent){
			this.parent = parent
			this.children = {}

			for(let [key, model] of Object.entries(childModels)){
				this.children[key] = new model.Leaf()
			}
		}

		

		
	}

	class Instance{
	
		constructor(data){
			for(let [key, value] of Object.entries(data)){
				this[key] = config.children[key]
					? new childModels[key].Instance(value)
					: value
			}
		}
	}
	}

	for(let child of Object.values(config.children)){
		let model = chain.find(({ config }) => config === child)

		if(model)
			childModels[child.key] = model
		else{
			chain.push(model = { config })
			childModels[child.key] = Object.assign(model, compile({ database, config: child, chain }))
		}
	}*/

	return { Instance, Collection }
}