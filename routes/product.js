const fs = require('fs')
const express = require('express')
const pool = require('../utils/db')
const result = require('../utils/result')
const authorizeUser = require('../utils/authuser')
const multer = require('multer')

const router = express.Router()
const upload = multer({ dest: 'productimages' })

// Add new product (WHOLESALER only)
router.post('/', authorizeUser, upload.single('ProductImage'), (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const { ProductName, Category, Price, StockQuantity } = req.body

  if (!ProductName || !Category || !Price || !StockQuantity)
    return res.send(result.createResult('Missing fields'))
  const findWholesalerSql = `SELECT WholesalerID FROM wholesaler WHERE UserID = ?`

  pool.query(findWholesalerSql, [req.user.userId], (err, rows) => {
    if (err) return res.send(result.createResult(err))

    if (rows.length === 0)
      return res.send(result.createResult('Wholesaler profile not found'))

    const wholesalerId = rows[0].WholesalerID

    const ProductImage = req.file.originalname

    const oldPath = req.file.path
    const newPath = oldPath + '.jpg'
    fs.rename(oldPath, newPath, (err) => {
      if (err) console.error('File rename error:', err)
    })

    //Insert product
    const sql = `INSERT INTO product(ProductName, Category, Price, StockQuantity, WholesalerID, ProductImage)VALUES (?, ?, ?, ?, ?, ?)`

    pool.query(sql,[ProductName, Category, Price, StockQuantity, wholesalerId, ProductImage],(err, data) => 
        res.send(result.createResult(err, data))
    )
  })
})


//GET ALL PRODUCT
router.get('/all', (req, res) => {
  const sql = `SELECT * FROM product`
  pool.query(sql, (err, data) => res.send(result.createResult(err, data)))
})

// Get product by ID
router.get('/:id', (req, res) => {
  const sql = `SELECT * FROM product WHERE ProductID = ?`
  pool.query(sql, [req.params.id], (err, data) => {
    if (err) {
      return res.send(result.createResult(err))
    }
    if (!data || data.length === 0) {
      return res.send(result.createResult('Product not found'))
    }
    res.send(result.createResult(null, data[0]))
  })
})

// Update product (WHOLESALER only)
router.put('/:id', authorizeUser, upload.single('ProductImage'), (req, res) => {

  if (!req.user || req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const { ProductName, Category, Price, StockQuantity } = req.body

  if (!ProductName || !Category || !Price || !StockQuantity)
    return res.send(result.createResult('Missing fields'))

  const findWholesalerSql = `SELECT WholesalerID FROM wholesaler WHERE UserID = ?`

  pool.query(findWholesalerSql, [req.user.userId], (err, rows) => {
    if (err) return res.send(result.createResult(err))
    if (rows.length === 0)
      return res.send(result.createResult('Wholesaler profile not found'))

    const wholesalerId = rows[0].WholesalerID

    let imageSql = ''
    let imageValue = []

    if (req.file) {
      const oldPath = req.file.path
      const newPath = oldPath + '.jpg'

      fs.rename(oldPath, newPath, (err) => {
        if (err) console.error('File rename error:', err)
      })

      imageSql = ', ProductImage = ?'
      imageValue.push(req.file.originalname)
    }

    const sql = `UPDATE product SET ProductName = ?, Category = ?, Price = ?, StockQuantity = ?${imageSql}WHERE ProductID = ? AND WholesalerID = ?`

    const params = [ProductName, Category, Price, StockQuantity, ...imageValue, req.params.id, wholesalerId]

    pool.query(sql, params, (err, data) => {
      if (!err && data.affectedRows === 0)
        return res.send(result.createResult('Product not found or unauthorized'))

      res.send(result.createResult(null, {
        message: 'Product updated successfully'
      }))
    })
  })
})


//Delete Product
router.delete('/:id', (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const findWholesalerSql = `SELECT WholesalerID FROM wholesaler WHERE UserID = ?`

  pool.query(findWholesalerSql, [req.user.userId], (err, rows) => {
    if (err) return res.send(result.createResult(err))

    if (rows.length === 0)
      return res.send(result.createResult('Wholesaler profile not found'))

    const wholesalerId = rows[0].WholesalerID

    const deleteSql = `DELETE FROM product WHERE ProductID = ? AND WholesalerID = ?`

    pool.query(deleteSql, [req.params.id, wholesalerId], (err, data) => {
      if (!err && data.affectedRows === 0)
        return res.send(result.createResult('Product not found or unauthorized'))

      res.send(result.createResult(err, {
        message: 'Product deleted successfully'
      }))
    })
  })
})


// Search by product name
router.get('/search/:name', (req, res) => {
  const sql = `SELECT * FROM product WHERE ProductName LIKE ?`
  pool.query(sql, [`%${req.params.name}%`], (err, data) =>
    res.send(result.createResult(err, data))
  )
})


// search by product category
router.get('/category/:category', (req, res) => {
  const sql = `SELECT * FROM product WHERE Category=?`
  pool.query(sql, [req.params.category], (err, data) =>
    res.send(result.createResult(err, data))
  )
})



module.exports = router