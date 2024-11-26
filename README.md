# Overview
1. How to setup MySQL for this project
2. How to set up the config file
3. Startup

## 1. MySQL-Setup:

### Step 1: Create and Setup Database
Replace "dbreg" if you want to.
replace "yourHashedPasswd" with your hashed password, you can use theis Hash-Generator. Use the SHA-256 Version! https://www.passwort-generator.org/hashgenerator.html<br><br>
⚠️ If you replace "dbreg", you have to change it in your config file. ⚠️
```mysql
CREATE DATABASE IF NOT EXISTS dbreg;

USE dbreg;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  user_id INT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  user_id INT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS collection_books (
  collection_id INT,
  book_id INT,
  FOREIGN KEY(collection_id) REFERENCES collections(id),
  FOREIGN KEY(book_id) REFERENCES books(id),
  PRIMARY KEY(collection_id, book_id)
);

ALTER TABLE books ADD COLUMN cover VARCHAR(255);
ALTER TABLE books ADD COLUMN description TEXT;
ALTER TABLE books ADD COLUMN price VARCHAR(50);
ALTER TABLE books ADD COLUMN release_date VARCHAR(50);
ALTER TABLE books ADD COLUMN volume_number VARCHAR(50);
ALTER TABLE books ADD COLUMN isbn13 VARCHAR(20);
ALTER TABLE books ADD COLUMN isbn10 VARCHAR(20);

CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(255) NOT NULL
);

INSERT INTO admin (password) VALUES (SHA2('yourHashedPasswd', 256));
```

### Step 2: Create DB-User:
Replace "localhost" if needed<br>
Replace "yourUsername" by your Username you want to set as your Username<br>
Replace "yourPassword" by the password  you want to set as your DB-User's password<br>
```mysql
CREATE USER 'yourUsername'@'localhost' IDENTIFIED BY 'yourPassword';
```

### Step 3: Setup DB-User:
Replace "localhost" if needed<br>
Replace "yourUsername" by your Username<br>
Replace "yourPassword" by your DB-User's password.<br>
```mysql
GRANT ALL PRIVILEGES ON *.* TO 'yourUsername'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```


## 2. Config-File-Setup
Replace "localhost" if needed<br>
Replace "yourUsername" by your Username<br>
Replace "yourPassword" by your DB-User's password.<br>
Replace "dbreg" by your Database-Name, if you changed it when setting up the MySQL-DB.
```js
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'yourUsername',
    password: 'yourPassword',
    database: 'dbreg'
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database');
});

module.exports = connection;
```

## 3. Startup
Run the following commands in the shell:
```
npm init -y
```
```
npm install
```
```
node app.js
```
