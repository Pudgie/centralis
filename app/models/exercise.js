var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var Scenario = require('./scenario');
var autoIncrement = require('mongoose-auto-increment');

// autoincrement implicitly adds _id
var exerciseSchema = new Schema({
	enabled: Boolean,
	title: String,
	numOfRounds: Number,
	numOfRoles: Number,
	teamAnswerer: String,
	scenarios: [],
	roles: [],
	hasIndividual: Boolean,
	hasTeam: Boolean
});

exerciseSchema.plugin(autoIncrement.plugin, {
	model: 'Exercise',
	startAt: 1,
    incrementBy: 1});

var Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;
