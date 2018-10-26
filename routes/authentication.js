var express = require('express');
var router = express.Router();
var db = require('./db');
var uuidv4 = require('uuid/v4');
var bcrypt = require('bcrypt');
const saltRounds = 10;

router.post('/login', function(req, res, next) {
  req.session.regenerate(function(err) {
    db.findUser(req.body.username, function(user) {
      if (user && bcrypt.compareSync(req.body.password, user.password)) {
        if(user.enabled === 'true') {
          var token = uuidv4();
          req.session.user = user;
          req.session.csrf_token = token;
          res.set('token', token);
          delete user.password;
          res.json(user);
        } else {
          console.log(user.enabled);
          res.status(403).send('Disabled');
        }
      } else {
        res.status(403).send('Invalid');
      }
    });
  });
});

router.post( '/logout', function( req, res, next ) {
 req.session.regenerate( function(err) {
    res.json( { msg : 'sucess' } );
  } );
});

router.get('/user', function(req, res, next) {
  var user = req.session.user;
  if (user) {
    res.set('token', req.session.csrf_token);
    res.json(user);
  } else {
    res.status(403).send('Forbidden');
  }
});

module.exports = router;
