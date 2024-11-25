const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware zum Überprüfen der Authentifizierung 
function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login'); // Umleitung zur Login-Seite 
}

// Alle Bücher anzeigen 
router.get('/', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM books WHERE user_id = ?', [req.session.userId], (err, results) => {
        if (err) throw err;
        res.render('books', { books: results });
    });
});

// Formular zum Erstellen eines neuen Buchs
router.get('/new', isAuthenticated, (req, res) => {
    res.render('newBook'); // Neue EJS-Datei für das Buchformular
});

// Buch erstellen 
router.post('/add', isAuthenticated, (req, res) => {
    const { title } = req.body;

    db.query('INSERT INTO books (title, user_id) VALUES (?, ?)', [title, req.session.userId], (err) => {
        if (err) throw err;
        res.redirect('/books'); // Nach dem Hinzufügen zurück zur Bücherliste
    });
});

module.exports = router;