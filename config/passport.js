var LocalStrategy = require('passport-local').Strategy;
var Admin = require('../app/models/admin');
var Session = require('../app/models/session');

module.exports = function(passport) {
  // ======================
  // passport session setup
  // ======================

  // passport.serializeUser(function(user, done) {
  //   if (isAdmin(user)) {
  //     console.log("is admin");
  //     admin = true;
  //     done(null, user.id);
  //   } else {
  //     console.log("not admin");
  //     admin = false;
  //     done(null, user.id);
  //   }
  // });
  // //deserialize the user
  // passport.deserializeUser(function(id, done) {
  //   if (admin) {
  //     Admin.findById(id, function(err, user) {
  //       done(err, user);
  //     });
  //   } else {
  //     Session.findById(id, function(err, user) {
  //       done(err, user);
  //     });
  //   }
  // });

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    if (isAdmin(id)) {
      console.log("is admin")
      Admin.findById(id, function(err, user) {
        done(err, user);
      });
    } else {
      console.log("not admin")
      Session.findById(id, function(err, user) {
        done(err, user);
      });
    }
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


  passport.use('local-student', new LocalStrategy({
    usernameField: 'roomNumber',
    passwordField: 'activeSessionID',
    passReqToCallback: true // allows us to pass the entire request to the callback
  },
  function(req, roomNumber, activeSessionID, done) { // callback with email and password
    // find a user with same email as the forms email
    Session.findOne({'roomNumber': roomNumber.toUpperCase(), 'activeSessionID' : activeSessionID}, function(err, user) {
      if (err)
        return done(err);
      // if no user is found, return a message
      if (!user)
        return done(null, false, req.flash('loginMessage', 'No room found.'));
      // if the user is found but the password is wrong
      if (!user.validPassword(activeSessionID))
        return done(null, false, req.flash('loginMessage', 'Active Session ID not found'));
      // if everything went well, return user
      return done(null, user);
    });
  }));


  function isAdmin(id) {
    return id == "5896c4098031945115019d74";
  }
};
