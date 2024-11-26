const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware zum Überprüfen der Authentifizierung 
function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login');
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
    res.render('newCollection');
});

// Collection erstellen 
router.post('/add', isAuthenticated, (req, res) => {
    const { name } = req.body;

    db.query('INSERT INTO collections (name, user_id) VALUES (?, ?)', [name, req.session.userId], 
        (err) => {
            if (err) throw err;
            res.redirect('/collections');
        }
    );
});

// Formular zum Bearbeiten einer Collection
router.get('/edit/:id', isAuthenticated, (req, res) => {
   const collectionId = req.params.id;
   db.query('SELECT * FROM collections WHERE id = ?', [collectionId], (err, result) => {
     if (err) throw err;
     if (result.length > 0) {
       res.render('editCollection', { collection: result[0] });
     } else {
       res.redirect('/collections');
     }
   });
});

// Collection aktualisieren
router.post('/edit/:id', isAuthenticated, (req, res) => {
   const collectionId = req.params.id;
   const { name } = req.body;

   db.query('UPDATE collections SET name = ? WHERE id = ?', [name, collectionId], (err) => {
     if (err) throw err;
     res.redirect('/collections');
   });
});

// Collection löschen
router.post('/delete/:id', isAuthenticated, (req, res) => {
   const collectionId = req.params.id;
   db.query('DELETE FROM collections WHERE id = ?', [collectionId], (err) => {
     if (err) throw err;
     res.redirect('/collections');
   });
});

module.exports = router;