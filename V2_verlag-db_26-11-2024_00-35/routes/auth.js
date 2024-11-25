const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/database');

let reg = false; // Standardmäßig auf Login setzen

// Registrierung Route
if (reg == true) {
    router.get('/register', (req, res) => {
        res.render('register');
    });
} else {
    router.get('/register', (req, res) => {
        res.render('reg-dis');
    });
}

router.post('/register', (req, res) => {
    const { username, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) throw err;
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err) => {
            if (err) throw err;
            res.redirect('/login');
        });
    });
});

// Login Route
router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            bcrypt.compare(password, results[0].password, (err, match) => {
                if (match) {
                    req.session.userId = results[0].id; // Setzen der Session-ID
                    res.redirect('/dashboard'); // Umleitung nach erfolgreichem Login
                } else {
                    res.send('Incorrect Password!');
                }
            });
        } else {
            res.send('Username not found!');
        }
    });
});

// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect('/login');
    });
});

module.exports = router;