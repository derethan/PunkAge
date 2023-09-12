/***************************************
 *  PunkAge - Web Platform
 *  Author: Andrew Patterson
 * 
 *  Path: app.js
 * 
 * Import Dependant Modules
 * 
 * ************************************/

const express = require('express');
const app = express(); // Initialize express
const util = require('util');
const crypto = require('crypto'); // Import crypto module
// configure express to use express sessions
const session = require('express-session');

// Configure express to use handlebars
app.set('view engine', 'hbs');

// Configure express to recieve form data as json
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Configure express to use static files
const path = require('path'); // Import path module
const publicDirectory = path.join(__dirname, './public'); // Set path for public directory
app.use(express.static(publicDirectory)); // Set path for public directory


// Configure express to use request-ip
const requestIp = require('request-ip');
app.use(requestIp.mw());


// Configure dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({
    host: process.env.DATABASE_HOST,
    port : process.env.DATABASE_PORT,

    database : process.env.DATABASE_NAME,

    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
    createDatabaseTable: true
});

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    store: sessionStore
}));

/***************************************
 *  MySQL Database Connection
 * ************************************/
const db_con = require('./js/db'); // Import db.js
const dbQueryPromise = util.promisify(db_con.query).bind(db_con); //promisify db_con.query

/***************************************
 *  Route Handling for Page rendering
 * ************************************/
const page_routes = require('./js/page_routes'); // Import page_routes.js
page_routes(app); // Call page_routes function and pass app as argument




/***************************************
 *  Route Handling for User Login
 * ************************************/

// Define Routes for handling login form data
app.post('/auth/login', async (req, res) => {

    // Capture form data
    const { username, password } = req.body; // Destructure form data

    // Hash password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('base64');

    //get current date and time
    const now = new Date();
    const time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
    const date = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
    const time_stamp = date + ' ' + time;



    // Check that Form Conditions are met before executing database query code, provide responce as nessessary
    if (username && password) {

        try {
            const [existingUser] = await dbQueryPromise('SELECT * FROM users WHERE username = ? AND password = ?', [username, hashedPassword]); //check if email is in database

            if (existingUser) {
                console.log(username + " has logged in at " + time_stamp); // debug
                req.session.loggedin = true;
                req.session.username = username;
                res.redirect('/dashboard');
            } else {
                console.log("Incorrect Username or Password!"); // debug
                return res.render('login', {
                    message: 'Incorrect Username or Password!'
                });
            }
                            
                
        } catch (error) {
            console.log(error);
        }


    } else {
        console.log("Username or Password Fields are blank"); // debug
            return res.render('login', {
                message: 'A username & Password are required'
            });
    }
});




/***************************************
 *  Route Handling for:
 * 
 *  User Registration
 *  Email Verification
 * ************************************/

// Define Routes for handling registration form data
app.post('/auth/register', async (req, res) => {
    //   console.log(req.body); // Log form data in console
    const { username, email, password, password_confirm } = req.body; // Destructure form data

        // Hash password
        const hashedPassword = crypto.createHash('sha256').update(password).digest('base64');
        
        //set last_ip to clients ip address
        const ipAddress = req.clientIp;
        let last_ip = ipAddress;

    // Check that Form Conditions are met before executing database query code, provide responce as nessessary
    try {
        const [existingEmail] = await dbQueryPromise('SELECT * FROM users WHERE email = ?', [email]); //check if email is in database
        const [existingUser] = await dbQueryPromise('SELECT * FROM users WHERE username = ?', [username]); //check if email is in database


            // Check if password and password_confirm match
        if (password !== password_confirm) {
            console.log("Passwords do not match!"); // debug
            return res.render('register', {
                message: 'Passwords do not match!'
            });
        } else if (password.length < 4) {
            console.log("Password must be at least 4 characters long!"); // debug
            return res.render('register', {
                message: 'Password must be at least 4 characters long!'
            });
        } else if (existingEmail) {
            console.log("Email already exists!"); // debug
            return res.render('register', {
                message: 'Email already exists!'
            });
        } else if (existingUser) {
            console.log("UserName already exists!"); // debug
            return res.render('register', {
                message: 'UserName already exists!'
            });
        } else {

            console.log('Registration Successful!'); // debug

            // Insert user into database
            db_con.query('INSERT INTO users SET ?', { username: username, email: email, password: hashedPassword, last_ip: last_ip }, (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    //console.log(results);
                    return results.render('register', {
                        message: 'User registered!'
                    });
                }
            }); // End of db_con.query
        }
    } catch (error) {
        console.log(error);
    } 

});

/***************************************
 *  Route Handling for:
 * 
 *  Chaging user Password
 * ************************************/
app.post('/auth/change_password', async (req, res) => {
    //   console.log(req.body); // Log form data in console
    const { password, password_confirm } = req.body; // Destructure form data
    const current_User = req.session.username;


    // Hash password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('base64');

                // Check if password and password_confirm match
                if (password !== password_confirm) {
                    console.log("Passwords do not match!"); // debug
                    return res.render('account', {
                        message: 'Passwords do not match!'
                    });
                } else if (password.length < 4) {
                    console.log("Password must be at least 4 characters long!"); // debug
                    return res.render('account', {
                        message: 'Password must be at least 4 characters long!'
                    });
                } else {
                    try {
                        // Update user password in database
                        await dbQueryPromise('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, current_User]);

                        console.log('Password Changed by ' + current_User); // debug
                        return res.render('account', {
                            message: 'Password Changed!'
                        });
                    } catch (error) {
                        console.log(error);
                    }
                }
});

                        




//listen on port 5000
app.listen(5000, () => {
    console.log("Server started on Port 5000");
});