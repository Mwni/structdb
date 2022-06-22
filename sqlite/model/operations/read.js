import sql from '../../sql/index.js'
import { composeFilter } from '../common.js'


export function read({ database, struct, where = {}, include, distinct, orderBy, groupBy, skip, take, iter }){
	if(take === 0)
		return []

	if(orderBy){
		let invert = take < 0

		for(let [key, dir] of Object.entries(orderBy)){
			if(invert)
				orderBy[key] = dir === 'asc' ? 'desc' : 'asc'
		}
	}
	

	let query = sql.select({
		...composeNesting({ struct, include }),
		table: struct.table.name,
		where: composeFilter({ where, struct }),
		distinct,
		groupBy,
		orderBy,
		limit: Math.abs(take),
		offset: skip
	})

	if(iter){
		let iterator = database.iter(query)
			
		return {
			[Symbol.iterator](){
				return {
					next(){
						let { value: row, done } = iterator.next()

						if(done)
							return {
								done: true
							}
		
						return {
							value: resolveNesting({ 
								data: makeRowIntegerSafe(row), 
								include, 
								struct 
							})
						}
					}
				}
			}
		}
	}else{
		return database.all(query)
			.map(row => makeRowIntegerSafe(row))
			.map(row => resolveNesting({ data: row, include, struct }))
	}
}

export function count({ database, struct, where, distinct, limit }){
	let query = sql.select({
		count: ['*'],
		table: struct.table.name,
		where: composeFilter({ where, struct }),
		distinct,
		limit
	})

	return Object.values(database.get(query))[0]
}


function composeNesting({ include, struct, chain = [] }){
	let fields = []
	let joins = []
	let table = chain.length === 0
		? struct.table.name
		: ['T', ...chain].join('.')

	for(let [key, field] of Object.entries(struct.table.fields)){
		fields.push({
			name: key,
			nameAlias: [...chain, key].join('.'),
			table
		})
	}

	for(let [key, node] of Object.entries(struct.nodes)){
		if(node.many)
			continue

		if(!include || !include[key])
			continue

		let tableAlias = ['T', ...chain, key].join('.')

		joins.push({
			table: node.table.name,
			tableAlias: tableAlias,
			condition: [{
				text: `"${tableAlias}"."${node.table.idKey}" = "${table}"."${key}"`
			}]
		})

		let nesting = composeNesting({
			include: include[key], 
			struct: node, 
			chain:  [...chain, key]
		})

		fields.push(...nesting.fields)
		joins.push(...nesting.joins)
	}

	return { fields, joins }
}


function resolveNesting({ data, include, struct, chain = [] }){
	let item = {}

	for(let [key, field] of Object.entries(struct.table.fields)){
		let dotKey = [...chain, key].join('.')

		if(data.hasOwnProperty(dotKey))
			item[key] = data[dotKey]
	}

	for(let [key, node] of Object.entries(struct.nodes)){
		if(node.many)
			continue

		let dotKey = [...chain, key].join('.')

		if(data[dotKey] == null)
			continue

		if(!include || !include[key]){
			item[key] = {
				[node.table.idKey]: data[dotKey]
			}
			continue
		}

		item[key] = resolveNesting({
			data,
			include: include[key],
			struct: node,
			chain:  [...chain, key]
		})
	}

	return struct.decode(item)
}




function makeRowIntegerSafe(row){
	for(let [key, value] of Object.entries(row)){
		if(typeof value === 'bigint' && value < 9007199254740991n)
			row[key] = Number(value)
	}

	return row
}