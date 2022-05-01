import View from './View.js'


export default class Instance{
	#database
	#config

	get name(){
		return config.table.name
	}

	constructor({ database, data, config }){
		this.#database = database
		this.#config = config

		for(let child of Object.values(config.children)){
			if(data.hasOwnProperty(child.key))
				continue

			let view = new View({ 
				database: this.#database,
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

		Object.assign(this, data)
	}

	get [Symbol.toStringTag]() {
		return this.#config.table.name
	}
}