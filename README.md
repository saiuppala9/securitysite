# Security Services Web Application

This is a full-stack web application for a security services company, featuring a client-facing portal and an admin dashboard for managing service requests and system operations.

## Features

### User Portal
- **User Authentication:** Secure login and registration for clients.
- **Service Requests:** Clients can request various security services.
- **Request Tracking:** Clients can view the status of their service requests (e.g., Pending, In Progress, Completed).
- **Report Downloads:** Clients can securely download reports for completed services.

### Admin Dashboard
- **Dashboard Analytics:** Visual overview of key metrics, including:
  - Total number of registered users.
  - Statistics on service requests (total, approved, completed).
  - A pie chart visualizing the distribution of service requests by status.
- **Service Request Management:** Admins can view, update, and manage all service requests.
- **Service Management:** Admins can add, edit, and remove the types of services offered.
- **Secure Logout:** Admins can securely log out of the dashboard.

## Tech Stack

- **Backend:** Django, Django REST Framework
- **Frontend:** React, TypeScript, Mantine UI, Recharts
- **Database:** SQLite (for development)

## Setup and Installation

### Backend
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run the database migrations:
    ```bash
    python manage.py migrate
    ```
4.  Start the backend server (runs on port 8001):
    ```bash
    python manage.py runserver 8001
    ```

### Frontend
1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the required Node.js packages:
    ```bash
    npm install
    ```
3.  Start the frontend development server (runs on port 3000):
    ```bash
    npm start
    ```

The application will be accessible at `http://localhost:3000`.

*This repo is automatically updated using a custom Python script.*
