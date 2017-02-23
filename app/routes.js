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
				res.render('studentRoles.ejs', {exName: exercise.name, exId: id, roles: exercise.roles});
			});
		});
	});

	app.post('/wait', function (req, res) {
		var taken = currentSession.activeRoles;
		if (taken.includes(req.body.selectButtons)) {
			res.redirect('/selectRoles');
		} else {
			Session.findOneAndUpdate(
				{roomNumber: currentRoom},
				{$push: {activeRoles: req.body.selectButtons}},
				{safe: true, upsert: true},
					function(err, model) {
							if (err) throw err;
					}
			);
			console.log(currentSession.activeRoles);
			res.render('wait.ejs', {players: currentSession.activeRoles});
		}
		// if (currentExercise.scenarios[0].text == null) {
		// 	res.render('video.ejs', {file: currentExercise.scenarios[0].videoURL});
		// } else {
		// 	res.render('text.ejs', {question: currentExercise.scenarios[0].text});
		// }
	});
	// show questions to students
	app.get('/response', function(req, res) {
		// res.render('response.ejs', {question: currentExercise.scenarios[0].text});
		res.render('response.ejs', {question: currentExercise.scenarios[0].question, survey: currentExercise.scenarios[0].survey});
	});
	// collect student responses
	app.post('/collect', function(req, res) {

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
		videoPath = videoPath + req.file.filename;
		var scenario = new Scenario({
			videoURL: req.file.filename,
			text: req.body.text,
			question: req.body.question,
			survey: null
		});
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
		//res.render('video.ejs');
	// VIDEO UPLOAD INTO DATABASE===============
	// Grid.mongo = mongoose.mongo;
	// conn.once('open', function() {
	// 	console.log('connection open');
	// 	// uploading video
	// 	app.post('/upload', upload.single('myVideo'), function(req, res) {
	// 		//res.send(req.file.filename);
	// 		videoPath = videoPath + req.file.filename;
	// 		console.log(videoPath);
	// 		// create write stream
	// 		var gfs = Grid(conn.db);
	// 		var writeStream = gfs.createWriteStream({
	// 			filename: 'test1.mp4'
	// 		});
	// 		// create read stream with file path and pipe into database
	// 		fs.createReadStream(videoPath).pipe(writeStream);
	// 		writeStream.on('close', function(file) {
	// 			console.log(file.filename + ' written to DB');
	// 		});
	// 		res.render('test.ejs');
	// 	});
	//
	// 	// retrieving video
	// 	app.post('/getVideo', function(req, res) {
	// 		var gfs = Grid(conn.db);
	// 		// write content to this path
	// 		var writeStream = fs.createWriteStream(path.join(__dirname, '../videos/test4.mp4'));
	// 		//create read stream from mongodb
	// 		var readStream = gfs.createReadStream({
	// 			filename: 'test1.mp4'
	// 		});
	//
	// 		//pipe the read stream into the write stream
	// 		readStream.pipe(writeStream);
	// 		writeStream.on('close', function() {
	// 			console.log('File has been written to videos folder');
	// 		});
	//
	// 	})
	// });

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
