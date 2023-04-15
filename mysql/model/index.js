import { createOne } from './operations/create.js'
import { read, count, readRaw } from './operations/read.js'
import { update } from './operations/update.js'
import { remove } from './operations/delete.js'



export function create({ database, struct }){
	return {
		async createOne(args){
			return await createOne({
				...args,
				database,
				struct
			})
		},

		async readOne(args = {}){
			return (
				await read({
					...args,
					take: args.last ? -1 : 1,
					database,
					struct
				})
			)[0]
		},

		async readLast(args = {}){
			return (
				await read({
					...args,
					take: -1,
					database,
					struct
				})
			)[0]
		},

		async readOneRaw(args = {}){
			return (
				await readRaw({
					...args,
					database,
					struct
				}))
			[0]
		},

		async readMany(args = {}){
			return await read({
				...args,
				database,
				struct
			})
		},

		async readManyRaw(args = {}){
			return await readRaw({
				...args,
				database,
				struct
			})
		},

		async readGrouped({ by, ...args }){
			return await read({
				...args,
				groupBy: by,
				database,
				struct
			})
		},

		iter({ dedicated = true, ...args } = {}){
			if(dedicated){
				let readAccess = database.clone({ 
					readonly: true 
				})

				let iter = read({
					...args,
					database: readAccess,
					struct,
					iter: true
				})

				iter.done.then(readAccess.close)

				return iter
			}else{
				return read({
					...args,
					database: database,
					struct,
					iter: true
				})
			}
		},

		async updateOne(args){
			return await update({
				...args,
				database,
				struct,
				take: 1
			})[0]
		},

		async updateMany(args){
			return await update({
				...args,
				database,
				struct
			})
		},

		async deleteOne(args = {}){
			return await remove({
				...args,
				database,
				struct,
				limit: 1
			})
		},

		async deleteMany(args = {}){
			return await remove({
				...args,
				database,
				struct
			})
		},

		async count(args = {}){
			return await count({
				...args,
				database,
				struct
			})
		},
	}
}
