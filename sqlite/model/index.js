import { createOne } from './operations/create.js'
import { read, count } from './operations/read.js'
import { update } from './operations/update.js'
import { remove } from './operations/delete.js'



export function create({ database, struct }){
	return {
		createOne(args){
			return createOne({
				...args,
				database,
				struct
			})
		},

		readOne(args = {}){
			return (
				read({
					...args,
					take: args.last ? -1 : 1,
					database,
					struct
				})
			)[0]
		},

		readLast(){
			return (
				read({
					...args,
					take: -1,
					database,
					struct
				})
			)[0]
		},

		readMany(args = {}){
			return read({
				...args,
				database,
				struct
			})
		},

		readGrouped({ by, ...args }){
			return read({
				...args,
				groupBy: by,
				database,
				struct
			})
		},

		iter(args = {}){
			return read({
				...args,
				database,
				struct,
				iter: true
			})
		},

		updateOne(args){
			return update({
				...args,
				database,
				struct,
				take: 1
			})[0]
		},

		updateMany(args){
			return update({
				...args,
				database,
				struct
			})
		},

		deleteOne(args = {}){
			return remove({
				...args,
				database,
				struct,
				limit: 1
			})
		},

		deleteMany(args = {}){
			return remove({
				...args,
				database,
				struct
			})
		},

		count(args = {}){
			return count({
				...args,
				database,
				struct
			})
		},
	}
}
