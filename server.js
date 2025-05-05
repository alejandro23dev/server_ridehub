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

  // Puedes agregar más eventos personalizados aquí
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Cliente ${socket.id} se unió a la sala ${room}`);
  });
});

// Rutas de la API
app.get('/items', async (req, res) => {
  const items = await Item.find().sort({ createdAt: -1 });
  res.json(items);
});

app.post('/items', async (req, res) => {
  const newItem = new Item(req.body);
  await newItem.save();
  
  // Emitir evento a todos los clientes conectados
  io.emit('new_item', newItem);
  
  res.status(201).json(newItem);
});

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});