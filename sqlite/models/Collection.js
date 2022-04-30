export default class Collection extends Array{
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