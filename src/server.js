import dotenv from 'dotenv'
import {app} from './app.js'
import connectToDB from './db/db.js'

dotenv.config({
  path: './env'
})

const port = process.env.PORT || 8000

connectToDB().then(
  () => {
    app.listen(port, () => {
      console.log(`Server is running at port: ${port}` )
    })
  }
).catch(
  (err) => {
    console.log("Server crashed while connecting to mongoDB")
  }
)