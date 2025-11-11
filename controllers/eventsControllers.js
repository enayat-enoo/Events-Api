const { ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

// Fallback values
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 100;

// Helpers
function parsePositiveInt(val, fallback) {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

// Helpers
function parseIntIfPossible(val) {
  if (val === undefined || val === null) return undefined;
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? undefined : n;
}

//utility function to safely parse attendees into an array
function parseAttendees(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((x) => (isNaN(x) ? x : Number(x)));
  if (typeof val === "string") {
    if (val.includes(",")) {
      return val
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => (isNaN(x) ? x : Number(x)));
    }
    return [isNaN(val) ? val : Number(val)];
  }
  return [];
}

async function getEvents(req, res) {
  const eventsCollection = req.app.locals.eventsCollection;
  if (!eventsCollection) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
  try {
    const { id, type } = req.query;
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid id" });
      }
      const _id = new ObjectId(id);
      const doc = await eventsCollection.findOne({ _id });
      if (!doc) {
        return res.status(404).json({ message: "Event not found" });
      }
      return res.status(200).json(doc);
    }

    if (type === "latest") {
      const limit = Math.min(
        MAX_LIMIT,
        parsePositiveInt(req.query.limit, DEFAULT_LIMIT)
      );
      const page = Math.max(1, parsePositiveInt(req.query.page, 1));
      const skip = (page - 1) * limit;
      const cursor = eventsCollection
        .find({})
        .sort({ schedule: -1, _id: -1 })
        .skip(skip)
        .limit(limit);

      const items = await cursor.toArray();
      const total = await eventsCollection.countDocuments();

      return res.status(200).json({ page, limit, total, items });
    }

    const fallbackLimit = 50;
    const items = await eventsCollection
      .find({})
      .limit(fallbackLimit)
      .toArray();
    return res.status(200).json({ items });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function createEvent(req, res) {
  const eventsCollection = req.app.locals.eventsCollection;
  if (!eventsCollection) {
    return res.status(500).json({ message: "Internal Server Error" });
  }

  try {
    const b = req.body || {};
    const doc = {
      type: "event",
      uid: parseIntIfPossible(b.uid) ?? b.uid ?? null,
      name: b.name ?? "",
      tagline: b.tagline ?? "",
      schedule: b.schedule
        ? isNaN(Date.parse(b.schedule))
          ? b.schedule
          : new Date(b.schedule)
        : null,
      description: b.description ?? "",
      moderator: b.moderator ?? null,
      category: b.category ?? null,
      sub_category: b.sub_category ?? null,
      rigor_rank: parseIntIfPossible(b.rigor_rank) ?? null,
      attendees: parseAttendees(b.attendees),
      files: {},
      createdAt: new Date(),
    };

    if (req.file) {
      doc.files.image = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/api/v3/app/uploads/${req.file.filename}`,
      };
    }

    const result = await eventsCollection.insertOne(doc);
    return res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function updateEvent(req, res) {
  const eventsCollection = req.app.locals.eventsCollection;
  if (!eventsCollection) {
    return res.status(500).json({ message: "Internal Server Error" });
  }

  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const _id = new ObjectId(id);

    const b = req.body || {};
    const set = {};

    // Only set keys that are present in body
    if ("uid" in b) set.uid = parseIntIfPossible(b.uid) ?? b.uid;
    if ("name" in b) set.name = b.name;
    if ("tagline" in b) set.tagline = b.tagline;
    if ("schedule" in b)
      set.schedule = b.schedule
        ? isNaN(Date.parse(b.schedule))
          ? b.schedule
          : new Date(b.schedule)
        : null;
    if ("description" in b) set.description = b.description;
    if ("moderator" in b) set.moderator = b.moderator;
    if ("category" in b) set.category = b.category;
    if ("sub_category" in b) set.sub_category = b.sub_category;
    if ("rigor_rank" in b) set.rigor_rank = parseIntIfPossible(b.rigor_rank);
    if ("attendees" in b) set.attendees = parseAttendees(b.attendees);

    // handle file replacement
    if (req.file) {
      set["files.image"] = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/api/v3/app/uploads/${req.file.filename}`,
      };
    }

    if (Object.keys(set).length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    // if replacing image, we will need to delete old file after successful update
    let oldFileToRemove = null;
    if (set["files.image"]) {
      const existing = await eventsCollection.findOne({ _id });
      if (
        existing &&
        existing.files &&
        existing.files.image &&
        existing.files.image.filename
      ) {
        oldFileToRemove = existing.files.image.filename;
      }
    }

    const result = await eventsCollection.updateOne({ _id }, { $set: set });
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    // remove old file
    if (oldFileToRemove) {
      try {
        const uploadDir = path.join(__dirname, "..", "uploads");
        const filePath = path.join(uploadDir, oldFileToRemove);
        fs.unlink(filePath, (err) => {
          if (err)
            console.warn("Failed to delete old file:", filePath, err.message);
        });
      } catch (e) {
        console.warn("File cleanup error:", e.message);
      }
    }

    return res.json({
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error("updateEvent error:", err);
    return res
      .status(500)
      .json({ message: "Update failed", details: err.message });
  }
}

async function deleteEvent(req, res) {
  const eventsCollection = req.app.locals.eventsCollection;
  if (!eventsCollection) {
    return res.status(500).json({ message: "Internal Server Error" });
  }

  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const _id = new ObjectId(id);

    const doc = await eventsCollection.findOne({ _id });
    if (!doc) {
      return res.status(404).json({ message: "Event not found" });
    }

    const result = await eventsCollection.deleteOne({ _id });
    if (result.deletedCount === 0) {
      return res.status(500).json({ message: "Delete failed" });
    }

    try {
      if (doc.files && doc.files.image && doc.files.image.filename) {
        const uploadDir = path.join(__dirname, "..", "uploads");
        const filePath = path.join(uploadDir, doc.files.image.filename);
        fs.unlink(filePath, (err) => {
          if (err)
            console.warn("Failed to delete file:", filePath, err.message);
        });
      }
    } catch (e) {
      console.warn("File cleanup error:", e.message);
    }

    return res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    console.error("deleteEvent error:", err);
    return res
      .status(500)
      .json({ message: "Delete failed", details: err.message });
  }
}

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};
