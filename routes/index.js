var express = require('express');
var session = require('express-session');
var fs = require('fs');
var uuidv4 = require('uuid/v4');
var db = require('./db');

var router = express.Router();

var levels = [{
    'name': 'easy',
    'minLength': 3,
    'maxLength': 5,
    'rounds': 8
  },
  {
    'name': 'medium',
    'minLength': 4,
    'maxLength': 10,
    'rounds': 7
  },
  {
    'name': 'hard',
    'minLength': 9,
    'maxLength': 30,
    'rounds': 6
  }
];

var fonts = [{
    'name': 'Fredericka',
    'category': 'cursive',
    'family': 'cursive',
    'rule': "'Fredericka the Great', cursive",
    'url': 'https://fonts.googleapis.com/css?family=Fredericka+the+Great'
  },
  {
    'name': 'Indie',
    'category': 'cursive',
    'family': 'cursive',
    'rule': "'Indie Flower', cursive",
    'url': 'https://fonts.googleapis.com/css?family=Indie+Flower'
  },
  {
    'name': 'Marmelad',
    'category': 'sans-serif',
    'family': 'sans-serif',
    'rule': "'Marmelad', sans-serif",
    'url': 'https://fonts.googleapis.com/css?family=Marmelad'
  },
  {
    'name': 'Pacifico',
    'category': 'cursive',
    'family': 'cursive',
    'rule': "'Pacifico', cursive",
    'url': 'https://fonts.googleapis.com/css?family=Pacifico'
  },
  {
    'name': 'Ultra',
    'category': 'serif',
    'family': 'serif',
    'rule': "'Ultra', serif",
    'url': 'https://fonts.googleapis.com/css?family=Ultra'
  }
];

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

var metadata = {
  'font': fonts,
  'levels': levels,
  'defaults': defaults
};

var words = fs.readFileSync(process.cwd() + '/routes/wordlist.txt', 'utf8').split('\r\n');


/**************** ROUTES ***********************************/
router.all('*', function (req, res, next) {
  var user = req.session.user;
  var token = req.headers['token'];
  if (user && token === req.session.csrf_token && user.role === "USER") {
      next();
  } else {
    res.status(403).send('Expired or Forbidden');
  }
});

router.get('/metadata', function(req, res, next) {
  if (metadata) {
    res.send(metadata);
  } else {
    res.status(500).send('No metadata');
  }
});

router.get('/meta/fonts', function(req, res, next) {
  if (fonts) {
    res.send(fonts);
  } else {
    res.status(500).send('No fonts');
  }
});

router.put('/:userid/defaults', function(req, res, next) {
  db.updateDefaults(req.params.userid, req.body, function(result) {
    if(result == 1) {
      req.session.user.defaults = req.body;
      res.send(req.body);
    } else {
      res.status(500).send('invalid defaults');
    }
  });
});

router.post('/:userid', function(req, res, next) {
  var userID = req.params.userid;
  var font;
  var level;
  var word;
  var found = false;
  var view = "";

  fonts.forEach(f => {
    if (f.name === req.headers['x-font']) {
      font = f;
      return;
    }
  });

  levels.forEach(l => {
    if (l.name === req.query.level) {
      level = l;
      return;
    }
  });

  while (!found) {
    var random = Math.floor(Math.random() * (words.length - 1)) + 0;
    if (words[random].length >= level.minLength && words[random].length <= level.maxLength) {
      word = words[random];
      found = true;
    }
  };

  for (var i = 0; i < word.length; i++) {
    view = view + "_";
  }

  var game = {
    'userId': userID,
    'colors': req.body,
    'font': font,
    'guesses': "",
    'level': level,
    'remaining': level.rounds,
    'status': 'unfinished',
    'timestamp': Math.floor(Date.now()),
    'view': view
  };

  db.makeGame(game, function (gameArr) {
    if(gameArr) {
      var gid = gameArr[0]._id;
      answerKey = {'gameID' : gid, 'target' : word};
      db.addAnswer(answerKey, function (answerArr) {
        if(answerArr) {
          // game was created successfully
        } else {
          res.status(500).send('Could not create game');
        }
        res.send(gameArr);
      });
    } else {
      res.status(500).send('Could not create game');
    }
  });
});

router.put('/:userid/:gid', function(req, res, next) {
  var game;
  var word;
  db.findGame(req.params.userid, req.params.gid, function(result) {
    if(result) {
      game = result;
      db.findAnswer(req.params.gid, function(obj) {
        if(obj) {
          word = obj.target;
          for (var i = 0; i < game.guesses.length; i++) {
            if (game.guesses[i] === req.query.guess) {
              res.status(500).send('guessed already');
              return;
            }
          }
            var newView = "";
            for (var i = 0; i < word.length; i++) {
              if (word[i] === req.query.guess) {
                newView = newView + req.query.guess;
              } else {
                newView = newView + game.view[i];
              }
            }
            game.guesses = game.guesses + req.query.guess;
            if (newView === game.view) {
              game.remaining -= 1;
              if (game.remaining === 0) {
                game.status = 'loss';
                game.target = word;
                game.timeToComplete = Math.floor(Date.now()) - game.timestamp;
              }
            } else {
              game.view = newView;
            }
            if (game.view === word) {
              game.status = 'victory';
              game.target = word;
              game.timeToComplete = Math.floor(Date.now()) - game.timestamp;
            }
            db.updateGame(game, req.params.userid, req.params.gid, function(result) {
              if(result) {
                res.send(game);
                return;
              } else {
                res.status(500).send('Error could not update game');
              }
            });
        } else {
          res.status(500).send('Error with game');
        }
      });
    } else {
      res.status(500).send('Could not find game');
    }
  });
});

router.get('/:userid', function(req, res, next) {
  db.findGames(req.params.userid, function(games) {
    if(games) {
      res.send(games);
    } else {
      res.status(500).send('No games found');
    }
  });
});

router.get('/:userid/:gid', function(req, res, next) {
  db.findGame(req.params.userid, req.params.gid, function(result) {
    if(result) {
      res.send(result);
    } else {
      res.status(500).send('Game does not exist');
    }
  });
});

module.exports = router;
