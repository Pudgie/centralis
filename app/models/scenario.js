var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var scenarioSchema = new Schema({
	_id: Number,
	videoURL: String,
	text: String,
	question: String,
	survey: []
});

var Scenario = mongoose.model('Scenario', scenarioSchema);

module.exports = Scenario;
