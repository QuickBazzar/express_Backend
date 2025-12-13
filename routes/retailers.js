const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const pool = require('../utils/db')
const result = require('../utils/result')
const config = require('../utils/config')

const router = express.Router()

//Get All Retailers
router.get('/all', (req, res) => {
    const sql =  `SELECT * FROM retailer`
    pool.query(sql, (err, data)=> {
        res.send(result.createResult(err,data))
    })
})

// Add Retailer (Mapped to logged-in user)
router.post('/add', (req, res) => {
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const userId = req.user.userId
  const { shopName, contactNumber, address, gstNumber } = req.body

  const sql = `
    INSERT INTO retailer
    (UserID, ShopName, ContactNumber, Address, GSTNumber)
    VALUES (?, ?, ?, ?, ?)
  `

  pool.query(
    sql,
    [userId, shopName, contactNumber, address, gstNumber],
    (err, data) => {
      res.send(result.createResult(err, data))
    }
  )
})

module.exports = router

module.exports = router