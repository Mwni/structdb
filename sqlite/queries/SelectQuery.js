import compile from './compileQuery.js'

export default compile({
	setters: {
		from: x => x,
		where: (where, previous = {}) => ({...previous, ...where}),
		orderBy: (field, dir) => ({ field, dir }),
		limit: x => x,
		offset: x => x,
	},
	render: p => ({
		sql: [
			`SELECT *`,
			`FROM "${p.from}"`,
			p.orderBy ? `ORDER BY "${p.orderBy.field}" ${p.orderBy.dir}` : null,
			p.limit ? `LIMIT @limit` : null
		],
		data: {
			limit: p.limit
		}
	})
})