const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')

const router = express.Router()

// CREATE PAYMENT (INITIATE ONLY)
router.post('/', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const { orderId, paymentMode, amount } = req.body

  if (!orderId || !amount)
    return res.send(result.createResult('OrderId and amount are required'))

  const checkSql = `SELECT o.OrderID FROM orders o JOIN retailer r ON o.RetailerID = r.RetailerID WHERE o.OrderID = ? AND r.UserID = ?`

  pool.query(checkSql, [orderId, req.user.userId], (err, rows) => {
    if (err) return res.send(result.createResult(err))

    // Check authorization BEFORE processing payment
    if (rows.length === 0)
      return res.send(result.createResult('Order not found or unauthorized'))

    // Handle CASH payment mode
    if (paymentMode === 'CASH') {
      pool.query(
        `UPDATE orders SET PaymentStatus='PENDING' WHERE OrderID=?`,
        [orderId],
        (err) => {
          if (err) return res.send(result.createResult(err))
        }
      )
    }
    
    const paySql = `INSERT INTO payment (OrderID, PaymentMode, Amount) VALUES (?, ?, ?)`

    pool.query(paySql, [orderId, paymentMode, amount], (err, data) => {
      if (err) return res.send(result.createResult(err))

      res.send(result.createResult(null, {
        paymentId: data.insertId,
        status: 'PENDING',
        message: 'Payment initiated'
      }))
    })
  })
})


// GET PAYMENT BY ORDER ID
router.get('/order/:id', (req, res) => {
  let sql
  let params

  // ADMIN (can view any payment)
  if (req.user.role === 'ADMIN') {
    sql = `SELECT p.* FROM payment p WHERE p.OrderID = ?`
    params = [req.params.id]
  }
  // RETAILER (can view only own order payment)
  else if (req.user.role === 'RETAILER') {
    sql = `SELECT p.* FROM payment p JOIN orders o ON p.OrderID = o.OrderID WHERE p.OrderID = ? AND o.RetailerID = ?`
    params = [req.params.id, req.user.userId]
  }
  else {
    return res.send(result.createResult('Access denied'))
  }

  pool.query(sql, params, (err, data) => {
    if (!err && data.length === 0)
      return res.send(result.createResult('Payment not found'))

    res.send(result.createResult(err, data[0]))
  })
})

//  GET ALL PAYMENTS (ADMIN ONLY)
router.get('/all', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  pool.query(`SELECT * FROM payment`, (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// UPDATE PAYMENT STATUS
router.patch('/status/:id', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const { status } = req.body

  if (!['PAID', 'FAILED', 'PENDING'].includes(status))
    return res.send(result.createResult('Invalid payment status'))

  const sql = `UPDATE orders o JOIN payment p ON o.OrderID = p.OrderID SET o.PaymentStatus = ? WHERE p.PaymentID = ?`

  pool.query(sql, [status, req.params.id], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// GET PAYMENTS BY MODE
router.get('/mode/:mode', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const mode = req.params.mode.toUpperCase()
  
  if (!['CASH', 'UPI', 'CARD', 'WALLET'].includes(mode))
    return res.send(result.createResult('Invalid payment mode'))

  const sql = `SELECT * FROM payment WHERE PaymentMode = ?`

  pool.query( sql,[mode],(err, data) => {
      res.send(result.createResult(err, data))
    }
  )
})

module.exports = router