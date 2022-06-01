import fs from 'fs'
import createQueryLayer from 'knex'
import InternalSQLError from './errors/internal-sql.js'



export async function open({ file, journalMode }){
	let connection
	let blank = !fs.existsSync(file)
	let inTx = false

	try{
		connection = createQueryLayer({
			client: 'better-sqlite3',
			connection: {
				filename: file
			},
			useNullAsDefault: true
		})

		if(journalMode){
			await connection.raw(`PRAGMA journal_mode = ${journalMode}`)
		}
	}catch(error){
		await connection.destroy()
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

	return Object.assign(
		connection,
		{
			get blank(){
				return blank
			},
	
			async close(){
				await this.compact()
				await connection.destroy()

				if(fs.existsSync(`${file}-wal`)){
					fs.unlinkSync(`${file}-wal`)
					fs.unlinkSync(`${file}-shm`)
				}
			},
	
			async compact(){
				await connection.raw('PRAGMA wal_checkpoint(TRUNCATE)')
			},

			async tx(executor){
				if(inTx)
					return executor()
		
				connection.raw('BEGIN IMMEDIATE')
				inTx = true
				
				try{
					var result = await executor()
					connection.raw('COMMIT')
				}catch(error){
					connection.raw('ROLLBACK')
					throw error
				}finally{
					inTx = false
				}
		
				return result
			},
		}
	)
}