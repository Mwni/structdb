export default class{
	constructor(fields){
		this.fields = fields
		this.joins = []
		this.whereTree = null
	}

	from(table){
		this.table = table
		return this
	}

	where(where){
		this.whereTree = {...this.whereTree, ...where}
		return this
	}

	innerJoin(table, on, ...values){
		this.joins.push({type: 'INNER', table, on, values})
		return this
	}

	orderBy(key, dir){
		this.orderKey = key
		this.orderDir = dir || 'ASC'
		return this
	}

	limit(limit){
		this.limitValue = limit
		return this
	}

	sql(){
		let frags = []

		frags.push(`SELECT *`)
		frags.push(`FROM "${this.table}"`)

		if(this.whereTree){
			
		}

		if(this.orderKey)
			frags.push(`ORDER BY "${this.orderKey}" ${this.orderDir}`)

		if(this.limitValue)
			frags.push(`LIMIT ${this.limitValue}`)

		return frags.join(' ')
	}

	values(){
		return []
	}
}