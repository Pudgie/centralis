// app/routes.js
module.exports = function(app, passport) {
	var url = __dirname + '/../views/';
	var path = require('path');

	app.get('/', function(req, res) {
		//res.sendFile(path.resolve(url + 'index.html'));
		res.render('login.ejs', {message: req.flash('loginMessage')});
	});

	// process the login form
  app.post('/login', passport.authenticate('local', {
		successRedirect: '/admin',
		failureRedirect: '/',
		failureFlash: true
	}));

	// admin page. Must be logged in to to visit using function isLoggedIn as middleware
	app.get('/admin', isLoggedIn, function(req, res) {
		// res.render('admin.ejs', {
		// 	user : req.user // get the user our of session and pass to template
		// });
		//res.sendFile(path.resolve(url + 'index.html'));
		res.render('admin.ejs', {user: req.user})
	});

	// logout
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	// app.listen(3000, function(){
	// 	console.log('Server running at Port 3000');
	// });
};

// route middleware to make sure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	// if not logged in, redirect to homepage
	res.redirect('/');
}
