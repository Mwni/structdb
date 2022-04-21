import Codec from './Codec.js'

let codec = new Codec({
	type: 'object',
	properties: {
		name: {
			type: 'string'
		},
		age: {
			type: 'integer'
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
			}
		}
	}
})


let encoded = codec.encode({
	name: 'Mr Test',
	age: 25,
	account: {
		id: 1,
		created_at: '2020-01-01'
	}
})

console.log('encoded:', encoded)
console.log('decoded:', codec.decode(encoded))