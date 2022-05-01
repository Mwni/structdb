import Instance from './Instance.js'
import View from './View.js'


export default class Collection extends Array{
	#database
	#config

	constructor(arg){
		if(typeof arg !== 'object'){
			return Array(arg)
		}

		let { items, database, config } = arg

		super(...items.map(item => new Instance({ data: item, config })))

		this.#database = database
		this.#config = config
		
		for(let child of Object.values(config.children)){
			let view = new View({ 
				database: this.#database,
				config: child,
				parent: {
					collection: this,
					config,
				},
			})

			Object.defineProperty(this, child.key, {
				get(){
					return view
				}
			})
		}
	}

	get [Symbol.toStringTag]() {
		return this.#config.table.name
	}
}