export function deriveBlueprint(schema){
	if(schema.type === 'object'){
		let properties = Object.entries(schema.properties)
			.map(([ key, schema ]) => ({ key, schema }))
			.sort((a, b) => a.key > b.key ? 1 : a.key < b.key ? -1 : 0)

		return {
			...schema,
			properties
		}
	}else if(schema.type === 'array'){
		return {
			...schema,
			items: deriveBlueprint(schema.items)
		}
	}else{
		return schema
	}
}