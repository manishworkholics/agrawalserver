const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const validateApiKey = require("./middlewares/api-key-middleware"); // Adjust the path accordingly
const multer = require("multer");
const parentRoutes = require("./routes/parentRoutes");
const teacherRoutes = require("./routes/teacherRoute");
const schoolRoutes = require("./routes/schoolRoutes");
const appuserRoutes = require("./routes/appuserRoutes");
const noticeBoardRoutes = require("./routes/noticeboardRoute");
const categoryRoutes = require("./routes/categoryRoutes");
const pageRoutes = require("./routes/pageRoute");
const appScrollerMsgRoutes = require("./routes/appScrollerMsgRoutes");
const welcomeMsgRoutes = require("./routes/appTopWelcomeMsgRoutes");
const combineRoutes = require("./routes/combinedRoutes");
const msgRoutes = require("./routes/msgRoute");
const scholarRoutes = require("./routes/scholarRoute");
const adminRoutes = require("./routes/adminRoute");
const feesRoutes = require("./routes/feesRoute");
const chatMsgRoutes = require("./routes/chatmessageRoute");
const supportRoutes = require("./routes/supportRoutes");
const sharp = require("sharp");
const fs = require("fs");


const { ChatMessage, msgMasterModel, studentMainDetailModel } = require("./models/associations");
const StudentModel = require("./models/studentModel");


dotenv.config();

const app = express();
const server = http.createServer(app);


app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//************************************************
// ************** CROSS ERROR  **************
//************************************************

const allowedOrigins = [
  "https://webapp.actindore.com",
  "https://apps.actindore.com",
  "http://localhost:3000"
];
 
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log("Request origin:", origin);
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  // Important for preflight requests (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

//************************************************
// Image path access to directory **** IMP TO ACCESS DATA
//************************************************

// Serve static files
app.use("/Uploads/", express.static("Uploads/"));

// Create upload directory if not exists
const uploadPath = path.join(__dirname, "Uploads/image");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer configuration for temporary file storage (memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Image upload route with compression
app.post("/api/v1/admin/imageUpload_Use", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: false, message: "No file uploaded" });
    }

    const filename = `${Date.now()}.jpg`;
    const outputPath = path.join(uploadPath, filename);

    // Compress and save image
    await sharp(req.file.buffer)
      .resize({ width: 1200 }) // optional resize
      .jpeg({ quality: 70 })   // adjust quality (0–100)
      .toFile(outputPath);

    return res.status(200).json({
      status: true,
      message: "Image uploaded and compressed successfully",
      filePath: `/Uploads/image/${filename}`,
    });
  } catch (err) {
    console.error("Image upload error:", err);
    return res.status(500).json({
      status: false,
      message: "Image upload failed",
      error: err.message,
    });
  }
});

app.use("/Uploads/", express.static("Uploads/"));
//Configuration for Multer image and pdf
const imagestorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/image/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + Date.now() + ".png");
  },
});
const imageStorage = multer({ storage: imagestorage }); //For Image
app.use(
  "/api/v1/admin/imageUpload_Use",
  imageStorage.single("file"),
  adminRoutes
);

app.use("/Uploads/", express.static("Uploads/"));

