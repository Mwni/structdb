export function parse(schema){
	let tables = []

	function walk(schema, previousNodes = []){
		let previous = previousNodes.find(p => p.schema === schema)
		let node = {}
		let fields = {}
		let relations = {}

		if(previous)
			return previous.node

		for(let [key, prop] of Object.entries(schema.properties)){
			if(prop.type === 'array'){
				let referenceKeys = findReferenceKeys(prop.items, schema)

				if(referenceKeys.length === 0){
					relations[key] = {
						key,
						schema: prop.items,
						referenceKey: referenceKeys[0],
						many: true
					}
				}else if(referenceKeys.length === 1){
					relations[key] = {
						key,
						schema: prop.items,
						referenceKey: referenceKeys[0],
						many: true
					}
				}else{
					console.log(referenceKeys)
					throw 'conflicting relations'
				}
			}else if(prop.type === 'object'){
				let referenceKeys = findReferenceKeys(prop, schema)

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

		node.table = createTable({ fields, schema })
		node.children = {}

		previousNodes.push({ node, schema })

		for(let { key, schema, ...relation } of Object.values(relations)){
			node.children[key] = {
				key,
				...relation,
				...walk(schema, previousNodes),
			}
		}

		return node
	}

	function createTable({ fields, schema }){
		let table = tables
			.find(t => deepCompare(t.fields, fields))
	
		if(!table){
			tables.push(
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
					table.fields[field].unique = table.fields[field].unique || true
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
		}
		
		return table
	}

	return {
		tree: walk(unfold(schema)),
		tables: tables.slice(1)
	}
}

export function unfold(schema, node, previousRefNodes = []){
	node = node || schema

	if(Array.isArray(node)){
		return node.map(element => unfold(schema, element, previousRefNodes))
	}else if(node && typeof node === 'object'){
		let refUrl = node['$ref']

		if(refUrl){
			let refSchema = schema.definitions[refUrl.slice(14)]
			let previousRefNode = previousRefNodes.find(r => r['$ref'] === refUrl)

			if(previousRefNode)
				return previousRefNode
			

			node = { 
				...node,
				...refSchema,  
			}

			previousRefNodes.push(node)
		}

		for(let [key, value] of Object.entries(node)){
			node[key] = unfold(schema, value, previousRefNodes)
		}

		return node
	}else{
		return node
	}
}

function findReferenceKeys(from, to){
	let keys = []

	for(let [key, prop] of Object.entries(from.properties)){
		if(prop['$ref'] && prop['$ref'] === to['$ref'])
			keys.push(key)
	}
	
	return keys
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