const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const pool = require('./db');
const bcrypt = require('bcrypt');
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const { Resend } = require('resend');

require('dotenv').config();

const resend = new Resend(process.env.RESEND_KEY);

app.use(cors());
app.use(express.json());

// Routes
app.get('/connectToApi', (req, res) => {
	try {
		res.status(200).json({
			error: 0,
			msg: "success"
		});
	} catch (err) {
		res.status(404).json({
			error: 404,
			msg: "connection failed"
		});
	}
});

// app.get("/", async (req, res) => {
//     const { data, error } = await resend.emails.send({
//         from: "Acme <onboarding@resend.dev>",
//         to: ["alejandro23dev@gmail.com"],
//         subject: "hello world",
//         html: "<strong>it works!</strong>",
//     });

//     if (error) {
//         return res.status(400).json({ error });
//     }

//     res.status(200).json({ data });
// });

app.post('/loginProcess', async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({
				error: 400,
				msg: "Email y contraseña son requeridos"
			});
		}

		const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

		console.log(rows)

		if (rows.length === 0) {
			return res.status(401).json({
				error: 401,
				msg: "Credenciales inválidas"
			});
		}

		const user = rows[0];

		const isMatch = await bcrypt.compare(password, user.password);
		//const isMatch = password == user.password;

		if (!isMatch) {
			return res.status(401).json({
				error: 401,
				msg: "Credenciales inválidas"
			});
		}

		res.status(200).json({
			error: 0,
			msg: "Login exitoso",
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
			}
		});

	} catch (err) {
		console.error('Error en loginProcess:', err);
		res.status(500).json({
			error: 500,
			msg: "Error en el servidor"
		});
	}
});

app.post('/registerProcess', async (req, res) => {
	try {
		const { username, email, password } = req.body;

		// 1. Validación de campos
		if (!username || !email || !password) {
			return res.status(400).json({
				error: 400,
				msg: "Todos los campos son requeridos"
			});
		}

		// 2. Verificar si el usuario ya existe
		const [existingUser] = await pool.query(
			'SELECT * FROM users WHERE email = ? OR username = ?',
			[email, username]
		);

		if (existingUser.length > 0) {
			return res.status(409).json({
				error: 409,
				msg: "Correo o nombre de usuario no disponibles"
			});
		}

		// 3. Hash de la contraseña
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

		const [result] = await pool.query(
			'INSERT INTO users (username, email, password, created) VALUES (?, ?, ?, ?)',
			[username, email, hashedPassword, currentDate]
		);


		// 6. Respuesta exitosa
		res.status(201).json({
			error: 0,
			msg: "Registro exitoso",
			user: {
				id: result.insertId,
				username,
				email
			},
		});

	} catch (err) {
		console.error('Error en registerProcess:', err);
		res.status(500).json({
			error: 500,
			msg: "Error en el servidor al registrar usuario"
		});
	}
});

httpServer.listen(PORT, () => {
	console.log(`Servidor corriendo en http://localhost:${PORT}`);
});