import qb from './query/index.js'


const typeMap = {
	"integer": "INTEGER",
	"string": "TEXT",
	"number": "REAL",
	"bigint": "INTEGER",
	"boolean": "INTEGER",
	"blob": "BLOB",
	"any": "TEXT"
}


export function construct({ database, tables }){
	for(let schema of tables){
		constructTable({ database, schema })
	}
}

function constructTable({ database, schema }){
	let fields = []
	let createQuery = qb.createTable()
		.table(schema.name)

	for(let { key, type, required, id, default: defaultValue } of Object.values(schema.fields)){
		let primary = false
		let autoincrement = false
		let notNull = required

		if(id){
			primary = true
			notNull = true
			autoincrement = !required
		}

		createQuery.field({
			name: key,
			type: typeMap[type],
			notNull,
			primary,
			autoincrement,
			default: defaultValue
		})
	}

	database.run(createQuery)

	for(let { name, unique, fields } of schema.indices){
		database.run(
			qb.createIndex()
				.name(name)
				.unique(unique)
				.on(schema.name)
				.fields(fields)
		)
	}
}