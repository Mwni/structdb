const types = {
	"integer": "INTEGER",
	"string": "TEXT",
	"number": "REAL",
	"bigint": "BIGINT",
	"blob": "BLOB"
}


export function createTable({ name, fields }){
	let f = fields.map(field => {
		let fragments = [`"${field.name}"`, types[field.type]]
		
		if(field.notNull)
			fragments.push(`NOT NULL`)

		if(field.primary)
			fragments.push(`PRIMARY KEY`)

		if(field.autoincrement)
			fragments.push(`AUTOINCREMENT`)

		return fragments.join(` `)
	})

	return `CREATE TABLE "${name}" (${f.join(`, `)})`
}

export function createIndex({ table, name, unique, fields }){
	let f = fields.map(field => `"${field}"`)

	return `CREATE ${unique ? `UNIQUE INDEX` : `INDEX`} "${name}" ON "${table}" (${f.join(`, `)})`
}