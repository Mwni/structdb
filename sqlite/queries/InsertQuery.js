import compile from './compileQuery.js'

export default compile({
	setters: {
		into: x => x,
		data: x => x,
	},
	render: p => ({
		sql: [
			`INSERT`,
			`INTO "${p.table}"`,
			Object.keys(p.data).map(key => `"${key}"`),
			`VALUES`,
			Object.keys(p.data).map(key => `@${key}`)
		]
	})
})