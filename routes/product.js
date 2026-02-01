const express = require('express')
const path = require('path')
const multer = require('multer')

const pool = require('../utils/db')
const result = require('../utils/result')
const authorizeUser = require('../utils/authuser')
const multer = require('multer')
const path = require('path')

const router = express.Router()
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'productimages'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, Date.now() + ext)
  }
})
const upload = multer({ storage })



const storage = multer.diskStorage({
  destination: 'productimages',
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname)
    cb(null, uniqueName)
  },
})

const upload = multer({ storage })
router.post('/', authorizeUser, upload.single('ProductImage'), (req, res) => {
  console.log('REQ.BODY:', req.body)
  console.log('REQ.FILE:', req.file)
  console.log('REQ.USER:', req.user)

  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const { ProductName, Category, Price, StockQuantity,Description,Quantity } = req.body

  if (!ProductName || !Category || !Price || !StockQuantity)
    return res.send(result.createResult('Missing fields'))

  const findWholesalerSql = `SELECT WholesalerID FROM wholesaler WHERE UserID = ?`

  pool.query(findWholesalerSql, [req.user.userId], (err, rows) => {
    if (err) return res.send(result.createResult(err))
    if (rows.length === 0) return res.send(result.createResult('Wholesaler profile not found'))

    const wholesalerId = rows[0].WholesalerID
    const ProductImage = req.file.filename

    const sql = `INSERT INTO product(ProductName, Category, Price, StockQuantity, WholesalerID, ProductImage,Description,Quantity)
                 VALUES (?, ?, ?, ?, ?, ?,?,?)`

    pool.query(sql, [ProductName, Category, Price, StockQuantity, wholesalerId, ProductImage,Description,Quantity] ,(err, data) => {
      console.log('DB ERROR:', err)
      res.send(result.createResult(err, data))
    })
  })
})

//GET ALL PRODUCT
router.get('/all', (req, res) => {
  const sql = `SELECT * FROM product WHERE IsActive = 1`
  pool.query(sql, (err, data) =>
    res.send(result.createResult(err, data))
  )
})

router.get('/:id', (req, res) => {
  const sql = `
    SELECT * FROM product
    WHERE ProductID = ? AND IsActive = 1
  `
  pool.query(sql, [req.params.id], (err, data) => {
    if (err) return res.send(result.createResult(err))
    if (data.length === 0)
      return res.send(result.createResult('Product not found'))
    res.send(result.createResult(null, data[0]))
  })
})

// Update product (WHOLESALER only)
router.put('/:id', authorizeUser, upload.single('ProductImage'), (req, res) => {

  if (!req.user || req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const {
    ProductName,
    Category,
    Price,
    StockQuantity,
    Description,
    Quantity
  } = req.body

  if (!ProductName || !Category || !Price || !StockQuantity)
    return res.send(result.createResult('Missing required fields'))

  const findWholesalerSql = `
    SELECT WholesalerID FROM wholesaler WHERE UserID = ?
  `

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

    const sql = `
      UPDATE product 
      SET 
        ProductName = ?, 
        Category = ?, 
        Price = ?, 
        StockQuantity = ?, 
        Description = ?, 
        Quantity = ?
        ${imageSql}
      WHERE ProductID = ? AND WholesalerID = ?
    `

    const params = [
      ProductName,
      Category,
      Price,
      StockQuantity,
      Description || null,
      Quantity || 0,
      ...imageValue,
      req.params.id,
      wholesalerId
    ]

    pool.query(sql, params, (err, data) => {
      if (err) return res.send(result.createResult(err))

      if (data.affectedRows === 0)
        return res.send(result.createResult('Product not found or unauthorized'))

      res.send(result.createResult(null, {
        message: 'Product updated successfully'
      }))
    })
  })
})


