const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS
const allowedOrigins = [
  'http://localhost:4200', // Frontend local (desarrollo)
  'https://proyecto-taller-sis-info-grupo-1.onrender.com' // Frontend en producción
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  credentials: true // Permitir cookies si se necesitan
}));

// Middleware
app.use(express.json());

// Rutas
const productosRoutes = require('./routes/productos');
const empresasRoutes = require('./routes/empresas');
const authRoutes = require('./routes/auth');
const negociosRoutes = require('./routes/negocios');
const pedidosRoutes = require('./routes/pedidos');
const carritosRoutes = require('./routes/carritos');

// Uso de las rutas
app.use('/auth', authRoutes);
app.use('/productos', productosRoutes);
app.use('/empresas', empresasRoutes);
app.use('/negocios', negociosRoutes);
app.use('/pedidos', pedidosRoutes);
app.use('/carritos', carritosRoutes);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en ${process.env.NODE_ENV === 'production' 
    ? 'https://proyecto-taller-sis-info-grupo-1.onrender.com' 
    : `http://localhost:${port}`}`);
});
