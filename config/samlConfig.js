const os = require('os');
const fileCache = require('file-system-cache').default;

const host = "https://bd65-112-134-230-31.in.ngrok.io";
// const metaUrl = "https://login.microsoftonline.com/2ad92363-0194-43e2-9924-b4709e1020c3/federationmetadata/2007-06/federationmetadata.xml?appid=c5c8e065-fff0-48e5-95f0-15091b5b59e7";
const metaUrl = "https://staging125.dev.plus.jobready.io/saml_idp/metadata";

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
      strategy: 'saml',
      saml: {
        path: `${host}/login/callback`,
        callbackUrl: `${host}/login/callback`,
        logoutCallbackUrl: `${host}/logout`,
        issuer: "urn:node:passport-saml-test",
        identifierFormat: null, //"urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
        audience: metaUrl,
        metadata: {
          url: metaUrl,
         timeout: "1500",
          backupStore: fileCache({
            basePath: os.tmpdir(),
            ns: "urn:node:passport-saml-test"
          })
        }
      }
    }
  }
};
