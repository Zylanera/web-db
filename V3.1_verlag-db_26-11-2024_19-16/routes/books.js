const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware zum Überprüfen der Authentifizierung 
function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login');
}

// Alle Bücher anzeigen 
router.get('/', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM books WHERE user_id = ?', [req.session.userId], (err, results) => {
        if (err) {
            console.error('Error fetching books:', err);
            return res.status(500).send('Error fetching books');
        }
        res.render('books', { books: results });
    });
});

// Formular zum Erstellen eines neuen Buchs
router.get('/new', isAuthenticated, (req, res) => {
    res.render('newBook');
});

// Buch erstellen 
router.post('/add', isAuthenticated, (req, res) => {
    const { cover, title, description, price, releaseDate, volumeNumber, isbn13, isbn10 } = req.body;
    const finalPrice = price.trim() === "" ? "TBA" : price;
    const finalReleaseDate = releaseDate.trim() === "" ? "TBA" : releaseDate;

    db.query('INSERT INTO books (cover, title, description, price, release_date, volume_number, isbn13, isbn10, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [cover, title, description, finalPrice, finalReleaseDate, volumeNumber, isbn13 || null, isbn10 || null, req.session.userId], 
        (err) => {
            if (err) {
                console.error('Error adding book:', err);
                return res.status(500).send('Error adding book');
            }
            res.redirect('/books');
        }
    );
});

// Formular zum Bearbeiten eines Buchs
router.get('/edit/:id', isAuthenticated, (req, res) => {
    const bookId = req.params.id;
    db.query('SELECT * FROM books WHERE id = ? AND user_id = ?', [bookId, req.session.userId], (err, results) => {
        if (err) {
            console.error('Error fetching book for edit:', err);
            return res.status(500).send('Error fetching book');
        }
        if (results.length > 0) {
            res.render('editBook', { book: results[0] });
        } else {
            res.redirect('/books');
        }
    });
});

// Buch aktualisieren
router.post('/edit/:id', isAuthenticated, (req, res) => {
    const bookId = req.params.id;
    const { cover, title, description, price, releaseDate, volumeNumber, isbn13, isbn10 } = req.body;
    const finalPrice = price.trim() === "" ? "TBA" : price;
    const finalReleaseDate = releaseDate.trim() === "" ? "TBA" : releaseDate;

    db.query('UPDATE books SET cover = ?, title = ?, description = ?, price = ?, release_date = ?, volume_number = ?, isbn13 = ?, isbn10 = ? WHERE id = ? AND user_id = ?', 
        [cover, title, description, finalPrice, finalReleaseDate, volumeNumber, isbn13 || null, isbn10 || null, bookId, req.session.userId], 
        (err) => {
            if (err) {
                console.error('Error updating book:', err);
                return res.status(500).send('Error updating book');
            }
            res.redirect('/books');
        }
    );
});

// Buch löschen
router.post('/delete/:id', isAuthenticated, (req, res) => {
    const bookId = req.params.id;
    db.query('DELETE FROM books WHERE id = ? AND user_id = ?', [bookId, req.session.userId], (err) => {
        if (err) {
            console.error('Error deleting book:', err);
            return res.status(500).send('Error deleting book');
        }
        res.redirect('/books');
    });
});

module.exports = router;