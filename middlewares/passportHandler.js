const metadata = require('passport-saml-metadata');
const SamlStrategy = require("passport-saml").Strategy;
const env = 'development';
const config = require("../config/samlConfig")[env];
var fs = require('fs');

module.exports = async function (passport,params) {
  return new Promise((resolve, reject) => {
  metadata.metadata(config.passport.saml);
  metadata.fetch(config.passport.saml.metadata)
    .then(async function (reader) {
      const strategyConfig = metadata.toPassportConfig(reader);
      strategyConfig.realm = config.passport.saml.issuer;
      strategyConfig.protocol = 'samlp';
      strategyConfig.passReqToCallback = false;
      strategyConfig.validateInResponseTo = false;
      strategyConfig.disableRequestedAuthnContext = true;

      strategyConfig.issuer = config.passport.saml.issuer;
      strategyConfig.callbackUrl = config.passport.saml.callbackUrl;

      if(strategyConfig.identifierFormat === undefined)
        strategyConfig.identifierFormat = config.passport.saml.identifierFormat;

      passport.use(config.passport.strategy, new SamlStrategy(strategyConfig, function (profile, done) {
        profile = metadata.claimsToCamelCase(profile, reader.claimSchema);
        return done(null, profile);
      }));

      passport.serializeUser(async function(user, done) {
        done(null, user);
      });

      passport.deserializeUser(async function(user, done) {
        done(null, user);
      });
    }).then(()=>{
      resolve()
    })
  })

};
