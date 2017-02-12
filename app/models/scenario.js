var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var Scenario = require('./survey');

var scenarioSchema = new Schema({
	videoURL: String,
	text: String,
	question: String,
	survey: {type: Schema.ObjectId, ref: 'Survey'}
});

var Scenario = mongoose.model('Scenario', scenarioSchema);

module.exports = Scenario;