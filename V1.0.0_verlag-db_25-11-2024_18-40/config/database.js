const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'benutzername',
    password: 'passwort',
    database: 'dbreg'
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database');
});

module.exports = connection;