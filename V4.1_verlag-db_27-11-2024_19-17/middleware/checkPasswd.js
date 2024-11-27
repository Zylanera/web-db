const db = require('../config/database');
const logger = require('./logger'); // Importiere das Logger-Modul

function checkPassword(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/admin/login'); // Umleitung zur Login-Seite
    }
    
    logger.info(`Admin logged in.`);
    next(); // Zugriff gewähren
    
}

module.exports = checkPassword;
