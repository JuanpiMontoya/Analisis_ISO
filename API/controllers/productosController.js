const db = require('../db');  // Conexión a la base de datos
const { body, validationResult } = require('express-validator');

// Middleware para validar entradas al crear un producto
const validateCreateProduct = [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio.'),
    body('descripcion').notEmpty().withMessage('La descripción es obligatoria.'),
    body('precio').isFloat({ gt: 0 }).withMessage('El precio debe ser un número mayor que 0.'),
    body('imagen_url').optional().isURL().withMessage('La URL de la imagen debe ser válida.'),
];

// Crear un nuevo producto
exports.crearProducto = async (req, res) => {
    const { nombre, descripcion, precio, imagen_url } = req.body;
    const empresaId = req.usuarioId;  // ID de la empresa autenticada

    // Validar entradas
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const query = 'INSERT INTO productos (nombre, descripcion, precio, imagen_url, id_empresa) VALUES (?, ?, ?, ?, ?)';

    try {
        const [result] = await db.query(query, [nombre, descripcion, precio, imagen_url, empresaId]);
        res.status(201).json({ mensaje: 'Producto creado con éxito' });
    } catch (err) {
        console.error('Error al crear el producto:', err);
        return res.status(500).json({ mensaje: 'Error al crear el producto' });
    }
};

// Obtener productos de la empresa autenticada o todos los productos si no hay filtro
exports.obtenerProductosPorProveedor = async (req, res) => {
    const empresaId = req.query.id_empresa;

    // Query con o sin filtro
    let query = 'SELECT * FROM productos';
    let params = [];

    if (empresaId) {
        query += ' WHERE id_empresa = ?';
        params.push(empresaId);
    }

    try {
        const [results] = await db.query(query, params);
        res.json(results);
    } catch (err) {
        console.error('Error al obtener productos:', err);
        return res.status(500).json({ mensaje: 'Error al obtener productos' });
    }
};

// Obtener producto por ID
exports.obtenerProductoPorId = async (req, res) => {
    const productoId = req.params.id_producto;

    try {
        const [results] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [productoId]);

        if (results.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }

        res.json(results[0]);
    } catch (err) {
        console.error('Error al consultar el producto:', err);
        return res.status(500).json({ mensaje: 'Error al consultar el producto.' });
    }
};

// Actualizar un producto
exports.actualizarProducto = async (req, res) => {
    const { nombre, descripcion, precio, imagen_url, etiqueta, descuento } = req.body;
    const productoId = req.params.id;

    const query = 'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, imagen_url = ?, etiqueta = ?, descuento = ? WHERE id_producto = ? AND id_empresa = ?';

    try {
        const [result] = await db.query(query, [nombre, descripcion, precio, imagen_url, etiqueta, descuento, productoId, req.usuarioId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado o no tiene permiso para editarlo' });
        }
        res.json({ mensaje: 'Producto actualizado con éxito' });
    } catch (err) {
        console.error('Error al actualizar el producto:', err);
        return res.status(500).json({ mensaje: 'Error al actualizar el producto' });
    }
};

// Eliminar un producto
exports.eliminarProducto = async (req, res) => {
    const productoId = req.params.id;

    const query = 'DELETE FROM productos WHERE id_producto = ? AND id_empresa = ?';

    try {
        const [result] = await db.query(query, [productoId, req.usuarioId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado o no tiene permiso para eliminarlo' });
        }
        res.json({ mensaje: 'Producto eliminado con éxito' });
    } catch (err) {
        console.error('Error al eliminar el producto:', err);
        return res.status(500). json({ mensaje: 'Error al eliminar el producto' });
    }
};