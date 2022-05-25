import squel from 'squel'
import CreateTableQuery from './create-table.js'
import CreateIndexQuery from './create-index.js'
import UpsertQuery from './upsert.js'

squel.createTable = options => new CreateTableQuery(options)
squel.createIndex = options => new CreateIndexQuery(options)
squel.upsert = options => new UpsertQuery(options)

squel.registerValueHandler('bigint', bigint => bigint)

export default squel