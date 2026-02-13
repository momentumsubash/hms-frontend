"use client";
import { useState } from "react";
import { HotelDashboard } from "@/components/hotel-dashboard";

export default function DashboardPage() {
  // Load hotel from localStorage
  const [hotel, setHotel] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hotel');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  return <HotelDashboard nepaliFlag={hotel?.nepaliFlag} />;
}
