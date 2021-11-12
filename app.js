//jshint esversion:6
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
// const bcrypt = require("bcrypt");
// const md5 = require("md5");
// const encrypt = require("mongoose-encryption");
const ejs = require("ejs");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// using bcrypt hashing
// const saltRounds = 10;

// using mongoose-encrypt
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

// Root path
app.get("/", function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/secrets");
  } else {
    res.render("home");
  }
});

// Login path
app
  .route("/login")
  .get(function (req, res) {
    res.render("login");
  })
  .post(function (req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });

    req.login(user, function (err) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    });
  });

// Logout path
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

// Register path
app
  .route("/register")
  .get(function (req, res) {
    res.render("register");
  })
  .post(function (req, res) {
    User.register(
      { username: req.body.username },
      req.body.password,
      function (err, user) {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          const authenticate = passport.authenticate("local");
          authenticate(req, res, function () {
            res.redirect("/secrets");
          });
        }
      }
    );
  });

// Google Authentication path
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

// Google Auth redirect path
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  }
);

// Secrets path
app.get("/secrets", function (req, res) {
  User.find({secret: {$ne: null}}, function(err, foundUsers) {
    if(!err) {
      res.render("secrets", {usersWithSecrets: foundUsers});
    } else {
      console.log(err);
    }
  })
});

// Submit your secret path
app
  .route("/submit")
  .get(function (req, res) {
    if (req.isAuthenticated()) {
      res.render("submit");
    } else {
      res.redirect("/login");
    }
  })
  .post(function (req, res) {
    const submittedSecret = req.body.secret;
    User.updateOne({ _id: req.user.id }, { secret: submittedSecret })
      .then((result) => {
        res.redirect("/secrets");
      })
      .catch((err) => console.log(err));
  });

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

// NOTE: All the levels of encryptions are on git (see git log and check commits)
