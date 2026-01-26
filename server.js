// builtin modules
const express = require('express')
const cors = require('cors')

// user-defined modules
const authorizeUser = require('./utils/authuser')
const userRouter = require('./routes/user.js')
const retailerRouter = require('./routes/retailers.js')
const reportsRouter = require('./routes/reports')
const adminRouter = require('./routes/admin')
const paymentRouter = require('./routes/payments')
const productRouter = require('./routes/product.js')
const wholesalerRouter = require('./routes/wholesaler.js')
const orderRouter = require('./routes/order.js')
const orderItemRouter = require('./routes/orderItem.js')


const app = express()

app.use(cors())
app.use(express.json())

app.use('/productimages', express.static('productimages'))

app.use(authorizeUser)

app.use('/user', userRouter)
app.use('/retailer', retailerRouter)
app.use('/reports', reportsRouter)
app.use('/admin', adminRouter)
app.use('/payments', paymentRouter)
app.use('/product', productRouter)
app.use('/wholesaler', wholesalerRouter)
app.use('/orders', orderRouter)
app.use("/orderitem", orderItemRouter)


app.listen(4000, '0.0.0.0', () => {
  console.log('Server Started At Port 4000')
})
