const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/iniciar-sesion', authController.iniciarSesion);
router.post('/solicitar-otp', authController.solicitarOTP);
router.post('/verificar-otp', authController.verificarOTP);

module.exports = router;    