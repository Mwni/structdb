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
	

			if(defaultValue !== undefined){
				column.defaultTo(defaultValue)
				column.notNullable()
			}else if(required)
				column.notNullable()
		}

		for(let [key, { name, idKey }] of Object.entries(schema.foreign)){
			table.foreign(key)
				.references(idKey)
				.inTable(name)
				.onUpdate('CASCADE')
				.onDelete('CASCADE')
		}

		for(let { name, unique, fields } of schema.indices){
			if(unique){
				table.unique(fields, {indexName: name})
			}else{
				table.index(fields, name)
			}
		}
	})
}