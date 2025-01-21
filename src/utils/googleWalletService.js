// Libs
const path = require("path");
const jwt = require("jsonwebtoken");
// Google Service
const { GoogleAuth } = require("google-auth-library");

const credentialsPath = path.resolve(
  __dirname,
  "../../",
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);

if (!process.env.ISSUER_ID || !process.env.CLASS_ID || !credentialsPath) {
  throw new Error("Missing environment variables in the .env file");
}

const credentials = require(credentialsPath);

const httpClient = new GoogleAuth({
  keyFile: credentialsPath,
  scopes: "https://www.googleapis.com/auth/wallet_object.issuer",
});

function generateSaveWalletPassUrl(kidzaniaObject) {
  const claims = {
    iss: credentials.client_email, //* email of the service account
    aud: "google",
    origins: [], //* You can specify the origins that are allowed to use this JWT
    typ: "savetowallet",
    payload: {
      eventTicketObjects: [kidzaniaObject],
    },
  };

  //? Create the JWT
  const token = jwt.sign(claims, credentials.private_key, {
    algorithm: "RS256",
  });

  //? Generate and return the save URL
  const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
  return saveUrl;
}

module.exports = {
  httpClient,
  issuerId: process.env.ISSUER_ID,
  classId: process.env.CLASS_ID,
  baseUrl: "https://walletobjects.googleapis.com/walletobjects/v1",
  generateSaveWalletPassUrl,
};
