export default class Schema{
	constructor(schema){
		this.raw = schema
		this.tree = []
		this.models = []
		this.tables = []
		this.indices = []
		this.parse(schema)
	}

	parse(schema){
		this.makeTree(schema)
	}

	makeTree(schema){
		let tree = this.walk(schema.properties.users.items)

		console.log(tree)
	}

	walk(schema){
		let fields = []
		let pointers = []
		let relations = []

		for(let [key, prop] of Object.entries(schema.properties)){
			if(prop['$ref']){
				prop = this.pullRef(prop['$ref'])
			}

			if(prop.type === 'array'){
				let childRelations = this.findRelations(prop.items, schema)

				if(childRelations.length === 0){
					if(schema === this.raw){

					}
				}else if(childRelations.length === 1){

				}else{
					throw 'conflicting relations'
				}
			}else if(prop.type === 'object'){
				let childRelations = this.findRelations(prop, schema)

				if(childRelations.length === 0){
					fields.push({
						key,
						type: 'integer'
					})

					loaders.push({
						key
					})
				}else if(childRelations.length === 1){
					
				}else{
					throw 'conflicting relations'
				}
			}else{
				fields.push({
					...prop, 
					key
				})
			}
		}

		let model = this.matchModel({ fields, pointers })

		if(!model){
			this.models.push(model = {
				fields,
				pointers
			})
		}

		return {
			model,
			
		}
	}

	findRelations(from, to){
		let relations = []

		for(let [key, prop] of Object.entries(from.properties)){
			if(prop['$ref']){
				prop = this.pullRef(prop['$ref'])
			}

			if(prop['$ref'] === to['$ref'])
				relations.push({key})
		}
		
		return relations
	}

	matchModel({ fields, pointers }){
		return null
	}

	deriveTable(schema){

	}

	deriveNode(object){
		let fields = []
		let children = []
		let relations = []

		for(let [key, schema] of Object.entries(object.properties)){
			if(schema['$ref']){
				schema = this.pullRef(schema['$ref'])
			}

			if(schema.type === 'array'){
				relations.push({
					type: 'o2m',
					from: this.deriveNode(schema.items)
				})
			}else if(schema.type === 'object'){
				throw 'not implemented'
			}else{
				fields.push({...schema, key})
			}
		}

		let model = { fields, children }


		return { model, relations }
	}

	deriveRelations(object){
		let relations = []

		for(let [key, prop] of Object.entries(object.properties)){

		}

		return relations
	}

	pullRef(url){
		return {
			...this.raw.definitions[url.slice(14)],
			'$ref': url
		}
	}

	makeTable(name, schema){
		let fields = []
		let required = schema.required || []

		for(let [key, prop] of Object.entries(schema.properties)){
			let primary = false
			let unique = false
			let autoincrement = false
			let notNull = required.includes(key)
			let type

			if(prop.type === 'array' && prop.items['$ref']){
				continue
			}

			if(prop['$ref']){
				type = 'integer'
			}else{
				type = prop.type
			}

			if(prop.id){
				primary = true
				unique = true
				notNull = true
				autoincrement = !required.includes(key)
			}else if(prop.unique){
				unique = true

				this.indices.push({
					table: name,
					name: `${name}_${key}_key`,
					unique: true,
					fields: [key]
				})
			}

			fields.push({
				name: key,
				type,
				notNull,
				primary,
				autoincrement,
			})
		}

		this.tables.push({name, fields})
	}
}