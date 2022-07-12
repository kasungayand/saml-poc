const express = require("express");
const cookieParser = require("cookie-parser");
const passport = require('passport');
const session = require('express-session');
var flash = require('connect-flash');
const SAML = require('passport-saml').SAML;
const env = "development";
const config = require("./config/samlConfig")[env];
var fs = require('fs');
var fs = require('fs');
const os = require('os');
const fileCache = require('file-system-cache').default;
const passportSamlMiddleware =  require('./middlewares/passportHandler')

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
// require('./middlewares/passportHandler')(passport);
/** no need to initialize if we not use sessions with authentication */
// app.use(passport.initialize());
// app.use(passport.session());

app.get("/set_strategies", async (req, res) =>{
  let strategies = [
    {
      platform: "jobready",
      strategy: "staging125",
      metadata: {
        url: "https://staging125.dev.plus.jobready.io/saml_idp/metadata",
       timeout: "1500",
        backupStore: fileCache({
          basePath: os.tmpdir(),
          ns: config.passport.saml.issuer
        })
      }
    },
    {
      platform: "microsoft",
      strategy: "azure",
      metadata: {
        url: "https://login.microsoftonline.com/2ad92363-0194-43e2-9924-b4709e1020c3/federationmetadata/2007-06/federationmetadata.xml?appid=c5c8e065-fff0-48e5-95f0-15091b5b59e7",
       timeout: "1500",
        backupStore: fileCache({
          basePath: os.tmpdir(),
          ns: config.passport.saml.issuer
        })
      }
    },
    {
      platform: "jobready",
      strategy: "ecosystem2",
      metadata:{
        url: "https://ecosystem2.jobreadyplus.com/saml_idp/metadata",
        timeout: "1500",
        backupStore: fileCache({
          basePath: os.tmpdir(),
          ns: config.passport.saml.issuer
        })
      }
    }
  ];
  await passportSamlMiddleware.setStrategies(passport,strategies);
  res.status(200).send({
    'status': "Strategies updated"
  });
})

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