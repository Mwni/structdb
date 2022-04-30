import { deepCompare } from './utils.js'


export default class Schema{
	constructor(schema){
		this.inputSchema = schema
		this.filledSchema = this.fill(schema)
		this.tree = null
		this.tables = []
		this.parse()
	}

	parse(){
		this.tree = this.walk(this.filledSchema)
		this.tables = this.tables
			.slice(1)
	}

	walk(schema, previousNodes = []){
		let previous = previousNodes.find(p => p.schema === schema)
		let node = {}
		let fields = {}
		let relations = {}

		if(previous)
			return previous.node

		for(let [key, prop] of Object.entries(schema.properties)){
			if(prop.type === 'array'){
				let referenceKeys = this.findReferenceKeys(prop.items, schema)

				if(referenceKeys.length === 0){
					relations[key] = {
						key,
						schema: prop.items,
						referenceKey: referenceKeys[0],
						many: true,
					}
				}else if(referenceKeys.length === 1){
					relations[key] = {
						key,
						schema: prop.items,
						referenceKey: referenceKeys[0],
						many: true,
					}
				}else{
					console.log(referenceKeys)
					throw 'conflicting relations'
				}
			}else if(prop.type === 'object'){
				let referenceKeys = this.findReferenceKeys(prop, schema)

				if(referenceKeys.length === 0){
					fields[key] = {
						key,
						type: 'integer'
					}

					relations[key] = {
						key,
						schema: prop
					}
				}else if(referenceKeys.length === 1){
					relations[key] = {
						key,
						referenceKey: referenceKeys[0],
						schema: prop
					}
				}else{
					throw 'conflicting relations'
				}
			}else{
				fields[key] = {
					...prop, 
					key
				}
			}
		}

		node.table = this.createTable({ fields, schema })
		node.children = {}

		previousNodes.push({ node, schema })

		for(let { key, schema, ...relation } of Object.values(relations)){
			node.children[key] = {
				key,
				...relation,
				...this.walk(schema, previousNodes),
			}
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

	createTable({ fields, schema }){
		let table = this.tables
			.find(t => deepCompare(t.fields, fields))

		if(!table){
			this.tables.push(
				table = {
					fields,
					indices: []
				}
			)
		}
			
		if(!table.name && schema['$ref']){
			table.name = schema['$ref']
				.split('/')
				.slice(-1)
				[0]
		}

		if(schema.unique){
			let uniques = Array.isArray(schema.unique[0])
				? schema.unique
				: [schema.unique]

			for(let fields of uniques){
				let name = `${table.name}Unique`

				for(let field of fields){
					name += field.slice(0, 1).toUpperCase() + field.slice(1)
				}

				table.indices.push({
					name,
					unique: true,
					fields,
				})
			}
		}

		for(let [key, field] of Object.entries(table.fields)){
			if(field.id)
				table.idKey = key

			field.required = field.required 
				|| !schema.required 
				|| schema.required.includes(field.key)

			field.default = field.default 
				|| schema.default 
		}
		
		return table
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
}