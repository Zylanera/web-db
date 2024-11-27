const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../middleware/logger'); // Importiere das Logger-Modul

// Middleware zum Überprüfen der Authentifizierung 
function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login');
}

// Alle Collections anzeigen 
router.get('/', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM collections WHERE user_id = ?', [req.session.userId], (err, results) => {
        if (err) {
            logger.error('Fehler beim Abrufen der Collections: ' + err.message); // Loggen des Fehlers
            throw err;
        }
        res.render('collections', { collections: results });
    });
});

// Formular zum Erstellen einer neuen Collection
router.get('/new', isAuthenticated, (req, res) => {
    res.render('newCollection');
});

// Collection erstellen 
router.post('/add', isAuthenticated, (req, res) => {
    const { name } = req.body;

    db.query('INSERT INTO collections (name, user_id) VALUES (?, ?)', [name, req.session.userId], 
        (err) => {
            if (err) {
                logger.error('Fehler beim Hinzufügen der Collection: ' + err.message); // Loggen des Fehlers
                throw err;
            }
            logger.info(`Neue Collection hinzugefügt: ${name}`); // Protokolliere die Aktion
            res.redirect('/collections');
        }
    );
});

// Formular zum Bearbeiten einer Collection
router.get('/edit/:id', isAuthenticated, (req, res) => {
   const collectionId = req.params.id;
   db.query('SELECT * FROM collections WHERE id = ?', [collectionId], (err, result) => {
     if (err) {
         logger.error('Fehler beim Abrufen der Collection zur Bearbeitung: ' + err.message); // Loggen des Fehlers
         throw err;
     }
     if (result.length > 0) {
       res.render('editCollection', { collection: result[0] });
     } else {
       logger.warn(`Collection nicht gefunden für ID: ${collectionId}`); // Loggen eines Warnhinweises
       res.redirect('/collections');
     }
   });
});

// Collection aktualisieren
router.post('/edit/:id', isAuthenticated, (req, res) => {
   const collectionId = req.params.id;
   const { name } = req.body;

   db.query('UPDATE collections SET name = ? WHERE id = ?', [name, collectionId], (err) => {
     if (err) {
         logger.error('Fehler beim Aktualisieren der Collection: ' + err.message); // Loggen des Fehlers
         throw err;
     }
     logger.info(`Collection aktualisiert: ${name}`); // Protokolliere die Aktion
     res.redirect('/collections');
   });
});

// Collection löschen
router.post('/delete/:id', isAuthenticated, (req, res) => {
   const collectionId = req.params.id;
   db.query('DELETE FROM collections WHERE id = ?', [collectionId], (err) => {
     if (err) {
         logger.error('Fehler beim Löschen der Collection: ' + err.message); // Loggen des Fehlers
         throw err;
     }
     logger.info(`Collection gelöscht: ID ${collectionId}`); // Protokolliere die Aktion
     res.redirect('/collections');
   });
});

module.exports = router;
