const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../middleware/logger');

function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login');
}

router.get('/', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM books WHERE user_id = ?', [req.session.userId], (err, results) => {
        if (err) {
            logger.error('Fehler beim Abrufen der Bücher: ' + err.message);
            return res.status(500).send('Error fetching books');
        }
        res.render('books', { books: results });
    });
});

router.get('/new', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM collections WHERE user_id = ?', [req.session.userId], (err, collections) => {
        if (err) {
            logger.error('Fehler beim Abrufen der Collections: ' + err.message);
            return res.status(500).send('Error fetching collections');
        }
        res.render('newBook', { collections: collections });
    });
});

router.post('/add', isAuthenticated, (req, res) => {
    const { cover, title, description, price, releaseDate, volumeNumber, isbn13, isbn10, collectionId } = req.body;
    const finalPrice = price && price.trim() !== "" ? price.trim() : "TBA";
    const finalReleaseDate = releaseDate && releaseDate.trim() !== "" ? releaseDate.trim() : "TBA";

    db.query('INSERT INTO books (cover, title, description, price, release_date, volume_number, isbn13, isbn10, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [cover, title, description, finalPrice, finalReleaseDate, volumeNumber || null, isbn13 || null, isbn10 || null, req.session.userId], 
        (err, result) => {
            if (err) {
                logger.error('Fehler beim Hinzufügen des Buches: ' + err.message);
                return res.status(500).send('Error adding book');
            }
            
            const bookId = result.insertId;
            
            if (collectionId) {
                db.query('INSERT INTO collection_books (collection_id, book_id) VALUES (?, ?)', [collectionId, bookId], (err) => {
                    if (err) {
                        logger.error('Fehler beim Hinzufügen des Buches zur Collection: ' + err.message);
                    }
                });
            }
            
            logger.info(`Neues Buch hinzugefügt: ${title}`);
            res.redirect('/books');
        }
    );
});

router.get('/edit/:id', isAuthenticated, (req, res) => {
    const bookId = req.params.id;
    console.log(`Attempting to edit book with ID: ${bookId}`);

    db.query(`
        SELECT b.*, c.id AS collection_id, c.name AS collection_name 
        FROM books b 
        LEFT JOIN collection_books cb ON b.id = cb.book_id 
        LEFT JOIN collections c ON cb.collection_id = c.id 
        WHERE b.id = ? AND b.user_id = ?
    `, [bookId, req.session.userId], (err, bookResults) => {
        if (err) {
            logger.error('Fehler beim Abrufen des Buches zur Bearbeitung: ' + err.message);
            return res.status(500).send('Error fetching book');
        }

        console.log(`Book query results:`, bookResults);

        if (bookResults.length > 0) {
            db.query('SELECT * FROM collections WHERE user_id = ?', [req.session.userId], (err, collectionResults) => {
                if (err) {
                    logger.error('Fehler beim Abrufen der Collections: ' + err.message);
                    return res.status(500).send('Error fetching collections');
                }
                res.render('editBook', { book: bookResults[0], collections: collectionResults });
            });
        } else {
            logger.warn(`Buch nicht gefunden für ID: ${bookId}`);
            res.redirect('/books');
        }
    });
});

router.post('/edit/:id', isAuthenticated, (req, res) => {
    const bookId = req.params.id;
    const { cover, title, description, price, releaseDate, volumeNumber, isbn13, isbn10, collectionId } = req.body;

    console.log('Received data:', req.body);

    const finalPrice = price && price.trim() !== "" ? price.trim() : "TBA";
    const finalReleaseDate = releaseDate && releaseDate.trim() !== "" ? releaseDate.trim() : "TBA";

    db.query('UPDATE books SET cover = ?, title = ?, description = ?, price = ?, release_date = ?, volume_number = ?, isbn13 = ?, isbn10 = ? WHERE id = ? AND user_id = ?', 
        [cover || null, title || null, description || null, finalPrice, finalReleaseDate, volumeNumber || null, isbn13 || null, isbn10 || null, bookId, req.session.userId], 
        (err) => {
            if (err) {
                logger.error('Fehler beim Aktualisieren des Buches: ' + err.message);
                return res.status(500).send('Error updating book');
            }
            
            db.query('DELETE FROM collection_books WHERE book_id = ?', [bookId], (err) => {
                if (err) {
                    logger.error('Fehler beim Entfernen des Buches aus alten Collections: ' + err.message);
                }
                if (collectionId) {
                    db.query('INSERT INTO collection_books (collection_id, book_id) VALUES (?, ?)', [collectionId, bookId], (err) => {
                        if (err) {
                            logger.error('Fehler beim Hinzufügen des Buches zur neuen Collection: ' + err.message);
                        }
                    });
                }
            });
            
            logger.info(`Buch aktualisiert: ${title || 'Unbekannter Titel'}`);
            res.redirect('/books');
        }
    );
});

router.post('/delete/:id', isAuthenticated, (req, res) => {
    const bookId = req.params.id;
    
    db.query("DELETE FROM books WHERE id = ? AND user_id = ?", [bookId, req.session.userId], (err, result) => {
        if (err) {
            logger.error("Fehler beim Löschen des Buches: " + err.message);
            return res.status(500).send("Error deleting book");
        }

        if(result.affectedRows === 0){
            logger.warn(`Kein Buch gefunden für ID: ${bookId}`);
            return res.status(404).send("Book not found");
        }

        logger.info(`Buch gelöscht: ID ${bookId}`);
        return res.redirect("/books");
    });
});

module.exports = router;