Flood Prediction App - Steps
=================================

Project structure:
  backend/node_server/   - Node.js + Express API (port 5002)
  backend/flask_server/  - Flask ML service (port 5001)
  frontend/              - React + Vite frontend

---------------------------------------------------------------------------
1) Flask ML Service (must run first)
---------------------------------------------------------------------------
The Flask service provides /predict and /explain endpoints used by the
Node backend for predictions and SHAP explanations.

  cd "G:\RUSL\4.2\research project new\flood_app\backend\flask_server"

  # Activate virtual environment (Windows PowerShell)
  & "venv\Scripts\Activate"

  # Install dependencies (first time only)
  pip install -r requirements.txt

  # Start the server
  python app.py

  # Health check (optional, another terminal)
  Invoke-RestMethod http://localhost:5001/health

The service runs on http://localhost:5001 by default.

---------------------------------------------------------------------------
2) Node.js Backend API
---------------------------------------------------------------------------
The Node backend proxies to Flask and exposes REST endpoints for the frontend.

  cd "G:\RUSL\4.2\research project new\flood_app\backend\node_server"

  # Install dependencies (first time only)
  npm install

  # Start in development mode (nodemon)
  npm run dev

  # Or start normally
  npm start

The API runs on http://localhost:5002 by default.

---------------------------------------------------------------------------
3) React Frontend
---------------------------------------------------------------------------
  cd "G:\RUSL\4.2\research project new\flood_app\frontend"

  # Install dependencies (first time only)
  npm install

  # Start development server
  npm run dev

  # Build for production
  npm run build

  # Preview production build
  npm run preview

The frontend runs on http://localhost:5173 by default.

---------------------------------------------------------------------------
4) Run Order
---------------------------------------------------------------------------
  1. Start Flask service (port 5001) first
  2. Start Node backend (port 5002)
  3. Start Frontend (port 5173)

---------------------------------------------------------------------------
5) Notes
---------------------------------------------------------------------------
- The Flask service must be running before calling /predict-station or
  /explain-station on the Node backend, otherwise those endpoints will fail.
- The frontend expects the Node backend at http://localhost:5002/api.
- If you get an execution policy error activating the venv on Windows:
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
