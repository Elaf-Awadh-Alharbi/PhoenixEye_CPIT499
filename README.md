# Phoenix Eye

Phoenix Eye is an AI-powered road hazard detection system designed to identify roadkill incidents and assist authorities in responding quickly to wildlife-related road hazards.

The system combines Artificial Intelligence, a citizen reporting mobile application, and a monitoring dashboard used by authorities to detect, verify, and manage road incidents efficiently.

---

# Problem

Roadkill incidents on highways and roads can:

- Cause serious traffic accidents
- Endanger drivers
- Harm wildlife populations
- Take time for authorities to detect and respond

Currently, there is no automated system that helps detect and manage these incidents in real time.

Phoenix Eye aims to solve this problem using AI and a connected reporting system.

---

# Solution Overview

Phoenix Eye provides a full ecosystem consisting of:

1. **Citizen Mobile Application**
2. **AI Detection System**
3. **Backend API**
4. **Authority Dashboard**

Citizens can report incidents using the mobile app, while AI detection helps analyze images to determine whether roadkill is present.

Authorities can then verify the report and dispatch drones if needed.

---

# System Architecture

```
Citizen Mobile App
        │
        │ Submit Report (Image + Location)
        ▼
Backend API (Node.js)
        │
        │ Store Report
        ▼
PostgreSQL Database
        │
        │
        ├── AI Detection Service
        │       (Python + YOLO)
        │
        ▼
Admin Dashboard (React)
        │
        │ Verify Report
        ▼
Drone Deployment
```

---

# Project Components

## 1 Mobile Application

Developed using **Flutter**.

Features:

- User registration
- Image upload (camera or gallery)
- GPS location detection
- Map location selection
- Animal type selection
- Report submission
- Confirmation screen

The mobile application allows citizens to easily report roadkill incidents.

---

## 2 AI Detection System

The AI component detects roadkill using computer vision.

Technology used:

- Python
- YOLOv8 (Ultralytics)
- CUDA GPU acceleration
- Label Studio for annotation

Dataset:

- 146 labeled images of roadkill
- Bounding box annotations in YOLO format
- Various road environments and lighting conditions

Current status:

The model is trained and functional but still produces some false positives. Further dataset expansion and training improvements are planned.

For the demo version, **Gemini AI analysis is used to assist detection**, while the YOLO model continues to be improved.

---

## 3 Backend System

The backend handles all system logic and APIs.

Technology:

- Node.js
- Express.js
- REST API architecture

Main responsibilities:

- User authentication
- Report submission
- Image upload
- Status management
- Drone assignment
- Data communication between AI and dashboard

---

## 4 Database

Database used:

PostgreSQL

Stored data includes:

- Users
- Reports
- Images
- GPS locations
- Drone information
- Report status

---

## 5 Authority Dashboard

The dashboard allows authorities to monitor and manage reports.

Technology:

- React.js
- Tailwind CSS
- Axios

Dashboard features:

- Reports management
- Status verification
- Drone assignment
- Location map visualization
- Analytics dashboard
- Incident tracking

---

# Current Development Status

Completed:

- Mobile application interface
- Report submission system
- Web dashboard interface
- Backend API structure
- Database schema
- Initial AI model training
- System integration architecture

Pending improvements:

- AI model accuracy improvement
- Larger dataset collection
- Full AI integration into backend
- Real-time notifications
- Drone system integration

---

# Technology Stack

Frontend (Dashboard)

- React.js
- Tailwind CSS
- Axios

Backend

- Node.js
- Express.js

Mobile App

- Flutter

AI / Machine Learning

- Python
- YOLOv8
- Label Studio
- CUDA

Database

- PostgreSQL

---

# Future Work

Planned improvements include:

- Expanding the roadkill dataset
- Improving YOLO detection accuracy
- Integrating the trained AI model into the backend
- Implementing real-time report notifications
- Integrating drone deployment systems

---

# Team

Phoenix Eye Development Team
Faculty of Computing and Information Technology

King Abdulaziz University

---

# License

This project is developed for academic and research purposes.
