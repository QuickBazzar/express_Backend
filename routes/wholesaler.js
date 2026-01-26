const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')
const authorizeUser = require('../utils/authuser')

const router = express.Router()

router.post('/add', authorizeUser, (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const userId = req.user.userId
  const { shopName, contactNumber, address, gstNumber } = req.body

  const checkSql = `SELECT WholesalerID FROM wholesaler WHERE UserID = ?`

  pool.query(checkSql, [userId], (err, rows) => {
    if (rows.length > 0) {
      return res.send(result.createResult('Already registered'))
    }

    const insertSql = `
      INSERT INTO wholesaler(UserID, BusinessName, ContactNumber, Address, GSTNumber)
      VALUES (?, ?, ?, ?, ?)
    `

    pool.query(
      insertSql,
      [userId, shopName, contactNumber, address, gstNumber],
      (err, data) => {
        res.send(result.createResult(err, data))
      }
    )
  })
})



router.get('/my', authorizeUser, (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const userId = req.user.userId

  const sql = `
    SELECT WholesalerID, BusinessName, ContactNumber, Address, GSTNumber
    FROM wholesaler
    WHERE UserID = ?
  `

  pool.query(sql, [userId], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

router.get('/profile', authorizeUser, (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const userId = req.user.userId

  const sql = `
    SELECT 
      u.UserID,
      u.Name,
      u.Email,
      w.WholesalerID,
      w.BusinessName,
      w.ContactNumber,
      w.Address,
      w.GSTNumber
    FROM users u
    LEFT JOIN wholesaler w ON u.UserID = w.UserID
    WHERE u.UserID = ?
  `

  pool.query(sql, [userId], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

router.put('/update', authorizeUser, (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const userId = req.user.userId
  const { businessName, contactNumber, address, gstNumber } = req.body

  if (!businessName || !contactNumber || !address || !gstNumber)
    return res.send(result.createResult('Missing fields'))

  const sql = `
    UPDATE wholesaler
    SET BusinessName = ?, ContactNumber = ?, Address = ?, GSTNumber = ?
    WHERE UserID = ?
  `

  pool.query(
    sql,
    [businessName, contactNumber, address, gstNumber, userId],
    (err, data) => {
      res.send(result.createResult(err, data))
    }
  )
})

module.exports = router
