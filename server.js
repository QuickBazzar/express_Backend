// builtin modules
const express = require('express')
const cors = require('cors')

//userdefined modules
const authorizeUser = require('./utils/authuser')
const userRouter = require('./routes/user.js')

const app = express()
app.use(cors())
app.use(express.json())
app.use(authorizeUser)
app.use('/user', userRouter)
app.listen(4000, 'localhost', ()=> {
    console.log('Server Started At Port 4000')
})