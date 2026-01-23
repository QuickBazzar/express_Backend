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

module.exports = router