// Configure multer storage
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/pdf/"); // Change folder name to a generic one
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${extension}`);
  },
});



const fileFilter = (req, file, cb) => {
  // Allow all types of documents
  cb(null, true);
};

// Multer instance with storage and file filter
const docUpload = multer({
  storage: docStorage,
  fileFilter,
  // limits: {
  //   fileSize: 5 * 1024 * 1024, // Set a file size limit (5MB)
  // },
});

// Use the upload middleware for the route
app.use(
  "/api/v1/admin/pdfUpload_Use",
  docUpload.single("file"),
  (req, res, next) => {
    if (req.file) {
      next(); // Continue to the next middleware if the file is uploaded
    } else {
      res.status(400).send({ message: "File upload failed or file not provided." });
    }
  },
  adminRoutes
);

// app.use("/Uploads/", express.static("Uploads/"));

// const pdfstorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "Uploads/pdf/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + Date.now() + ".pdf");
//   },
// });

// const pdfStorage = multer({ storage: pdfstorage });

// app.use(
//   "/api/v1/admin/pdfUpload_Use",
//   pdfStorage.single("file"),
//   adminRoutes
// );




const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      console.log("Socket.IO Origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Socket.IO CORS not allowed: " + origin));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});


io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // Join group (room)
  socket.on("join_group", (groupId) => {
    if (groupId) {
      socket.join(groupId);
      console.log(`Socket ${socket.id} joined group ${groupId}`);
    }
  });

  // Leave group (room)
  socket.on("leave_group", (groupId) => {
    if (groupId) {
      socket.leave(groupId);
      console.log(`Socket ${socket.id} left group ${groupId}`);
    }
  });

  // Send message to group
  socket.on("send_message", (newMessage) => {
    const groupId = newMessage.group_id;
    if (groupId) {
      // io.to(groupId).emit("receive_message", newMessage);
      io.emit("receive_message", newMessage);
      console.log(`Message sent to group ${groupId}:`, newMessage);
    }
  });



  // Join individual room (based on group_id or unique identifier)
  socket.on("join_individual", (groupId) => {
    if (groupId) {
      socket.join(groupId);
      console.log(`Socket ${socket.id} joined individual room ${groupId}`);
    }
  });

  // Leave individual room
  socket.on("leave_individual", (groupId) => {
    if (groupId) {
      socket.leave(groupId);
      console.log(`Socket ${socket.id} left individual room ${groupId}`);
    }
  });

  // Send message to individual
  socket.on("send_individual_message", (newMessage) => {
    const receiverGroupId = newMessage.group_id; // Updated to use group_id
    if (receiverGroupId) {
      io.emit("receive_individual_message", newMessage);
      console.log(`Message sent to individual group ${receiverGroupId}:`, newMessage);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// REST API to send a chat message
app.post('/api/chat/send_chat_msg', async (req, res) => {
  const { msg_id, link, sender_id, sender_detail, msg_type, chat_type, mobile_no, group_id, receiver_id, message } = req.body;

  try {
    // Validate required fields
    if (!group_id) {
      return res.status(400).json({
        status: false,
        message: "Group ID is required.",
      });
    }

    // Create a new message
    const newMessage = await ChatMessage.create({
      sender_id,
      sender_detail,
      msg_id,
      mobile_no,
      chat_type,
      group_id,
      link: link || null,
      msg_type: msg_type || "TEXT",
      receiver_id: receiver_id || null,
      message,
    });

    // Emit the new message to the WebSocket
    io.to(group_id).emit("receive_message", newMessage);

    res.status(201).json({
      status: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error.message);
    res.status(500).json({
      status: false,
      message: "An error occurred while sending the message",
      error: error.message,
    });
  }
});


app.post('/api/chat/send_chat_msg_individualssss', async (req, res) => {
  const { msg_id, sender_id, sender_detail, link, msg_type, chat_type, mobile_no, group_id, message, receiverMobileNumbers } = req.body;

  try {
    // Validate receiver group IDs
    const validReceivers = await StudentModel.findAll({
      where: {
        student_family_mobile_number: receiverMobileNumbers.map(num => num.mobilenumber),
      },
    });

    if (validReceivers.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No valid receivers found.' });
    }

    // Step 1: Check if the sender is a group owner (if mobile_no matches with validReceivers)
    const isGroupOwner = validReceivers.some(receiver => receiver.student_family_mobile_number === mobile_no);

    // Step 2: Determine who will receive the message based on whether the sender is a group owner
    let recipients = [];
    if (isGroupOwner) {
      // Group owner sends message to all members
      recipients = validReceivers.map(receiver => receiver.student_family_mobile_number);
      // Emit to all members
      io.to(group_id).emit("receive_individual_message", {
        msg_id,
        msg_type,
        link,
        sender_id,
        sender_detail,
        chat_type,
        mobile_no,
        group_id,
        message,
        receiver_id: JSON.stringify(recipients)
      });
    } else {
      // Other members send message only to group owners
      recipients = validReceivers.filter(receiver => receiver.student_family_mobile_number !== mobile_no)
        .map(receiver => receiver.student_family_mobile_number);
      // Emit to group owners only
      recipients.forEach(receiverMobile => {
        io.to(receiverMobile).emit("receive_individual_message", {
          msg_id,
          msg_type,
          link,
          sender_id,
          sender_detail,
          chat_type,
          mobile_no,
          group_id,
          message,
          receiver_id: JSON.stringify(recipients)
        });
      });
    }

    // Step 3: Save the message in the database for record keeping
    const savedMessage = await ChatMessage.create({
      msg_id,
      msg_type,
      link,
      sender_id,
      sender_detail,
      chat_type,
      mobile_no,
      group_id,
      message,
      receiver_id: JSON.stringify(receiverMobileNumbers) // Store as a JSON string if needed
    });

    // Respond with success
    res.status(201).json({
      status: true,
      data: {
        messages: savedMessage,
      },
    });
  } catch (error) {
    console.error("Error sending individual message:", error);
    res.status(500).json({ status: false, message: 'Failed to send message.' });
  }
});

app.post('/api/chat/send_chat_msg_individuals', async (req, res) => {
  const { msg_id, sender_id, sender_detail, link, msg_type, chat_type, mobile_no, group_id, message, receiverMobileNumbers,private_message } = req.body;

  try {
    // Validate receiver group IDs
    const validReceivers = await StudentModel.findAll({
      where: {
        student_family_mobile_number: receiverMobileNumbers.map(num => num.mobilenumber),
      },
    });

    if (validReceivers.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No valid receivers found.' });
    }
    // Step 2: Create a single ChatMessage entry
    const savedMessage = await ChatMessage.create({
      msg_id,
      msg_type,
      link,
      sender_id,
      sender_detail,
      chat_type,
      mobile_no,
      group_id,
      message,
      private_message,
      receiver_id: JSON.stringify(receiverMobileNumbers) // Store as a JSON string if needed
    });

    io.to(group_id).emit("receive_individual_message", savedMessage);


    // Respond with success
    res.status(201).json({
      status: true,
      data: {
        messages: savedMessage,
      },
    });
  } catch (error) {
    console.error("Error sending individual message:", error);
    res.status(500).json({ status: false, message: 'Failed to send message.' });
  }
});


app.post('/api/chat/send_chat_msg_individualss', async (req, res) => {
  const { msg_id, sender_id, sender_detail, link, msg_type, chat_type, mobile_no, group_id, message, receiverMobileNumbers,private_message } = req.body;

  try {
    // Validate receiver group IDs
    const validReceivers = await StudentModel.findAll({
      where: {
        student_family_mobile_number: receiverMobileNumbers.map(num => num.mobilenumber),
      },
    });

    if (validReceivers.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No valid receivers found.' });
    }
    // Step 2: Create a single ChatMessage entry
    const savedMessage = await ChatMessage.create({
      msg_id,
      msg_type,
      link,
      sender_id,
      sender_detail,
      chat_type,
      mobile_no,
      group_id,
      message,
      private_message,
      receiver_id: JSON.stringify(receiverMobileNumbers) // Store as a JSON string if needed
    });

    


    // Respond with success
    res.status(201).json({
      status: true,
      data: {
        messages: savedMessage,
      },
    });
  } catch (error) {
    console.error("Error sending individual message:", error);
    res.status(500).json({ status: false, message: 'Failed to send message.' });
  }
});





app.use("/api/admin", adminRoutes);
app.use("/api/fees", feesRoutes);
app.use("/api/chat", chatMsgRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/scholar", scholarRoutes);
// app.use('/api/appuser', appuserRoutes);
app.use("/api/notice", noticeBoardRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/appScrollerMsg", appScrollerMsgRoutes);
app.use("/api/welcomemsg", welcomeMsgRoutes);
app.use("/api/combine", combineRoutes);
app.use("/api/msg", msgRoutes);
app.use("/api/supports", supportRoutes);
// app.use('/api/intimation', intimationRoutes);

const PORT = 3550; // hardcoded because you now know it
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});



module.exports = { io };
