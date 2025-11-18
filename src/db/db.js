import mongoose from "mongoose";

const mongodbUri = process.env.MONGODB_URI

if(!mongodbUri){
  throw Error ("Mongodb uri is missing")
}

const connectToDB = async() => {
  try {
    const instance = await mongoose.connect(mongodbUri)
    console.log("MongoDB is connected")

  } catch (error) {
    console.log("MongoDB Connection failed: ", error)
    process.exit(1)
  }
}

export default connectToDB