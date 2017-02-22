// app/routes.js


module.exports = function(app, passport) {
	var url = __dirname + '/../views/';
	var path = require('path');
	var Exercise = require('./models/exercise');
	var Scenario = require('./models/scenario');
	var Session = require('./models/session');

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


	app.post('/createSession', function(req, res) {
		var id = req.body.exerciseButtons;
		Exercise.findOne({'_id': id}).lean().exec( function(err, results) {
			res.render('createSession.ejs', {exName: results.name, exId: id});
		});
	});
	
	app.post('/session', function(req, res) {
		var sessionID = Math.random() * (999999 - 100000) + 100000;
		sessionID = Math.round(sessionID);
		var session = new Session ({
			activeSessionID: sessionID,
			exerciseID: req.body.exId
		});
		session.save(function(err) {
			if (err) { throw err; }
			console.log("Session saved succesfully");

		});
		res.render('session.ejs', {exId: req.body.exId, sesId: sessionID});
	});

	app.get('/selectExercise', function(req, res) {
		Exercise.find().lean().exec( function(err, results) {
			res.render('selectExercise.ejs', {exercises: results});
		});
	});


	app.get('/selectRoles', function(req, res) {
		// console.log("password: before req sent");
		// var password = req.query.activeSessionID;
		// console.log("password: " + password);
		Session.find({}).lean().exec( function(err, results) {
			//get the session 
			var id = results[0].exerciseID; //pull out exercise ID for that session
			console.log("my current ID is: " + id);
			Exercise.findOne({'_id': id}).lean().exec( function(err, results) {
				//find session ID;
				res.render('studentRoles.ejs', {exName: results.name, exId: id, roles: results.roles});
			});
		});
		
	});



	// process the admin login form
  	app.post('/login', passport.authenticate('local', {

		successRedirect: '/admin',
		failureRedirect: '/adminLogin',
		failureFlash: true
	}));

	// process the student login form **DONE**
  	app.post('/studentlogin', passport.authenticate('local-student', {

		successRedirect: '/selectRoles',
		failureRedirect: '/studentlogin',
		failureFlash: true
	}));

	// admin page. Must be logged in to to visit using function isLoggedIn as middleware
	app.get('/admin', isLoggedIn, function(req, res) {
		res.render('admin.ejs', {user: req.user})
	});


	app.get('/session', isLoggedIn, function(req, res) {
		res.render('student.ejs', {user: req.user})
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


	app.post('/selectRoles', function(req, res) {
		res.render('roles.ejs', {name: req.body.exerciseName, roles: req.body.roles});
	});

	app.post('/createScenarios', function(req, res) {
		var titles = req.body.roles;
		var answerer;
		console.log(req.body.numRoles);
		if (req.body.numRoles == 1) {
			answerer = titles;
		} else {
			answerer = titles[0];
		}
		var exercise = new Exercise({
			roles: titles,
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
		console.log(scenario.text);
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
	});
};

// route middleware to make sure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	// if not logged in, redirect to homepage
	res.redirect('/');
}
