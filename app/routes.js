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
	// var Answer = require('./models/answer');
	// var ScenarioAnswer = require('./models/scenarioAnswer');
	// var SurveyAnswer = require('./models/surveyAnswer');
	var currentSession = null;
	var currentExercise = null;
	var currentRoom = null;
	var currentSessionID = null;
	var hasStarted = false;
	var sCount = 0;

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
			if (err) console.err(err);
			res.render('createSession.ejs', {exName: results.name, exId: id});
		});
	});


	app.post('/sessionAdmin', function(req, res) {
		var rooms = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'K', 'L', 'M', 'N'];
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
			// create answer models to store data
			// var answer = new Answer({
			// 	roomNumber: rooms[i],
			// 	sessionID: sessionID,
			// 	exerciseID: req.body.exID,
			// 	scenarioAnswers: []
			// });
			// answer.save(function(err) {
			// 	if (err) { throw err; }
			// 	console.log("Answer saved succesfully");
			// });
		}
		res.render('session.ejs', {exId: req.body.exId, sesId: sessionID});
	});

	app.get('/deleteExercise', function(req, res) {
		Exercise.find().lean().exec( function(err, results) {
			if (err) console.err(err);
			res.render('deleteExercise.ejs', {exercises: results});
		});
	});

	app.post('/deleteExercise', function(req, res) {
		var exercisesToDelete = req.body.exerciseChecks;
		if (exercisesToDelete) {
			Exercise.findOneAndRemove({'_id': exercisesToDelete}, function(err, results) {
				if (err) console.err(err);
				console.log("Removed exercise successfully from DB");
			});
		}
		res.redirect('/admin');
	});

	app.get('/selectExercise', function(req, res) {
		Exercise.find().lean().exec( function(err, results) {
			if (err) console.err(err);
			res.render('selectExercise.ejs', {exercises: results});
		});
	});

	app.get('/selectRoles', function(req, res) {
		Session.findOne({'roomNumber': currentRoom, 'activeSessionID': currentSessionID}).lean().exec( function(err, result) {
			//get the session
			currentSession = result;
			var id = result.exerciseID; //pull out exercise ID for that session
			console.log("my current ID is: " + id);
			Exercise.findOne({'_id': id}).lean().exec( function(err, exercise) {
				//find session ID;
				currentExercise = exercise;
				res.render('studentRoles.ejs', {exName: exercise.name, exId: id, activeRoles: currentSession.activeRoles, 
												roles: exercise.roles, descriptions: currentExercise.descriptions});
			});
		});
	});

	app.post('/wait', function (req, res) {
		var taken = currentSession.activeRoles;
		var str = (req.body.role).split("//");
		if (taken.includes(str[0]) || str[0] == null) {
			res.redirect('/selectRoles');
		} else {
			Session.findOneAndUpdate(
				{roomNumber: currentRoom},
				{$push: {activeRoles: str[0]}},
				{safe: true, upsert: true},
					function(err, model) {
						if (err) throw err;
					}
			);
			console.log(currentSession.activeRoles);
			res.render('wait.ejs', {role: str[0], description: str[1]});
		}
	});

	app.post('/startScenario', function(req, res) {
		if (currentExercise.scenarios[sCount].videoURL == null || currentExercise.scenarios[sCount].videoURL == "") {
			res.render('text.ejs', {scenario: currentExercise.scenarios[sCount], answerer: currentExercise.answerer, 
									role: req.body.role, description: req.body.description});
		} else {
			res.render('video.ejs', {scenario: currentExercise.scenarios[sCount], answerer: currentExercise.answerer, 
									role: req.body.role, description: req.body.description});
		}
	});

	// // show questions to students
	// app.post('/response', function(req, res) {
	// 	// add group answer to database
	// 	if (req.body.answer != null && req.body.answer != "") {
	// 		var scenarioAnswer = new ScenarioAnswer({
	// 			scenarioID: sCount + 1,
	// 			text: req.body.answer,
	// 			surveyAnswers: []
	// 		});
	// 		Answer.findOneAndUpdate(
	// 			{'roomNumber': currentRoom, 'sessionID': currentSessionID},
	// 			{$addToSet: {scenarioAnswers: scenarioAnswer}},
	// 			{safe: true, upsert: true},
	// 				function(err, model) {
	// 					if (err) throw err;
	// 				}
	// 		);
	// 	}
	// 	res.render('response.ejs', {scenario: currentExercise.scenarios[sCount], role: req.body.role, description: req.body.description});
	// });

	// collect student survey responses
	// app.post('/collect', function(req, res) {
	// 	var currScenario = currentExercise.scenarios.length;
	// 	var surveyAnswer = new SurveyAnswer({
	// 		role: req.body.role,
	// 		answers: req.body.surveyAnswers
	// 	});
	// 	Answer.findOneAndUpdate(
	// 		{roomNumber: currentRoom, sessionID: currentSessionID, 'scenarioAnswers.scenarioID' : sCount + 1},
	// 		{$push: {'scenarioAnswers.$.surveyAnswers' : surveyAnswer}},
	// 		{safe: true, upsert: true},
	// 			function(err, model) {
	// 				if (err) throw err;
	// 				console.log("survey answer inserted successfully!")
	// 			}
	// 	);
	// 	sCount++;
	// 	if (sCount == currScenario) { // finished exercise
	// 		res.render('finish.ejs');
	// 	} else { // more scenarios
	// 		if (currentExercise.scenarios[sCount].videoURL == null || currentExercise.scenarios[sCount].videoURL == "") {
	// 			res.render('text.ejs', {scenario: currentExercise.scenarios[sCount], answerer: currentExercise.answerer, 
	// 								role: req.body.role, description: req.body.description});
	// 		} else {
	// 			res.render('video.ejs', {scenario: currentExercise.scenarios[sCount], answerer: currentExercise.answerer, 
	// 									role: req.body.role, description: req.body.description});
	// 		}
	// 	}
	// });

	app.post('/reset', function(req, res) {
		sCount = 0;
		res.redirect('/');
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

	// process the student login form 
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

	app.post('/finishSession', function(req, res) {
		var sessionIDToRemove = req.body.sessionID;
		console.log("SessionID: " + sessionIDToRemove);
		Session.remove({'activeSessionID': sessionIDToRemove}, function(err, results) {
			if (err) console.err(err);
			console.log("Completed Session " + results.activeSessionID + " and removed from DB");
		});
		res.redirect('/admin');
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
		Exercise.nextCount(function(err, count) {
			var exerciseID = count - 1;

			// find length of scenarios array from current exercise
			Exercise.findOne({'_id': exerciseID}).lean().exec( function(err, result) {
				var exCount = result.scenarios.length + 1; // set this as scenario id
				console.log("exercise count: " + exCount);
				var scenario = new Scenario({
					_id: exCount,
					videoURL: req.body.videoURL,
					text: req.body.text,
					question: req.body.question,
					survey: req.body.surveys
				});

				// find and update exercise with current scenario
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
