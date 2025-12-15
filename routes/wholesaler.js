const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')
const authorizeRole = require('../utils/authuser')

const router = express.Router()

// ADD WHOLESALER (WHOLESALER ONLY)
router.post('/add', (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const { shopName, contactNumber, address, gstNumber } = req.body
  const userId = req.user.userId

  const sql = `INSERT INTO wholesaler(UserID, BusinessName, ContactNumber, Address, GSTNumber) VALUES (?, ?, ?, ?, ?)`

  pool.query(sql,[userId, shopName, contactNumber, address, gstNumber],(err, data) => {
      res.send(result.createResult(err, data))
    }
  )
})

// GET ALL WHOLESALERS (ADMIN ONLY)
router.get('/all', (req, res) => {
  if (req.user.role !== 'ADMIN')
      return res.send(result.createResult('Access denied'))
  
  const sql = `SELECT UserID, Name, Email FROM users WHERE Role = 'WHOLESALER'`
  pool.query(sql, (err, data) => {
    res.send(result.createResult(err, data))
  })
})

// GET WHOLESALER BY ID
router.get('/:id', (req, res) => {
    if (req.user.role !== 'ADMIN')
        return res.send(result.createResult('Access denied'))

    const sql = `SELECT UserID, Name, Email FROM users WHERE UserID = ? AND Role = 'WHOLESALER'`
    pool.query(sql, [req.params.id], (err, data) => {
        if (!err && data.length === 0)
        return res.send(result.createResult('Wholesaler not found'))
        res.send(result.createResult(err, data[0]))
    })
})

// UPDATE WHOLESALER EMAIL (ADMIN ONLY)
router.put('/:id', (req, res) => {
    if (req.user.role !== 'ADMIN')
        return res.send(result.createResult('Access denied'))
    const { email } = req.body
    if (!email)
        return res.send(result.createResult('Email is required'))

    const sql = `UPDATE users SET Email = ? WHERE UserID = ? AND Role = 'WHOLESALER'`
    pool.query(sql, [email, req.params.id], (err, data) => {
        res.send(result.createResult(err, data))
    })
})

// DELETE WHOLESALER (ADMIN ONLY)
router.delete('/:id', (req, res) => {
    if (req.user.role !== 'ADMIN')
        return res.send(result.createResult('Access denied'))
    const sql = `DELETE FROM users WHERE UserID = ? AND Role = 'WHOLESALER'`
    pool.query(sql, [req.params.id], (err, data) => {
        res.send(result.createResult(err, data))
    })
})

module.exports = router
