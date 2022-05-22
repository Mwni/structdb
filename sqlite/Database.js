import fs from 'fs'
import DatabaseAdapter from 'better-sqlite3'



export function open({ file, journalMode }){
	let connection
	let blank = !fs.existsSync(file)
	let inTx

	try{
		connection = new DatabaseAdapter(file)

		if(journalMode){
			connection.pragma(`journal_mode = ${journalMode}`)
		}
	}catch(error){
		connection.close()
		throw error
	}

	return {
		get blank(){
			return blank
		},

		close(){
			connection.close()
		},

		compact(){
			connection.pragma('wal_checkpoint(TRUNCATE)')
		},

		tx(executor){
			if(inTx)
				return executor()
	
			connection.exec('BEGIN IMMEDIATE')
			inTx = true
			
			try{
				var ret = executor()
	
				if(ret instanceof Promise){
					ret
						.then(ret => {
							connection.exec('COMMIT')
						})
						.catch(error => {
							throw error
						})
				}else{
					connection.exec('COMMIT')
				}
			}catch(error){
				connection.exec('ROLLBACK')
	
				throw error
			}finally{
				inTx = false
			}
	
			return ret
		},
	
		run(query){
			let { text, values } = query.toParam()

			console.log(text, values)
	
			return connection
				.prepare(text)
				.run(values)
		},
	
		get(query){
			let { text, values } = query.toParam()
	
			return connection
				.prepare(text)
				.get(values)
		},
	
		all(query){
			let { text, values } = query.toParam()

			console.log(text, values)
	
			return connection
				.prepare(text)
				.all(values)
		}
	}
}