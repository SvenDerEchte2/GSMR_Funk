// Stable WebSocket signaling + push-to-talk lock server (improved)
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const rooms = {};        // room -> [ws, ...]
const roomLocks = {};    // room -> { ws, id }
const roomLocksMutex = {}; // room -> boolean, prevents race condition

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (err) {
      console.error("❌ Invalid JSON:", msg);
      return;
    }

    const { type, room, payload, from } = data;

    // --- Join room ---
    if (type === "join") {
      if (!rooms[room]) rooms[room] = [];
      rooms[room].push(ws);
      ws.room = room;
      ws.id = from;
      console.log(`👤 ${from} joined room ${room}`);

      // Notify both sides when 2+ clients exist
      if (rooms[room].length >= 2) {
        broadcast(room, { type: "ready" });
      }

      // Tell new user if room currently locked
      if (roomLocks[room]) {
        ws.send(JSON.stringify({
          type: "lock_granted",
          holder: roomLocks[room].id
        }));
      }
      return;
    }

    // --- WebRTC signaling ---
    if (type === "signal") {
      broadcast(room, { type: "signal", payload }, ws);
      return;
    }

    // --- Request to speak (Push-to-Talk lock) ---
    if (type === "request_lock") {
      if (!roomLocksMutex[room]) roomLocksMutex[room] = false;

      // prevent race condition
      if (!roomLocksMutex[room]) {
        roomLocksMutex[room] = true;

        if (!roomLocks[room]) {
          roomLocks[room] = { ws, id: from };
          console.log(`🔒 Lock granted to ${from} in ${room}`);
          broadcast(room, { type: "lock_granted", holder: from });
        } else if (roomLocks[room].id !== from) {
          ws.send(JSON.stringify({
            type: "busy",
            holder: roomLocks[room].id
          }));
          console.log(`🚫 ${from} tried to talk, busy by ${roomLocks[room].id}`);
        }

        roomLocksMutex[room] = false;
      }
      return;
    }

    // --- Release lock ---
    if (type === "release_lock") {
      if (roomLocks[room] && roomLocks[room].id === from) {
        delete roomLocks[room];
        console.log(`🔓 Lock released by ${from}`);
        broadcast(room, { type: "unlock", holder: from });
      }
      return;
    }
  });

  ws.on("close", () => {
    const room = ws.room;
    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter((c) => c !== ws);
      if (rooms[room].length === 0) {
        delete rooms[room];
        delete roomLocks[room];
        delete roomLocksMutex[room];
      }
    }

    // Free lock if disconnected user was the holder
    if (room && roomLocks[room] && roomLocks[room].ws === ws) {
      delete roomLocks[room];
      broadcast(room, { type: "unlock", holder: "disconnect" });
    }
  });
});

// --- Helper ---
function broadcast(room, data, exclude) {
  if (!rooms[room]) return;
  for (const c of rooms[room]) {
    if (c.readyState === 1 && c !== exclude) {
      c.send(JSON.stringify(data));
    }
  }
}

console.log("✅ Stable signaling server on ws://localhost:8080");
