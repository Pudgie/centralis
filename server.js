var express = require("express");
var app = express();
var mongoose = require('mongoose');
// mlab login:centralis password:centaur1
mongoose.connect('mongodb://user:password@ds129459.mlab.com:29459/centralis');

// // Sample model
// var yang = new User({
//   name: 'Yang',
//   role: 'waterboy',
//   room: 445
// });
// yang.save(function(err) {
//   if (err) throw err;
//   console.log('User saved successfully!');
// });

// routes ========================================
require('./app/routes.js')(app);
