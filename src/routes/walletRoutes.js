const express = require("express");
const {
  createPassClass,
  createPassObject,
} = require("../controllers/googleWalletController");

const router = express.Router();

router.post("/create-class", createPassClass); // Create a new class (Only execute once or when you want to update the class, change the CLASS_ID on the .env file)
router.post("/create-pass", createPassObject);

module.exports = router;
