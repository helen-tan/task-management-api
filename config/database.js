const mysql = require('mysql2');

// Create connection 
const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : process.env.DB_PASSWORD,
    database : 'tms_db',
    timezone : 'Z'
})

// Connect to MySQL
db.connect((error) => {
    if (error) {
        throw error;
    }
    console.log('MySql Connected!');
})

module.exports = db;