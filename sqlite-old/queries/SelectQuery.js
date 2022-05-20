import compile from './lib/compile.js'
import { compose as composeWhere } from './lib/where.js'


export default compile({
	setters: {
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
