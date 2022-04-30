import compile from './compileQuery.js'

export default compile({
	setters: {
		name: x => x,
		on: x => x,
		unique: x => x,
		fields: x => x,
	},
	render: p => ({
		sql: [
			`CREATE`,
			p.unique ? `UNIQUE INDEX` : `INDEX`,
			`"${p.name}"`,
			`ON "${p.on}"`,
			{ list: p.fields }
		]
	})
})