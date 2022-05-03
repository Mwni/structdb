import compile from './lib/compile.js'

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
					field.autoincrement ? `AUTOINCREMENT` : null,
					field.default !== undefined ? `DEFAULT ${JSON.stringify(field.default)}` : null
				])
			}
		]
	})
})