const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware zum Überprüfen der Authentifizierung 
function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login'); // Umleitung zur Login-Seite 
}

// Alle Collections anzeigen 
router.get('/', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM collections WHERE user_id = ?', [req.session.userId], (err, results) => {
        if (err) throw err;
        res.render('collections', { collections: results });
    });
});

// Formular zum Erstellen einer neuen Collection
router.get('/new', isAuthenticated, (req, res) => {
    res.render('newCollection'); // Neue EJS-Datei für das Collection-Formular
});

// Collection erstellen 
router.post('/add', isAuthenticated, (req, res) => {
    const { name } = req.body;

    db.query('INSERT INTO collections (name, user_id) VALUES (?, ?)', [name, req.session.userId], (err) => {
        if (err) throw err;
        res.redirect('/collections'); // Nach dem Hinzufügen zurück zur Collectionsliste
    });
});

module.exports = router;