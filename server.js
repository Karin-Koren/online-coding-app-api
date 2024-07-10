const { MongoClient } = require("mongodb");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
require("dotenv").config({ path: "./config.env" });
const codeBlocks = require("./codeBlocks");

const dbName = "coding_app";
const Db = process.env.ATLAS_URI;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "[online-coding-app-client-production.up.railway.app]",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

//const PORT = process.env.PORT || 3000;
const SOCKET_IO_PORT = process.env.PORT || 3001;

// Start the server
server.listen(SOCKET_IO_PORT, () => {
  console.log(`Server listening on port ${SOCKET_IO_PORT}`);
});

const mentors = new Map(); // To keep track of mentors by room

// Socket.IO event handling
io.on("connection", (socket) => {
  console.log(`user conncted: ${socket.id}`);

  // When a user joins a room
  socket.on("join", ({ room, userId }) => {
    if (!room || !userId) {
      console.log("Room or userId is undefined", { room, userId });
      return;
    }
    socket.join(room);
    console.log(`User ${userId} with socket ${socket.id} joined room ${room}`);

    // Check if the user is the mentor or a student
    if (!mentors.has(room)) {
      console.log(`User ${userId} with socket ${socket.id} is the mentor`);
      mentors.set(room, { mentorId: userId, mentorSocketId: socket.id });
      io.to(socket.id).emit("role", "mentor");
    } else if (mentors.get(room).mentorId === userId) {
      console.log(`User ${userId} reconnected as the mentor`);
      mentors.get(room).mentorSocketId = socket.id;
      io.to(socket.id).emit("role", "mentor");
    } else {
      console.log(`User ${userId} with socket ${socket.id} is a student`);
      io.to(socket.id).emit("role", "student");
    }

    // Update student count in the room
    const studentsInRoom = io.sockets.adapter.rooms.get(room).size - 1;
    io.to(room).emit("studentCount", studentsInRoom);
  });

  // When code is changed in a room
  socket.on("codeChange", (data) => {
    if (!data.room) {
      console.log("Room is undefined in codeChange", data);
      return;
    }

    // Find the corresponding code block
    const codeBlock = codeBlocks.find((block) => block.id === data.room);
    if (codeBlock && data.code.trim() === codeBlock.solution.trim()) {
      io.to(data.room).emit("correctSolution");
    }

    // Broadcast code update to all clients in the room
    socket.broadcast.to(data.room).emit("codeUpdate", data.code);
  });

  // When a user leaves a room
  socket.on("leaveRoom", ({ room, userId }) => {
    socket.leave(room);
    console.log(`User ${userId} left room: ${room}`);

    // Check if the user leaving is the mentor
    let roomToDelete = null;
    let isMentor = false;

    for (const [room, mentor] of mentors.entries()) {
      if (mentor.mentorSocketId === socket.id) {
        roomToDelete = room;
        isMentor = true;
        break;
      }
    }

    // Handle mentor leaving the room
    if (isMentor && roomToDelete) {
      console.log(`Mentor left room ${roomToDelete}`);
      mentors.delete(roomToDelete);
      io.to(roomToDelete).emit("mentorLeft");
    }

    // Update student count in the room
    const roomData = io.sockets.adapter.rooms.get(room);
    const studentsInRoom = roomData ? roomData.size - 1 : 0;
    io.to(room).emit("studentCount", studentsInRoom);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected " + socket.id);
  });
});

// Upload initial code blocks to MongoDB
async function uploadCodeBlocks(codeBlocks) {
  const client = new MongoClient(Db);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    // Access database
    const database = client.db(dbName);

    // Access the collection for code blocks
    const codeBlocksCollection = database.collection("code_blocks");

    // Insert initial code blocks if the collection is empty
    const count = await codeBlocksCollection.countDocuments({});
    if (count === 0) {
      await codeBlocksCollection.insertMany(codeBlocks);
      console.log("Initial code blocks uploaded to MongoDB");
    } else {
      console.log("Code blocks already exist in MongoDB");
    }

    // Define endpoint to fetch code blocks
    app.get("/codeblocks", async (req, res) => {
      try {
        // Fetch all code blocks
        const getCodeBlocks = await codeBlocksCollection.find({}).toArray();
        res.json(getCodeBlocks);
      } catch (error) {
        console.error("Error fetching code blocks from MongoDB:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
  //finally {
  //   // Close the connection
  //   //await client.close(); //TODO
  //   console.log("MongoDB connection closed");
  // }
}

uploadCodeBlocks(codeBlocks);

const HTTP_SERVER_PORT = process.env.PORT || 3002;
// Start the Express server
app.listen(HTTP_SERVER_PORT, () => {
  console.log(`HTTP server running on port ${HTTP_SERVER_PORT}`);
});
