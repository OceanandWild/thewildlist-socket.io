const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos en la carpeta "public"
app.use(express.static(path.join(__dirname, "public")));

// Datos iniciales del ranking con historial de posiciones
let rankingData = [
  { id: 1, name: "Juego Alpha", lastPosition: 0, dateConfirmed: new Date() },
  { id: 2, name: "App Beta", lastPosition: 1, dateConfirmed: new Date() },
  { id: 3, name: "Juego Gamma", lastPosition: 2, dateConfirmed: new Date() },
  { id: 4, name: "Hola", lastPosition: 5, dateConfirmed: new Date() },
  { id: 5, name: "App Delta", lastPosition: 4, dateConfirmed: new Date() },
];

/**
 * Compara el ranking actual con el nuevo para detectar cambios de posición.
 * @param {Array} newRanking - Nuevo ranking recibido del cliente.
 */
function compareRankings(newRanking) {
  let changes = [];

  newRanking.forEach((item, newIndex) => {
    let oldItem = rankingData.find((old) => old.id === item.id);
    if (oldItem && oldItem.lastPosition !== newIndex) {
      let diff = oldItem.lastPosition - newIndex;
      let now = new Date();

      changes.push({
        id: item.id,
        name: item.name,
        diff: diff,
        dateConfirmed: oldItem.lastPosition === newIndex ? oldItem.dateConfirmed : now,
      });

      // Actualizar la posición en el historial
      item.lastPosition = newIndex;
      item.dateConfirmed = oldItem.lastPosition === newIndex ? oldItem.dateConfirmed : now;
    }
  });

  return { newRanking, changes };
}

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);
  socket.emit("rankingUpdate", rankingData);

  // Evento para recibir cambios manuales del ranking desde el cliente
  socket.on("updateRanking", (newRanking) => {
    const { newRanking: updatedRanking, changes } = compareRankings(newRanking);

    rankingData = updatedRanking;

    io.emit("rankingUpdate", rankingData);
    io.emit("rankingChanges", changes); // Enviar solo los cambios detectados
    console.log("Ranking actualizado:", rankingData);
    console.log("Cambios detectados:", changes);
  });

  // Evento para que un cliente solicite el ranking actualizado
  socket.on("requestRanking", () => {
    socket.emit("rankingUpdate", rankingData);
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
