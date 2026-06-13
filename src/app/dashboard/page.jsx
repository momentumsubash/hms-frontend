"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { HotelDashboard } from "@/components/hotel-dashboard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getMyHotel } from "@/lib/api";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [hotel, setHotel] = useState(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hotel');
      if (stored) setHotel(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
      return;
    }
    if (!loading && user && !hotel) {
      getMyHotel().then(res => {
        if (res?.data) {
          setHotel(res.data);
          localStorage.setItem('hotel', JSON.stringify(res.data));
        }
      }).catch(console.error);
    }
  }, [loading, user, hotel]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <DashboardLayout>
      <HotelDashboard nepaliFlag={hotel?.nepaliFlag} />
    </DashboardLayout>
  );
}
