var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var Scenario = require('./scenario');
var autoIncrement = require('mongoose-auto-increment');

var exerciseSchema = new Schema({
	name: String,
	roles: [String],
	scenarios: [{type: Schema.ObjectId, ref: 'Scenario'}],
	answerer: String
});

exerciseSchema.plugin(autoIncrement.plugin, {
	model: 'Exercise',
	startAt: 1,
    incrementBy: 1});

var Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;