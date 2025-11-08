// Minimaler WebSocket-Signalisierungsserver mit Push-to-Talk Lock
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const rooms = {};
const roomLocks = {}; // -> Speichert, wer gerade spricht (room -> client ws)

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (err) {
      console.error("❌ Ungültige Nachricht:", msg);
      return;
    }

    const { type, room, payload, from } = data;

    // --- Raum beitreten ---
    if (type === "join") {
      if (!rooms[room]) rooms[room] = [];
      rooms[room].push(ws);
      console.log(`👤 Client joined room ${room} (${rooms[room].length})`);

      // Wenn 2 Clients da sind, senden "ready"
      if (rooms[room].length >= 2) {
        rooms[room].forEach((c) => c.send(JSON.stringify({ type: "ready" })));
      }
      return;
    }

    // --- WebRTC Signal weiterleiten ---
    if (type === "signal") {
      rooms[room]?.forEach((c) => {
        if (c !== ws) c.send(JSON.stringify({ type: "signal", payload }));
      });
      return;
    }

    // --- Push-to-Talk: Lock ---
    if (type === "lock") {
      // Falls der Raum schon belegt ist, sende Ablehnung zurück
      if (roomLocks[room] && roomLocks[room] !== ws) {
        ws.send(JSON.stringify({ type: "busy", room }));
        console.log(`🚫 ${from} wollte sprechen, aber ${room} ist belegt`);
        return;
      }

      // Sonst Lock setzen
      roomLocks[room] = ws;
      console.log(`🔒 Raum ${room} gesperrt durch ${from}`);

      // Allen anderen mitteilen
      rooms[room]?.forEach((c) => {
        if (c !== ws) c.send(JSON.stringify({ type: "lock", from }));
      });
      return;
    }

    // --- Push-to-Talk: Unlock ---
    if (type === "unlock") {
      if (roomLocks[room] === ws) {
        delete roomLocks[room];
        console.log(`🔓 Raum ${room} wieder frei (von ${from})`);

        // Allen mitteilen, dass wieder frei ist
        rooms[room]?.forEach((c) => {
          if (c !== ws) c.send(JSON.stringify({ type: "unlock", from }));
        });
      }
      return;
    }
  });

  ws.on("close", () => {
    for (const r in rooms) {
      rooms[r] = rooms[r].filter((c) => c !== ws);
      if (rooms[r].length === 0) delete rooms[r];
    }

    // Falls jemand die Verbindung verliert, Lock freigeben
    for (const r in roomLocks) {
      if (roomLocks[r] === ws) {
        delete roomLocks[r];
        rooms[r]?.forEach((c) =>
          c.send(JSON.stringify({ type: "unlock", from: "disconnect" }))
        );
      }
    }
  });
});

console.log("✅ Signaling server läuft auf ws://localhost:8080");
