import fs from 'fs'
import { createConnection } from 'mysql'


export function open({ host, user, password, database }){
	let connection
	let isPool = false

	try{
		connection = createConnection({ 
			host, 
			user, 
			password, 
			database,
			charset: 'utf8mb4'
		})
	}catch(error){
		throw error
	}

	async function getConnection(){
		let con

		if(isPool)
			con = await new Promise((resolve, reject) => connection.getConnection((err, con) => {
				if(err)
					reject(err)
				else
					resolve(con)
			}))
		else
			con = connection

		if(!connection){
			throw new Error('no connection available')
		}

		return con
	}

	async function query({ sql, values }){
		try{
			var con = await getConnection()
		}catch(e){
			throw new Error(e.message)
		}
		
		return new Promise((resolve, reject) => {
			con.query({sql, values}, (error, results, fields) => {
				if(isPool)
					con.release()

				if(error){
					reject(error)
					return
				}

				resolve(results)
			})
		})
	}

	return {
		close(){
			connection.close()
		},

		exec({ sql, values }){
			return query({ sql, values })
				.then(res => res.affectedRows)
		},

		insert({ sql, values }){
			return query({ sql, values })
				.then(res => res.insertId)
		},

		get({ sql, values }){
			return query({ sql, values })
				.then(res => res[0])
		},
	
		all({ sql, values }){
			return query({ sql, values })
		}
	}
}