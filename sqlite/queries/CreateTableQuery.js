import compile from './compileQuery.js'

export default compile({
	setters: {
		name: x => x,
		fields: x => x,
	},
	render: p => ({
		sql: [
			`CREATE TABLE "${p.name}"`,
			{
				list: p.fields.map(field => [
					`"${field.name}"`,
					field.type,
					field.notNull ? `NOT NULL` : null,
					field.primary ? `PRIMARY KEY` : null,
					field.autoincrement ? `AUTOINCREMENT` : null
				])
			}
		]
	})
})