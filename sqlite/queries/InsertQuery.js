import compile from './compileQuery.js'

export default compile({
	setters: {
		into: x => x,
		data: x => x,
		upsert: x => x,
	},
	render: p => ({
		sql: [
			`INSERT`,
			`INTO "${p.into}"`,
			{ list: Object.keys(p.data).map(key => `"${key}"`) },
			`VALUES`,
			{ list: Object.keys(p.data).map(key => `@${key}`) },
			p.upsert
				? [
					`ON CONFLICT DO UPDATE SET`,
					{ 
						list: Object.keys(p.data).map(key => `"${key}" = excluded."${key}"`) ,
						braces: false
					},
				]
				: null
		],
		data: p.data
	})
})