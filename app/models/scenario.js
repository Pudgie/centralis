var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var autoIncrement = require('mongoose-auto-increment');

var scenarioSchema = new Schema({
	videoURL: String,
	text: String,
	question: String,
	survey: []
});

scenarioSchema.plugin(autoIncrement.plugin, {
	model: 'Scenario',
	startAt: 1,
  incrementBy: 1
});

var Scenario = mongoose.model('Scenario', scenarioSchema);

module.exports = Scenario;
