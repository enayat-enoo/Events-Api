const express = require("express");
const upload = require("../middleware/upload");
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventsControllers");

module.exports = function (eventsCollection) {
  const router = express.Router();
  //Registering routes
  router.get("/events", getEvents);
  router.post("/events", upload.single("image"), createEvent);
  router.put("/events/:id", upload.single("image"), updateEvent);
  router.delete("/events/:id", deleteEvent);
  return router;
};
