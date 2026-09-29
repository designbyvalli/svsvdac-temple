import React from "react";
import { Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import Shell from "./components/Shell";
import Home from "./pages/Home";
import Poojas from "./pages/Poojas";
import Booking from "./pages/Booking";
import Success from "./pages/Success";
import MyBookings from "./pages/MyBookings";
import Admin from "./pages/Admin";
export default function App() {
  return (
    <LanguageProvider>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/poojas" element={<Poojas />} />
          <Route path="/book/:id" element={<Booking />} />
          <Route path="/booking-success" element={<Success />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Shell>
    </LanguageProvider>
  );
}
