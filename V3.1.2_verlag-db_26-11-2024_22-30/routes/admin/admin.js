const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const checkPassword = require('../../middleware/checkPasswd'); // Importiere die Middleware
const crypto = require('crypto'); // Für das Hashen des Passworts
const logger = require('../../middleware/logger'); // Importiere das Logger-Modul

// Route für das Anmeldeformular 
router.get('/login', (req, res) => {
    res.render('admin/login'); 
});

// Redirect root URL to login page
router.get('/', (req, res) => {
    logger.info('Redirecting to login page'); // Loggen der Umleitung
    res.redirect('/admin/login'); // Redirect to login page
});

// Route für das Anmelden (POST)
router.post('/login', (req, res) => {
    const password = req.body.password;

    db.query("SELECT password FROM admin LIMIT 1", (error, results) => {
        if (error || results.length === 0) {
            logger.error("Zugriff verweigert: Ungültiges Passwort oder Benutzer nicht gefunden");  // Loggen der Fehlermeldung 
            return res.status(403).send("Zugriff verweigert"); 
        }

        const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

        if (results[0].password === hashedPassword) {
            req.session.userId = 1; 
            logger.info(`Benutzer eingeloggt`);  // Protokolliere den Zugriff 
            return res.redirect("/admin/users");
        }

        logger.error("Zugriff verweigert: Ungültiges Passwort");  // Loggen der Fehlermeldung 
        return res.status(403).send("Zugriff verweigert");
    });
});

// Route zum Ändern des Admin-Passworts
router.post('/change-passwd', checkPassword, (req, res) => {
   const newPassword = req.body.newPassword; 

   const hashedNewPassword = crypto.createHash("sha256").update(newPassword).digest("hex"); 

   db.query("UPDATE admin SET password=? WHERE id=1", [hashedNewPassword], (error) => {
       if (error) {
           logger.error("Fehler beim Ändern des Passworts: " + error.message); // Loggen des Fehlers
           return res.status(500).send("Fehler beim Ändern des Passworts");
       }
       logger.info(`Passwort erfolgreich geändert!`); // Protokolliere die Aktion
       return res.send("Passwort erfolgreich geändert!");
   });
});

// Benutzerverwaltung unter /admin/users (GET)
router.get("/users", checkPassword, (req, res) => {
    db.query("SELECT * FROM users", (error, results) => {
        if (error) {
            logger.error("Fehler beim Abrufen der Benutzer: " + error.message);  // Loggen des Fehlers 
            return res.status(500).send("Fehler beim Abrufen der Benutzer");
        }

        logger.info(`Benutzerübersicht angezeigt`);  // Protokolliere die Aktion 
        return res.render("admin/users", { users: results });  
    });
});

// Benutzerverwaltung unter /admin/users (POST)
router.post("/users", checkPassword, (req, res) => {
    const { username, password } = req.body; 

    if (!username || username.trim() === "") {
        return res.status(400).send("Benutzername darf nicht leer sein");  
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    db.query("INSERT INTO users(username, password) VALUES (?, ?)", [username, hashedPassword], (error) => {
        if (error) {
            logger.error("Fehler beim Hinzufügen des Benutzers: " + error.message);  // Loggen des Fehlers 
            return res.status(500).send("Fehler beim Hinzufügen des Benutzers");
        }

        logger.info(`Neuer Benutzer hinzugefügt: ${username}`);  // Protokolliere die Aktion 
        return res.redirect("/admin/users");  
    });
});

// Route zum Bearbeiten eines Benutzers (GET)
router.get("/users/:id/edit", checkPassword, (req, res) => {
    const userId = req.params.id;

    db.query("SELECT * FROM users WHERE id=?", [userId], (error, results) => {
        if (error || results.length === 0) {
            logger.warn(`Benutzer nicht gefunden für ID: ${userId}`);  // Loggen eines Warnhinweises 
            return res.status(404).send("Benutzer nicht gefunden");
        }

        return res.render("admin/edit-user", { user: results[0] });  
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