import Query from './compileQuery.js'


export default class CreateTableQuery extends Query{
	constructor(){
		super()
		this.setter('')
	}

	fields(fields){
		this.fields = fields
		return this
	}

	sql(){
		let f = this.fields.map(field => {
			let fragments = [`"${field.name}"`, typeMap[field.type]]
			
			if(field.notNull)
				fragments.push(`NOT NULL`)
	
			if(field.primary)
				fragments.push(`PRIMARY KEY`)
	
			if(field.autoincrement)
				fragments.push(`AUTOINCREMENT`)
	
			return fragments.join(` `)
		})
	
		return `CREATE TABLE "${this.name}" (${f.join(`, `)})`
	}

	values(){
		return []
	}
}