//Delete Product
router.delete('/:id',authorizeUser, (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const sql = `
    SELECT p.*
    FROM product p
    JOIN wholesaler w ON p.WholesalerID = w.WholesalerID
    WHERE w.UserID = ? AND p.IsActive = 1
    ORDER BY p.ProductID DESC
  `

  pool.query(sql, [req.user.userId], (err, data) => {
    res.send(result.createResult(err, data))
  })
})

router.get('/search/:name', (req, res) => {
  const sql = `
    SELECT * FROM product
    WHERE ProductName LIKE ? AND IsActive = 1
  `
  pool.query(sql, [`%${req.params.name}%`], (err, data) =>
    res.send(result.createResult(err, data))
  )
})

router.get('/category/:category', (req, res) => {
  const sql = `
    SELECT * FROM product
    WHERE Category = ? AND IsActive = 1
  `
  pool.query(sql, [req.params.category], (err, data) =>
    res.send(result.createResult(err, data))
  )
})


router.put('/:id', authorizeUser, upload.single('ProductImage'), (req, res) => {
    if (req.user.role !== 'WHOLESALER')
      return res.send(result.createResult('Access denied'))

    const { ProductName, Category, Price, StockQuantity, Description = null } = req.body

    if (!ProductName || !Price)
      return res.send(result.createResult('Missing required fields'))

    const findWholesalerSql =`SELECT WholesalerID FROM wholesaler WHERE UserID = ?`

    pool.query(findWholesalerSql, [req.user.userId], (err, rows) => {
      if (err) return res.send(result.createResult(err))
      if (rows.length === 0)
        return res.send(result.createResult('Wholesaler profile not found'))

      let imageSql = ''
      let imageValue = []

      if (req.file) {
        imageSql = ', ProductImage = ?'
        imageValue.push(req.file.filename)
      }

      const sql = `
        UPDATE product
        SET ProductName = ?, Category = ?, Price = ?, StockQuantity = ?, Description = ?
        ${imageSql}
        WHERE ProductID = ? AND WholesalerID = ?
      `

      const params = [
        ProductName,
        Category || null,
        Price,
        StockQuantity || 0,
        Description || null,
        ...imageValue,
        req.params.id,
        rows[0].WholesalerID,
      ]

      pool.query(sql, params, (err, data) => {
        if (!err && data.affectedRows === 0)
          return res.send(result.createResult('Product not found or unauthorized'))

        res.send(result.createResult(null, 'Product updated successfully'))
      })
    })
  }
)

router.delete('/:id', authorizeUser, (req, res) => {
  if (req.user.role !== 'WHOLESALER')
    return res.send(result.createResult('Access denied'))

  const findWholesalerSql =
    `SELECT WholesalerID FROM wholesaler WHERE UserID = ?`

  pool.query(findWholesalerSql, [req.user.userId], (err, rows) => {
    if (err) return res.send(result.createResult(err))
    if (rows.length === 0)
      return res.send(result.createResult('Wholesaler profile not found'))

    const sql = `
      UPDATE product
      SET IsActive = 0
      WHERE ProductID = ? AND WholesalerID = ?
    `

    pool.query(sql,[req.params.id, rows[0].WholesalerID],(err, data) => {
        if (!err && data.affectedRows === 0)
          return res.send(result.createResult('Product not found or unauthorized'))

        res.send(result.createResult(null, 'Product deleted successfully'))
      }
    )
  })
})

// GET PRODUCTS BY WHOLESALER (RETAILER ONLY)
router.get('/wholesaler/:id', (req, res) => {
  // ROLE CHECK
  if (req.user.role !== 'RETAILER')
    return res.send(result.createResult('Access denied'))

  const wholesalerId = req.params.id

  const sql = `SELECT ProductID, ProductName, Category, Price, StockQuantity, ProductImage, WholesalerID FROM product WHERE WholesalerID = ? AND IsActive = 1`

  pool.query(sql, [wholesalerId], (err, data) => {
    res.send(result.createResult(err, data))
  })
})


module.exports = router