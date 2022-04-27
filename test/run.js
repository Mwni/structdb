import fs from 'fs/promises'
import { Client } from '@crisma/sqlite'

let schemaString = await fs.readFile('schema.json')
let schemaJson = JSON.parse(schemaString)
let client = new Client({
	file: 'test.db',
	schema: schemaJson
})

async function createPost(){
	let user = await client.users.insertOne({
		nick: 'Mwni'
	})
	
	let post = await user.posts.insertOne({
		text: 'This is awesome.'
	})

	console.log('created post:', post)
}


async function findMwni(){
	let user = await client.users.loadOne({
		where: {
			nick: 'Mwni'
		}
	})

	let posts = await user.posts
		.loadAll()
		.votes.countAll()
}



await createPost()
//await findMwni()