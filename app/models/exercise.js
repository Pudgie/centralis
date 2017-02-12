var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var Scenario = require('./scenario');

var exerciseSchema = new Schema({
	id: Number,
	name: String,
	roles: [String],
	scenarios: [{type: Schema.ObjectId, ref: 'Scenario'}],
	answerer: String
});

var Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;