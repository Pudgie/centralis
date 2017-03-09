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
		Exercise.findOne({'_id': id, 'enabled': true}).lean().exec( function(err, results) {
			if (err) console.err(err);
			res.render('createSession.ejs', {exName: results.name, exId: id});
		});
	});

	app.get('/deleteExercise', function(req, res) {
		Exercise.find({'enabled': true}).lean().exec( function(err, results) {
			if (err) console.err(err);
			res.render('deleteExercise.ejs', {exercises: results});
		});
	});

	app.post('/deleteExercise', function(req, res) {
		var exercisesToDelete = req.body.exerciseChecks;
		if (exercisesToDelete) {
			for (var ii = 0; ii < exercisesToDelete.length; ii++) {
				Exercise.findOneAndRemove({'_id': exercisesToDelete[ii]}, function(err, results) {
					if (err) console.err(err);
					console.log("Removed exercise " + results._id + " from DB");
				});
			}
		}
		res.redirect('/admin');
	});

	app.post('/sessionAdmin', function(req, res) {
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
		res.render('session.ejs', {exId: session.exerciseID, sesId: session.activeSessionID});
	});

	app.get('/selectExercise', function(req, res) {
		Exercise.find({'enabled': true}).lean().exec( function(err, results) {
			if (err) console.err(err);
			res.render('selectExercise.ejs', {exercises: results});
		});
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
  	app.post('/studentlogin', passport.authenticate('local-student', {
		successRedirect: '/createRoles',
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

	app.post('/finishSession', function(req, res) {
		var sessionIDToRemove = req.body.sessionID;
		console.log("SessionID: " + sessionIDToRemove);
		Session.findOneAndRemove({'activeSessionID': sessionIDToRemove}, function(err, results) {
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
			enabled: true,
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
