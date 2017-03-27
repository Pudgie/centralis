var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var surveyAnswerSchema = new Schema({
	role: String,
	answers: [String]
});

var SurveyAnswer = mongoose.model('SurveyAnswer', surveyAnswerSchema);

module.exports = SurveyAnswer;