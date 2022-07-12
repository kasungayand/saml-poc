const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const passport = require('passport');
const session = require('express-session');
var flash = require('connect-flash');
const SAML = require('passport-saml').SAML;
const env = "development";
const config = require("./config/samlConfig")[env];
var fs = require('fs');

const port = 4030;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'waezrsdxtgfhjgvhghcfgnhmgjh,kml,',
  cookie: { maxAge: 60000 }
}));

app.use(flash());
require('./middlewares/passportHandler')(passport);
app.use(passport.initialize());
app.use(passport.session());

app.get("/metadata", (req, res) => {
    const saml = new SAML({
        issuer: config.passport.saml.issuer,
        callbackUrl: config.passport.saml.callbackUrl,
        logoutCallbackUrl: config.passport.saml.logoutCallbackUrl,
        identifierFormat: config.passport.saml.identifierFormat,
        cert: fs.readFileSync("./assets/cert-file.crt", 'utf8')
      });
      res.type('application/xml');
      res.status(200).send(saml.generateServiceProviderMetadata());
});

/** pass the strategy in the login request */
app.get('/login', (req, res, next) => {
  passport.authenticate(req.query.identifier, { successRedirect: '/', failureRedirect: '/login/failure'})(req, res, next); //RelayState: config.passport.saml.callbackUrl
});

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.post("/login/callback",(req, res, next) => {
        try {
          passport.authenticate(req.query.identifier, { failureRedirect: '/login/failure', failureFlash: true }, (error, user, info) => {
            req.samlUserObject = user;
            next()
          })(req, res, next);
        } catch(e) {
          console.log(e);
        }
    },
    (req, res) => {
      return res.status(200).send({
        'status': "success",
        "user": req.samlUserObject
      });
    }
);

app.get("/login/failure", function(req, res){
    res.status(200).send({
        'status': JSON.stringify(req.session.flash)
    });
});

app.get('/',(req,res)=>{
  res.status(200).send({
    'status': JSON.stringify(req.session.flash)
  });
});

app.get('/authentication/test',(req,res)=>{
  if(req.isAuthenticated){
    res.status(200).send({
      'status': "authenticted",
    })
  }else{
    res.status(401).send({
      'status': "Unauthenticted",
    });
  }
});

const server = app.listen(port, function () {
  console.log(`API Service started on port ${port}`);
});

server.on("connection", function (socket) {
  socket.setTimeout(5 * 60 * 1000);
});