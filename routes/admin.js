var express = require("express");
var session = require("express-session");
var db = require("./db");

var router = express.Router();

/**************** ROUTES ***********************************/
router.all("*", function(req, res, next) {
  var user = req.session.user;
  var token = req.headers["token"];
  if (user && token === req.session.csrf_token && user.role === "ADMIN") {
    next();
  } else {
    res.status(403).send("Expired or Forbidden");
  }
});

router.get("/users", function(req, res, next) {
  db.findUsers(function(result) {
    res.send(result);
  });
});

router.put("/:userid", function(req, res, next) {
  db.updateUser(req.params.userid, req.body, function(result) {
    if (result == 1) {
      res.send(req.body);
    } else {
      res.status(500).send("Could not update user");
    }
  });
});

router.post("/user", function(req, res, next) {
  db.insertUser(req.body, function(result) {
    if (result == 1) {
      res.send(req.body);
    } else {
      res.status(500).send("Could not create user");
    }
  });
});

module.exports = router;
