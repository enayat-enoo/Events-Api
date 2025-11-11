# 🧩 Event Management API (Node.js + MongoDB)

A schema-free RESTful API for managing events, built using **Node.js**, **Express**, and the **MongoDB native driver** (without Mongoose).  
This project supports **full CRUD operations**, **image uploads**, and **pagination**.

---

## 🚀 Features

✅ **MongoDB Native Driver (No Mongoose)** — flexible, schema-free document handling.  
✅ **Full CRUD** — Create, Read, Update, and Delete event data.  
✅ **File Uploads (Multer)** — Upload event images and serve them statically.  
✅ **Pagination** — Retrieve recent events via `type=latest` with `limit` and `page`.  
✅ **Error Handling** — Proper 400 / 404 / 500 responses for all routes.  
✅ **File Cleanup** — Automatically deletes old images when updated or deleted.  
✅ **Environment Configurable** — All credentials stored in `.env`.

---


## ⚙️ Tech Stack

| Layer | Technology |
|--------|-------------|
| **Runtime** | Node.js  |
| **Framework** | Express.js |
| **Database** | MongoDB (Native Driver) |
| **File Uploads** | Multer |
| **Environment Config** | dotenv |
| **Testing** | Postman / cURL |

---

## 🧩 API Endpoints

### **1️⃣ Create Event**
**POST** `/api/v3/app/events`

Create a new event with optional image upload.

**Request Type:** `multipart/form-data`  
**Fields:**
| Field | Type | Required | Description |
|--------|------|-----------|-------------|
| `name` | String | ✅ Yes | Event name |
| `tagline` | String | Optional | Tagline or subtitle |
| `schedule` | ISO String / Timestamp | ✅ Yes | Event date/time |
| `description` | String | Optional | Event description |
| `moderator` | String | Optional | Event host/moderator |
| `category` | String | Optional | Main category |
| `sub_category` | String | Optional | Subcategory |
| `rigor_rank` | Number | Optional | Difficulty / rank |
| `attendees` | Array or CSV | Optional | Attendee IDs |
| `image` | File | Optional | Event image |

# Create event
curl -X POST "http://localhost:3000/api/v3/app/events" \
  -F "name=Dev Meetup" \
  -F "schedule=2025-12-01T18:00:00Z" \
  -F "image=@/path/to/image.jpg"

# Get event by ID
curl "http://localhost:8000/api/v3/app/events?id=<event_id>"

# Update event
curl -X PUT "http://localhost:8000/api/v3/app/events/<event_id>" \
  -F "tagline=Updated tagline" \
  -F "image=@/path/to/new.jpg"

# Delete event
curl -X DELETE "http://localhost:3000/api/v3/app/events/<event_id>"



