const app = require('./app');
const apiRoutes = require('./routes/api');

// Usar las rutas en la aplicación
app.use('/api', apiRoutes);

// Puerto del servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running Server in http://localhost:${PORT}`);
});
