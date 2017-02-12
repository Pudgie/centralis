// app/routes.js
module.exports = function(app, passport) {
	var url = __dirname + '/../views/';
	var path = require('path');
	var Exercise = require('./models/exercise');

	app.get('/', function(req, res) {
		//res.sendFile(path.resolve(url + 'index.html'));
		res.render('main.ejs', {message: req.flash('loginMessage')});
	});

	app.get('/adminlogin', function(req, res) {
		//res.sendFile(path.resolve(url + 'index.html'));
		res.render('login.ejs', {message: req.flash('loginMessage')});
	});

	app.get('/studentlogin', function(req, res) {
		//res.sendFile(path.resolve(url + 'index.html'));
		res.render('studentLogin.ejs', {message: req.flash('loginMessage')});
	});

	// process the admin login form
  	app.post('/login', passport.authenticate('local', {
		successRedirect: '/admin',
		failureRedirect: '/adminLogin',
		failureFlash: true
	}));

	// process the student login form **CHANGE THIS**
  	app.post('/studentlogin', passport.authenticate('local', {
		successRedirect: '/admin',
		failureRedirect: '/studentlogin',
		failureFlash: true
	}));

	// admin page. Must be logged in to to visit using function isLoggedIn as middleware
	app.get('/admin', isLoggedIn, function(req, res) {
		res.render('admin.ejs', {user: req.user})
	});

	// logout
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/createExercise', function(req, res) {
		res.render('exercises.ejs');
	});

	app.post('/createRoles', function(req, res) {
		res.render('roles.ejs', {name: req.body.exerciseName, roles: req.body.roles});
	});

	app.post('/createScenarios', function(req, res) {
		var titles = req.body.roles;
		var exercise = new Exercise({
			roles: titles,
			name: req.body.exerciseName,
			scenarios: [],
			answerer: req.body.role1
		});
		exercise.save(function(err) {
			if (err) throw err;
			console.log('Exercise saved succesfully');
		});
	});

};

// route middleware to make sure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	// if not logged in, redirect to homepage
	res.redirect('/');
}
