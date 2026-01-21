const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')

const router = express.Router()

//USER RELATED API's

// GET ALL USERS (ADMIN ONLY) 
router.get('/user/all', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT UserID, Name, Email, Role FROM users` 
  pool.query(sql,(err, data) =>{
    res.send(result.createResult(err, data))
  })
})

// DELETE USER (ADMIN ONLY)
router.delete('/delete-user/:userId', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const { userId } = req.params
  const sql = `DELETE FROM users WHERE UserID=?`

  pool.query(sql, [userId],(err, data) => {
    res.send(result.createResult(err, data))
  })
})


//RETAILER RELATED API's

// GET ALL RETAILERS (ADMIN / WHOLESALER)
router.get('/all', (req, res) => {
  if (!['ADMIN', 'WHOLESALER'].includes(req.user.role))
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT * FROM retailer`
  pool.query(sql, (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// DELETE RETAILER (ADMIN ONLY)
router.delete('/delete/:id', (req, res) => {
    if (req.user.role !== 'ADMIN')
        return res.send(result.createResult('Access denied'))
    const sql = `DELETE FROM users WHERE UserID = ? AND Role = 'RETAILER'`
    pool.query(sql, [req.params.id], (err, data) => {
        res.send(result.createResult(err, data))
    })
})

// GET SYSTEM SUMMARY (ADMIN ONLY)
router.get('/summary', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `SELECT (SELECT COUNT(*) FROM users) AS totalUsers,(SELECT COUNT(*) FROM retailer) AS totalRetailers, 
    (SELECT COUNT(*) FROM wholesaler) AS totalWholesalers,(SELECT COUNT(*) FROM orders) AS totalOrders,
    (SELECT SUM(GrandTotal) FROM orders WHERE PaymentStatus = 'PAID') AS totalRevenue,(SELECT SUM(GSTAmount) FROM orders WHERE PaymentStatus = 'PAID') AS totalGST`

  pool.query(sql, (err, data) => {
    res.send(result.createResult(err, data[0]))
  })
})


// Recalculates GSTAmount & GrandTotal based on GSTPercentage
router.post('/recalculate-gst', (req, res) => {
  if (req.user.role !== 'ADMIN')
    return res.send(result.createResult('Access denied'))

  const sql = `UPDATE orders SET GSTAmount = (SubTotal * GSTPercentage) / 100`

  pool.query(sql, (err, data) => {
    if (err) return res.send(result.createResult(err))

    res.send(result.createResult(null, {
      message: 'GST recalculated successfully',
      affectedOrders: data.affectedRows
    }))
  })
})


module.exports = router

