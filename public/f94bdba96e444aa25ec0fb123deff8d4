var express = require("express");
var app = express();
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var passport = require('passport');
var flash = require('connect-flash');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var User = require('./app/models/admin');

// mlab login:centralis password:centaur1
var connection = mongoose.connect('mongodb://user:password@ds129459.mlab.com:29459/centralis');

autoIncrement.initialize(connection);

require('./config/passport.js')(passport);

// set up express application
app.use(express.static('public'));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({secret: 'howwouldyouhandlethis', resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// sample user
// var bob = new User({
//   email: 'bob@gmail.com',
//   password: 'imcool'
// });
// bob.save(function(err) {
//   if (err) throw err;
//   console.log('User saved succesfully');
// });

// routes ========================================
require('./app/routes.js')(app, passport);

// start application
app.listen(3000);
console.log('App running on port 3000');
