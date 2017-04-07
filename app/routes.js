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
	var RoleSurvey = require('./models/RoleSurvey');
	var events = require('events');
	var eventEmitter = new events.EventEmitter();
	var rooms = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'K', 'L', 'M', 'N'];
	var MAX_PEOPLE = 15; // can be changed

	// protects admin and student pages
	app.all('*', function(req, res, next) {
	  if (req.path === '/' || req.path === '/login' || req.path === '/adminlogin' || req.path === '/studentlogin')
	    next();
	  else
	    loggedIn(req, res, next);
	});

	app.get('/', function(req, res) {
		//res.sendFile(path.resolve(url + 'index.html'));
		res.render('main.ejs', {message: req.flash('loginMessage')});
	});

	app.get('/adminWait', function(req, res) {
		var sessionID = parseInt(req.query.sessionID);
		var currRound = parseInt(req.query.currRound);
		Session.findOneAndUpdate({activeSessionID: sessionID},
		{$inc: {currRound: 0}},
		{new: true}, function(err, model) {
			if (err) console.err(err);
			Exercise.find({'_id': model.exerciseID}).lean().exec(function(err1, results) {
				if (err1) console.err(err1);
				if (currRound == (results[0].numOfRounds+1)) {
					res.redirect('/finishSession?sessionID='+sessionID);
				}
				else {
					res.render('adminWait.ejs', {sessionID: sessionID, currRound: currRound});
				}
			});
		});
	});

	app.post('/adminWait', function(req, res) {
		var sessionID = parseInt(req.body.sessionID);
		var currRound = parseInt(req.body.currRound);
		Session.findOneAndUpdate({activeSessionID: sessionID},
		{$inc: {currRound: 0}},
		{new: true}, function(err, model) {
			if (err) console.err(err);
			Exercise.find({'_id': model.exerciseID}).lean().exec(function(err1, results) {
				if (err1) console.err(err1);
				if (currRound == (results[0].numOfRounds+1)) {
					res.redirect('/finishSession?sessionID='+sessionID);
				}
				else {
					res.render('adminWait.ejs', {sessionID: sessionID, currRound: currRound});
				}
			});

		});
	});

	app.post('/submitResults', function(req, res) {
		var currRound = parseInt(req.body.currRound);
 		var exerciseID = parseInt(req.body.exerciseID);
		var sessionID = parseInt(req.body.sessionID);
		var disruptionSelection = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
		disruptionSelection[0] = req.body.A;
		disruptionSelection[1] = req.body.B;
		disruptionSelection[2] = req.body.C;
		disruptionSelection[3] = req.body.D;
		disruptionSelection[4] = req.body.E;
		disruptionSelection[5] = req.body.F;
		disruptionSelection[6] = req.body.G;
		disruptionSelection[7] = req.body.J;
		disruptionSelection[8] = req.body.K;
		disruptionSelection[9] = req.body.L;
		disruptionSelection[10] = req.body.M;
		disruptionSelection[11] = req.body.N;
		for (var ii = 0; ii < rooms.length; ii++) {
			if (disruptionSelection[ii] != null && disruptionSelection[ii] != -1) {
				// MAX of 15 people per room. Can change.
				for (var i = 1; i <= MAX_PEOPLE; i++) {
					Session.findOneAndUpdate({roomNumber: String(rooms[ii]), activeSessionID: sessionID, 'students.id' : i},
						{$set: {'students.$.nextScenario': disruptionSelection[ii]}},
						function(err, model) {
							if (err) throw err;
						}
					);
				}
				Session.findOneAndUpdate({roomNumber: String(rooms[ii]), activeSessionID: sessionID},
					{$inc: {'currRound': 1}},
					function(err, model) {
						if (err) throw err;
					}
				);
			}
			else { // at least one scenario is not selected
				res.redirect('/assignDisruption?sessionID='+sessionID, {currRound: currRound});
			}
		}
		currRound++;
		res.redirect('/adminWait?sessionID='+sessionID+"&currRound="+currRound);
	});

	app.get('/adminlogin', function(req, res) {
		res.render('login.ejs', {message: req.flash('loginMessage')});
	});

	app.get('/assignDisruption', function(req, res) {
		var sessionID = parseInt(req.query.sessionID);
		var currRound = req.body.currRound;
		Session.find({activeSessionID: sessionID}).lean().exec(function(err, results) {
				Exercise.find({'_id': results[0].exerciseID}).lean().exec(function(err1, exerciseRes) {
					if (err1) console.err(err1);

					var scenarios = [];
					if (exerciseRes.length == 0) {

						for (var ii = 0; ii < exerciseRes.scenarios.length; ii++) {
							if (exerciseRes.scenarios[ii].round == results[0].currRound) {
								scenarios.push(exerciseRes.scenarios[ii]);
							}
						}
					}
					else {
						for (var ii = 0; ii < exerciseRes[0].scenarios.length; ii++) {
							if (exerciseRes[0].scenarios[ii].round == results[0].currRound) {
								scenarios.push(exerciseRes[0].scenarios[ii]);
							}
						}
					}

					res.render('assignDisruption.ejs', {scenarioChoices: scenarios, allRooms: rooms, sessionID: sessionID, currRound: currRound});
				});
		});
	});

	app.post('/assignDisruption', function(req, res) {
		var currRound = req.body.currRound;
		var sessionID = parseInt(req.body.sessionID);
		Session.find({activeSessionID: sessionID}).lean().exec(function(err, results) {
				Exercise.find({'_id': results[0].exerciseID}).lean().exec(function(err1, exerciseRes) {
					if (err1) console.err(err1);

					var scenarios = [];
					if (exerciseRes.length == 0) {

						for (var ii = 0; ii < exerciseRes.scenarios.length; ii++) {
							if (exerciseRes.scenarios[ii].round == results[0].currRound) {
								scenarios.push(exerciseRes.scenarios[ii]);
							}
						}
					}

					else {
						for (var ii = 0; ii < exerciseRes[0].scenarios.length; ii++) {
							if (exerciseRes[0].scenarios[ii].round == results[0].currRound) {
								scenarios.push(exerciseRes[0].scenarios[ii]);
							}
						}
					}

					res.render('assignDisruption.ejs', {scenarioChoices: scenarios, allRooms: rooms, sessionID: sessionID, currRound: currRound});
				});
		});
	});


	app.get('/finishSession', function(req, res) {
		var sessionIDToRemove = req.query.sessionID;
		res.render('finishAdmin.ejs', {sessionID: sessionIDToRemove});
	});

	app.post('/finishSession', function(req, res) {
		var sessionIDToRemove = req.body.sessionID;
		Session.remove({'activeSessionID': sessionIDToRemove}, function(err, results) {
			if (err) console.err(err);
			console.log("Completed Session " + results.activeSessionID + " and removed from DB");
		});
		res.redirect('/admin');
	});

	app.get('/studentlogin', function(req, res) {
		res.render('studentLogin.ejs', {message: req.flash('loginMessage')});
	});

	app.post('/createSession', function(req, res) {
		var exerciseID = req.body.exerciseButtons;
		Exercise.findOne({'_id': exerciseID, 'enabled': true}).lean().exec( function(err, results) {
			if (err) console.err(err);
			res.render('createSession.ejs', {exerciseName: results.title, exerciseID: exerciseID});
		});
	});

	app.post('/sessionAdmin', function(req, res) {

		var foundSessionID = function foundSessionID(sessionID) {
			for (var i = 0; i < rooms.length; i++) {
				var students = [MAX_PEOPLE];
				for (var j = 0; j < MAX_PEOPLE; j++) {
					var studentObj = {"id" : j+1, "nextScenario" : 0, "hasLoggedIn": false};
					students[j] = studentObj;
				}

				var session = new Session ({
					roomNumber: rooms[i],
					activeSessionID: sessionID,
					exerciseID: req.body.exerciseID,
					currRound: 1,
					students: students
				});

				session.save(function(err) {
					if (err) { throw err; }
					console.log("Session saved succesfully");
				});
			}
			var currRound = 1;
			res.render('session.ejs', {exerciseID: req.body.exerciseID, sessionID: sessionID, currRound: currRound});
		}

		eventEmitter.on('foundSession', foundSessionID);

		var sessionID = Math.random() * (999999 - 100000) + 100000;
		sessionID = Math.round(sessionID);


		Session.find().lean().exec(function (err, results) {
			while (true) {
				var alreadyExists = false;
				sessionID++;
				for (var ii = 0; ii < results.length; ii++) {
					if (results[ii].activeSessionID == sessionID) {
						alreadyExists = true;
					}
				}
				if (!alreadyExists) {
					eventEmitter.emit('foundSession', sessionID);
					break;
				}
			}
		});

	});

	app.get('/deleteExercise', function(req, res) {

		Exercise.find({'enabled': true}).lean().exec( function(err, results) {
			if (err) console.err(err);
			res.render('deleteExercise.ejs', {exercises: results});
		});
	});

	app.post('/deleteExercise', function(req, res) {
		var exerciseID = req.body.exerciseChecks;
		if (exerciseID) {
			Exercise.findByIdAndUpdate(
						exerciseID,
						{$set: {'enabled': false}},
						{new: true},
							function(err, model) {
									if (err) throw err;
							}
			);
		}
		res.redirect('/admin');
	});

	app.get('/selectExercise', function(req, res) {
		Exercise.find({'enabled': true}).lean().exec( function(err, results) {
			if (err) console.err(err);
			res.render('selectExercise.ejs', {exercises: results});
		});
	});

	app.post('/display', function(req, res) {
		var role = req.body.roles;
		var room = req.body.room;
		var sid = req.body.studentID;
		var sess = req.body.sessionID;
		Session.findOne({'roomNumber': room, 'activeSessionID' : sess}).lean().exec( function(err, result) {
			//get the session
			var id = result.exerciseID; //pull out exercise ID for that session
			var currentRound = result.currRound;
			var next;
			var students = result.students;
			for (var i = 0; i < students.length; i++) {
				if (students[i].id == sid) {
					next = students[i].nextScenario;
					break;
				}
			}

			Exercise.findOne({'_id': id}).lean().exec( function(err, exercise) {
				if (err) throw err;
				//find session ID;
				if (currentRound > exercise.numOfRounds + 1) {
					// render finish page
					console.log("finished exercise");
					res.render('finish.ejs');
					return;
				} else {
					// check if can proceed
					if (next == null && currentRound == exercise.numOfRounds + 1) {
						res.render('finish.ejs');
						return;
					}
					if (next == null) {
						res.render('survey2.ejs', {role: role, room: room, message: 'Please wait until admin chooses next scenario', url: "", sessionID: sess, studentID: sid});
						return;
					}

					if (next == 0) {
						res.render('survey2.ejs', {role: role, room: room, message: 'Please wait until admin chooses the first scenario', url: "", sessionID: sess, studentID: sid});
						return;
					}

					//set nextScenario of studentID to NULL
					Session.findOneAndUpdate(
						{"roomNumber": room, "activeSessionID" : sess, "students.id": parseInt(sid)},
						{$set: {"students.$.nextScenario": null}},
						{new: true},
						function(err, model) {
							if (err) throw err;
							console.log("Set nextScenario of studentID to null successfully");
						}
					);

					if (currentRound == 2) {
						for (var i = 0; i < exercise.scenarios.length; i++) {
		 					if (exercise.scenarios[i].round == 1){
		 						var results = exercise.scenarios[i];
								if (results.videoURL == "") {
									res.render('scenario.ejs', {text: results.text, role: role, room: room, sessionID: sess, studentID: sid, next: next});
			 						return;
								} else {
									var id = results.videoURL.split("youtu.be/");
									res.render('video.ejs', {id: id[1], role: role, room: room, sessionID: sess, studentID: sid, text: results.text, next: next});
								}
		 					}
	 					}
					}
					else if (currentRound > 2) {
						for (var i = 0; i < exercise.scenarios.length; i++) {
		 					if (exercise.scenarios[i].round == currentRound - 1 && exercise.scenarios[i].id == next){
		 						var results = exercise.scenarios[i];
								if (results.videoURL == "") {
									res.render('scenario.ejs', {text: results.text, role: role, room: room, sessionID: sess, studentID: sid, next: next});
			 						return;
								} else {
									var id = results.videoURL.split("youtu.be/");
									res.render('video.ejs', {id: id[1], role: role, room: room, sessionID: sess, studentID: sid, text: results.text, next: next});
									return;
								}
		 					}
	 					}
					}
					console.log("line 347 in /display error: possibly undefined var results");
				 }
			});
		});
	});

	app.post('/displaySurvey', function(req, res) {
		var sess = req.body.sessionID;
		var sid = req.body.studentID;
		var room = req.body.room;
		Session.findOne({'roomNumber': room, 'activeSessionID' : sess}).lean().exec( function(err, result) {
			if (err) throw err;
			var currentRound = result.currRound;
			var exerciseID = result.exerciseID;
			var next = req.body.next;
			console.log("NEXT: " + next);
			Exercise.findOne({'_id': exerciseID}).lean().exec( function(err1, exercise) {
				if (err1) throw err1;
				for (var i = 0; i < exercise.scenarios.length; i++) {
					if (exercise.scenarios[i].round == currentRound - 1 && exercise.scenarios[i].id == next){
						var results = exercise.scenarios[i];
						console.log(results);
						if (exercise.hasIndividual && exercise.hasTeam) {
							for (var i = 0; i < results.roleSurveys.length; i++) {
								if (req.body.role === results.roleSurveys[i].roleName) {
									res.render('survey.ejs', {individual: results.roleSurveys[i].surveyURL, team: results.teamSurvey, role: req.body.role, answerer: results.roleSurveys[0].roleName, room: req.body.room, sessionID: sess, studentID: sid});
									return;
								}
							}
						} else if (exercise.hasIndividual) {
							for (var i = 0; i < results.roleSurveys.length; i++) {
								if (req.body.role === results.roleSurveys[i].roleName) {
									res.render('survey2.ejs', {url: results.roleSurveys[i].surveyURL, role: req.body.role, room: req.body.room, message: "", sessionID: sess, studentID: sid});
									return;
								}
							}
						} else {
							res.render('survey2.ejs', {url: results.teamSurvey, role: req.body.role, room: req.body.room, message: "", sessionID: sess, studentID: sid});
							return;
						}
					}
				}
				// if (req.body.role === 'ceo') {
				// 	res.render('survey.ejs', {url: exercise.ceoSurvey, role: req.body.role, room: req.body.room, sessionID: sess, studentID: sid, team: exercise.teamMemberSurvey});
				// } else if (req.body.role === 'team') {
				// 	res.render('survey.ejs', {url: exercise.teamMemberSurvey, role: req.body.role, room: req.body.room, sessionID: sess, studentID: sid, team: exercise.teamMemberSurvey});
				// } else {
				// 	res.render('survey.ejs', {url: exercise.observerSurvey, role: req.body.role, room: req.body.room, sessionID: sess, studentID: sid, team: exercise.observerSurvey});
				// }
			});
		});
	});

	app.post('/team', function(req, res) {
		var sess = req.body.sessionID;
		var sid = req.body.studentID;
		var surveyURL = req.body.survey;
		res.render('survey2.ejs', {url: surveyURL, role: req.body.role, room: req.body.room, message: "", sessionID: sess, studentID: sid});
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

	// app.post('/startScenario', function(req, res) {
	// 	if (currentExercise.scenarios[sCount].videoURL == null || currentExercise.scenarios[sCount].videoURL == "") {
	// 		res.render('text.ejs', {scenario: currentExercise.scenarios[sCount], answerer: currentExercise.answerer,
	// 								role: req.body.role, description: req.body.description});
	// 	} else {
	// 		res.render('video.ejs', {scenario: currentExercise.scenarios[sCount], answerer: currentExercise.answerer,
	// 								role: req.body.role, description: req.body.description});
	// 	}
	// });

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
		res.redirect('/logout');
	});

	// process the admin login form
  	app.post('/login', passport.authenticate('local', {
		successRedirect: '/admin',
		failureRedirect: '/adminlogin',
		failureFlash: true
	}));

	// process the student login form
	app.post('/studentlogin', function(req, res, next) {
		passport.authenticate('local-student', function(err, user, info) {
			if (err) { return next(err); }
			if (!user) { return res.redirect('/studentlogin'); }
			req.logIn(user, function(err) {
				if (err) { return next(err); }
				var sessionID = req.body.activeSessionID;
				var roomNum = req.body.roomNumber.toUpperCase();
				var studentID = 1;
				Session.findOne({'activeSessionID' : sessionID, 'roomNumber' : roomNum}, function(err, result) {
					if (err) throw err;
					var id = result.exerciseID;
					Exercise.findOne({"_id": id}, function(err, result) {
						if (err) throw err;
						var roles = result.roles;
						console.log(roles);
						Session.find({roomNumber: roomNum, activeSessionID: sessionID, 'students.hasLoggedIn': false},
							{'students.$': 1, _id: 0},
								function(err, model) {
									studentID =  model[0].students[0].id;
									Session.findOneAndUpdate(
										{roomNumber: roomNum, activeSessionID: sessionID, 'students.id': studentID},
										{$set: {'students.$.hasLoggedIn' : true}},
											function(err, results) {
												if (err) return err;
												return res.render('roles.ejs', {roomNumber: user.roomNumber.toUpperCase(), studentID: studentID, sessionID: sessionID, roles: roles});
											}
									);
								}
						);
					});
				});
			});
		})(req, res, next);
	});

	// admin page. Must be logged in to to visit using function isLoggedIn as middleware
	app.get('/admin', function(req, res) {
		res.render('admin.ejs', {user: req.user})
	});

	app.get('/session', function(req, res) {
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
		Session.findOneAndRemove({'activeSessionID': sessionIDToRemove}, function(err, results) {
			if (err) console.err(err);
			console.log("Completed Session successfully and removed from DB");
		});
		res.redirect('/admin');
	});

	app.post('/createRoles', function(req, res) {
		res.render('roles.ejs', {name: req.body.exerciseName, roles: req.body.roles});
	});

	app.post('/createScenarios', function(req, res) {

		var hasIndSurv = (req.body.hasIndividualSurvey == "true");
		var hasTeamSurv = (req.body.hasTeamSurvey == "true");

		var exercise = new Exercise({
			enabled: true,
			title: req.body.exerciseName,
			numOfRounds: req.body.numOfRounds,
			numOfRoles: req.body.numRoles,
			teamAnswerer: null,
			scenarios: [],
			roles: [],
			hasIndividual: hasIndSurv,
			hasTeam: hasTeamSurv
		});
		exercise.save(function(err) {
			if (err) throw err;
			console.log('Exercise saved succesfully');
		});
		//res.render('createScenario.ejs');
		res.render('specifyRoles.ejs', {numRoles: req.body.numRoles, hasTeam: hasTeamSurv, hasIndividual: hasIndSurv});
	});

	app.post('/displayScenarios', function(req, res) {

		Exercise.nextCount(function(err, count) {

			var exerciseID = count - 1;

			if (req.body.hasTeam == "true") {
				Exercise.findOneAndUpdate({'_id': exerciseID},
						{$set: {roles: req.body.roles, teamAnswerer: req.body.roles[0]}},
						{safe: true, upsert: true},
							function(err, model) {
									if (err) throw err;
				});
			}

			else {
				Exercise.findOneAndUpdate({'_id': exerciseID},
						{$set: {roles: req.body.roles}},
						{safe: true, upsert: true},
							function(err, model) {
									if (err) throw err;
				});
			}
		});

		res.redirect('/displayScenarios?err=false');
	})

	app.get('/displayScenarios', function(req, res) {

		Exercise.nextCount(function(err, count) {
			var exerciseID = count - 1;
			var isErr = (req.query.err == "true");
			Exercise.findOne({'_id': exerciseID}).lean().exec(function(err, result) {
				res.render('displayScenarios.ejs', {scenarios: result.scenarios, err: isErr});
			})
		})
	});

	app.post('/getScenario', upload.single('myVideo'), function(req, res) {
		//videoPath = videoPath + req.file.filename;

		if (req.body.myVideo == null) {
			Exercise.nextCount(function(err, count) {
				var exerciseID = count - 1;
				var sCount = 0;
				// find length of scenarios array from current exercise
				Exercise.findOne({'_id': exerciseID}).lean().exec( function(err, result) {
					sCount = result.scenarios.length + 1;
					var teamSurveyURL = null;
					if (result.hasTeam) {
						teamSurveyURL = req.body.teamSurveyLink;
					}


					var roleSurveyLinks = [];
					if (result.hasIndividual) {
						for (var ii = 0; ii < result.numOfRoles; ii++) {
							roleSurveyLinks.push(new RoleSurvey({
								roleName: result.roles[ii],
								surveyURL: req.body.individualSurveyLinks[ii]
							}))
						}
					}


					var scenario = new Scenario({
						name: req.body.name,
						id: sCount,
						round: req.body.round,
						videoURL: null,
						text: req.body.text,
						teamSurvey: teamSurveyURL,
						roleSurveys: roleSurveyLinks
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
		} else {
			Exercise.nextCount(function(err, count) {
				var exerciseID = count - 1;
				var sCount = 0;
				// find length of scenarios array from current exercise
				Exercise.findOne({'_id': exerciseID}).lean().exec( function(err, result) {
					sCount = result.scenarios.length + 1;
					var teamSurveyURL = null;
					if (result.hasTeam) {
						teamSurveyURL = req.body.teamSurveyLink;
					}

					var roleSurveyLinks = [];
					if (result.hasIndividual) {
						for (var ii = 0; ii < result.numOfRoles; ii++) {
							roleSurveyLinks.push(new RoleSurvey({
								roleName: result.roles[ii],
								surveyURL: req.body.individualSurveyLinks[ii]
							}))
						}
					}

					var scenario = new Scenario({
						name: req.body.name,
						id: sCount,
						round: req.body.round,
						videoURL: req.body.myVideo,
						text: req.body.text,
						teamSurvey: teamSurveyURL,
						roleSurveys: roleSurveyLinks
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
		}
		res.redirect('/displayScenarios?err=false');
	});

	// app.post('/addSurvey', function(req, res) {
	// 	Exercise.nextCount(function(err, count) {
	// 		var exerciseID = count - 1;
	//
	// 		// find length of scenarios array from current exercise
	// 		Exercise.findOne({'_id': exerciseID}).lean().exec( function(err, result) {
	// 			var exCount = result.scenarios.length + 1; // set this as scenario id
	// 			console.log("exercise count: " + exCount);
	// 			var scenario = new Scenario({
	// 				_id: exCount,
	// 				videoURL: req.body.videoURL,
	// 				text: req.body.text,
	// 				question: req.body.question,
	// 				survey: req.body.surveys
	// 			});
	//
	// 			// find and update exercise with current scenario
	// 			Exercise.findByIdAndUpdate(
	// 		    exerciseID,
	// 		    {$push: {scenarios: scenario}},
	// 		    {safe: true, upsert: true},
	// 			    function(err, model) {
	// 			        if (err) throw err;
	// 			    }
	// 			);
	// 		});
	// 	});
	// 	res.render('finishCreateExercise.ejs');
	// });

	app.get('/scenarioRedirect', function(req, res) {

		Exercise.nextCount(function (err, count) {

			var exerciseID = count-1;
			Exercise.findOne({'_id': exerciseID}).lean().exec(function(err, results) {

				res.render('createScenario.ejs', {roles: results.roles, hasTeam: results.hasTeam, hasIndividual: results.hasIndividual});

			});
		});

	});

	app.get('/homeRedir', function(req, res) {

		Exercise.nextCount(function(err, count) {

			var exerciseID = count-1;
			Exercise.findOne({'_id': exerciseID}).lean().exec(function(err, results) {

				var numRounds = results.numOfRounds;
				var scenarioExists = [];
				for (var ii = 0; ii < numRounds; ii++) {
					scenarioExists.push(false);
				}

				for (var zz = 0; zz < results.scenarios.length; zz++) {
					var index = results.scenarios[zz].round - 1;
					scenarioExists[index] = true;
				}

				var allRoundsSet = true;
				for (var qq = 0; qq < numRounds; qq++) {
					if (scenarioExists[qq] == false) {
						allRoundsSet = false;
						break;
					}
				}

				if (allRoundsSet) {
					res.redirect('/admin');
				}
				else {
					res.redirect('/displayScenarios?err=true');
				}

			});

		});

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
function ensureAuthenticated(req, res, next) {
	console.log(req.isAuthenticated());
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/');
    }
}
