const prefixes = ['NOT']
const logics = ['AND', 'OR']
const operators = {
	equals: '=',
	in: 'IN',
	lt: '<',
	gt: '>'
}


export function compose(where){
	let sql = null
	let data = {}

	if(Object.keys(where).length > 0){
		sql = aggregate(where, data)
	}

	return { sql, data }
}

function aggregate(level, data){
	let list = []
	let entries = Object.entries(level)

	if(entries.length === 1){
		let [[ key, value ]] = entries

		if(prefixes.includes(key)){
			return [
				key,
				compose(value, data)
			]
		}else if(logics.includes(key)){
			return {
				list: value.map(condition => compose(condition, data)),
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

			if(typeof value === 'boolean')
				value = value ? 1 : 0

			data[key] = value
		}
	}

	return {
		list,
		join: 'AND'
	}
}