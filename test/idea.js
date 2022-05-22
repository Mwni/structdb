import fs from 'fs/promises'
import { open } from '@structdb/sqlite'

let schemaString = await fs.readFile('schema.json')
let schemaJson = JSON.parse(schemaString)
let client = open({
	file: 'test.db',
	schema: schemaJson
})

async function createIdea(){
	let idea = await client.ideas.createOne({
		data: {
			text: 'Wieso eigentlich nicht',
			user: {
				nick: 'Mwni',
				meta: {
					lol: 1
				}
			}
		}
	})

	console.log('created idea:', idea)

	let refoundIdea = await client.ideas.readOne({
		where: {
			user: {
				nick: 'Mwni'
			}
		}
	})

	console.log('found idea:', refoundIdea)

	//let allIdeas = await idea.user.ideas.readMany()

	//console.log('all ideas:', allIdeas)
}

async function wipe(){
	await client.close()
	//await fs.unlink('test.db')
}

await createIdea()
	.catch(error => console.error(error))

await wipe()