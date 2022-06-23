import sql from '../sql/index.js'


export function unflatten({ struct, item }){
	for(let [key, value] of Object.entries(item)){
		let childConf = struct.nodes[key]

		if(childConf && typeof value === 'number'){
			item[key] = { [childConf.table.idKey]: value }
		}
	}

	return item
}

export function composeFilter({ where, struct }){
	if(!where)
		return

	let fields = []
	let subqueries = []
	let conditions = []
	let index = 0


	for(let [key, value] of Object.entries(where)){
		index++

		if(key === 'AND' || key === 'OR'){
			conditions.push({
				text: `(%)`,
				join: ` ${key} `,
				items: value.map(condition => composeFilter({ where: condition, struct })),
				index
			})
		}else if(key === 'NOT'){
			conditions.push({
				text: `NOT (%)`,
				items: [composeFilter({ where: value, struct })],
				index
			})
		}else{
			let fieldConf = struct.table.fields[key]
			let childConf = struct.nodes[key]
			let operator = '='

			if(value === null || value === undefined){
				fields.push({ 
					key, 
					operator: 'IS',
					value: null,
					index
				})
			}else if(childConf && typeof value === 'object'){
				if(value[childConf.table.idKey]){
					if(value[childConf.table.idKey].in){
						fields.push({ 
							key, 
							operator: 'IN', 
							value: value[childConf.table.idKey].in,
							index
						})
					}else{
						fields.push({ 
							key, 
							operator, 
							value: value[childConf.table.idKey],
							index
						})
					}

					
				}else{
					subqueries.push({
						key,
						operator,
						query: sql.select({
							table: childConf.table.name,
							fields: [childConf.table.idKey],
							where: composeFilter({ where: value, struct: childConf}),
							limit: 1
						}),
						index
					})
				}
			}else if(fieldConf){
				if(value.hasOwnProperty('like')){
					value = value.like
					operator = 'LIKE'
				}

				if(value.hasOwnProperty('greaterThan')){
					value = value.greaterThan
					operator = '>'
				}

				if(value.hasOwnProperty('greaterOrEqual')){
					value = value.greaterOrEqual
					operator = '>='
				}

				if(value.hasOwnProperty('lessThan')){
					value = value.lessThan
					operator = '<'
				}

				if(value.hasOwnProperty('lessOrEqual')){
					value = value.lessOrEqual
					operator = '<='
				}

				if(value.hasOwnProperty('in')){
					if(value.in.length === 1){
						value = value.in[0]
					}else{
						value = value.in
						operator = 'IN'
					}
				}

				fields.push({ 
					key, 
					operator, 
					value,
					index
				})
			}else{
				throw new Error(`The field "${key}" in the WHERE clause is not specified in the schema`)
			}
		}
	}

	let encoded = struct.encode(
		fields.reduce(
			(data, { key, value }) => ({ ...data, [key]: value }),
			{}
		)
	)

	for(let { key, operator, index } of fields){
		let value = encoded[key]

		conditions.push({
			text: `"${struct.table.name}"."${key}" ${operator} %`,
			index,
			items: Array.isArray(value)
				? [{
					text: `(%)`,
					join: `, `,
					items: value.map(
						(v, i) => ({ text: `?`, values: [v] })
					)
				}]
				: [{ text: `?`, values: [value] }]
		})
	}

	for(let { key, operator, query, index } of subqueries){
		conditions.push({
			text: `"${struct.table.name}"."${key}" ${operator} (%)`,
			items: [query],
			index
		})
	}

	return {
		text: `%`,
		join: ` AND `,
		items: conditions
			.sort((a, b) => a.index - b.index)
	}
}