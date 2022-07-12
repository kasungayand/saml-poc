const metadata = require('passport-saml-metadata');
const SamlStrategy = require("passport-saml").Strategy;
const MultiSamlStrategy = require("passport-saml").MultiSamlStrategy;
const env = 'development';
const config = require("../config/samlConfig")[env];
var fs = require('fs');
const os = require('os');
const fileCache = require('file-system-cache').default;

module.exports = async function (passport,params) {
  let promises = [];
  // promises.push(new Promise((resolve, reject) => {
  //   // metadata.metadata(config.passport.saml);
  //   metadata.fetch(config.passport.saml.metadata)
  //     .then(async function (reader) {
  //       const strategyConfig = metadata.toPassportConfig(reader);
  //       strategyConfig.realm = config.passport.saml.issuer;
  //       strategyConfig.protocol = 'samlp';
  //       strategyConfig.passReqToCallback = false;
  //       strategyConfig.validateInResponseTo = false;
  //       strategyConfig.disableRequestedAuthnContext = true;
  
  //       strategyConfig.issuer = config.passport.saml.issuer;
  //       strategyConfig.callbackUrl = config.passport.saml.callbackUrl;
  
  //       if(strategyConfig.identifierFormat === undefined)
  //         strategyConfig.identifierFormat = config.passport.saml.identifierFormat;
  
  //       passport.use(config.passport.strategy, new SamlStrategy(strategyConfig, function (profile, done) {
  //         profile = metadata.claimsToCamelCase(profile, reader.claimSchema);
  //         return done(null, profile);
  //       }));
  
  //       passport.serializeUser(async function(user, done) {
  //         done(null, user);
  //       });
  
  //       passport.deserializeUser(async function(user, done) {
  //         done(null, user);
  //       });
  //     }).then(()=>{
  //       resolve()
  //     })
  //   }))
  [
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
  ].map(account => {
    promises.push(new Promise((resolve, reject) => {
      // metadata.metadata(config.passport.saml);
      const callbackUrl = `${config.passport.saml.callbackUrl}?identifier=${account.strategy}`;
      metadata.fetch(account.metadata)
        .then(async function (reader) {
          const strategyConfig = metadata.toPassportConfig(reader);
          strategyConfig.name = account.strategy;
          strategyConfig.realm = config.passport.saml.issuer;
          strategyConfig.protocol = 'samlp';
          strategyConfig.passReqToCallback = false;
          strategyConfig.validateInResponseTo = true;
          strategyConfig.disableRequestedAuthnContext = true;
    
          strategyConfig.issuer = config.passport.saml.issuer;
          // strategyConfig.callbackUrl = `${config.passport.saml.callbackUrl}`;
          strategyConfig.callbackUrl = callbackUrl;
          strategyConfig.additionalParams = {
            identifier:account.strategy
          };
          strategyConfig.logoutCallbackUrl = `${config.passport.saml.logoutCallbackUrl}`;
    
          if(strategyConfig.identifierFormat === undefined)
            strategyConfig.identifierFormat = config.passport.saml.identifierFormat;

          strategyConfig.audience = config.passport.saml.issuer;
    
          passport.use(account.strategy, new SamlStrategy(strategyConfig, function (profile, done) {
            // profile = metadata.claimsToCamelCase(profile, reader.claimSchema);
            // return done(null, profile);
            let attributes = {}
            if(account.platform === "jobready"){
              attributes['party_identifier'] = profile.party_identifier;
              attributes['username'] = profile.username,
              attributes['email_address'] = profile.email_address;
              attributes['first_name'] = profile.first_name;
              attributes['surname'] = profile.surname;
            }else{
              attributes['first_name'] = profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"];
              attributes['surname'] = profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"];
              attributes['email_address'] = profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
              attributes['name'] = profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
            }

            return done(null, {
              issuer: profile.issuer,
              inResponseTo: profile.inResponseTo,
              id: profile.nameID,
              name_id_format: profile.nameIDFormat,
              ...attributes
            });
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
      }))
  })

  return Promise.all(promises);

};
