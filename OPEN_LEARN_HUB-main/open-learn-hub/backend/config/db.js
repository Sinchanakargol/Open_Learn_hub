import mongoose from 'mongoose'

export default async function connectMongo(){
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/open_learn_hub'
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  console.log('Mongo connected')
}
