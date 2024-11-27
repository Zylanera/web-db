const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

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
app.use('/collections', require('./routes/collections'));

// Dashboard route (ensure this is defined)
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }
    res.render('dashboard'); // Render the dashboard if authenticated
});

// Start server
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});