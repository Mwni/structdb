import fs from 'fs/promises'
import { Client } from '@jxdb/sqlite'

let schemaString = await fs.readFile('schema.json')
let schemaJson = JSON.parse(schemaString)
let client = new Client({
	file: 'test.db',
	schema: schemaJson
})

async function createPost(){
	let user = await client.users.createOne({
		data: {
			nick: 'Mwni'
		}
	})

	console.log('created user:', user)
	
	let idea = await user.ideas.createOne({
		data: {
			text: 'This is awesome.'
		}
	})

	console.log('created idea:', idea)
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