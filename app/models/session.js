var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var sessionSchema = new Schema({
  activeSessionID: Number,
  exerciseID: Number
});

var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;