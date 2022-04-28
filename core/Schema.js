export default class Schema{
	constructor(schema){
		this.raw = schema
		this.tree = []
		this.tables = []
		this.indices = []
		this.parse(schema)
	}

	parse(schema){
		this.makeTree(schema)
	}

	makeTree(schema){
		let tree = this.deriveNode(schema)

		console.log(tree)
	}

	deriveNode(object){
		let fields = {}
		let relations = {}

		for(let [key, schema] of Object.entries(object.properties)){
			if(schema['$ref']){
				schema = this.pullRef(schema['$ref'])
			}

			if(schema.type === 'array'){
				
			}else if(schema.type === 'object'){
				throw 'not implemented'
			}else{
				fields[key] = schema
			}
		}

		return { fields, relations }
	}

	deriveRelations(object){
		let relations = []

		for(let [key, prop] of Object.entries(object.properties)){

		}

		return relations
	}

	pullRef(url){
		return this.raw.definitions[url.slice(14)]
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