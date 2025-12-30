const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')

const router = express.Router()
// ADD ORDER ITEM (RETAILER ONLY)
router.post('/', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const { OrderID, ProductID, Quantity, PriceAtPurchase } = req.body

  const sql = `
    INSERT INTO orderitem (OrderID, ProductID, Quantity, PriceAtPurchase)
    VALUES (?, ?, ?, ?)
  `
  pool.query(sql, [OrderID, ProductID, Quantity, PriceAtPurchase], (err, data) => {
    if (!err) updateOrderSubTotal(OrderID)
    res.send(result.createResult(err, data))
  })
})


// GET ITEMS BY ORDER (RETAILER / ADMIN)
router.get('/:orderId', (req, res) => {
  const sql = `
    SELECT oi.*, p.ProductName 
    FROM orderitem oi
    JOIN product p ON oi.ProductID = p.ProductID
    JOIN orders o ON oi.OrderID = o.OrderID
    WHERE oi.OrderID = ?
    AND (o.RetailerID = ? OR ? = 'ADMIN')
  `
  pool.query(sql,[req.params.orderId, req.user.userId, req.user.role],(err, data) => {
      res.send(result.createResult(err, data))
    }
  )
})


// UPDATE ORDER ITEM (RETAILER ONLY)
router.put('/:id', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const { Quantity, PriceAtPurchase } = req.body

  const sql = `SELECT OrderID FROM orderitem WHERE OrderItemID=?`
  pool.query(sql, [req.params.id], (err, rows) => {
    if (rows.length === 0)
      return res.send(result.createResult('Item not found'))

    const orderId = rows[0].OrderID

    const updateSql = `UPDATE orderitem SET Quantity=?, PriceAtPurchase=? WHERE OrderItemID=?`

    pool.query(updateSql,[Quantity, PriceAtPurchase, req.params.id],(err, data) => {
        if (!err) updateOrderSubTotal(orderId)
        res.send(result.createResult(err, data))
      }
    )
  })
})


// DELETE ORDER ITEM (RETAILER / ADMIN)
router.delete('/:id', (req, res) => {
  if (!['RETAILER', 'ADMIN'].includes(req.user.role))
    return res.send(result.createResult('Access denied'))

  pool.query(
    `SELECT OrderID FROM orderitem WHERE OrderItemID=?`,
    [req.params.id],
    (err, rows) => {
      if (rows.length === 0)
        return res.send(result.createResult('Item not found'))

      const orderId = rows[0].OrderID

      pool.query(
        `DELETE FROM orderitem WHERE OrderItemID=?`,
        [req.params.id],
        (err, data) => {
          if (!err) updateOrderSubTotal(orderId)
          res.send(result.createResult(err, data))
        }
      )
    }
  )
})

module.exports = router
