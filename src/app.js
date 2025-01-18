const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Middleware para procesar JSON
app.use(bodyParser.json());

// Middleware para registrar solicitudes (opcional, para depurar)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

module.exports = app;
