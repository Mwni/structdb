export default function({ table, data }){
	return [
		{
			text: `INSERT INTO \`${table}\``
		},
		{
			text: `(%)`,
			join: `, `,
			items: Object.keys(data)
				.map(key => `\`${key}\``)
		},
		{
			text: `VALUES`
		},
		{
			text: `(%)`,
			join: `, `,
			items: Object.values(data)
				.map(value => ({ text: `?`, values: [value] }))
		},
		{
			text: `ON DUPLICATE KEY UPDATE`
		},
		{
			text: `%`,
			join: `, `,
			items: Object.entries(data)
				.map(([key, value]) => ({ text: `\`${key}\` = ?`, values: [value] }))
		},
	]
}