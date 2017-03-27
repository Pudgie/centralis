var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var sessionIds = ['0','1','2','3','4','5','6'];  //created by admin, hardcode for now

var studentSchema = new Schema({
  sessionIds: sessionIds
});


// checking if sessionId exist
studentSchema.methods.validPassword = function(sessionId) {
    //brute force because there won't be that many sessions anyways
    for(var i = 0 ; i < sessionIds.length; i++){
    	if(sessionIds[i]===sessionId) return true; //capacity of a session
    }
    return false;
};

var User = mongoose.model('Student', userSchema);
module.exports = Student;



