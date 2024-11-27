const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../middleware/logger');

function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login');
}

router.get('/', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM collections WHERE user_id = ?', [req.session.userId], (err, results) => {
        if (err) {
            logger.error('Fehler beim Abrufen der Collections: ' + err.message);
            return res.status(500).send('Error fetching collections');
        }
        res.render('collections', { collections: results });
    });
});

router.get('/new', isAuthenticated, (req, res) => {
    res.render('newCollection');
});

router.post('/add', isAuthenticated, (req, res) => {
    const { name } = req.body;

    db.query('INSERT INTO collections (name, user_id) VALUES (?, ?)', [name, req.session.userId], 
        (err) => {
            if (err) {
                logger.error('Fehler beim Hinzufügen der Collection: ' + err.message);
                return res.status(500).send('Error adding collection');
            }
            logger.info(`Neue Collection hinzugefügt: ${name}`);
            res.redirect('/collections');
        }
    );
});

router.get('/edit/:id', isAuthenticated, (req, res) => {
   const collectionId = req.params.id;
   db.query('SELECT * FROM collections WHERE id = ? AND user_id = ?', [collectionId, req.session.userId], (err, result) => {
     if (err) {
         logger.error('Fehler beim Abrufen der Collection zur Bearbeitung: ' + err.message);
         return res.status(500).send('Error fetching collection');
     }
     if (result.length > 0) {
       res.render('editCollection', { collection: result[0] });
     } else {
       logger.warn(`Collection nicht gefunden für ID: ${collectionId}`);
       res.redirect('/collections');
     }
   });
});

router.post('/edit/:id', isAuthenticated, (req, res) => {
   const collectionId = req.params.id;
   const { name } = req.body;

   db.query('UPDATE collections SET name = ? WHERE id = ? AND user_id = ?', [name, collectionId, req.session.userId], (err) => {
     if (err) {
         logger.error('Fehler beim Aktualisieren der Collection: ' + err.message);
         return res.status(500).send('Error updating collection');
     }
     logger.info(`Collection aktualisiert: ${name}`);
     res.redirect('/collections');
   });
});

router.post('/delete/:id', isAuthenticated, (req, res) => {
   const collectionId = req.params.id;
   db.query('DELETE FROM collections WHERE id = ? AND user_id = ?', [collectionId, req.session.userId], (err) => {
     if (err) {
         logger.error('Fehler beim Löschen der Collection: ' + err.message);
         return res.status(500).send('Error deleting collection');
     }
     logger.info(`Collection gelöscht: ID ${collectionId}`);
     res.redirect('/collections');
   });
});

router.get('/search', isAuthenticated, (req, res) => {
    const searchTerm = req.query.term;
    db.query('SELECT id, name FROM collections WHERE user_id = ? AND name LIKE ?', 
        [req.session.userId, `%${searchTerm}%`], 
        (err, results) => {
            if (err) {
                logger.error('Fehler bei der Suche nach Collections: ' + err.message);
                return res.status(500).json([]);
            }
            const formattedResults = results.map(result => ({
                id: result.id,
                value: result.name,
                label: result.name
            }));
            res.json(formattedResults);
        }
    );
});

router.get('/:id', isAuthenticated, (req, res) => {
    const collectionId = req.params.id;
    db.query('SELECT c.name, b.* FROM collections c LEFT JOIN collection_books cb ON c.id = cb.collection_id LEFT JOIN books b ON cb.book_id = b.id WHERE c.id = ? AND c.user_id = ?', 
        [collectionId, req.session.userId], 
        (err, results) => {
            if (err) {
                logger.error('Fehler beim Abrufen der Bücher der Collection: ' + err.message);
                return res.status(500).send('Error fetching collection books');
            }
            if (results.length > 0) {
                const collection = {
                    id: collectionId,
                    name: results[0].name,
                    books: results.filter(result => result.id !== null)
                };
                res.render('collectionDetails', { collection: collection });
            } else {
                logger.warn(`Collection nicht gefunden für ID: ${collectionId}`);
                res.redirect('/collections');
            }
        }
    );
});

module.exports = router;