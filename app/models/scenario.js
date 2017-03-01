var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var scenarioSchema = new Schema({
	_id: Number,
	round: Number,
	videoURL: String, // for implementing video later
	text: String,
	teamSurveyLink: String,
	studentSurveyLink: String,
	observerSurveyLink: String
});

var Scenario = mongoose.model('Scenario', scenarioSchema);

module.exports = Scenario;
