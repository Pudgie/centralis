var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var exerciseSchema = new Schema({
	roles: [String].
	id: Number,
	name: String,
	scenarios: [{type: Schema.ObjectId, ref: 'Scenario'}],
	answerer: String
});

var scenarioSchema = new Schema({
	videoURL: String,
	text: String,
	question: String,
	survey: {type: Schema.ObjectId, ref: 'Survey'}
});

var surveySchema = new Schema({
	surveyQuestions: [String]
});

var Exercise = mongoose.model('Exercise', exerciseSchema);
var Scenario = mongoose.model('Scenario', scenarioSchema);
var Survey = mongoose.model('Survey', surveySchema);

module.exports = Exercise;
module.exports = Scenario;
module.exports = Survey;
