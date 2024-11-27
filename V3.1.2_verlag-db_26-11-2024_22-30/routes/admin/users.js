const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const checkPassword = require('../../middleware/checkPasswd'); // Importiere die Middleware
const crypto = require('crypto'); // Für das Hashen des Passworts
const logger = require('../../middleware/logger'); // Importiere das Logger-Modul

// Route für das Anmeldeformular
router.get('/login', (req, res) => {
    res.render('admin/login'); // Render ein einfaches Login-Formular
});

// Benutzerverwaltung unter /admin/users (GET)
router.get('/users', checkPassword, (req, res) => {
    db.query("SELECT * FROM users", (error, results) => {
        if (error) {
            logger.error("Fehler beim Abrufen der Benutzer: " + error.message); // Loggen des Fehlers
            return res.status(500).send("Fehler beim Abrufen der Benutzer");
        }
        res.render("admin/users", { users: results }); // Render die Benutzerübersicht
    });
});

// Benutzerverwaltung unter /admin/users (POST)
router.post('/users', checkPassword, (req, res) => {
    const { username, password } = req.body; 

    if (!username || username.trim() === '') {
        return res.status(400).send("Benutzername darf nicht leer sein"); 
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    db.query("INSERT INTO users(username, password) VALUES (?, ?)", [username, hashedPassword], (error) => {
        if (error) {
            logger.error("Fehler beim Hinzufügen des Benutzers: " + error.message); // Loggen des Fehlers
            return res.status(500).send("Fehler beim Hinzufügen des Benutzers");
        }
        
        logger.info(`Neuer Benutzer hinzugefügt: ${username}`); // Protokolliere die Aktion
        return res.redirect("/admin/users"); 
    });
});

// Route zum Aktualisieren eines Benutzers (POST)
router.post("/users/:id", checkPassword, (req, res) => {
    const userId = req.params.id;
    const { username, password } = req.body; 

    if (!username || username.trim() === "") {
        return res.status(400).send("Benutzername darf nicht leer sein");  
    }

    const hashedPassword = password ? crypto.createHash("sha256").update(password).digest("hex") : null;

    db.query("UPDATE users SET username=?, password=? WHERE id=?", [username, hashedPassword, userId], (error) => {
        if (error) {
            logger.error(`Fehler beim Aktualisieren des Benutzers mit ID ${userId}: ` + error.message);  // Loggen des Fehlers 
            return res.status(500).send("Fehler beim Aktualisieren des Benutzers");
        }

        logger.info(`Benutzer aktualisiert: ${username}`);  // Protokolliere die Aktion 
        return res.redirect("/admin/users");  
    });
});

// Route zum Löschen eines Benutzers (POST)
router.post("/users/:id/delete", checkPassword, (req, res) => {
    const userId = req.params.id;

    db.query("DELETE FROM users WHERE id=?", [userId], (error) => {
        if (error) {
            logger.error(`Fehler beim Löschen des Benutzers mit ID ${userId}: ` + error.message);  // Loggen des Fehlers 
            return res.status(500).send("Fehler beim Löschen des Benutzers");
        }

        logger.info(`Benutzer gelöscht: ID ${userId}`);  // Protokolliere die Aktion 
        return res.redirect("/admin/users");  
    });
});

module.exports = router;
