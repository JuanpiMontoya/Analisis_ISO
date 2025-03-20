const bcrypt = require('bcryptjs');
const db = require('../db');  // Conexión a la base de datos
const { body, validationResult } = require('express-validator');

// Middleware para validar entradas al crear un negocio
const validateCreateBusiness = [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio.'),
    body('correo').isEmail().withMessage('El correo debe ser un email válido.'),
    body('contrasenia').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    body('latitud').isFloat().withMessage('La latitud debe ser un número.').optional(),
    body('longitud').isFloat().withMessage('La longitud debe ser un número.').optional(),
    body('contacto').notEmpty().withMessage('El contacto es obligatorio.'),
];

// Crear un nuevo negocio 
exports.crearNegocio = async (req, res) => {
    const { nombre, informacion, correo, contrasenia, latitud, longitud, contacto } = req.body;
    const foto = req.file ? req.file.buffer : null; // Obtener el buffer de la imagen

    const saltRounds = 10;

    // Validar entradas
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Hasheamos la contraseña
        const hashedPassword = await bcrypt.hash(contrasenia, saltRounds);

        const query = 'INSERT INTO negocios (nombre, correo, contrasenia, informacion, latitud, longitud, contacto, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(query, [nombre, correo, hashedPassword, informacion, latitud, longitud, contacto, foto]);
        
        res.status(201).json({ mensaje: 'Negocio creado con éxito' });
    } catch (err) {
        console.error('Error al crear el negocio:', err);
        return res.status(500).json({ mensaje: 'Error al crear el negocio.' });
    }
};

// Obtener negocios
exports.obtenerNegocios = async (req, res) => {
    const query = 'SELECT * FROM negocios';

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error('Error al obtener negocios:', err);
        return res.status(500).json({ mensaje: 'Error al obtener negocios.' });
    }
};

// Obtener negocio por ID
exports.obtenerNegocioPorId = async (req, res) => {
    const negocioId = req.params.id_negocio;

    // Validar que el ID del negocio sea un número entero
    if (!Number.isInteger(Number(negocioId))) {
        return res.status(400).json({ mensaje: 'El ID del negocio debe ser un número entero.' });
    }

    try {
        const [results] = await db.query('SELECT * FROM negocios WHERE id_negocio = ?', [negocioId]);

        if (results.length === 0) {
            return res.status(404).json({ mensaje: 'Negocio no encontrado.' });
        }

        const negocio = results[0];

        if (negocio.foto) {
            negocio.foto = `data:image/png;base64,${negocio.foto.toString('base64')}`;
        }
        
        res.json(negocio);
    } catch (err) {
        console.error('Error al consultar el negocio:', err);
        return res.status(500).json({ mensaje: 'Error al consultar el negocio.' });
    }
};

// Actualizar negocio
exports.actualizarNegocio = async (req, res) => {
    const negocioId = req.params.id_negocio;
    const { nombre, informacion, correo, contrasenia, latitud, longitud, contacto } = req.body;
    const foto = req.file ? req.file.buffer : null; // Obtener la imagen si existe

    try {
        // Primero verificamos si el negocio existe
        const [negocioExistente] = await db.query('SELECT * FROM negocios WHERE id_negocio = ?', [negocioId]);

        if (negocioExistente.length === 0) {
            return res.status(404).json({ mensaje: 'Negocio no encontrado' });
        }

        // Preparamos los campos a actualizar
        let updateFields = [];
        let updateValues = [];

        if (nombre) {
            updateFields.push('nombre = ?');
            updateValues.push(nombre);
        }
        if (informacion) {
            updateFields.push('informacion = ?');
            updateValues.push(informacion);
        }
        if (correo) {
            updateFields.push('correo = ?');
            updateValues.push(correo);
        }
        if (contrasenia) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(contrasenia, saltRounds);
            updateFields.push('contrasenia = ?');
            updateValues.push(hashedPassword);
        }
        if (latitud) {
            updateFields.push('latitud = ?');
            updateValues.push(latitud);
        }
        if (longitud) {
            updateFields.push('longitud = ?');
            updateValues.push(longitud);
        }
        if (contacto) {
            updateFields.push('contacto = ?');
            updateValues.push(contacto);
        }
        if (foto) {
            updateFields.push('foto = ?');
            updateValues.push(foto);
        }

        // Si no hay campos para actualizar
        if (updateFields.length === 0) {
            return res.status(400).json({ mensaje: 'No se proporcionaron campos para actualizar' });
        }

        // Construimos la consulta SQL
        const query = `
            UPDATE negocios 
            SET ${updateFields.join(', ')}
            WHERE id_negocio = ?
        `;

        // Añadimos el id_negocio a los valores
        updateValues.push(negocioId);

        // Ejecutamos la actualización
        const [result] = await db.query(query, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se pudo actualizar el negocio' });
        }

        res.json({
            mensaje: 'Negocio actualizado exitosamente',
            negocioId: negocioId
        });
    } catch (err) {
        console.error('Error al actualizar el negocio:', err);
        res.status(500).json({
            mensaje: 'Error al actualizar el negocio',
            error: err.message
        });
    }
};

// Eliminar un negocio
exports.eliminarNegocio = async (req, res) => {
    const negocioId = req.params.id_negocio;

    const query = 'DELETE FROM negocios WHERE id_negocio = ?';

    try {
        const [result] = await db.query(query, [negocioId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Negocio no encontrado' });
        }
        res.json({ mensaje: 'Negocio eliminado con éxito' });
    } catch (err) {
        console.error('Error al eliminar el negocio:', err);
        return res.status(500).json({ mensaje: 'Error al eliminar el negocio', error: err.message });
    }
};