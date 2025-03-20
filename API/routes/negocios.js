const express = require('express');
const multer = require('multer');
const { verificarToken } = require('../middleware/auth'); 

// Configuración de Multer
const storage = multer.memoryStorage(); // Almacenamiento en memoria
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 3 * 1024 * 1024 // Limitar el tamaño del archivo a 3 MB
    },
    fileFilter: (req, file, cb) => {
        // Validar el tipo de archivo
        const filetypes = /jpeg|jpg|png|gif/; // Tipos de archivo permitidos
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(file.originalname.split('.').pop().toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Tipo de archivo no permitido. Solo se permiten imágenes.'));
        }
    }
});

// Controladores
const { crearNegocio, obtenerNegocios, obtenerNegocioPorId, eliminarNegocio, actualizarNegocio } = require('../controllers/negociosController');

const router = express.Router();

// Crear un Negocio
router.post('/', upload.single('foto'), crearNegocio); 

// Obtener los Negocios
router.get('/', obtenerNegocios);

// Obtener los Negocios por id
router.get('/:id_negocio', obtenerNegocioPorId);

// Actualizar un Negocio
router.put('/:id_negocio', verificarToken, upload.single('foto'), actualizarNegocio);

// Eliminar un Negocio
router.delete('/:id_negocio', verificarToken, eliminarNegocio);

module.exports = router;