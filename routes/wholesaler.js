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

  // 🔐 check if already exists
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

// GET LOGGED-IN WHOLESALER FULL PROFILE
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
