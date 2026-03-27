import React from "react";
import { BrowserRouter as  Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
// import SuitcasePage from "./pages/SuitcasePage";
// import ItemsPage from "./pages/ItemsPage";
// import ResultsPage from "./pages/ResultsPage";
// import SavedSessionsPage from "./pages/SavedSessionsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TripsPage from "./pages/TripsPage";
import CreateTripPage from "./pages/CreateTripPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import TripDetailsPage from "./pages/TripDetailsPage";
import TripItemsPage from "./pages/TripItemsPage";
import TripResultsPage from "./pages/TripResultsPage";
import EditTripPage from "./pages/EditTripPage";

function App() {
  return (
  <>
     <Navbar />
      <Routes>
        {/* V1 public */}
        <Route path="/" element={<HomePage />} />
        {/* <Route path="/suitcases" element={<SuitcasePage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/sessions" element={<SavedSessionsPage />} /> */}

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

        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <TripsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trips/new"
          element={
            <ProtectedRoute>
              <CreateTripPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trips/:id"
          element={
            <ProtectedRoute>
              <TripDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:id/items"
          element={
            <ProtectedRoute>
              <TripItemsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:id/results"
          element={
            <ProtectedRoute>
              <TripResultsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/trips/:id/edit"
          element={
            <ProtectedRoute>
              <EditTripPage />
            </ProtectedRoute>
          }
        />
      </Routes>
  </> 
  );
}

export default App;