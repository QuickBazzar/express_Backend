// builtin modules
const express = require('express')
const cors = require('cors')

//userdefined modules
const authorizeUser = require('./utils/authuser')

const userRouter = require('./routes/user.js')
const retailerRouter = require('./routes/retailers.js')
const orderRouter = require('./routes/order.js')
const orderItemRouter = require('./routes/orderItem.js')

const app = express()
app.use(cors())
app.use(express.json())
app.use(authorizeUser)

app.use('/user', userRouter)
app.use('/retailer', retailerRouter)
app.use('/orders',orderRouter)
app.use('/orderitem',orderItemRouter)


app.listen(4000, 'localhost', ()=> {
    console.log('Server Started At Port 4000')
})