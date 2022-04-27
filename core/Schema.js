export default class Schema{
	constructor(schema){
		this.struct = schema
		this.tables = []
		this.indices = []
		this.parse(schema)
	}

	parse(schema){
		for(let [name, def] of Object.entries(schema.definitions)){
			this.makeTable(name, def)
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