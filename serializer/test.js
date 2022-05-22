import Codec from './Codec.js'

const toBinString = (bytes) =>
  bytes.reduce((str, byte) => str + byte.toString(2).padStart(8, '0') + ' ', '');

let codec = new Codec({
	type: 'object',
	properties: {
		name: {
			type: 'string'
		},
		age: {
			type: 'number'
		},
		account: {
			type: 'object',
			properties: {
				id: {
					type: 'integer'
				},
				created_at: {
					type: 'string'
				}
			},
			required: ['id']
		},
		posts: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: {
						type: 'integer'
					},
					text: {
						type: 'string'
					}
				},
				required: ['id', 'text']
			},
		}
	},
	required: ['name', 'age', 'account', 'posts']
})

let data = {
	name: 'Mr Test',
	age: 25,
	account: {
		id: 1,
		created_at: '2020-01-01'
	},
	posts: [
		{
			id: 121212,
			text: 'Hello test test this is a post lmao'
		},
		{
			id: 121213,
			text: 'kek'
		}
	]
}

let encoded = codec.encode(data)

console.log('encoded:', encoded)
console.log('json size:', JSON.stringify(data).length)
console.log('decoded:', codec.decode(encoded))