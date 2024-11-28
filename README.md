# Overview
### -- using this project the docker (new) way --
1. Installing the MySQL
2. Setting up MySQL for this project
3. Installing the App
4. Setting up the config file
5. Disabeing/Enabeling the register-form.


This project is made for managing books with collections. It is recommended for publishers and projects like manga-passion.de (mangapassion does not use it tho), but you could also us it for your private book-collection.

How to Setup:

**Step 1:** Make sure Docker is installed. I recommend using using Docker with Portainer.

**Step 2:** Setup the Database via the following command:
```
sudo docker run \
  --name db-app-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  zylanera/web-db-mysql:latest

```
Please **change the "rootpassword" to any other password.** please note, that you will need this password later!

Note: You may be asked for your users password, if you run this command outside of the root user!

**Step 3:**
Install the App. Note, that **you have to set the path on your computer, outside of your container**, as you will need to edit some things in the files later!
```
docker run -d \
  --name web-db-container \
  -p 9444:9444 \
  -v /your/path/to/web-db-app:/data \
  zylanera/web-db-app:latest

```


**Step 4 (optional):**
if you want your app to run on an other port than 9444, you have to edit the command like this:
```
docker run -d \
  --name web-db-container \
  -p 9444:<yourPort> \
  -v /your/path/to/web-db-app:/data \
  zylanera/web-db-app:latest

```
Replace the <yourPort> by the port you want the app to be running on.


**Step 5:**
run the following commands:
```
cd /your/path/to/web-db-app/config/
sudo nano database.js
```

now you should see this code:
```
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '172.17.0.2',
    user: 'root',
    password: 'root',
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

```

Run this Commands in a seperate console/terminal:
```
sudo docker ps
```
copy the id of your web-db-mysql container and replace <yourDockerContainerId> with this ID. The run this command in your console/terminal:

```
sudo docker inspect <yourDockerContainerId> | grep "IPAddress"
```

Now you copy the "IPAddress" and replace the ip at "host" with it. 
You will also need to replace the username and password for your database if these variables are different than those here.

```
const connection = mysql.createConnection({
    host: '172.17.0.2',
    user: 'root',
    password: 'root',
    database: 'dbreg'
});
```

Now save the File.

**Step 6 (optional):**
If you have already created an account for yourself, you can disable the registration-form like this:

Run this Command:
```
cd /your/path/to/web-db-app/routes/
sudo nano auth.js
```

Via the "const reg = true;" at line 7 you can turn the registration form on and off, default is true (enabled). 

You can change this at any time. 

true = enabled registration form
false = disabled registration form (only login with existing accounts possible)

**Step 7 (optional):**
if you go to the /your/path/to/web-db-app/public/media folder, you can replace the used media-files, such as the logo in the Navbar.

There you go,
you have now setup the web-db-app successfully.
 

<br><br><br><br>

### -- using this project the old way (may be outdated) --
1. How to setup MySQL for this project
2. How to set up the config file
3. Startup

## 1. MySQL-Setup:

### Step 1: Create and Setup Database
Replace "dbreg" if you want to.
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
