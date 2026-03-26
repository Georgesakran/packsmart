import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SuitcasePage from "./pages/SuitcasePage";
import ItemsPage from "./pages/ItemsPage";
import ResultsPage from "./pages/ResultsPage";
import SavedSessionsPage from "./pages/SavedSessionsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* V1 public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/suitcases" element={<SuitcasePage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/sessions" element={<SavedSessionsPage />} />

        {/* V2 auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* V2 protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;