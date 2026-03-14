# Phoenix Eye

Phoenix Eye is an intelligent road safety system designed to detect and manage roadkill incidents using Artificial Intelligence, citizen reporting, and drone-assisted response.

The platform enables citizens to report roadkill through a mobile application, while authorities monitor and manage incidents through a web-based control center. AI detection assists in identifying roadkill from images, and drones can be deployed to investigate or respond to incidents.

---

# Project Overview

Roadkill on highways is a significant problem that can:

• Endanger drivers  
• Cause traffic accidents  
• Harm wildlife populations  
• Delay response from authorities  

Phoenix Eye aims to solve this problem by combining:

• Citizen reporting  
• AI-based image detection  
• Real-time monitoring dashboard  
• Drone deployment system  

---

# System Components

The system consists of three main components:

### 1. Mobile Application
Used by citizens to report roadkill incidents.

Features:
- User registration
- Photo upload
- GPS location capture
- Roadkill reporting

Technology:
- Flutter

---

### 2. Web Dashboard (Control Center)

Used by authorities to monitor and manage reports.

Features:
- Report management
- Drone management
- Incident verification
- Analytics dashboard
- Status tracking

Technology:
- React (Frontend)
- Node.js + Express (Backend)

---

### 3. AI Detection System

An AI model trained to detect roadkill from images.

Technology:
- Python
- YOLOv8
- Ultralytics
- CUDA GPU acceleration

Dataset:
- 146 labeled roadkill images
- Bounding box annotations in YOLO format

The current model is functional but still being improved to reduce false detections.

For demo purposes, Gemini Vision API can also be used to analyze images.

---

# Dashboard Interface

### Admin Login

<img src="docs/images/login.png" width="600"/>

---

### Control Center Overview

<img src="docs/images/dashboard.png" width="900"/>

Displays:

• Total reports  
• Total drones  
• Online/offline drones  
• Recent reports  

---

### Reports Management

<img src="docs/images/reports.png" width="900"/>

Authorities can:

• View citizen reports  
• Verify incidents  
• Assign drones  
• Mark reports as removed  

Report statuses include:

- Pending
- Verified
- Assigned
- Removed

---

### Drone Management

<img src="docs/images/drones.png" width="900"/>

Allows administrators to:

• Register drones  
• Monitor drone status  
• Launch drones  
• Assign drones to reports

Drone states include:

- Available
- Assigned
- Offline

---

### Analytics Dashboard

<img src="docs/images/analytics.png" width="900"/>

Provides:

• Report trends  
• Status distribution  
• Heatmap of locations  

---

# Technology Stack

### Frontend
- React
- Vite
- TailwindCSS
- Axios

### Backend
- Node.js
- Express.js
- REST API

### Database
- PostgreSQL

### Mobile App
- Flutter

### AI Detection
- Python
- YOLOv8
- Ultralytics
- Label Studio

---

# Project Structure
