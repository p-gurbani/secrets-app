//jshint esversion:6
// require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
// const md5 = require("md5");
// const encrypt = require("mongoose-encryption");
const ejs = require("ejs");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// using bcrypt hashing
const saltRounds = 10;

// using mongoose-encrypt
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.render("home");
});

app
  .route("/login")
  .get(function (req, res) {
    res.render("login");
  })
  .post(function (req, res) {
    User.findOne({ email: req.body.username })
      .then((foundUser) => {
        if(foundUser) {
          bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
            if(result == true) {
              res.render("secrets");
            }
          });
        }
      })
      .catch((err) => console.log(err));
  });

app
  .route("/register")
  .get(function (req, res) {
    res.render("register");
  })
  .post(function (req, res) {
    // using bcrypt hashing
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
      if(!err) {
        const newUser = new User({
          email: req.body.username,
          password: hash,
        });
        newUser
          .save()
          .then(() => res.render("secrets"))
          .catch((err) => console.log(err));
      } else {
        console.log(err);
      }
    });
  });

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
