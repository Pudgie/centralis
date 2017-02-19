// app/routes.js


module.exports = function(app, passport) {
	var url = __dirname + '/../views/';
	var path = require('path');
	var Exercise = require('./models/exercise');
	var Scenario = require('./models/scenario');

	app.get('/', function(req, res) {
		//res.sendFile(path.resolve(url + 'index.html'));
		res.render('main.ejs', {message: req.flash('loginMessage')});
	});

	app.get('/adminlogin', function(req, res) {
		res.render('login.ejs', {message: req.flash('loginMessage')});
	});

	app.get('/studentlogin', function(req, res) {
		res.render('studentLogin.ejs', {message: req.flash('loginMessage')});
	});
	
	app.get('/createSession', function(req, res) {
		res.render('createSession.ejs', {message: req.flash('sessionMessage')});

	});
	
	app.post('/createSession', function(req, res) {
		var sessionID = Math.random() * (999999 - 100000) + 100000;
		sessionID = Math.round(sessionID);
		console.log(sessionID);
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
		var descriptions = req.body.descriptions;
		var answerer;
		if (req.body.numRoles == 1) {
			answerer = titles;
		} else {
			answerer = titles[0];
		}
		var exercise = new Exercise({
			roles: titles,
			descriptions: descriptions,
			name: req.body.exerciseName,
			scenarios: [],
			answerer: answerer
		});
		exercise.save(function(err) {
			if (err) throw err;
			console.log('Exercise saved succesfully');
		});

		res.render('createScenario.ejs');
	});

	app.post('/getScenario', function(req, res) {
		var scenario = new Scenario({
			videoURL: req.body.video,
			text: req.body.text,
			question: req.body.question,
			survey: null
		});

		res.render('survey.ejs', {number: req.body.survey, scenario: scenario});
	});

	app.post('/addSurvey', function(req, res) {
		var scenario = new Scenario({
			videoURL: req.body.videoURL,
			text: req.body.text,
			question: req.body.question,
			survey: req.body.surveys
		});
		Exercise.nextCount(function(err, count) {
			var exerciseID = count - 1;
			Exercise.findByIdAndUpdate(
		    exerciseID,
		    {$push: {scenarios: scenario}},
		    {safe: true, upsert: true},
			    function(err, model) {
			        if (err) throw err;
			    }
			);
		});
		res.render('finishCreateExercise.ejs');
	});

	app.get('/scenarioRedirect', function(req, res) {
		res.render('createScenario.ejs');
	});

	app.get('/homeRedirect', function(req, res) {
		res.redirect('/admin');
	});
};

// route middleware to make sure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	// if not logged in, redirect to homepage
	res.redirect('/');
}
