import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SuitcasePage from "./pages/SuitcasePage";
import ItemsPage from "./pages/ItemsPage";
import ResultsPage from "./pages/ResultsPage";
import SavedSessionsPage from "./pages/SavedSessionsPage";
import { Analytics } from "@vercel/analytics/react"
function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/suitcases" element={<SuitcasePage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/sessions" element={<SavedSessionsPage />} />
      </Routes>
      <Analytics />
    </Router>
    
  );
}

export default App;