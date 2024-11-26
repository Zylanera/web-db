const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../middleware/logger'); // Importiere das Logger-Modul

// Middleware zum Überprüfen der Authentifizierung 
function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login');
}

// Alle Bücher anzeigen 
router.get('/', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM books WHERE user_id = ?', [req.session.userId], (err, results) => {
        if (err) {
            logger.error('Fehler beim Abrufen der Bücher: ' + err.message); // Loggen des Fehlers
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
                logger.error('Fehler beim Hinzufügen des Buches: ' + err.message); // Loggen des Fehlers
                return res.status(500).send('Error adding book');
            }
            logger.info(`Neues Buch hinzugefügt: ${title}`); // Protokolliere die Aktion
            res.redirect('/books');
        }
    );
});

// Formular zum Bearbeiten eines Buchs
router.get('/edit/:id', isAuthenticated, (req, res) => {
    const bookId = req.params.id;
    db.query('SELECT * FROM books WHERE id = ? AND user_id = ?', [bookId, req.session.userId], (err, results) => {
        if (err) {
            logger.error('Fehler beim Abrufen des Buches zur Bearbeitung: ' + err.message); // Loggen des Fehlers
            return res.status(500).send('Error fetching book');
        }
        if (results.length > 0) {
            res.render('editBook', { book: results[0] });
        } else {
            logger.warn(`Buch nicht gefunden für ID: ${bookId}`); // Loggen eines Warnhinweises
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
        [cover, title, description, finalPrice, finalReleaseDate, volumeNumber || null , isbn13 || null , isbn10 || null , bookId , req.session.userId], 
        (err) => {
            if (err) {
                logger.error('Fehler beim Aktualisieren des Buches: ' + err.message); // Loggen des Fehlers
                return res.status(500).send('Error updating book');
            }
            logger.info(`Buch aktualisiert: ${title}`); // Protokolliere die Aktion
            res.redirect('/books');
        }
    );
});

// Buch löschen
router.post('/delete/:id', isAuthenticated, (req,res)=>{
    const bookId=req.params.id;
    
    db.query("DELETE FROM books WHERE id=? AND user_id=?", [bookId , req.session.userId],(err)=>{
        if(err){
            logger.error("Fehler beim Löschen des Buches: "+ err.message); // Loggen des Fehlers
            return res.status(500).send("Error deleting book");
        }

        logger.info(`Buch gelöscht: ID ${bookId}`); // Protokolliere die Aktion
        return res.redirect("/books");
        
    })
})

module.exports=router;
