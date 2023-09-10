// Import Dependencies

const express = require('express');
const dotenv = require('dotenv');
const util = require('util');

const app = express(); // Initialize express
app.set('view engine', 'hbs'); // Set view engine to hbs

const path = require('path'); // Import path module
const publicDirectory = path.join(__dirname, './public'); // Set path for public directory
app.use(express.static(publicDirectory)); // Set path for public directory

console.log(publicDirectory); // Log directory name

// Configure dotenv
dotenv.config({ path: './.env' });

const db_con = require('./js/db'); // Import db.js
const dbQueryPromise = util.promisify(db_con.query).bind(db_con); //promisify db_con.query


// Define Routes for rendering pages
app.get('/', (req, res) => {
    const page_Title = "Welcome to PunkAge!";
    res.render('index', {page_Title});
});

app.get('/login', (req, res) => {
    const page_Title = "Login to your PunkAge account!";
    res.render('login', {page_Title});
});

app.get('/register', (req, res) => {
    const page_Title = "create a new PunkAge account!";
    res.render('register', {page_Title});
});


// Handle Form Registration
const bcrypt = require('bcryptjs'); // Import bcryptjs module

// Configure express to recieve form data as json
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Define Routes for handling form data
app.post('/auth/register', async (req, res) => {
 //   console.log(req.body); // Log form data in console
    const { username, email, password, password_confirm } = req.body; // Destructure form data

// Check that Form Conditions are met before executing database query code, provide responce as nessessary
    try {
        const [existingEmail] = await dbQueryPromise('SELECT * FROM users WHERE email = ?', [email]); //check if email is in database
        const [existingUser] = await dbQueryPromise('SELECT * FROM users WHERE name = ?', [username]); //check if email is in database


            // Check if password and password_confirm match
        if (password !== password_confirm) {
            console.log("Passwords do not match!"); // debug
            return res.render('register', {
                message: 'Passwords do not match!'
            });
        } else if (password.length < 8) {
            console.log("Password must be at least 8 characters long!"); // debug
            return res.render('register', {
                message: 'Password must be at least 8 characters long!'
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
            // All checks passed, execute database query code and render success message
            const jwt = require('jsonwebtoken');

            // Hash password
            let hashedPassword = await bcrypt.hash(password, 8);

            //Generate Token
            let token = jwt.sign({username: username}, process.env.TOKEN_SECRET, { expiresIn: '24h' });

            // Insert user into database
            db_con.query('INSERT INTO users SET ?', { name: username, email: email, password: hashedPassword, token: token }, (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(results);
                    return res.render('register', {
                        message: 'User registered!'
                    });
                }
            }); 
        }
    } catch (error) {
        console.log(error);
    } 

});


//listen on port 5000
app.listen(5000, () => {
    console.log("Server started on Port 5000");
});