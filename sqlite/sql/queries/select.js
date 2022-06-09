export default function({ fields, distinct, table, where, leftJoins, limit, offset }){
	let selection
	let limitation
	let joins

	if(distinct){
		selection = {
			text: `DISTINCT %`,
			join: `, `,
			items: distinct
				.map(
					field => typeof field === 'string'
						? `"${field}"`
						: `"${field.name}" as "${field.alias}"`
				)
		}
	}else if(fields){
		selection = {
			text: `%`,
			join: `, `,
			items: fields
				.map(
					field => typeof field === 'string'
						? `"${field}"`
						: `"${field.name}" as "${field.alias}"`
				)
		}
	}else{
		selection = {
			text: `*`
		}
	}

	if(leftJoins){
		joins = leftJoins.map(join => ({
			text: `LEFT JOIN "${join.table}" ON (%)`,
			items: [join.condition]
		}))
	}

	if(limit || offset){
		limitation = {
			text: `LIMIT ?, ?`,
			values: [
				offset || 0,
				limit
			]
		}
	}

	return [
		{
			text: `SELECT`
		},
		selection,
		{
			text: `FROM "${table}"`
		},
		{
			text: `WHERE %`,
			items: where && where.length > 0
				? where
				: ['1']
		},
		limitation
	]
}

/*
import compile from './lib/compile.js'
import { compose as composeWhere } from './lib/where.js'


export default compile({
	setters: {
		distinct: x => x,
		fields: x => x,
		from: x => x,
		where: (where, previous = {}) => ({...previous, ...where}),
		orderBy: (orderBy, previous = {}) => ({...previous, ...orderBy}),
		limit: x => x,
		offset: x => x,
	},
	render: p => {
		let { sql: whereSql, data: whereData } = composeWhere(p.where)

		return {
			sql: [
				`SELECT`,
				p.distinct ? `DISTINCT` : null,
				p.fields ? p.fields.map(field => `"${field}"`).join(', ') : '*',
				`FROM "${p.from}"`,
				whereSql ? [`WHERE`, whereSql] : null,
				p.orderBy 
					? [
						`ORDER BY`,
						{
							list: Object.entries(p.orderBy)
								.map(([key, dir]) => `"${key}" ${dir.toUpperCase()}`),
							braces: false
						}
					]
					: null,
				p.limit ? `LIMIT @limit` : null
			],
			data: {
				limit: p.limit,
				...whereData
			}
		}
	}
})
*/