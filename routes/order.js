const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')

const router = express.Router()


router.post('/', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const userId = req.user.userId
  const { SubTotal } = req.body
  const GSTPercentage = 18

  if (!SubTotal || SubTotal <= 0)
    return res.send(result.createResult('Invalid SubTotal'))

  const sqlRetailer = `SELECT RetailerID FROM retailer WHERE UserID = ?`
  pool.query(sqlRetailer, [userId], (err, rows) => {
    if (err) return res.send(result.createResult(err))

    if (rows.length === 0)
      return res.send(result.createResult('Retailer profile not found'))

    const retailerId = rows[0].RetailerID

    const GSTAmount = (SubTotal * GSTPercentage) / 100
    const TotalAmount = SubTotal + GSTAmount

    const sql = `INSERT INTO orders (RetailerID, SubTotal, GSTPercentage, GSTAmount, TotalAmount, PaymentStatus, DeliveryStatus)
                 VALUES (?, ?, ?, ?, ?, 'PENDING', 'PENDING')`

    pool.query(
      sql,
      [retailerId, SubTotal, GSTPercentage, GSTAmount, TotalAmount],
      (err, data) => {
        res.send(result.createResult(err, data))
      }
    )
  })
})




// GET ALL ORDERS (ADMIN / WHOLESALER)
router.get('/', (req, res) => {
  if (!['ADMIN', 'WHOLESALER'].includes(req.user.role))
    return res.send(result.createResult('Access denied'))

  pool.query(`SELECT * FROM orders ORDER BY OrderID DESC`, (err, data) => {
    res.send(result.createResult(err, data))
  })
})



// GET ORDER BY ID (Retailer / ADMIN)
router.get('/:id', (req, res) => {
  const sql = `SELECT * FROM orders WHERE OrderID = ? AND (RetailerID = ? OR ? = 'ADMIN')`

  pool.query(sql,[req.params.id, req.user.userId, req.user.role],(err, data) => {
      res.send(result.createResult(err, data))
    }
  )
})


// GET OWN ORDERS (RETAILER)
router.get('/retailer/orders', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT * FROM orders WHERE RetailerID = ? ORDER BY OrderID DESC`
  pool.query(sql, [req.user.userId], (err, data) => {
    res.send(result.createResult(err, data))
  })
})


// UPDATE DELIVERY STATUS (ADMIN / WHOLESALER)
router.patch('/:id/status', (req, res) => {
  if (!['ADMIN', 'WHOLESALER'].includes(req.user.role))
    return res.send(result.createResult('Access denied'))

  const sql = `UPDATE orders SET DeliveryStatus=? WHERE OrderID=?`
  pool.query(sql, [req.body.DeliveryStatus, req.params.id], (err, data) => {
    res.send(result.createResult(err, data))
  })
})



// calculate GST (RETAILER/ ADMIN / WHOLESALER)
router.get('/:id/gst', (req, res) => {
  const sql = ` SELECT OrderID, SubTotal,GSTPercentage,(SubTotal * GSTPercentage) / 100 AS GSTAmount,
                (SubTotal + (SubTotal * GSTPercentage) / 100) AS TotalAmount
                 FROM orders
                 WHERE OrderID = ? `
  pool.query(sql, [req.params.id], (err, data) => {
    res.send(result.createResult(err, data))
  })
})



// DELETE ORDER (ADMIN ONLY)
router.delete('/:id', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  pool.query(
    `DELETE FROM orders WHERE OrderID=?`,
    [req.params.id],
    (err, data) => {
      res.send(result.createResult(err, data))
    }
  )
})

module.exports = router
