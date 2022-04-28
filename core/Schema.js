export default class Schema{
	constructor(schema){
		this.inputSchema = schema
		this.filledSchema = this.fill(schema)
		this.roots = []
		this.tables = []
		this.indices = []
		this.parse()
	}

	fill(node, previousRefNodes = []){
		if(Array.isArray(node)){
			return node.map(element => this.fill(element, previousRefNodes))
		}else if(node && typeof node === 'object'){
			let refUrl = node['$ref']

			if(refUrl){
				let refSchema = this.inputSchema.definitions[refUrl.slice(14)]
				let previousRefNode = previousRefNodes.find(r => r['$ref'] === refUrl)

				if(previousRefNode)
					return previousRefNode
				

				node = { 
					...node,
					...refSchema,  
				}

				previousRefNodes.push(node)
			}

			for(let [k, v] of Object.entries(node)){
				node[k] = this.fill(v, previousRefNodes)
			}

			return node
		}else{
			return node
		}
	}

	parse(){
		//console.log(JSON.stringify(this.filledSchema, null, 4))
		let tree = this.walk(this.filledSchema)

		this.roots = tree.children

		console.dir(this.roots, { depth: 11 })
	}

	walk(schema, previousNodes = []){
		let previous = previousNodes.find(p => p.schema === schema)
		let node = {}
		let fields = []
		let relations = []

		if(previous)
			return previous.node

		for(let [key, prop] of Object.entries(schema.properties)){
			if(prop.type === 'array'){
				let referenceKeys = this.findReferenceKeys(prop.items, schema)

				if(referenceKeys.length === 0){
					relations.push({
						key,
						schema: prop.items,
						referenceKey: referenceKeys[0],
						many: true,
					})
				}else if(referenceKeys.length === 1){
					relations.push({
						key,
						schema: prop.items,
						referenceKey: referenceKeys[0],
						many: true,
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

		node.table = this.matchTable({ fields })
		node.children = []

		previousNodes.push({ node, schema })

		if(!node.table){
			this.tables.push(node.table = {
				fields
			})
		}

		for(let { schema, ...relation } of relations){
			node.children.push({
				...relation,
				...this.walk(schema, previousNodes),
			})
		}

		return node
	}

	findReferenceKeys(from, to){
		let keys = []

		for(let [key, prop] of Object.entries(from.properties)){
			if(prop['$ref'] && prop['$ref'] === to['$ref'])
				keys.push(key)
		}
		
		return keys
	}

	matchTable({ fields }){
		return this.tables.find(table => deepCompare(table.fields, fields))
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