"use strict";

const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const session = require("express-session");
const passport = require("passport");
const mongo = require("mongodb").MongoClient;
//for user id
const ObjectID = require("mongodb").ObjectID;

require('dotenv').config()

const app = express();

fccTesting(app); //For FCC testing purposes

//view engine
app.set("view engine", "pug");
//middlewares
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//express sessions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  }
));

app.use(passport.initialize());
app.use(passport.session());

//database connection
mongo.connect(process.env.DATABASE, { useUnifiedTopology: true }, (err, db) => {
  if(err) {
    console.log('Database error: ' + err);
  } else {
    console.log('Successful database connection');

    //serialization and app.listen
    passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    passport.deserializeUser( (id, done) => {
        db.collection('users').findOne(
            {_id: new ObjectID(id)},
            (err, doc) => {
                done(null, doc);
            }
        );
    });
    
    app.route("/").get((req, res) => {
      //Change the response to render the Pug template
      res.render("pug/index", {title: 'Hello', message: 'Please login'});
     // res.send(`Pug template is not defined.`);
    });
    
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
  }
});


