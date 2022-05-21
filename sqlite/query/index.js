import squel from 'squel'
import CreateTableQuery from './create-table.js'
import CreateIndexQuery from './create-index.js'

squel.createTable = options => new CreateTableQuery(options)
squel.createIndex = options => new CreateIndexQuery(options)

export default squel