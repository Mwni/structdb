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

			if(id){
				column = table
					.primary(key)
					.increments(key)
			}else{
				column = table[typeMap[type]](key)
			}

			if(required)
				column.notNullable()
					

			if(defaultValue)
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