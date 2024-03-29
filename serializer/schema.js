export default function derive(schema){
	if(schema.type === 'object'){
		let properties = Object.entries(schema.properties)
			.map(([ key, schema ]) => ({ key, schema: derive(schema) }))
			.sort((a, b) => a.key > b.key ? 1 : a.key < b.key ? -1 : 0)

		let staticProperties = properties
			.filter(prop => schema.required && schema.required.includes(prop.key))

		let dynamicProperties = properties
			.filter(prop => !staticProperties.includes(prop))

		return {
			type: 'object',
			staticProperties,
			dynamicProperties
		}
	}else if(schema.type === 'array'){
		return {
			type: 'array',
			items: derive(schema.items)
		}
	}else{
		return schema
	}
}