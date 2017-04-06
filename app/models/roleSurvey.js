var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var roleSurveySchema = new Schema({
	roleName: String,
	surveyURL: String
});

var roleSurvey = mongoose.model('roleSurvey', roleSurveySchema);

module.exports = roleSurvey;
