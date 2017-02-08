var LocalStrategy = require('passport-local').Strategy;
var Admin = require('../app/models/admin');

module.exports = function(passport) {
  // ======================
  // passport session setup
  // ======================

  //serialize the user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  //deserialize the user
  passport.deserializeUser(function(id, done) {
    Admin.findById(id, function(err, user) {
      done(err, user);
    });
  });

  //=======================
  // login
  //=======================

  // parameters
  passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass the entire request to the callback
  },
  function(req, email, password, done) { // callback with email and password
    // find a user with same email as the forms email
    Admin.findOne({'email': email}, function(err, user) {
      if (err)
        return done(err);
      // if no user is found, return a message
      if (!user)
        return done(null, false, req.flash('loginMessage', 'No user found.'));
      // if the user is found but the password is wrong
      if (!user.validPassword(password))
        return done(null, false, req.flash('loginMessage', 'Wrong password.'));
      // if everything went well, return user
      return done(null, user);
    });
  }));

};
