const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect('mongodb+srv://alejandro23dev:<yBt1JUy2duhczW7P>@ridehub.w3lqmhg.mongodb.net/?retryWrites=true&w=majority&appName=ridehub', {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

// Modelo de ejemplo
const Item = mongoose.model('Item', {
	name: String,
	description: String,
	createdAt: { type: Date, default: Date.now }
});

// Crear servidor HTTP
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Configurar Socket.io
const io = new Server(httpServer, {
	cors: {
		origin: "*", // En producción, reemplaza con tu dominio de la app Expo
		methods: ["GET", "POST"]
	}
});

// Conexiones Socket.io
io.on('connection', (socket) => {
	console.log('Cliente conectado:', socket.id);

	socket.on('disconnect', () => {
		console.log('Cliente desconectado:', socket.id);
	});
});

// Ruta de autenticación
app.post('/auth/login', async (req, res) => {
	const { email, password } = req.body;

	// Validación básica
	if (!email || !password) {
		return res.status(400).json({
			success: false,
			message: 'Email y contraseña son requeridos'
		});
	}

	try {
		// Buscar usuario por email
		const user = await User.findOne({
			$or: [
				{ email: email },
				{ username: email } // Permite login con username también
			]
		});

		if (!user) {
			return res.status(401).json({
				success: false,
				message: 'Credenciales inválidas'
			});
		}

		// Comparar contraseñas (sin encriptar por ahora - ¡más abajo te explico cómo mejorarlo!)
		if (user.password !== password) {
			return res.status(401).json({
				success: false,
				message: 'Credenciales inválidas'
			});
		}

		// Si todo es correcto, devolver datos básicos del usuario (sin password)
		const userData = {
			id: user._id,
			username: user.username,
			email: user.email,
			createdAt: user.createdAt
		};

		res.json({
			success: true,
			user: userData,
			message: 'Autenticación exitosa'
		});

	} catch (error) {
		console.error('Error en login:', error);
		res.status(500).json({
			success: false,
			message: 'Error en el servidor'
		});
	}
});

// Iniciar servidor
httpServer.listen(PORT, () => {
	console.log(`Servidor corriendo en puerto ${PORT}`);
});