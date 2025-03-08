let previousPositions = {};
let lastConfirmedPositions = {}; // Guardará la fecha en la que el puesto fue confirmado

gsap.registerPlugin(Flip);

/**
 * Renderiza el ranking y anima la transición con GSAP Flip.
 * @param {Array} newData - Array con los datos del ranking recibido del servidor.
 */
function renderRanking(newData) {
  const rankingList = document.getElementById("ranking");

  // Capturar el estado actual de los elementos
  const state = Flip.getState("#ranking li");

  // Limpiar el contenido actual de la lista
  rankingList.innerHTML = "";

  newData.forEach((item, index) => {
    // Obtenemos la posición anterior
    const prevPos = previousPositions[item.id];
    const now = new Date().toLocaleDateString("es-UY");

    // Calculamos la diferencia de posición solo si prevPos está definido
    const diff = prevPos !== undefined ? prevPos - index : null;

    if (diff !== null && diff !== 0) {
      // Si la diferencia no es cero, almacenamos la fecha de la última confirmación
      if (!lastConfirmedPositions[item.id] || diff !== 0) {
        lastConfirmedPositions[item.id] = now;
      }
    }

    // Generar el HTML para la flecha solo si hay un cambio de posición
    let arrowHTML = "";
    if (diff > 0) {
      // Subió de puesto
      arrowHTML = `<span class="arrow up" data-tooltip="Subió ${diff} puesto${diff > 1 ? "s" : ""}, Desde ${lastConfirmedPositions[item.id]}" data-diff="${diff}" style="opacity: 0;">▲</span>`;
    } else if (diff < 0) {
      // Bajó de puesto
      arrowHTML = `<span class="arrow down" data-tooltip="Bajó ${Math.abs(diff)} puesto${Math.abs(diff) > 1 ? "s" : ""}, Desde ${lastConfirmedPositions[item.id]}" data-diff="${diff}" style="opacity: 0;">▼</span>`;
    }

    const li = document.createElement("li");
    li.id = `item-${item.id}`;
    li.className = "ranking-item";
    li.innerHTML = `
      <div class="item-info">
        <span class="item-rank">${index + 1}</span>
        <span class="item-name">${item.name}</span>
      </div>
      ${arrowHTML}
    `;
    rankingList.appendChild(li);

    // Actualizamos la posición anterior del item
    previousPositions[item.id] = index;
  });

  // Animar la transición de los elementos con Flip
  Flip.from(state, {
    duration: 0.8,
    ease: "power2.inOut",
    absolute: true,
    onComplete: animateArrows,  // Asegúrate de que se ejecute después de la animación de Flip
  });
}

/**
 * Anima las flechas que indican el cambio de posición.
 */
function animateArrows() {
  document.querySelectorAll(".arrow").forEach(arrow => {
    let diff = parseInt(arrow.getAttribute("data-diff"));
    console.log("Diff:", diff);  // Verifica el valor de diff en la consola
    if (diff && diff !== 0) {
      gsap.fromTo(arrow, 
        { opacity: 0, y: diff > 0 ? 10 : -10 }, 
        { opacity: 1, y: 0, duration: 0.5, ease: "bounce.out", 
          onComplete: () => {
            gsap.to(arrow, { opacity: 0, delay: 2, duration: 0.5 });
          }
        }
      );
    }
  });
}

// Conectar al servidor mediante Socket.IO
const socket = io("https://thewildlist-socket-io.onrender.com", { transports: ["websocket", "polling"] });

socket.on("connect", () => {
  console.log("Conectado al servidor de Socket.IO");
});

socket.on("rankingUpdate", (rankingData) => {
  console.log("Ranking actualizado:", rankingData);
  renderRanking(rankingData);
  updateLastUpdatedTime(); // 🔹 Agregar esta línea para actualizar la hora
});

let lastUpdatedTime = document.getElementById("lastUpdate");

function updateLastUpdatedTime() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  });

  lastUpdatedTime.textContent = `Última actualización: ${formatter.format(now)} (UY)`;
}

// Función para solicitar el ranking actualizado al servidor
function fetchUpdatedRanking() {
  socket.emit("requestRanking"); // Solicitar el ranking
}

// Actualizar cada 3 minutos automáticamente
setInterval(fetchUpdatedRanking, 180000); // 180000 ms = 3 minutos

// Pedir el ranking inicial al cargar la página
fetchUpdatedRanking();
