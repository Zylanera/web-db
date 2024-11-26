const db = require('../config/database'); // Importiere die Datenbankverbindung

// Funktion zum Abrufen der Statistiken
const getStatistics = () => {
    return new Promise((resolve, reject) => {
        const queries = {
            monthlyReleases: "SELECT COUNT(*) AS count FROM books WHERE MONTH(release_date) = MONTH(CURRENT_DATE()) AND YEAR(release_date) = YEAR(CURRENT_DATE())",
            lastMonthReleases: "SELECT COUNT(*) AS count FROM books WHERE MONTH(release_date) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(release_date) = YEAR(CURRENT_DATE())",
            yearlyReleases: "SELECT MONTH(release_date) AS month, COUNT(*) AS count FROM books WHERE YEAR(release_date) = YEAR(CURRENT_DATE()) GROUP BY MONTH(release_date)",
            bookEntries: "SELECT COUNT(*) AS count FROM books",
            collectionEntries: "SELECT COUNT(*) AS count FROM collections",
            averagePrice: "SELECT AVG(price) AS average FROM books"
        };

        const results = {};

        // Führe alle Abfragen gleichzeitig aus
        Promise.all(Object.keys(queries).map(key => {
            return new Promise((resolve, reject) => {
                db.query(queries[key], (error, results) => {
                    if (error) return reject(error);
                    resolve(results[0]);
                });
            }).then(result => {
                if (key === 'yearlyReleases') {
                    results[key] = result; // Für die jährlichen Releases speichern wir das gesamte Ergebnis
                } else {
                    results[key] = result.count || parseFloat(result.average).toFixed(2);
                }
            });
        }))
        .then(() => {
            resolve(results);
        })
        .catch(err => {
            console.error(err);
            reject('Fehler beim Abrufen der Statistiken');
        });
    });
};

// Exportiere die Funktion
module.exports = { getStatistics };