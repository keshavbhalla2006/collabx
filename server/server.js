const http = require('http');//Native Node module to create a server
const { Server } = require('socket.io');//Socket.IO server class
const app = require('./app');//The Express app (routes, middleware)
const { syncDB } = require('./models');//Syncs the database models (Sequelize)
const { initSocket } = require('./sockets');//The custom socket logic 
require('dotenv').config();//Loads environment variables (.env)

const PORT = process.env.PORT || 5000;

const start = async () => { //Async function because DB connection is asynchronous
  await syncDB();//Connect DB and sync tables

  // Create an HTTP server from Express app
  // Socket.IO needs to attach to the HTTP server, not Express directly
  const httpServer = http.createServer(app);


  /*
    Why not just app.listen()?

    Because:
    Express alone handles only HTTP
    Socket.IO needs direct access to the HTTP server
    So  create a shared server:
    One server → handles both REST + WebSockets
  */  

  // Attach Socket.IO to the HTTP server
  const io = new Server(httpServer, {
    cors: { //CORS is configured for frontend
      origin: ['http://localhost:5173','https://collabx-2-e3qp.onrender.com',],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  /*
  CORS BREAKDOWN:
  origin - the frontend (vite default: 5173)
  methods - allowed http methods
  credentials: true - allows cookies/auth headers
  */

  // Initialize all socket event handlers
  initSocket(io);

  // Use httpServer.listen instead of app.listen
  // Both HTTP (REST) and WebSocket traffic go through the same port
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  }); //httpServer = Express + Socket.IO combined
};

start();



//This file is the server startup file (usually called server.js).
//It’s responsible for starting the backend after connecting to the database.
/*
We use httpServer.listen() instead of app.listen() because Socket.IO needs access to the raw HTTP server, not just the Express app.

app.listen() internally creates an HTTP server, but we don’t get direct control over it.
Socket.IO must attach to the same HTTP server instance to handle WebSocket connections.

Because Socket.IO works on top of the HTTP server, we manually create it using http.createServer() and use httpServer.listen() so both Express and WebSockets run on the same server.
This allows both REST APIs and real-time communication to run on the same port.
Using app.listen() would make it harder to integrate Socket.IO cleanly.



When we run:

"node server.js"

start() is called
DB connection is established
Tables are synced
Server starts listening
Your API becomes available
*/
