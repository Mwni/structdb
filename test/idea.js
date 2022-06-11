import fs from 'fs/promises'
import { open } from '@structdb/sqlite'

let schemaString = await fs.readFile('schema.json')
let schemaJson = JSON.parse(schemaString)
let client = await open({
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


	let vote = client.votes.createOne({
		data: {
			user: {
				nick: 'Voter'
			},
			idea: {
				text: 'another refactor',
				user: {
					nick: 'Mwni',
					meta: {
						lol: 2
					}
				}
			},
			type: 'up'
		}
	})

	console.log(`created vote:`, vote)

	vote = client.votes.update({
		data: {
			type: 'down'
		},
		where: {
			id: vote.id
		}
	})

	console.log(`updated vote:`, vote)
}

async function wipe(){
	await client.close()
	//await fs.unlink('test.db')
}

await createIdea()
	.catch(error => console.error(error))

await wipe()