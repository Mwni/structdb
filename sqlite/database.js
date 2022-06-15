import fs from 'fs'
import DatabaseAdapter from 'better-sqlite3'
import InternalSQLError from './errors/internal-sql.js'



export function open({ file, journalMode }){
	let connection
	let blank = !fs.existsSync(file)
	let inTx
	try{
		connection = new DatabaseAdapter(file)
		connection.defaultSafeIntegers(true)

		if(journalMode){
			connection.pragma(`journal_mode = ${journalMode}`)
		}
	}catch(error){
		connection.close()
		throw error
	}

	function prepare(sql){
		try{
			return connection.prepare(sql)
		}catch(error){
			throw new InternalSQLError({
				message: error.message,
				sql
			})
		}
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
	
		run({ text, values }){
			//console.log(text, values)

			return prepare(text)
				.run(values)
		},

		get({ text, values }){
			//console.log(text, values)

			return prepare(text)
				.get(values)
		},
	
		all({ text, values }){
			//console.log(text, values)

			return prepare(text)
				.all(values)
		},

		iter({ text, values }){
			return prepare(text)
				.iterate(values)
		},
	}
}