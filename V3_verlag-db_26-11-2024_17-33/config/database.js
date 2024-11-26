const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'benutzername',
    password: 'passwort',
    database: 'dbreg'
});

connection.connect((err) => {
    if (err) throw err;
    console.log(` `);
    console.log(`=== ESTABLISHING DB CONNECTION ===`);
    console.log(`✅ CODE 200: OK`);
    console.log(`✅ CODE 200: CONNECTED TO MySQL DATABASE`);
    console.log(`=== ESTABLISHING DB CONNECTION ===`);
    console.log(` `);
    
});

module.exports = connection;