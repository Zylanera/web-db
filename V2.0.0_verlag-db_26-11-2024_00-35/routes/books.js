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
    const { cover, title, description, price, releaseDate, volumeNumber, isbn13, isbn10 } = req.body;

    // Setze Standardwerte für Preis und Release-Datum
    const finalPrice = price.trim() === "" ? "TBA" : price;
    const finalReleaseDate = releaseDate.trim() === "" ? "TBA" : releaseDate;

    db.query('INSERT INTO books (cover, title, description, price, release_date, volume_number, isbn13, isbn10, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [cover, title, description, finalPrice, finalReleaseDate, volumeNumber, isbn13 || null, isbn10 || null, req.session.userId], 
        (err) => {
            if (err) throw err;
            res.redirect('/books'); // Nach dem Hinzufügen zurück zur Bücherliste
        }
    );
});

module.exports = router;