//import mysql module
const mysql = require('mysql2');

//create connection to database

const db_con = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port : process.env.DATABASE_PORT,

    database : process.env.DATABASE_NAME,

    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
});

//connect to database
db_con.connect((err) => {
    if(err){
        console.log(err);
    }else{
        console.log("Database Connected");
    }
});

//export connection
module.exports = db_con;