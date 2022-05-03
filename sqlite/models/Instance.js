import View from './View.js'
import UpdateQuery from '../queries/UpdateQuery.js'
import SelectQuery from '../queries/SelectQuery.js'


export default class Instance{
	#database
	#config

	constructor({ database, data, config }){
		this.#database = database
		this.#config = config

		for(let child of Object.values(config.children)){
			if(data.hasOwnProperty(child.key))
				continue

			let view = new View({ 
				database,
				parent: { 
					collection: [this],
					config,
				},
				config: child,
			})

			Object.defineProperty(this, child.key, {
				get(){
					return view
				}
			})
		}

		this.#set(data)
	}

	#set(data){
		for(let field of Object.values(this.#config.table.fields)){
			let value = data[field.key]

			if(field.type === 'boolean')
				value = !!value
			else if(field.type === 'any')
				value = JSON.parse(value)

			this[field.key] = value
		}
	}

	async update({ data }){
		let tableData = {}
		let where = {[this.#config.table.idKey]: this[this.#config.table.idKey]}

		for(let [key, value] of Object.entries(data)){
			let childConf = this.#config.children[key]
			let fieldConf = this.#config.table.fields[key]

			if(this[key] === value)
				continue

			if(childConf){
				//
			}else if(fieldConf){
				if(fieldConf.id)
					throw new Error(`Cannot modify identifying field "${key}"`)

				if(fieldConf.type === 'boolean')
					value = value ? 1 : 0
				else if(fieldConf.type === 'any')
					value = JSON.stringify(value)

				tableData[key] = value
			}

		}

		this.#database.run(
			new UpdateQuery()
				.table(this.#config.table.name)
				.set(tableData)
				.where(where)
		)

		this.#set({
			...this,
			...this.#database.get(
				new SelectQuery()
					.fields(Object.keys(tableData))
					.from(this.#config.table.name)
					.where(where)
					.limit(1)
			)
		})
	}

	get [Symbol.toStringTag]() {
		return this.#config.table.name
	}
}