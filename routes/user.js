const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const pool = require('../utils/db')
const result = require('../utils/result')
const config = require('../utils/config')

const router = express.Router()

//Registration API for Application
router.post('/signup', (req, res) => {
    const { name, email, password } = req.body;
    const role = 'RETAILER';
    const sql = `INSERT INTO users (Name, Email, PasswordHash, Role) VALUES (?, ?, ?, ?)`;

    bcrypt.hash(password, config.SALT_ROUND, (err, hashedPass) => {
        if (err) {
            return res.send(result.createResult(err));
        }
        if (hashedPass) {
            pool.query(sql, [name, email, hashedPass, role], (err, data) => {
                res.send(result.createResult(err, data));
            });
        } else {
            res.send(result.createResult(err));
        }
    });
});

//Login 
router.post('/signin', (req, res) => {
    const {email, password} = req.body
    const sql = `SELECT * FROM users WHERE email = ?`
    pool.query(sql, [email], (err, data) => {
        if(err)
            res.send(result.createResult(err))
        else if(data.length == 0)
            res.send(result.createResult("Invalid Email"))
        else{
            bcrypt.compare(password, data[0].PasswordHash, (err, passwordStatus) => {
                console.log(passwordStatus)
                if(passwordStatus){
                    const payload = {
                        userId : data[0].userId,
                    }
                    const token = jwt.sign(payload, config.SECRET)
                    const user = {
                        token,
                        name : data[0].Name,
                        email: data[0].Email,
                        role: data[0].Role
                    }
                    res.send(result.createResult(null, user))
                }
                else
                    res.send(result.createResult('Invalid Password'))
            })
        }
    })
})

//Registration API for WEB Application
router.post('/web/signup', (req, res) => {
    const { name, email, password, role } = req.body; // role allowed
    if (!['ADMIN', 'WHOLESALER', 'RETAILER'].includes(role)) {
        return res.send(result.createResult('Invalid role selected.'));
    }
    const sql = `INSERT INTO users (Name, Email, PasswordHash, Role) VALUES (?, ?, ?, ?)`;
    bcrypt.hash(password, config.SALT_ROUND, (err, hashedPass) => {
        if (err) {
            return res.send(result.createResult(err));
        }
        if (hashedPass) {
            pool.query(sql, [name, email, hashedPass, role], (err, data) => {
                res.send(result.createResult(err, data));
            });
        } else {
            res.send(result.createResult(err));
        }
    });
});

//Give All Users
router.get('/',(req, res) => {
    const sql = `SELECT * From users`
    pool.query(sql, (err, data)=>{
        res.send(result.createResult(err, data))
    })
})

//Get User By Id
router.get('/profile/',(req, res) => {
    const uid = req.headers.uid
    const sql = `SELECT * FROM users WHERE UserId = ?`
    pool.query(sql, [uid], (err, data) => {
        if(err)
            res.send(result.createResult(err))
        else if(data.length == 0){
            res.send(result.createResult("User not found"))
        }
        else{
            const user = {
                name : data[0].Name,
                email: data[0].Email,
                role: data[0].Role
            }
            res.send(result.createResult(null, user))
        }
    })
})

router.put('/update-user', (req, res) => {
    const {email} = req.body
    const uid = req.headers.uid
    const sql = `UPDATE users SET Email = ? WHERE UserId = ?`
    pool.query(sql, [email, uid], (err, data) => {
        res.send(result.createResult(err, data))
    })
})

router.delete('/delete-user',(req, res) => {
    const uid = req.body.uid
    const sql = `DELETE FROM users WHERE UserId = ?`
    pool.query(sql, [uid], (err, data) => {
        res.send(result.createResult(err, data))
    })
})

router.patch('/update-password', (req, res) => {
    const uid = req.headers.uid
    const {oldPassword, newPassword} = req.body

    if(!oldPassword || !newPassword){
        return res.send(result.createResult("Password Required!!"))
    }

    const sql = `SELECT PasswordHash FROM users WHERE UserId = ?`
    pool.query(sql, [uid], (err, data) => {
        if(err)
            return res.send(result.createResult(err))
        else if(data.length == 0)
            return res.send(result.createResult("User Not Found!!"))

        bcrypt.compare(oldPassword, data[0].PasswordHash, (err, status) => {
            if(err)
                return res.send(result.createResult(err))
            if(!status)
                return res.send(result.createResult("Old Password is incorrect !!"))

            bcrypt.hash(newPassword, config.SALT_ROUND, (err, hash) => {
                if(err)
                    return res.send(result.createResult(err))

                const sql = `UPDATE users SET PasswordHash = ? WHERE UserId = ?`

                pool.query(sql, [hash, uid], (err, UpdatedStatus) => {
                    if(err)
                        res.send(result.createResult(err))
                    else
                        res.send(result.createResult(null, "Password Updated SuccessFully!!"))
                })
            })
        })
    })
})


module.exports = router