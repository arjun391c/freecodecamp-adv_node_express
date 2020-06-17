"use strict";

const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const mongo = require("mongodb").MongoClient;
//for user id
const ObjectID = require("mongodb").ObjectID;

require("dotenv").config();

const app = express();

fccTesting(app); //For FCC testing purposes

//view engine
app.set("view engine", "pug");
app.set("views", "./views/pug");
//middlewares
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//express sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//database connection
mongo.connect(process.env.DATABASE, { useUnifiedTopology: true }, (err, db) => {
  if (err) {
    console.log("Database error: " + err);
  } else {
    console.log("Successful database connection");
    var db = db.db("users");

    //serialization and app.listen
    passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
      db.collection("users").findOne({ _id: new ObjectID(id) }, (err, doc) => {
        done(null, doc);
      });
    });

    passport.use(
      new LocalStrategy(function (username, password, done) {
        db.collection("users").findOne({ username: username }, function (
          err,
          user
        ) {
          console.log("User " + username + " attempted to log in.");
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false);
          }
          if (password !== user.password) {
            return done(null, false);
          }
          return done(null, user);
        });
      })
    );

    //ensure is authenticated before accesing page to profile
    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect("/");
    }

    app.route("/").get((req, res) => {
      //Change the response to render the Pug template
      res.render("index", {
        title: "Home page",
        message: "Please login",
        showLogin: true,
        showRegistration: true,
      });
      // res.send(`Pug template is not defined.`);
    });

    app
      .route("/login")
      .post(
        passport.authenticate("local", { failureRedirect: "/" }),
        (req, res) => {
          res.redirect("/profile");
        }
      );

    app.route("/register").post(
      (req, res, next) => {
        db.collection("users").findOne(
          { username: req.body.username },
          (err, user) => {
            if (err) {
              next(err);
            } else if (user) {
              res.redirect("/");
            } else {
              db.collection("users").insertOne(
                {
                  username: req.body.username,
                  password: req.body.password,
                },
                (err, doc) => {
                  if (err) {
                    res.redirect("/");
                  } else {
                    next(null, doc);
                  }
                }
              );
            }
          }
        );
      },
      passport.authenticate("local", { failureRedirect: "/" }),
      (req, res, next) => {
        res.redirect("/profile");
      }
    );

    app.route("/logout").get((req, res) => {
      req.logout();
      res.redirect("/");
    });

    app.route("/profile").get(ensureAuthenticated, (req, res) => {
      res.render("profile", { username: req.user.username });
    });

    //404
    app.use((req, res, next) => {
      res.status(404).type("text").send("Not Found");
    });

    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
  }
});
