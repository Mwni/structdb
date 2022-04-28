export default class{
	constructor(name, unique){
		this.name = name
		this.unique = unique
	}

	on(table){
		this.table = table
		return this
	}

	fields(fields){
		this.fields = fields
		return this
	}

	sql(){
		let f = this.fields
			.map(field => `"${field}"`)

		return `CREATE ${this.unique ? `UNIQUE INDEX` : `INDEX`} "${this.name}" ON "${this.table}" (${f.join(`, `)})`
	}

	values(){
		return []
	}
}