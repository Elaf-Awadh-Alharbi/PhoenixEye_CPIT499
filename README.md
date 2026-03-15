# Phoenix Eye
### AI-Powered Roadkill Detection & Smart Monitoring System

Phoenix Eye is an intelligent road monitoring platform designed to detect and manage roadkill incidents using **Artificial Intelligence, mobile reporting, and a centralized monitoring dashboard**.

The system allows citizens to report roadkill using a mobile application, while authorities can monitor incidents through an administrative dashboard and analyze uploaded images using AI.

Phoenix Eye aims to improve **road safety**, **wildlife protection**, and **incident response time** on highways and rural roads.

---

# Problem Statement

Roadkill incidents are a serious issue on highways and rural roads. Dead animals on roads can:

• Cause traffic accidents  
• Endanger drivers  
• Harm wildlife populations  
• Remain undetected for long periods  
• Require manual inspection by authorities  

Currently, most roadkill incidents are detected manually or reported too late.

Phoenix Eye provides a **smart system that combines citizen reporting with AI detection** to identify road hazards faster and assist authorities in responding quickly.

---

# Solution Overview

Phoenix Eye introduces an integrated system consisting of:

1. A **mobile application** for citizens to report roadkill.
2. A **backend server** to process and store reports.
3. An **admin dashboard** to monitor incidents.
4. An **AI detection module** that analyzes uploaded images.

This system reduces the time required to detect road hazards and improves response efficiency.

---

# System Architecture

Citizen Mobile App  
⬇  
Backend API (Node.js + Express)  
⬇  
PostgreSQL Database  
⬇  
Admin Dashboard (React)  
⬇  
AI Detection Engine

---

# System Components

## 1️⃣ Citizen Mobile Application

The citizen application allows road users to submit roadkill reports using their smartphones.

Developed using **Flutter**, the application includes:

• Animal type selection  
• Camera or gallery photo upload  
• GPS location detection  
• Map location picker  
• Manual location option  
• Roadkill report submission  
• Confirmation screen after report submission  

The application sends reports to the backend using **multipart HTTP requests including image and location data**.

---

## 2️⃣ Backend System

The backend server manages report storage, image uploads, AI analysis, and dashboard APIs.

Developed using:

• Node.js  
• Express.js  
• PostgreSQL  
• Sequelize ORM  
• Multer (image upload middleware)  
• Helmet (security middleware)

Backend responsibilities include:

• Receiving reports from the mobile application  
• Uploading and storing images on the server  
• Saving report data in the PostgreSQL database  
• Providing APIs for the dashboard  
• Managing report status and drone assignments  
• Triggering AI detection analysis  

Uploaded images are stored in:

uploads/reports/

Reports are stored in the database table:

roadkill_reports

Images are served to the dashboard using:

http://localhost:5000/uploads/reports/<image_name>

---

## 3️⃣ Admin Dashboard

The administrative dashboard allows authorities to monitor and manage reported incidents.

Developed using:

• React  
• Vite  
• Axios  
• TailwindCSS  
• Leaflet (map visualization)

### Dashboard Features

**Report Management**

• View all roadkill reports  
• Filter reports by status, source, and date  
• View detailed report information  
• Verify reports  
• Remove invalid reports  
• Assign drones to incidents  

**Drone Management**

• Monitor drone status  
• Update drone availability  
• Launch drone missions  
• Track drone activity  

**Map Visualization**

All incidents are displayed on an interactive map using Leaflet.

---

## 4️⃣ AI Detection System

Phoenix Eye integrates AI to analyze uploaded images and determine whether they likely contain roadkill.

### Demo Implementation

For demonstration purposes, the system currently uses **Gemini Vision AI** to analyze uploaded images.

AI detection workflow:

1. A citizen uploads a roadkill image.
2. The report appears in the admin dashboard.
3. The admin clicks **Analyze with AI**.
4. Gemini analyzes the image.
5. The system returns a detection result.

---

## Future AI Model

The final system will integrate a **custom-trained YOLOv8 object detection model**.

Current AI work includes:

• Created a dataset containing **146+ labeled roadkill images**  
• Annotated images using **Label Studio**  
• Exported annotations in **YOLO format**  
• Trained initial YOLOv8 detection models  
• Conducted testing and error analysis  

Current focus:

• Improving detection accuracy  
• Reducing false positives  
• Expanding the dataset  

---

# Technologies Used

## Backend

Node.js  
Express.js  
PostgreSQL  
Sequelize ORM  
Multer  
Helmet  

---

## Frontend Dashboard

React  
Vite  
Axios  
TailwindCSS  
Leaflet  

---

## Mobile Application

Flutter  
Dart  
Image Picker  
Geolocator  
HTTP Multipart Requests  

---

## Artificial Intelligence

Python  
YOLOv8 (Ultralytics)  
Label Studio  
CUDA GPU acceleration  
Gemini Vision API  

---

# API Endpoints

### Submit Citizen Report

POST /api/reports

Multipart request fields:

image
latitude
longitude

---

### Get All Reports

GET /api/admin/reports

---

### Get Report Details

GET /api/admin/reports/:id

---

### Run AI Detection

POST /api/admin/reports/:id/ai-detect

Triggers AI analysis on the uploaded image.

---

# Project Structure

PhoenixEye
│
├── backend
│   ├── controllers
│   ├── routes
│   ├── models
│   ├── middleware
│   ├── uploads
│   └── server.js
│
├── frontend
│   ├── components
│   ├── pages
│   ├── api
│   └── utils
│
├── mobile-app
│   ├── screens
│   ├── services
│   └── widgets
│
└── docs
└── images

---

# Dashboard Preview

## Dashboard Overview
![Dashboard](docs/images/dashboard.png)

## Reports Management
![Reports](docs/images/reports.png)

## Drone Management
![Drones](docs/images/drones.png)

## Report Details
![Report Details](docs/images/report-details.png)

## Map Visualization
![Map](docs/images/map.png)

---

# Innovation

Phoenix Eye introduces several innovative aspects:

• Integration of **citizen reporting with AI detection**  
• Real-time **dashboard monitoring system**  
• **Drone-assisted incident response**  
• AI-based road hazard detection  

The platform significantly reduces the time required to detect and respond to road hazards.

---

# Current Development Status

### Completed

• Mobile application interface  
• Backend API development  
• Admin dashboard implementation  
• Image upload infrastructure  
• Report database integration  
• AI demo detection using Gemini  
• Drone assignment logic  

### In Progress

• Improving YOLO detection model  
• Expanding roadkill dataset  
• Integrating trained AI model into backend  
• Improving detection accuracy  

---

# Future Improvements

Future enhancements will include:

• Full YOLO AI integration  
• Automated drone dispatch system  
• Real-time hazard alerts  
• Cloud deployment  
• Integration with transportation authorities  

---

# Huawei ICT Competition

This project is being developed as part of the **Huawei ICT Competition**, demonstrating the integration of artificial intelligence, mobile applications, and smart monitoring systems to solve real-world road safety challenges.

---

# License

This project is developed for academic and research purposes.
