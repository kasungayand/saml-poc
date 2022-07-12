const metadata = require('passport-saml-metadata');
const SamlStrategy = require("passport-saml").Strategy;
const env = 'development';
const config = require("../config/samlConfig")[env];

module.exports =  {
  setStrategies: async (passport,strategies) => {
    let promises = [];
    strategies.map(account => {
      promises.push(new Promise((resolve, reject) => {
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
  }
}
