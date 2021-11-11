//jshint esversion:6
// require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const md5 = require("md5");
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
    User.findOne(
      {email: req.body.username}
    ).then(foundUser => {
      // using md5 hashing to match the hashed password
      if(foundUser && foundUser.password === md5(req.body.password)) {
        res.render("secrets");
      }
    }).catch(err => console.log(err));
  });

app
  .route("/register")
  .get(function (req, res) {
    res.render("register");
  })
  .post(function (req, res) {
    // using md5 hashing
    const newUser = new User({
      email: req.body.username,
      password: md5(req.body.password),
    });
    newUser
      .save()
      .then(() => res.render("secrets"))
      .catch((err) => console.log(err));
  });

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
