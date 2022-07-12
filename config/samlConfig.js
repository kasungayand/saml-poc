const os = require('os');
const fileCache = require('file-system-cache').default;

const host = "https://7e46-103-247-48-180.in.ngrok.io";

module.exports = {
  development: {
    app: {
      name: 'Passport SAML Test',
      hostname: host,
      testHost: host,
      host: host,
      port: "4030"
    },
    passport: {
      saml: {
        path: `${host}/login/callback`,
        callbackUrl: `${host}/login/callback`,
        logoutCallbackUrl: `${host}/logout`,
        issuer: "urn:node:passport-saml-test",
        identifierFormat: null, //"urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      }
    }
  }
};
