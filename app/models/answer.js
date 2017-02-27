var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var answerSchema = new Schema({
	roomNumber: String,
	sessionID: Number,
	exerciseID: Number,
	scenarioAnswers: []
});

var Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;
