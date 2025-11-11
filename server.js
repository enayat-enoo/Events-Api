const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const connectToDB = require("./db/dbConfig");
const router = require("./routes/events");
const path = require("path");
const fs = require("fs");

//config
const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

if (!MONGODB_URI || !DB_NAME) {
  console.error("Missing MONGODB_URI or DB_NAME in .env");
  process.exit(1);
}

// image upload directory
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

async function startServer() {
  const client = await connectToDB(MONGODB_URI);
  const db = client.db(DB_NAME);
  const eventsCollection = db.collection("events");

  try {
    await eventsCollection.createIndex({ schedule: -1 });
  } catch (e) {
    console.warn("Index create warning:", e.message);
  }

  //express instance
  const app = express();
  app.use(express.json()); //Parse JSON
  app.use(express.urlencoded({ extended: true })); //Parse URL-encoded

  // Make the collection available to controllers via req.app.locals
  app.locals.eventsCollection = eventsCollection;

  //middleware
  app.use("/api/v3/app/uploads", express.static(uploadsDir));
  app.use("/api/v3/app", router(eventsCollection));
 
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Shutting down...");
    server.close();
    try {
      await client.close();
      console.log("Mongo client closed.");
    } catch (e) {
      console.warn("Error closing Mongo client:", e.message);
    }
    process.exit(0);
  });
}

startServer().catch((err) => {
  console.error("Failed to start", err);
  process.exit(1);
});
