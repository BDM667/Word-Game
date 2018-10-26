const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
var bcrypt = require('bcrypt');
const saltRounds = 10;

// Connection URL
const url = '<Your mongodb database URI/URL>';

//Database Name
const dbName = 'wordgame';
var db;

// Connect to database and initialization
MongoClient.connect(url, function(err, client) {
  assert.equal(null, err);

  db = client.db(dbName);
  db.collection('users').count(function(err, count) {
    if( count == 0) {
      insertDefaultUsers();
    }
    else {
      // Users already exist. No need to create deafault users.
    }
  });
});

var defaults = {
  'font': {
    'name': 'Marmelad',
    'category': 'sans-serif',
    'family': 'sans-serif',
    'rule': "'Marmelad', sans-serif",
    'url': 'https://fonts.googleapis.com/css?family=Marmelad'
  },
  'level': {
    'name': 'medium',
    'minLength': 4,
    'maxLength': 10,
    'rounds': 7
  },
  'colors': {
    'guessBackground': '#FFFF00',
    'textBackground': '#0000FF',
    'wordBackground': '#FF0000'
  }
};

// Insert default users into users collection
const insertDefaultUsers = function() {
  db.collection('users').insertMany([{
      email: 'admin@admin.com',
      password: bcrypt.hashSync("password1", saltRounds),
      name : {
        'first' : 'Admin',
        'last' : 'Admin',
      },
      'defaults': defaults,
      'role' : 'ADMIN',
      'enabled' : 'true'
    },
    {
      email: 'user1@user.com',
      password: bcrypt.hashSync("password2", saltRounds),
      name : {
        'first' : 'Martin',
        'last' : 'McFly',
      },
      'defaults': defaults,
      'role' : 'USER',
      'enabled' : 'true'
    },
    {
      email: 'user2@user.com',
      password: bcrypt.hashSync("password3", saltRounds),
      name : {
        'first' : 'Frodo',
        'last' : 'Baggins',
      },
      'defaults': defaults,
      'role' : 'USER',
      'enabled' : 'true'
    },
    {
      email: 'user3@user.com',
      password: bcrypt.hashSync("password4", saltRounds),
      name : {
        'first' : 'Harry',
        'last' : 'Potter',
      },
      'defaults': defaults,
      'role' : 'USER',
      'enabled' : 'false'
    }
  ], function(err, result) {
    assert.equal(err, null);
    assert.equal(4, result.result.n);
    assert.equal(4, result.ops.length);
  });
};

const findUser = function(userEmail, callback) {
  db.collection('users').findOne({
    email: userEmail
  }, function(err, usr) {
    assert.equal(err, null);
    if(usr) {
      usr.id = usr._id;
      delete usr._id;
    }
    callback(usr);
  });
};

module.exports.findUser = findUser;

const findUsers = function(callback) {
  db.collection("users").find({}).toArray(function(err, result) {
    if(err) {
      throw err;
    } else {
      result.forEach(user => {
        user.id = user._id;
        delete user._id;
        delete user.password;
        delete user.defaults;
      });
      callback(result);
    }
  });
};

module.exports.findUsers = findUsers;

const updateUser = function(uid, update, callback) {
  var o_id = new ObjectID(uid);
  db.collection('users').updateOne({'_id' : o_id}, {$set : update}, function(err, result) {
    assert.equal(err, null);
    callback(result.matchedCount);
  });
};

module.exports.updateUser = updateUser;

const insertUser = function(newUser, callback) {
  newUser.password = bcrypt.hashSync(newUser.password, saltRounds),
  newUser.defaults = defaults;
  db.collection('users').insertOne(newUser, function(err, result) {
    assert.equal(err, null);
    callback(result.insertedCount);
  });
};

module.exports.insertUser = insertUser;

const updateDefaults = function(uid, def, callback) {
  var o_id = new ObjectID(uid);
  db.collection('users').updateOne({'_id' : o_id}, {$set : { defaults : def }}, function(err, result) {
    assert.equal(err, null);
    callback(result.matchedCount);
  });
};

module.exports.updateDefaults = updateDefaults;

const findGames = function(usrID, callback) {
  db.collection('games').find({'userId': usrID}) .toArray(function (err, games) {
    assert.equal(err, null);
    callback(games);
  });
};

module.exports.findGames = findGames;

const findGame = function(uid, gid, callback) {
  var o_id = new ObjectID(gid);
  db.collection('games').findOne({'userId' : uid, '_id': o_id}, function (err, game) {
    assert.equal(err, null);
    callback(game);
  });
};

module.exports.findGame = findGame;

const makeGame = function(game, callback) {
  db.collection('games').insertOne( game, function (err, result) {
    assert.equal(err,null);
    assert.equal(1, result.result.n);
    assert.equal(1, result.ops.length);
    callback(result.ops);
  });
};

module.exports.makeGame = makeGame;

const updateGame = function(gameObj, uid, gid, callback) {
  var o_id = new ObjectID(gid);
  db.collection('games').save(gameObj, function (err, update) {
    assert.equal(err, null);
    callback(update);
  });
};

module.exports.updateGame = updateGame;

const addAnswer = function(answer, callback) {
  db.collection('answers').insertOne(answer, function (err, result) {
    assert.equal(err,null);
    assert.equal(1, result.result.n);
    assert.equal(1, result.ops.length);
    callback(result.ops);
  });
};

module.exports.addAnswer = addAnswer;

const findAnswer = function(gid, callback) {
  var o_id = new ObjectID(gid);
  db.collection('answers').findOne({'gameID' : o_id}, function (err, answer) {
    assert.equal(err, null);
    callback(answer);
  });
};

module.exports.findAnswer = findAnswer;
