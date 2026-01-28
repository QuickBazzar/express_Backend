const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')

const router = express.Router()

router.post('/', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const { SubTotal } = req.body
  const GSTPercentage = 18

  if (!SubTotal || SubTotal <= 0)
    return res.send(result.createResult('Invalid SubTotal'))

  const sqlRetailer = `SELECT RetailerID FROM retailer WHERE UserID=?`

  pool.query(sqlRetailer, [req.user.userId], (err, rows) => {
    if (err) return res.send(result.createResult(err))
    if (rows.length === 0)
      return res.send(result.createResult('Retailer not found'))

    const GSTAmount = (SubTotal * GSTPercentage) / 100
    const TotalAmount = SubTotal + GSTAmount

    const sql = `
      INSERT INTO orders
      (RetailerID, SubTotal, GSTPercentage, GSTAmount, TotalAmount, PaymentStatus, DeliveryStatus)
      VALUES (?, ?, ?, ?, ?, 'PENDING', 'PENDING')
    `

    pool.query(
      sql,
      [rows[0].RetailerID, SubTotal, GSTPercentage, GSTAmount, TotalAmount],
      (err, data) =>
        res.send(result.createResult(err, { OrderID: data.insertId }))
    )
  })
})


// GET RETAILER'S OWN ORDERS
router.get('/retailer/orders', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT o.* FROM orders o JOIN retailer r ON o.RetailerID = r.RetailerID WHERE r.UserID=? ORDER BY o.OrderID DESC`

  pool.query(sql, [req.user.userId], (err, data) =>
    res.send(result.createResult(err, data))
  )
})

// GET WHOLESALER'S OWN ORDERS (ONLY THEIR PRODUCTS)
router.get('/wholesaler/orders', (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT DISTINCT o.* FROM orders o JOIN orderitem oi ON o.OrderID = oi.OrderID
              JOIN product p ON oi.ProductID = p.ProductID
              JOIN wholesaler w ON p.WholesalerID = w.WholesalerID
              WHERE w.UserID = ? ORDER BY o.OrderID DESC`

  pool.query(sql, [req.user.userId], (err, data) =>
    res.send(result.createResult(err, data))
  )
})


router.get('/', (req, res) => {
  if (!['ADMIN'].includes(req.user.role))
    return res.send(result.createResult('Access denied'))

  pool.query(
    `SELECT * FROM orders ORDER BY OrderID DESC`,
    (err, data) => res.send(result.createResult(err, data))
  )
})

router.get('/:id', (req, res) => {
  const sql = `
    SELECT o.*
    FROM orders o
    JOIN retailer r ON o.RetailerID = r.RetailerID
    WHERE o.OrderID = ?
    AND (r.UserID = ? OR ? = 'ADMIN')
  `

  pool.query(
    sql,
    [req.params.id, req.user.userId, req.user.role],
    (err, data) => res.send(result.createResult(err, data))
  )
})

router.patch('/:id/status', (req, res) => {
  if (!['ADMIN', 'WHOLESALER'].includes(req.user.role))
    return res.send(result.createResult('Access denied'))

  const { DeliveryStatus } = req.body

  pool.query(
    `UPDATE orders SET DeliveryStatus=? WHERE OrderID=?`,
    [DeliveryStatus, req.params.id],
    (err, data) => res.send(result.createResult(err, data))
  )
})

router.get('/:id/gst', (req, res) => {
  const sql = `
    SELECT OrderID, SubTotal, GSTPercentage,
           (SubTotal * GSTPercentage) / 100 AS GSTAmount,
           (SubTotal + (SubTotal * GSTPercentage) / 100) AS GrandTotal
    FROM orders
    WHERE OrderID = ?
  `
  pool.query(sql, [req.params.id], (err, data) =>
    res.send(result.createResult(err, data))
  )
})

// CANCEL ORDER - Allow RETAILER to cancel their own orders
router.patch('/:id/cancel', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  // Check if order belongs to this retailer and is cancellable
  const checkSql = `
    SELECT o.OrderID, o.PaymentStatus, o.DeliveryStatus
    FROM orders o 
    JOIN retailer r ON o.RetailerID = r.RetailerID 
    WHERE o.OrderID = ? AND r.UserID = ?
  `

  pool.query(checkSql, [req.params.id, req.user.userId], (err, rows) => {
    if (err) return res.send(result.createResult(err))
    if (rows.length === 0)
      return res.send(result.createResult('Order not found or unauthorized'))

    // Check if order can be cancelled
    if (rows[0].PaymentStatus !== 'PENDING' || rows[0].DeliveryStatus !== 'PENDING')
      return res.send(result.createResult('Order cannot be cancelled'))

    // Restore stock
    const restoreSql = `
      UPDATE product p 
      JOIN orderitem oi ON p.ProductID = oi.ProductID 
      SET p.StockQuantity = p.StockQuantity + oi.Quantity 
      WHERE oi.OrderID = ?
    `

    pool.query(restoreSql, [req.params.id], err => {
      if (err) return res.send(result.createResult(err))

      // Cancel the order
      const cancelSql = `UPDATE orders SET DeliveryStatus='CANCELLED', PaymentStatus='CANCELLED' WHERE OrderID=?`
      
      pool.query(cancelSql, [req.params.id], (err, data) => {
        if (err) return res.send(result.createResult(err))
        res.send(result.createResult(null, 'Order cancelled successfully'))
      })
    })
  })
})

router.delete('/:id', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  pool.query(
    `DELETE FROM orders WHERE OrderID=?`,
    [req.params.id],
    (err, data) => res.send(result.createResult(err, data))
  )
})

module.exports = router