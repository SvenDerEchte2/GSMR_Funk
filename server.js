// Minimaler WebSocket-Signalisierungsserver
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const rooms = {};

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    const { type, room, payload } = data;

    if (type === "join") {
      if (!rooms[room]) rooms[room] = [];
      rooms[room].push(ws);
      console.log(`Client joined room ${room}`);

      // Wenn 2 Clients da sind, starten
      if (rooms[room].length === 2) {
        rooms[room].forEach((c) => c.send(JSON.stringify({ type: "ready" })));
      }
    }

    if (type === "signal") {
      // Weiterleiten an anderen Client im Raum
      rooms[room].forEach((c) => {
        if (c !== ws) c.send(JSON.stringify({ type: "signal", payload }));
      });
    }
  });

  ws.on("close", () => {
    for (const r in rooms) {
      rooms[r] = rooms[r].filter((c) => c !== ws);
      if (rooms[r].length === 0) delete rooms[r];
    }
  });
});

console.log("Signaling server läuft auf ws://localhost:8080");
