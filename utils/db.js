const mysql2 = require('mysql2')

const pool = mysql2.createPool({
    host : 'localhost',
    user: 'root',
    password: 'Aditya@42',
    database: 'quickbazzar'

})

module.exports = pool