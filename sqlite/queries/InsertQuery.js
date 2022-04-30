import compile from './compileQuery.js'

export default compile({
	setters: {
		into: x => x,
		data: x => x,
	},
	render: p => ({
		sql: [
			`INSERT`,
			`INTO "${p.into}"`,
			{ list: Object.keys(p.data).map(key => `"${key}"`) },
			`VALUES`,
			{ list: Object.keys(p.data).map(key => `@${key}`) }
		],
		data: p.data
	})
})