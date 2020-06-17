const passport = require("passport");
const bcrypt = require("bcrypt");
const auth = require("./auth.js");

module.exports = function (app, db) {

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
      var hashedPass = bcrypt.hashSync(req.body.password, 12);
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
                password: hashedPass,
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
};
