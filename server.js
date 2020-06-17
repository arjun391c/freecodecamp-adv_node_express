"use strict";

const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const mongo = require("mongodb").MongoClient;
const auth = require("./auth.js");
const routes = require("./routes.js");

const app = express();

require("dotenv").config();

fccTesting(app); //For FCC testing purposes

//middlewares
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//view engine
app.set("view engine", "pug");
app.set("views", "./views/pug");

//database connection
mongo.connect(process.env.DATABASE, { useUnifiedTopology: true }, (err, db) => {
  if (err) {
    console.log("Database error: " + err);
  } else {
    console.log("Successful database connection");
    var db = db.db("users");

    //auth
    auth(app, db);

    //routes
    routes(app, db);

    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
  }
});
