import fs from 'fs/promises'
import { Client } from '@jxdb/sqlite'

let schemaString = await fs.readFile('schema.json')
let schemaJson = JSON.parse(schemaString)
let client = new Client({
	file: 'test.db',
	schema: schemaJson
})

async function createPost(){
	let post = await client.posts.createOne({
		data: {
			text: 'Großartig',
			user: {
				nick: 'Mwni'
			}
		},
		duplicate: {
			user: {
				ignore: true
			}
		}
	})

	console.log('created post:', post)
}

await createPost()