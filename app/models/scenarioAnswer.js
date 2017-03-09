var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var scenarioAnswerSchema = new Schema({
	scenarioID: Number,
	text: String,
	surveyAnswers: []
});

var ScenarioAnswer = mongoose.model('ScenarioAnswer', scenarioAnswerSchema);

module.exports = ScenarioAnswer;