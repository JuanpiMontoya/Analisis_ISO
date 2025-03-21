const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');  
const nodemailer = require('nodemailer');

// Configurar transporte de Nodemailer con Gmail
// (Recomendable crear una cuenta específica para esto)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,        // Tu correo Gmail
    pass: process.env.EMAIL_PASSWORD     // La contraseña de aplicación (no tu contraseña normal)
  }
});
 
// Lógica para iniciar sesión (modificada para OTP)
exports.iniciarSesion = async (req, res) => {
    const { email, password, userType } = req.body;

    if (userType !== 'negocio' && userType !== 'empresa') {
        return res.status(400).json({ mensaje: 'Tipo de usuario no válido' });
    }

    const queryTable = userType === 'negocio' ? 'negocios' : 'empresas';
    const idColumn = userType === 'negocio' ? 'id_negocio' : 'id_empresa';

    try {
        const [userResult] = await db.query(`SELECT * FROM ${queryTable} WHERE correo = ?`, [email]);

        if (!userResult || userResult.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const user = userResult[0];  

        console.log('Usuario encontrado:', user);

        const match = await bcrypt.compare(password, user.contrasenia);
        console.log('Resultado de comparación de contraseñas:', match);

        if (!match) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        // En lugar de generar el token inmediatamente, indicamos que se requiere OTP
        // y almacenamos temporalmente la información del usuario
        res.json({
            requireOTP: true,
            userId: user[idColumn],
            userType
        });
        
        // Opcionalmente, iniciar automáticamente el proceso OTP
        await generateAndSendOTP(email, userType, user[idColumn]);
        
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

async function generateAndSendOTP(email, userType, userId) {
    try {
        // Generar código OTP (6 dígitos)
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Establecer tiempo de expiración (5 minutos)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);
        
        console.log('Intentando eliminar OTPs antiguos para:', email);
        // Guardar en la base de datos
        // Primero verificar si ya existe un OTP para este usuario y eliminarlo
        await db.query('DELETE FROM otp_codes WHERE email = ?', [email]);
        
        console.log('Insertando nuevo OTP para:', email);
        // Insertar nuevo OTP
        await db.query(
            'INSERT INTO otp_codes (email, code, user_type, user_id, expires_at) VALUES (?, ?, ?, ?, ?)',
            [email, otpCode, userType, userId, expiresAt]
        );
        
        console.log('Enviando correo a:', email);
        // Enviar correo con Nodemailer
        try {
            const mailOptions = {
                from: '"Merka" <' + process.env.EMAIL_USER + '>',
                to: email,
                subject: 'Código de Verificación para Iniciar Sesión',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2>Código de Verificación</h2>
                        <p>Hola,</p>
                        <p>Has solicitado iniciar sesión en tu cuenta. Tu código de verificación es:</p>
                        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
                            <strong>${otpCode}</strong>
                        </div>
                        <p>Este código expirará en 5 minutos. Si no has solicitado este código, por favor ignora este correo.</p>
                        <p>Saludos,<br>El equipo de Merka</p>
                    </div>
                `
            };
            
            const info = await transporter.sendMail(mailOptions);
            console.log('Correo enviado exitosamente:', info.messageId);
            return true;
        } catch (sendError) {
            console.error('Error al enviar email con Nodemailer:', sendError);
            throw new Error(`Error al enviar email: ${sendError.message || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error detallado al generar/enviar OTP:', error);
        throw error; 
    }
}


exports.solicitarOTP = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            mensaje: 'Correo electrónico no proporcionado' 
        });
    }
    
    try {
        // Verificar si el usuario existe
        const [negocioResult] = await db.query('SELECT id_negocio FROM negocios WHERE correo = ?', [email]);
        const [empresaResult] = await db.query('SELECT id_empresa FROM empresas WHERE correo = ?', [email]);
        
        let userId, userType;
        
        if (negocioResult && negocioResult.length > 0) {
            userId = negocioResult[0].id_negocio;
            userType = 'negocio';
        } else if (empresaResult && empresaResult.length > 0) {
            userId = empresaResult[0].id_empresa;
            userType = 'empresa';
        } else {
            return res.status(404).json({ 
                success: false, 
                mensaje: 'Usuario no encontrado' 
            });
        }
        
        // Generar y enviar nuevo OTP
        try {
            const success = await generateAndSendOTP(email, userType, userId);
            
            if (success) {
                res.json({ 
                    success: true, 
                    mensaje: 'Código OTP enviado correctamente' 
                });
            } else {
                throw new Error('Error al enviar código OTP');
            }
        } catch (otpError) {
            console.error('Error específico en generateAndSendOTP:', otpError);
            res.status(500).json({ 
                success: false, 
                mensaje: 'Error al enviar correo con OTP',
                error: otpError.message 
            });
        }
        
    } catch (error) {
        console.error('Error al solicitar OTP:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al generar código de verificación',
            error: error.message
        });
    }
};

// Método para verificar OTP
exports.verificarOTP = async (req, res) => {
    const { email, otpCode } = req.body;
    
    if (!email || !otpCode) {
        return res.status(400).json({ 
            success: false, 
            mensaje: 'Correo electrónico y código OTP son requeridos' 
        });
    }
    
    try {
        // Buscar OTP en la base de datos
        const [otpResult] = await db.query(
            'SELECT * FROM otp_codes WHERE email = ? ORDER BY expires_at DESC LIMIT 1', 
            [email]
        );
        
        if (!otpResult || otpResult.length === 0) {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'No se encontró ningún código OTP para este correo' 
            });
        }
        
        const otpData = otpResult[0];
        
        // Verificar si el OTP ha expirado
        if (new Date() > new Date(otpData.expires_at)) {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'El código OTP ha expirado' 
            });
        }
        
        // Verificar si el código coincide
        if (otpData.code !== otpCode) {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'Código OTP incorrecto' 
            });
        }
        
        // Eliminar OTP usado
        await db.query('DELETE FROM otp_codes WHERE email = ?', [email]);
        
        // Generar token JWT para autenticación completa
        const token = jwt.sign(
            { id: otpData.user_id }, 
            'secreto', 
            { expiresIn: '1h' }
        );
        
        // Devolver información de sesión
        res.json({
            success: true,
            token,
            userId: otpData.user_id,
            userType: otpData.user_type
        });
        
    } catch (error) {
        console.error('Error al verificar OTP:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al verificar código OTP' 
        });
    }
};