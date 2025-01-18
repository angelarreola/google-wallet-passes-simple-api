require("dotenv").config();

const express = require("express");
const { GoogleAuth } = require("google-auth-library");

const path = require("path");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const credentialsPath = path.resolve(
  __dirname,
  "../../",
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);

const credentials = require(credentialsPath);
const issuerId = process.env.ISSUER_ID;
const classId = process.env.CLASS_ID;

if (!credentialsPath || !issuerId || !classId) {
  throw new Error("There are missing enviroment varibles in the .env file");
}

const httpClient = new GoogleAuth({
  keyFile: credentialsPath,
  scopes: "https://www.googleapis.com/auth/wallet_object.issuer",
});
const baseUrl = "https://walletobjects.googleapis.com/walletobjects/v1";

/**
 * Creates a sample pass class based on the template defined below.
 *
 * This class contains multiple editable fields that showcase how to
 * customize your class.
 *
 * @param res A representation of the HTTP result in Express.
 */
async function createPassClass(res) {
  // TODO: Create a Generic pass class
  let genericClass_kidzaniaPass = {
    id: classId,
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          {
            threeItems: {
              startItem: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData['adulto']",
                    },
                  ],
                },
              },
              middleItem: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData['niño']",
                    },
                  ],
                },
              },
              endItem: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData['bebe']",
                    },
                  ],
                },
              },
            },
          },
          {
            oneItem: {
              item: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData['fecha_de_visita']",
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  };

  let response;
  try {
    // Check if the class exists already
    response = await httpClient.request({
      url: `${baseUrl}/genericClass/${classId}`,
      method: "GET",
    });

    console.log("Class already exists");
    console.log(response);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // Class does not exist
      // Create it now
      response = await httpClient.request({
        url: `${baseUrl}/genericClass`,
        method: "POST",
        data: genericClass_kidzaniaPass,
      });

      console.log("Class insert response");
      console.log(response);
    } else {
      // Something else went wrong
      console.log(err);
      res.send("Something went wrong...check the console logs!");
    }
  }
}

/**
 * Crea un pase para un usuario en base a su email.
 * @param {string} email - El correo electrónico del usuario.
 * @returns {Promise<object>} - Respuesta del API de Google Wallet.
 */
async function createPassObject(email) {
  const objectSuffix = email.replace(/[^\w.-]/g, "_");
  const objectId = `${issuerId}.${objectSuffix}.${uuidv4()}`; // Unique ID for test purposes

  const kidzaniaObject = {
    id: objectId,
    classId: classId,
    logo: {
      sourceUri: {
        uri: "https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg",
      },
      contentDescription: {
        defaultValue: {
          language: "en-US",
          value: "LOGO_IMAGE_DESCRIPTION",
        },
      },
    },
    cardTitle: {
      defaultValue: {
        language: "en-US",
        value: "KidZania México",
      },
    },
    subheader: {
      defaultValue: {
        language: "en-US",
        value: "KidZania Guadalajara",
      },
    },
    header: {
      defaultValue: {
        language: "en-US",
        value: "Entradas Regulares",
      },
    },
    textModulesData: [
      {
        id: "adulto",
        header: "ADULTO",
        body: "0",
      },
      {
        id: "niño",
        header: "NIÑO",
        body: "0",
      },
      {
        id: "bebe",
        header: "BEBE",
        body: "0",
      },
      {
        id: "fecha_de_visita",
        header: "Fecha de Visita",
        body: "15 / 02 / 2025",
      },
    ],
    barcode: {
      type: "QR_CODE",
      value: "BARCODE_VALUE",
      alternateText: "054b5c22466a",
    },
    hexBackgroundColor: "#a30010",
    heroImage: {
      sourceUri: {
        uri: "https://fiverr-res.cloudinary.com/images/q_auto,f_auto/gigs3/362540826/original/9b216ebd825491684e96983661d40b7eb4fb53cc/create-stunning-anime-landscape-and-scenery-art.jpg",
      },
      contentDescription: {
        defaultValue: {
          language: "en-US",
          value: "HERO_IMAGE_DESCRIPTION",
        },
      },
    },
  };

  try {
    // Verificar si el objeto ya existe
    const existingObject = await httpClient.request({
      url: `${baseUrl}/genericObject/${objectId}`,
      method: "GET",
    });

    console.log("El objeto ya existe:", existingObject.data);
    // Generar el token para el objeto existente
    return generateSaveUrl(existingObject.data);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // Crear el objeto si no existe
      const response = await httpClient.request({
        url: `${baseUrl}/genericObject`,
        method: "POST",
        data: kidzaniaObject,
      });

      console.log("Objeto genericObject creado:", response.data);
      // Generar el token para el nuevo objeto
      return generateSaveUrl(response.data);
    } else {
      // Otro error
      console.error("Error al verificar o crear el objeto:", err.message);
      throw err;
    }
  }
}

/**
 * Genera la URL de Save to Wallet para el objeto proporcionado.
 * @param {object} genericObject - El objeto de Google Wallet.
 * @returns {string} - La URL para guardar el pase.
 */
function generateSaveUrl(kidzaniaObject) {
  const claims = {
    iss: credentials.client_email, // Correo del servicio
    aud: "google",
    origins: [], // Puedes especificar dominios válidos si es necesario
    typ: "savetowallet",
    payload: {
      eventTicketObjects: [kidzaniaObject],
    },
  };

  // Crear el token JWT
  const token = jwt.sign(claims, credentials.private_key, {
    algorithm: "RS256",
  });

  // Generar y retornar la URL de Save to Wallet
  const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
  return saveUrl;
}

router.post("/gpass", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  //CLASS OVERWRITE (only once)
  createPassClass(res);

  // PASS CREATION
  try {
    const saveUrl = await createPassObject(email);
    res.status(200).json({
      message: "Save URL generated successfully",
      saveUrl: saveUrl,
    });
  } catch (error) {
    res.status(500).json({
      error: "There was a problem creating the pass object",
      details: error.message,
    });
  }
});

module.exports = router;
