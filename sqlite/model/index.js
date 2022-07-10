import { createOne } from './operations/create.js'
import { read, count } from './operations/read.js'
import { update } from './operations/update.js'
import { remove } from './operations/delete.js'



export function create({ database, struct }){
	return {
		createOne(args){
			return createOne({
				...args,
				database: database.write,
				struct
			})
		},

		readOne(args = {}){
			return (
				read({
					...args,
					take: args.last ? -1 : 1,
					database: database.read,
					struct
				})
			)[0]
		},

		readLast(args = {}){
			return (
				read({
					...args,
					take: -1,
					database: database.read,
					struct
				})
			)[0]
		},

		readMany(args = {}){
			return read({
				...args,
				database: database.read,
				struct
			})
		},

		readGrouped({ by, ...args }){
			return read({
				...args,
				groupBy: by,
				database: database.read,
				struct
			})
		},

		iter(args = {}){
			return read({
				...args,
				database: database.read,
				struct,
				iter: true
			})
		},

		updateOne(args){
			return update({
				...args,
				database: database.write,
				struct,
				take: 1
			})[0]
		},

		updateMany(args){
			return update({
				...args,
				database: database.write,
				struct
			})
		},

		deleteOne(args = {}){
			return remove({
				...args,
				database: database.write,
				struct,
				limit: 1
			})
		},

		deleteMany(args = {}){
			return remove({
				...args,
				database: database.write,
				struct
			})
		},

		count(args = {}){
			return count({
				...args,
				database: database.read,
				struct
			})
		},
	}
}
