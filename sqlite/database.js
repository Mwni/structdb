import fs from 'fs'
import DatabaseAdapter from 'better-sqlite3'
import InternalSQLError from './errors/internal-sql.js'



export function open({ file, journalMode }){
	let connection
	let blank = !fs.existsSync(file)
	let statementCache = {}


	try{
		connection = new DatabaseAdapter(file, { timeout: 60000 })
		connection.defaultSafeIntegers(true)
		connection.unsafeMode(true)

		if(journalMode){
			connection.pragma(`journal_mode = ${journalMode}`)
		}
	}catch(error){
		connection.close()
		throw error
	}

	function prepare(sql){
		let cached = statementCache[sql]

		if(cached)
			return cached

		try{
			return statementCache[sql] = connection.prepare(sql)
		}catch(error){
			throw new InternalSQLError({
				message: error.message,
				sql
			})
		}
	}

	return patchImmediateLockThrow({
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
			if(connection.inTransaction)
				return executor()
	
			connection.exec('BEGIN IMMEDIATE')
			
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

				if(error.stack)
					error.stack = `${error.stack}\n\n[[The error occured inside a transaction, which was rolled back]]\n`
					
				throw error
			}
	
			return ret
		},
	
		run({ text, values }){
			return prepare(text)
				.run(values)
		},

		get({ text, values }){
			return prepare(text)
				.get(values)
		},
	
		all({ text, values }){
			return prepare(text)
				.all(values)
		},

		iter({ text, values }){
			return prepare(text)
				.iterate(values)
		},
	})
}

export function tracing(database){
	return {
		...database,

		run({ text, values }){
			console.log(text, values)
			console.time(`> time`)
			let res = database.run({ text, values })
			console.timeEnd(`> time`)

			return res
		},

		get({ text, values }){
			console.log(text, values)
			console.time(`> time`)
			let res = database.get({ text, values })
			console.timeEnd(`> time`)

			return res
		},
	
		all({ text, values }){
			console.log(text, values)
			console.time(`> time`)
			let res = database.all({ text, values })
			console.timeEnd(`> time`)

			return res
		},
	}
}

function patchImmediateLockThrow(database){
	return {
		...database,
		...['run', 'get', 'all', 'iter'].reduce(
			(patched, method) => ({
				...patched,
				[method]: args => {
					while(true){
						try{
							return database[method](args)
						}catch(error){
							if(error.code !== 'SQLITE_BUSY' && error.code !== 'SQLITE_BUSY_SNAPSHOT'){
								throw error
							}
						}
					}
				}
			}),
			{}
		)
	}
}