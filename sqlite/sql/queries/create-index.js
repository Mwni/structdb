export default function({ name, table, unique, fields }){
	return [
		{
			text: `CREATE`
		},
		{
			text: unique ? `UNIQUE INDEX` : `INDEX`
		},
		{
			text: `"${name}" ON ${table}`
		},
		{
			text: `(%)`,
			join: `, `,
			items: fields
				.map(field => `COALESCE("${field}", 0)`)
		}
	]
}