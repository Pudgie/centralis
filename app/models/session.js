var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var sessionSchema = new Schema({
  roomNumber: String,
  activeSessionID: String,
  exerciseID: Number,
  nextRound: Number
});


// generating a hash
sessionSchema.methods.generateHash = function(activeSessionID) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
sessionSchema.methods.validPassword = function(activeSessionID) {
    return activeSessionID === this.activeSessionID;
};



var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
