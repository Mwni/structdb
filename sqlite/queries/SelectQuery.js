import compile from './compileQuery.js'

const prefixes = ['NOT']
const logics = ['AND', 'OR']
const operators = {
	equals: '=',
	in: 'IN',
	lt: '<',
	gt: '>'
}


export default compile({
	setters: {
		from: x => x,
		where: (where, previous = {}) => ({...previous, ...where}),
		orderBy: (field, dir) => ({ field, dir }),
		limit: x => x,
		offset: x => x,
	},
	render: p => {
		let whereSql = null
		let whereData = {}

		if(Object.keys(p.where).length > 0){
			whereSql = composeWhere(p.where, whereData)
		}

		return {
			sql: [
				`SELECT *`,
				`FROM "${p.from}"`,
				whereSql ? [`WHERE`, whereSql] : null,
				p.orderBy ? `ORDER BY "${p.orderBy.field}" ${p.orderBy.dir}` : null,
				p.limit ? `LIMIT @limit` : null
			],
			data: {
				limit: p.limit,
				...whereData
			}
		}
	}
})

function composeWhere(level, data){
	let list = []
	let entries = Object.entries(level)

	if(entries.length === 1){
		let [[ key, value ]] = entries

		if(prefixes.includes(key)){
			return [
				key,
				composeWhere(value, data)
			]
		}else if(logics.includes(key)){
			return {
				list: value.map(condition => composeWhere(condition, data)),
				join: key
			}
		}
	}

	for(let [key, value] of entries){
		let operator = 'equals'

		if(typeof value === 'object'){
			operator = Object.keys(value)[0]
			value = Object.values(value)[0]
		}

		if(operator === 'in'){
			list.push(`${key} IN (${value.map((_, i) => `@${key}${i}`)})`)
			value.forEach((v, i) => {
				data[`${key}${i}`] = v
			})
		}else{
			list.push(`${key} ${operators[operator]} @${key}`)
			data[key] = value
		}
	}

	return {
		list,
		join: 'AND'
	}
}