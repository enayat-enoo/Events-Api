# Event Management Api 
  
It is a simple Nodejs + Express + MongoDB (Native Driver) based API for handling events CRUD operations.  
Frontend is not required and the api can be tested using Postman.  

---

## Overview

The API allows user to **create**, **read**, **update** and **delete** events.  
It also supports image upload for each event and list events by latest using pagination.  
  
MongoDB official library is used instead of mongoose.

---

## Tech Used

- Nodejs  
- Express  
- MongoDB native driver  
- Multer (for image upload)  
- Dotenv  

---

## How To Run

1. Clone the repo  
2. install dependancy  
3. setup .env file

4. start the server  
```
node server.js
```


---

## Api Endpoints

| Method | Endpoint | Description |
|---------|-----------|-------------|
| **GET** | `/api/v3/app/events?id=:event_id` | get single event by id |
| **GET** | `/api/v3/app/events?type=latest&limit=5&page=1` | get latest events with pagination |
| **POST** | `/api/v3/app/events` | create new event |
| **PUT** | `/api/v3/app/events/:id` | update event |
| **DELETE** | `/api/v3/app/events/:id` | delete event |








