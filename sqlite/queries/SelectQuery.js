export default class{
	constructor({ fields }){
		this.fields = fields
		this.joins = []
		this.wheres = []
	}

	from(table){
		this.table = table
		return this
	}

	where(sql, ...values){
		this.wheres.push({sql, values})
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
		let where = (
			this.wheres.length > 0 
				? this.wheres 
				: [{sql: '1'}]
		)
			.map(w => w.sql)
			.join(' AND ')

		let sql = `SELECT * FROM ??` 

		if(this.joins.length > 0){
			for(let join of this.joins){
				sql += ` ${join.type} JOIN ?? ON (${join.on})`
			}
		}

		if(where)
			sql += ` WHERE ${where}`

		if(this.orderKey)
			sql += ` ORDER BY ?? ${this.orderDir}`

		if(this.limitValue)
			sql += ` LIMIT ${this.limitValue}`

		return sql
	}

	values(){
		let values = []

		values.push(this.table)
		values = values.concat([...this.joins.reduce((vars, j) => [...vars, j.table, ...j.values], [])])
		values = values.concat([...this.wheres.reduce((vars, w) => [...vars, ...w.values], [])])
		
		if(this.orderKey)
			values.push(this.orderKey)


		return values
	}
}