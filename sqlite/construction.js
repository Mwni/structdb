const typeMap = {
	"integer": "integer",
	"string": "text",
	"number": "double",
	"bigint": "integer",
	"boolean": "boolean",
	"blob": "binary",
	"any": "text"
}


export async function construct({ database, tables }){
	for(let schema of tables){
		constructTable({ database, schema })
	}
}

async function constructTable({ database, schema }){
	await database.schema.createTable(schema.name, table => {
		for(let field of Object.values(schema.fields)){
			let { key, type, required, id, default: defaultValue } = field
			let column

			if(id && !defaultValue && !required){
				column = table.increments(key)
			}else{
				column = table[typeMap[type]](key)
			}

			if(id)
				column.primary(key)

			if(required)
				column.notNullable()
					

			if(defaultValue !== undefined)
				column.defaultTo(defaultValue)
		}

		for(let { name, unique, fields } of schema.indices){
			if(unique){
				table.unique(fields, {indexName: name})
			}else{
				table.index(fields, {indexName: name})
			}
		}
	})
}