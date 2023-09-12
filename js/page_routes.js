/***************************************
 * 
 *  Route Handling for Page rendering
 * 
 * ************************************/
 

module.exports = function (app) {



/***************************************
 *  Default Route (index.hbs)
 *  - Home page
 *  - if user is logged in, redirect to dashboard
 * 
 * ************************************/
     
app.get('/', (req, res) => {

// Check if user is logged in
if (req.session.loggedin) {
    res.redirect('/dashboard');
} else {
    const page_Title = "Welcome to PunkAge!";
    res.render('index', {page_Title});
}
});

/***************************************
 *  Route for handling login page
 * ************************************/
 
app.get('/login', (req, res) => {
    const page_Title = "Login to your PunkAge account!";
    res.render('login', {page_Title});
});

/***************************************
 *  Route for handling logout
 * ************************************/
app.get('/logout', (req, res) => {
    req.session.destroy();
    
    res.redirect('/');
});

/***************************************
 *  Route for handling register page
 * ************************************/
app.get('/register', (req, res) => {
    const page_Title = "create a new PunkAge account!";
    res.render('register', {page_Title});
});

/***************************************
 *  Route for handling dashboard page
 * ************************************/
app.get ('/dashboard', (req, res) => {
    const current_User = req.session.username;

    if (req.session.loggedin) {
        const page_Title = "Welcome to back " + current_User + "!";
        res.render('dashboard', {page_Title});
    } else {
        res.redirect('/login');
    }

});

/***************************************
 *  Route for handling account page
 * ************************************/
app.get ('/account', (req, res) => {
    const current_User = req.session.username;

    if (req.session.loggedin) {
        const page_Title = "Manage your account";
        res.render('account', {page_Title});
    } else {
        res.redirect('/login');
    }

});

/***************************************
 *  Route for handling account page
 * ************************************/
app.get ('/characters', (req, res) => {
    const current_User = req.session.username;

    if (req.session.loggedin) {
        const page_Title = "Manage your character";
        res.render('characters', {page_Title});
    } else {
        res.redirect('/login');
    }

});

};