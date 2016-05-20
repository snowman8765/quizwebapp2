var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data/quiz.db');

function isAuthenticated(req, res, next){
  if (req.isAuthenticated()) {  // 認証済
    console.info("isAuthenticated: OK.");
    return next();
  }
  else {  // 認証されていない
    console.error("isAuthenticated: NG.");
    res.redirect('/users/login');  // ログイン画面に遷移
  }
}

router.get('/', function(req, res, next) {
  res.redirect("/home");
});

router.get('/home', isAuthenticated, function(req, res, next) {
  res.render('users/home', {
    user: req.user,
    path: req.path,
    pretty: true
  });
});

router.get('/config', isAuthenticated, function(req, res, next) {
  res.render('users/config', {
    user: req.user,
    path: req.path,
    pretty: true
  });
});

router.get('/signup', function(req, res, next) {
  res.render('users/signup', {
    path: req.path,
    pretty: true
  });
});

router.post('/signup', function(req, res, next) {
  res.redirect("/home");
});

router.get('/login', function(req, res, next) {
  console.log("get /login:"+req.user);
  res.render('users/login', {
    path: req.path,
    pretty: true
  });
});

router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/users/home',
    failureRedirect: '/users/login',
    failureFlash: true
  })
);

router.get("/logout", isAuthenticated, function(req, res){
  console.log("get /logout:"+req.id);
  //console.log(req);
  req.logout();
  res.redirect("/");
});

router.get('/:id', isAuthenticated, function(req, res, next) {
  db.serialize(function(){
    db.get("SELECT id, password, firstname, lastname, createtime, updatetime FROM users WHERE id=?", req.params.id, function(err, rows){
      if (!err) {
        res.locals.userdata = rows;
        res.render('users/single', {
          path: req.path,
          data: rows,
          pretty: true
        });
      }
      else {
        console.log(err);
      }
    });
  });
});

function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

passport.use(new LocalStrategy({usernameField: "userid", passwordField: "password"}, function(userid, password, done) {
  console.log("check login.");
  db.get('SELECT createtime as salt FROM users WHERE id = ?', userid, function(err, row) {
    if (!row) {
      return done(null, false, {
        message: "ユーザーが見つかりませんでした。"
      });
    }
    console.log("find user.");
    var hash = hashPassword(password, row.salt);
    db.get('SELECT id, firstname, lastname, createtime, updatetime FROM users WHERE id = ? AND password = ?', userid, hash, function(err, row) {
      if (!row) {
        return done(null, false, {
          message: "パスワードが間違っています。",
          input_id: userid,
          input_password: password
        });
      }
      console.log("login ok.:id="+row.id);
      return done(null, row);
    });
  });
}));

passport.serializeUser(function(user, done) {
  console.log("serializeUser:id="+user.id);
  return done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  console.log("deserializeUser:id="+id);
  db.get('SELECT id, firstname, lastname, createtime, updatetime FROM users WHERE id = ?', id, function(err, row) {
    if (!row) {
      return done(null, false);
    }
    return done(null, row);
  });
});

module.exports = router;