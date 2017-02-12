var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var surveySchema = new Schema({
	surveyQuestions: [String]
});

var Survey = mongoose.model('Survey', surveySchema);

module.exports = Survey;