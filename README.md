# E-Commerce Web Application

A complete, modern, and scalable e-commerce web application with a dynamic user interface, role-based access (User & Admin), and integrated third-party services.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (which includes npm)
- [MongoDB](https://www.mongodb.com/try/download/community) (must be running)
- An AWS account with an S3 bucket configured for image storage.
- A Google Cloud project with OAuth 2.0 credentials.

## Installation & Setup

### 1. Backend Setup

- Navigate to the backend directory:
  ```bash
  cd backend
  ```
- Install the dependencies:
  ```bash
  npm install
  ```
- Create a `.env` file in the `backend` directory. You can copy the contents from the provided `.env` file and replace the placeholder values with your actual credentials for the database, JWT secret, AWS, and Google.
- **Whitelist Your IP in MongoDB Atlas:** If you are using MongoDB Atlas, you must whitelist your IP address to allow your backend to connect to the database.
  1. Go to your Atlas Cluster > Security > Network Access.
  2. Click "+ Add IP Address".
  3. For local development, click "Allow Access From Anywhere" and confirm.
- **Configure S3 Bucket for Public Access:** For uploaded images to be viewable, you must disable "Block all public access" and apply a public read policy.
  1. Go to your S3 Bucket > **Permissions** tab.
  2. Under **Block public access (bucket settings)**, click **Edit**.
  3. **Uncheck** the box for **Block *all* public access** and save the changes.
  4. Under **Bucket policy**, click **Edit** and paste the following policy, replacing `your-bucket-name` with your actual bucket name (e.g., `ecommerce-saurabh`):
     ```json
     {
         "Version": "2012-10-17",
         "Statement": [
             {
                 "Sid": "PublicReadGetObject",
                 "Effect": "Allow",
                 "Principal": "*",
                 "Action": "s3:GetObject",
                 "Resource": "arn:aws:s3:::your-bucket-name/*"
             }
         ]
     }
     ```
  5. Save the policy changes.
- **Get Reverse Geocoding API Key:** For the "Current Location" feature, you need a free API key from OpenCage.
  1. Sign up at [opencagedata.com](https://opencagedata.com).
  2. Find your API key on your dashboard.
  3. Add it to `frontend/.env` as `VITE_OPENCAGE_API_KEY`.

### 2. Frontend Setup

- From the project root, navigate to the frontend directory:
  ```bash
  cd frontend
  ```
- Install the dependencies:
  ```bash
  npm install
  ```
- **Important:** If you add new dependencies to `frontend/package.json` later, you must stop the development server, run `npm install` again, and then restart the server for the changes to take effect.
- **Proxy Configuration:** The frontend is configured to proxy API requests starting with `/api` to the backend server running on `http://127.0.0.1:5000`. This is handled in the `vite.config.js` file. Using `127.0.0.1` is recommended over `localhost` to avoid potential IPv6 connection issues.

## Running the Application

You need to run both the backend and frontend servers simultaneously in separate terminal windows.

### 1. Run the Backend Server

- In the `backend` directory:
  ```bash
  npm run dev
  ```
- The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

### 2. Run the Frontend Development Server

- In the `frontend` directory:
  ```bash
  npm run dev
  ```
- The React application will open in your browser, typically at `http://localhost:5173`.

Now you can access the application in your web browser. The frontend will communicate with the backend API to fetch and manage data.

## Troubleshooting

**Vite Errors (e.g., "Cannot read properties of undefined"):**
Sometimes the Vite development server cache or dependencies can become corrupted. If you see strange errors related to Vite or its plugins, follow these steps:
1. Stop the frontend development server.
2. In the `frontend` directory, delete the `node_modules` folder and the `package-lock.json` file.
3. Run `npm install` again.
4. Restart the server with `npm run dev`.
