const jwt = require('jsonwebtoken')
const result = require('./result')
const config  = require('./config')

function authorizeUser(req, res, next) {

  // Allow public routes
  if (req.url === '/user/signin' || req.url === '/user/signup' || req.url === '/user/web/signup') {
    return next()
  }

  const authHeader = req.headers.authorization
  if (!authHeader)
    return res.send(result.createResult('Token missing'))

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, config.SECRET)

    // Attaching user info to request
    req.user = {
      userId: payload.userId,
      role: payload.role
    }
    next()
  } catch (ex) {
    res.send(result.createResult('Invalid Token'))
  }
}

module.exports = authorizeUser
