import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messages.js";
import chatroomRoutes from "./routes/chatrooms.js";
import http from "http";
import { Server } from "socket.io";
const cookieSession = require("cookie-session");
const multer = require('multer');

/* App Config */
const app = express();
const port = process.env.PORT || 5000;
dotenv.config();

/* Middleware -> Deals the Connections between database and the App */
app.use(express.json());
app.use(cors());


/* Socket.io Setup */
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  //when connect
  console.log("One User Got Connected.");

  //take userId and socketId from user
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  //send and get message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    io.to(user?.socketId).emit("getMessage", {
      senderId,
      text,
    });
  });

  //when disconnect
  socket.on("disconnect", () => {
    console.log("One User Got Disconnected!");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

/* API Routes -> The first part is the default path for all the requests in that users.js file there we have to continue from this path */
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chatrooms", chatroomRoutes);
app.use("/api/messages", messageRoutes);
app.use("/photo", express.static("images"));

/* Database Connection */
mongoose.connect(
  process.env.MONGO_URL,
  {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("MONGODB CONNECTED");
  }
);

app.get("/",(req,res)=>{
  res.send("Welcome to the AmigoChat API")
})

const upload = multer({ dest: 'uploads/' });

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "bezkoder-session",
    keys: ["COOKIE_SECRET"], // should use as secret environment variable
    httpOnly: true,
    sameSite: 'strict'
  })
);

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const file = req.file; // Contains file information
    // You can access file metadata like file.filename, file.originalname, etc.

    // Store file metadata in your database
    const fileMetadata = {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      userId: req.userId, // Include the user ID who uploaded the file
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert the file metadata into the 'files' table
    connection.query('INSERT INTO files SET ?', fileMetadata, (error, results) => {
      if (error) {
        console.error('Error storing file metadata:', error);
        res.status(500).json({ error: 'Failed to store file metadata.' });
      } else {
        res.status(200).json({ message: 'File uploaded successfully!', file });
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file.' });
  }
});

function initial() {
  Role.create({
    id: 1,
    name: "user",
  });

  Role.create({
    id: 2,
    name: "moderator",
  });

  Role.create({
    id: 3,
    name: "admin",
  });
}

// Define an endpoint to retrieve file metadata
app.get('/api/files/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  connection.query('SELECT * FROM files WHERE id = ?', [fileId], (error, results) => {
    if (error) {
      console.error('Error retrieving file metadata:', error);
      res.status(500).json({ error: 'Failed to retrieve file metadata.' });
    } else if (results.length === 0) {
      res.status(404).json({ error: 'File not found.' });
    } else {
      res.status(200).json(results[0]);
    }
  });
});

/* Port Listening In */
server.listen(port, () => {
  console.log("Server is running in PORT 5000");
});
