// Modules
const {
  httpClient,
  issuerId,
  classId,
  baseUrl,
  generateSaveWalletPassUrl,
} = require("../utils/googleWalletService");

/**
 ** **KidZania Pass Class**
 ** This is like the 'class' of the pass 'object' that will be created for each purchase.
 ** Create pass class (Only once, when you create the pass for the first, this maybe be done in other side)
 */
const createPassClass = async (_req, res) => {
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

  try {
    //? We check if the class already exists
    await httpClient.request({
      url: `${baseUrl}/genericClass/${classId}`,
      method: "GET",
    });
    console.log("Class already exists");
    res.status(200).send("Class already exists");
  } catch (err) {
    if (err.response && err.response.status === 404) {
      //? We create the class if it does not exist
      const response = await httpClient.request({
        url: `${baseUrl}/genericClass`,
        method: "POST",
        data: genericClass_kidzaniaPass,
      });
      console.log("Class created:", response.data);
      res.status(201).send(response.data);
    } else {
      console.error("Error creating class:", err);
      res.status(500).send("Error creating class");
    }
  }
};

/**
 ** **KidZania Pass Object for each purchase**
 ** Create pass for a specific purchase
 */
const createPassObject = async (req, res) => {
  const {
    folio,
    email,
    facility,
    ticketType,
    numberOfAdults,
    numberOfChilds,
    numberOfInfants,
    visitDate,
  } = req.body;

  const objectSuffix = email.replace(/[^\w.-]/g, "_");
  const objectId = `${issuerId}.${objectSuffix}.${folio}`;

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
        value: facility,
      },
    },
    header: {
      defaultValue: {
        language: "en-US",
        value: ticketType,
      },
    },
    textModulesData: [
      {
        id: "adulto",
        header: "ADULTO",
        body: numberOfAdults,
      },
      {
        id: "niño",
        header: "NIÑO",
        body: numberOfChilds,
      },
      {
        id: "bebe",
        header: "BEBE",
        body: numberOfInfants,
      },
      {
        id: "fecha_de_visita",
        header: "Fecha de Visita",
        body: visitDate,
      },
    ],
    barcode: {
      type: "QR_CODE",
      value: folio,
      alternateText: folio,
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
    //? Check if the pass already exists
    const existingObject = await httpClient.request({
      url: `${baseUrl}/genericObject/${objectId}`,
      method: "GET",
    });
    console.log("Pass already created:", existingObject.data);
    //? Send the token of the existing object
    const generatedUrl = generateSaveWalletPassUrl(existingObject.data);
    res.status(200).send({
      message: "Pass already created",
      saveUrl: generatedUrl,
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      //? Create the pass if it does not exist
      const response = await httpClient.request({
        url: `${baseUrl}/genericObject`,
        method: "POST",
        data: kidzaniaObject,
      });
      console.log("Pass created:", response.data);
      const generatedUrl = generateSaveWalletPassUrl(response.data);
      res.status(201).send({
        message: "Pass created successfully",
        saveUrl: generatedUrl,
      });
    } else {
      console.error("Error creating pass object:", err);
      res.status(500).send("Error creating pass object");
    }
  }
};

module.exports = { createPassClass, createPassObject };
