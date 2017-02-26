// app/routes.js


module.exports = function(app, passport) {
	var mongoose = require('mongoose');
	var conn = mongoose.connection;
	var url = __dirname + '/../views/';
	var path = require('path');
	var fs = require('fs');
	var multer = require('multer');
	var upload = multer({ dest: 'public/' });
	var Grid = require('gridfs-stream');
	var videoPath = path.join(__dirname, '../public/');
	var Exercise = require('./models/exercise');
	var Scenario = require('./models/scenario');
	var Session = require('./models/session');
	var currentSession = null;
	var currentExercise = null;
	var currentRoom = null;
	var currentSessionID = null;
	var hasStarted = false;

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

	app.post('/createSession', function(req, res) {
		var id = req.body.exerciseButtons;
		Exercise.findOne({'_id': id}).lean().exec( function(err, results) {
			res.render('createSession.ejs', {exName: results.name, exId: id});
		});
	});

	app.post('/session', function(req, res) {
		var rooms = ['A', 'B', 'C', 'D'];
		var sessionID = Math.random() * (999999 - 100000) + 100000;
		sessionID = Math.round(sessionID);
		for (var i = 0; i < rooms.length; i++) {
			var session = new Session ({
				roomNumber: rooms[i],
				activeSessionID: sessionID,
				exerciseID: req.body.exId
			});
			session.save(function(err) {
				if (err) { throw err; }
				console.log("Session saved succesfully");
			});
		}
		res.render('session.ejs', {exId: req.body.exId, sesId: sessionID});
	});

	app.get('/selectExercise', function(req, res) {
		Exercise.find().lean().exec( function(err, results) {
			res.render('selectExercise.ejs', {exercises: results});
		});
	});

	// app.get('/selectRoles', function(req, res) {
	// 	// console.log("password: before req sent");
	// 	// var password = req.query.activeSessionID;
	// 	// console.log("password: " + password);
	// 	Session.find({}).lean().exec( function(err, results) {
	// 		//get the session
	// 		var id = results[0].exerciseID; //pull out exercise ID for that session
	// 		console.log("my current ID is: " + id);
	// 		Exercise.findOne({'_id': id}).lean().exec( function(err, exercise) {
	// 			//find session ID;
	// 			currentExercise = exercise;
	// 			res.render('studentRoles.ejs', {exName: exercise.name, exId: id, roles: exercise.roles});
	// 		});
	// 	});
	//
	// });

	app.get('/selectRoles', function(req, res) {
		Session.findOne({'roomNumber': currentRoom, 'activeSessionID': currentSessionID}).lean().exec( function(err, result) {
			//get the session
			currentSession = result;
			var id = result.exerciseID; //pull out exercise ID for that session
			console.log("my current ID is: " + id);
			Exercise.findOne({'_id': id}).lean().exec( function(err, exercise) {
				//find session ID;
				currentExercise = exercise;
				res.render('studentRoles.ejs', {exName: exercise.name, exId: id, roles: exercise.roles, descriptions: currentExercise.descriptions});
			});
		});
	});

	app.post('/wait', function (req, res) {
		var taken = currentSession.activeRoles;
		if (taken.includes(req.body.role) || req.body.role == null) {
			res.redirect('/selectRoles');
		} else {
			Session.findOneAndUpdate(
				{roomNumber: currentRoom},
				{$push: {activeRoles: req.body.role}},
				{safe: true, upsert: true},
					function(err, model) {
							if (err) throw err;
					}
			);
			console.log(currentSession.activeRoles);
			var str = (req.body.role).split("//");
			res.render('wait.ejs', {role: str[0], description: str[1]});
		}
	});

	app.get('/startScenario', function(req, res) {
		if (currentExercise.scenarios[0].videoURL == null) {
			res.render('text.ejs', {question: currentExercise.scenarios[0].text});
		} else {
			res.render('video.ejs', {file: currentExercise.scenarios[0].videoURL});
		}
	});
	// show questions to students
	app.get('/response', function(req, res) {
		// res.render('response.ejs', {question: currentExercise.scenarios[0].text});
		res.render('response.ejs', {question: currentExercise.scenarios[0].question, survey: currentExercise.scenarios[0].survey});
	});
	// collect student responses
	app.post('/collect', function(req, res) {

	});

	app.get('/startGame', function (req, res) {
	 hasStarted = true;
	});

	app.get('/createRoles', function(req, res) {
		res.render('roles.ejs');
	});



	// process the admin login form
  	app.post('/login', passport.authenticate('local', {
		successRedirect: '/admin',
		failureRedirect: '/adminLogin',
		failureFlash: true
	}));

	// process the student login form **CHANGE THIS**
  // 	app.post('/studentlogin', passport.authenticate('local-student', {
	// 	successRedirect: '/selectRoles',
	// 	failureRedirect: '/studentlogin',
	// 	failureFlash: true
	// }));

	app.post('/studentlogin', function(req, res, next) {
		passport.authenticate('local-student', function(err, user, info) {
			if (err) { return next(err); }
			if (!user) { return res.redirect('/studentlogin'); }
			req.logIn(user, function(err) {
				if (err) { return next(err); }
				currentRoom = user.roomNumber;
				currentSessionID = user.activeSessionID;
				return res.redirect('/selectRoles');
			});
		})(req, res, next);
	});

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

	app.post('/getScenario', upload.single('myVideo'), function(req, res) {
		//res.send(req.file.filename);
		//videoPath = videoPath + req.file.filename;
		if (req.body.text != null) {
			var scenario = new Scenario({
				videoURL: null,
				text: req.body.text,
				question: req.body.question,
				survey: null
			});
		} else {
			var scenario = new Scenario({
				videoURL: req.file.filename,
				text: req.body.text,
				question: req.body.question,
				survey: null
			});
		}
		console.log(req.body.survey);
		res.render('survey.ejs', {number: req.body.survey, scenario: scenario});
	});

	app.post('/addSurvey', function(req, res) {
		var range = "1";
		var scenario = new Scenario({
			videoURL: req.body.videoURL,
			text: null,
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

	// UPLOAD VIDEO LOCALLY===============
	// app.post('/upload', upload.single('myVideo'), function(req, res) {
	// 	//res.send(req.file.filename);
	// 	videoPath = videoPath + req.file.filename;
	// 	var scenario = new Scenario({
	// 		videoURL: req.file.filename,
	// 		text: null,
	// 		question: req.body.question,
	// 		survey: null
	// 	});
	// 	//res.download(videoPath, req.file.originalname);
	// 	res.render('survey.ejs', {number: req.body.survey, scenario: scenario});
	// });
};


// route middleware to make sure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	// if not logged in, redirect to homepage
	res.redirect('/');
}
