export default class Schema{
	constructor(schema){
		this.input = schema
		this.tree = []
		this.models = []
		this.tables = []
		this.indices = []
		this.fill()
		this.parse()
	}

	fill(){
		
	}

	parse(schema){

		this.makeTree(schema)
	}

	makeTree(schema){
		let tree = this.walk(schema)

		console.log(JSON.stringify(tree, null, 4))
		console.log(JSON.stringify(this.tables, null, 4))
	}

	walk(schema){
		let fields = []
		let relations = []

		for(let [key, prop] of Object.entries(schema.properties)){
			if(prop['$ref']){
				prop = this.pullRef(prop['$ref'])
			}

			if(prop.type === 'array'){
				if( prop.items['$ref']){
					prop.items = this.pullRef(prop.items['$ref'])
				}

				let referenceKeys = this.findReferenceKeys(prop.items, schema)

				if(referenceKeys.length === 0){
					relations.push({
						key,
						schema: prop.items,
						referenceKey: referenceKeys[0],
						array: true,
					})
				}else if(referenceKeys.length === 1){
					relations.push({
						key,
						schema: prop.items,
						referenceKey: referenceKeys[0],
						array: true,
					})
				}else{
					console.log(referenceKeys)
					throw 'conflicting relations'
				}
			}else if(prop.type === 'object'){
				let referenceKeys = this.findReferenceKeys(prop, schema)

				if(referenceKeys.length === 0){
					fields.push({
						key,
						type: 'integer'
					})

					relations.push({
						key,
						schema: prop
					})
				}else if(referenceKeys.length === 1){
					relations.push({
						key,
						referenceKey: referenceKeys[0],
						schema: prop
					})
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

		let table = this.matchTable({ fields })

		if(!table){
			this.tables.push(table = {
				fields
			})
		}

		return {
			table,
			children: relations
				.map(relation => ({
					...relation,
					...this.walk(relation.schema),
				}))
		}
	}

	findReferenceKeys(from, to){
		let keys = []

		for(let [key, prop] of Object.entries(from.properties)){
			if(prop['$ref']){
				prop = this.pullRef(prop['$ref'])
			}

			if(prop['$ref'] && prop['$ref'] === to['$ref'])
				keys.push(key)
		}
		
		return keys
	}

	matchTable({ fields }){
		return this.tables.find(table => deepCompare(table.fields, fields))
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

function deepCompare(obj1, obj2, reversed){
	for(let key in obj1){
		if(typeof obj1[key] === 'object' && typeof obj2[key] === 'object'){
			if(!deepCompare(obj1[key], obj2[key])) 
				return false
		}else if(obj1[key] !== obj2[key]) 
			return false
	}

	return reversed ? true : deepCompare(obj2, obj1, true)
}