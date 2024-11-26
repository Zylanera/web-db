const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const net = require('net');
const path = require('path');
const app = express();
const PORT = 3000;

require("./bot/dcb.js");

// Database configuration
const db = require('./config/database');

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session management
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
}));

// Routes setup
app.use('/', require('./routes/auth'));
app.use('/books', require('./routes/books'));

const collectionsRouter = require('./routes/collections');
app.use('/collections', collectionsRouter);

// Dashboard route (ensure this is defined)
app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }

    try {
        const statistics = await getStatistics();
        console.log('Statistics:', statistics); // Debugging-Ausgabe
        res.render('dashboard', { statistics }); // Render the dashboard with statistics
    } catch (error) {
        console.error(error);
        res.status(500).send('Fehler beim Abrufen der Statistiken');
    }
});

// Funktion zum Abrufen der Statistiken
async function getStatistics() {
    const queries = {
        monthlyReleases: "SELECT COUNT(*) AS count FROM books WHERE MONTH(release_date) = MONTH(CURRENT_DATE()) AND YEAR(release_date) = YEAR(CURRENT_DATE())",
        lastMonthReleases: "SELECT COUNT(*) AS count FROM books WHERE MONTH(release_date) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(release_date) = YEAR(CURRENT_DATE())",
        bookEntries: "SELECT COUNT(*) AS count FROM books",
        collectionEntries: "SELECT COUNT(*) AS count FROM collections",
        averagePrice: "SELECT AVG(price) AS average FROM books",
        yearlyReleases: "SELECT MONTH(release_date) AS month, COUNT(*) AS count FROM books WHERE YEAR(release_date) = YEAR(CURRENT_DATE()) GROUP BY MONTH(release_date)"
    };

    const results = {};

    // Führe alle Abfragen gleichzeitig aus
    await Promise.all(Object.keys(queries).map(async (key) => {
        return new Promise((resolve, reject) => {
            db.query(queries[key], (error, results) => {
                if (error) return reject(error);
                // Überprüfen, ob Ergebnisse vorhanden sind
                if (results.length > 0) {
                    resolve(results[0]);
                } else {
                    resolve({ count: 0 }); // Standardwert, wenn keine Ergebnisse
                }
            });
        }).then(result => {
            results[key] = result.count || parseFloat(result.average).toFixed(2);
        });
    }));

    // Jährliche Releases speziell behandeln
    const yearlyResults = await new Promise((resolve, reject) => {
        db.query(queries.yearlyReleases, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });

    results.yearlyReleases = yearlyResults;

    return results;
}

/**
 * Prüft, ob ein bestimmter Port frei ist.
 * @param {number} port - Der zu prüfende Port.
 * @returns {Promise<boolean>} - True, wenn der Port frei ist; False, wenn er belegt ist.
 */
function isPortFree(port) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();

        console.log(` `);
        console.log("=== PORT CHECK ===");

        server.once('listening', () => {
            server.close();
            resolve(true);
        });

        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false); // Port ist in Verwendung
                console.log("❌ ERR 202: BIND FAILED");
                console.log("❌ ERR 202: ADDRESS IN USE");
                console.log("=== PORT CHECK ===");
                console.log(` `);
            } else {
                reject(err); // Unerwarteter Fehler
                console.log("❌ ERR 500: BIND FAILED");
                console.log("❌ ERR 500: UNEXPECTED ERROR");
                console.log("=== PORT CHECK ===");
                console.log(` `);
            }
        });

        server.listen(port);
    });
}

(async () => {
    try {
        const portFree = await isPortFree(PORT);

        if (portFree) {
            console.log(`✅ CODE 200: OK`);
            console.log(`✅ CODE 200: PORT AVAILABLE`);
            console.log("=== PORT CHECK ===");
            console.log(` `);

            app.listen(PORT, () => {
                console.log(` `);
                console.log("=== STARTING SERVER ===");
                console.log(`✅ CODE 200: BIND SUCCESSFUL`);
                console.log(`✅ CODE 200: SERVER STARTED ON http://localhost:${PORT}/`);
                console.log("=== STARTING SERVER ===");
                console.log(` `);
            });
        } else {
            console.error(`❌ ERR 202: Port ${PORT} is already in use.`);
            console.log("=== PORT CHECK ===");
            console.log(` `);
        }
    } catch (err) {
        console.error(`❌ ERR 500: An unexpected error occurred while checking the port:`, err);
        console.log("=== PORT CHECK ===");
        console.log(` `);
    }
})();