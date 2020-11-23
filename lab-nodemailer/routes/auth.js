const express = require("express");
const passport = require('passport');
const router = express.Router();
const User = require("../models/User");
const nodemailer = require('nodemailer');

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;


router.get("/login", (req, res, next) => {
  res.render("auth/login", { "message": req.flash("error") });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/auth/login",
  failureFlash: true,
  passReqToCallback: true
}));

router.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});

router.get("/confirm/:confirmCode", (req, res, next) => {
  const filter = { confirmationCode: req.params.confirmCode };
  const update = { status: "Active" };

  User.findOneAndUpdate(filter, update, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
    }
  });

  res.redirect('/');
});

router.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'jamie.p.egan@gmail.com',
      pass: process.env.PASSWORD 
    }
  });

  if (username === "" || password === "" || email === "") {
    res.render("auth/signup", { message: "Indicate username, password & email" });
    return;
  }

  User.findOne({ username }, "username", (err, user) => {
    if (user !== null) {
      res.render("auth/signup", { message: "The username already exists" });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = '';
    for (let i = 0; i < 25; i++) {
        token += characters[Math.floor(Math.random() * characters.length )];
    }

    const newUser = new User({
      username,
      password: hashPass,
      email,
      confirmationCode: characters
    });

    newUser.save()
    .then(() => {
      transporter.sendMail({
        from: '"My Awesome Project 👻" <JAMIE.P.EGAN@GMAIL.COM>',
        to: email, 
        subject: 'Email confirmation', 
        text: `Please confirm your email address http://localhost:3000/auth/confirm/${characters}`,
        html: `<p>Please confirm your email address <a href='http://localhost:3000/auth/confirm/${characters}'>here</a><p>`
      })
      .then(info => console.log(info))
      .catch(error => console.log(error))
      res.redirect("/");
    })
    .catch(err => {
      res.render("auth/signup", { message: "Something went wrong" });
    })
  });
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = router;
