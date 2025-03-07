const express = require('express'); 
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos en la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Datos iniciales del ranking
let rankingData = [
  { id: 1, name: "Juego Alpha" },
  { id: 2, name: "App Beta" },
  { id: 3, name: "Juego Gamma" },
  { id: 4, name: "Hola" },
  { id: 5, name: "App Delta" },
];

io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);
    socket.emit("rankingUpdate", rankingData);
  
    // Evento para recibir cambios manuales del ranking desde el cliente
    socket.on("updateRanking", (newRanking) => {
      rankingData = newRanking;
      io.emit("rankingUpdate", rankingData);
      console.log("Ranking actualizado manualmente:", rankingData);
    });
  
    // Evento para que un cliente solicite el ranking actualizado
    socket.on("requestRanking", () => {
      socket.emit("rankingUpdate", rankingData); // Enviar el ranking actualizado
    });
  
    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });
  

// Inicia el servidor en el puerto definido (3000 por defecto)
const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
