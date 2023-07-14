export default createPool => {
	return config => {
		let pool = createPool(config)

		if(config.idleConnectionTimeout){
			let getConnection = pool.getConnection

			pool.getConnection = function(callback){
				getConnection.call(pool, (err, connection) => {
					if(err){
						callback(err, connection)
						return
					}

					if(connection.__lastUsed){
						if(Date.now() - connection.__lastUsed > config.idleConnectionTimeout){
							connection.destroy()
							pool.getConnection(callback)
							return
						}
					}

					connection.__lastUsed = Date.now()
					callback(err, connection)
				})
			}
		}

		return pool
	}
}