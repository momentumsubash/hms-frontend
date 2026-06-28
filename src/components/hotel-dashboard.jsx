"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Bed,
  Utensils,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  Hotel,
  TrendingUp,
  CalendarCheck,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { RoomStatusBar } from "@/components/room-status-bar";
import { getMyHotel, getGuests, getRooms, getOrders } from "@/lib/api";

export function HotelDashboard({ nepaliFlag = false }) {
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentFoodIndex, setCurrentFoodIndex] = useState(0);

  const [hotel, setHotel] = useState(null);
  const hotelId = hotel?._id;
  const notesToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const hotelImages = [
    "/luxury-hotel-lobby.png",
    "/elegant-hotel-room.png",
    "/hotel-pool-lounge.png",
    "/elegant-hotel-dining.png",
    "/hotel-spa-wellness.png",
  ];
  const foodImages = [
    "/gourmet-breakfast-buffet.png",
    "/artistic-fine-dining.png",
    "/placeholder-p9aiz.png",
    "/placeholder-u7zdt.png",
  ];

  const [showExtra, setShowExtra] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!hotelId || !notesToken) return;
    setNotesLoading(true);
    setNotesError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hotels/${hotelId}/notes`, {
        headers: { Authorization: `Bearer ${notesToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch notes");
      const data = await res.json();
      setNotes(data.data || []);
    } catch (e) {
      setNotesError(e.message);
    } finally {
      setNotesLoading(false);
    }
  }, [hotelId, notesToken]);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) {
      toast.error("Please enter a note before submitting.");
      return;
    }
    setNotesLoading(true);
    setNotesError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hotels/${hotelId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${notesToken}`,
        },
        body: JSON.stringify({ text: noteText }),
      });
      if (!res.ok) throw new Error("Failed to create note");
      setNoteText("");
      await fetchNotes();
    } catch (e) {
      setNotesError(e.message);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    setNotesLoading(true);
    setNotesError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hotels/${hotelId}/notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${notesToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete note");
      await fetchNotes();
    } catch (e) {
      setNotesError(e.message);
    } finally {
      setNotesLoading(false);
    }
  };

  const { user: authUser, logout, loading: authLoading } = useAuth();

  useEffect(() => {
    if (hotelId && notesToken) fetchNotes();
  }, [hotelId, notesToken, fetchNotes]);

  useEffect(() => {
    async function fetchHotelData() {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const [hotelRes, guestRes, roomsRes, ordersRes] = await Promise.all([
          getMyHotel(),
          getGuests(),
          getRooms(),
          getOrders({ limit: 100 }),
        ]);

        setHotel(hotelRes?.data || null);
        setRooms(roomsRes?.data || []);
        setOrders(ordersRes?.data || []);

        if (guestRes?.data && typeof guestRes.data === 'object') {
          setGuests(guestRes.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHotelData();
  }, []);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % hotelImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + hotelImages.length) % hotelImages.length);
  const nextFood = () => setCurrentFoodIndex((prev) => (prev + 1) % foodImages.length);
  const prevFood = () => setCurrentFoodIndex((prev) => (prev - 1 + foodImages.length) % foodImages.length);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Please log in to access the dashboard.</div>;
  }

  const hotelName = hotel?.name || "Hotel Name";
  const hotelLocation = hotel?.location || "Hotel Location";
  const hotelAmenities = hotel?.amenities?.length ? hotel.amenities : ["Free WiFi", "Parking", "Restaurant", "Spa", "Pool", "Gym"];

  const statsCards = [
    { label: "Total Guests", value: guests?.currentlyStaying || 0, icon: Users },
    { label: "Occupied Rooms", value: `${guests?.occupiedRooms || 0}/${guests?.totalRooms || 0}`, icon: Bed },
    { label: "Checked Out", value: guests?.checkedOut || "-", icon: CalendarCheck },
    { label: "Restaurant Orders", value: orders.length, icon: Utensils },
  ];

  return (
    <div className="p-3 sm:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-6 overflow-x-hidden">
      <div data-cy="dashboard-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div data-cy="user-welcome-text">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back, <span className="text-gradient">{authUser?.firstName || authUser?.email || "User"}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here&apos;s what&apos;s happening at your hotel today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg border border-border">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      <div data-cy="dashboard-stats" className="grid grid-cols-4 gap-1 sm:gap-4">
        {statsCards.map((stat, i) => (
          <div
            key={stat.label}
            data-cy={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
            className="bg-card rounded-xl border border-border p-1.5 sm:p-5 hover:shadow-card-hover transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-0 sm:gap-2">
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-sm text-muted-foreground font-medium leading-tight sm:normal-case">{stat.label}</p>
                <p className="text-sm sm:text-2xl font-bold text-foreground mt-0 sm:mt-1">{stat.value}</p>
              </div>
              <div className="hidden sm:flex w-11 h-11 rounded-lg bg-primary/10 items-center justify-center text-primary shrink-0">
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <RoomStatusBar rooms={rooms} />

      <div className="bg-card rounded-xl border border-border p-4 sm:p-5 animate-slide-up">
        <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-foreground">Hotel Notes</h2>
        </div>
        <form onSubmit={handleCreateNote} className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <input
            type="text"
            className="flex-1 h-9 sm:h-10 px-3 sm:px-3.5 bg-muted/50 border border-input rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
            placeholder="Add a note..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
          />
          <Button type="submit" disabled={notesLoading} size="sm" className="gap-1 sm:gap-1.5 px-2 sm:px-3 h-9 sm:h-10">
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Add Note</span>
          </Button>
        </form>
        {notesError && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg mb-3">{notesError}</div>}
        {notesLoading && !notesError ? (
          <div className="text-xs sm:text-sm text-muted-foreground">Loading notes...</div>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
            {notes.length === 0 && <p className="text-xs sm:text-sm text-muted-foreground text-center py-4 sm:py-6">No notes yet. Add your first note above.</p>}
            {notes.map((note) => (
              <div key={note._id} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 sm:px-3.5 py-2 sm:py-2.5 group hover:bg-muted/50 transition-colors">
                <span className="flex-1 text-xs sm:text-sm text-foreground/80 leading-relaxed">{note.text}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteNote(note._id)}
                  className="p-1 sm:p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sm:hidden">
        <button
          onClick={() => setShowExtra(!showExtra)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>More details</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showExtra ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className={`${showExtra ? "block" : "hidden"} sm:block space-y-4 sm:space-y-6`}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-card rounded-xl border border-border p-4 sm:p-5 animate-slide-up">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-foreground">Hotel Information</h2>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Comprehensive insights at your fingertips</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-foreground mb-2 sm:mb-3">{hotelName}</h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {[
                      { label: "Type", value: hotel?.description || "Hotel" },
                      { label: "Rooms", value: `${rooms.length} Total` },
                      { label: "Location", value: hotelLocation },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <span className="text-muted-foreground min-w-[55px] sm:min-w-[60px]">{item.label}:</span>
                        <span className="text-foreground/80 font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground mb-2 sm:mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {hotelAmenities.map((am, i) => (
                      <Badge key={i} variant="secondary" className="rounded-md px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-normal">
                        {am}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 sm:p-5 animate-slide-up">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-foreground">Hotel Gallery</h2>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Showcase your unique offerings</p>
                </div>
              </div>
              <div className="relative rounded-lg overflow-hidden group">
                <img
                  src={hotelImages[currentImageIndex] || "/placeholder.svg"}
                  alt="Hotel"
                  className="w-full h-72 sm:h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                <Button variant="outline" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background border-0 shadow-sm rounded-lg" onClick={prevImage}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background border-0 shadow-sm rounded-lg" onClick={nextImage}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {hotelImages.map((_, index) => (
                    <button
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${index === currentImageIndex ? "bg-white w-6" : "bg-white/40 w-1.5"}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-card rounded-xl border border-border p-4 sm:p-5 animate-slide-up">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-foreground">Contact</h2>
              </div>
              <div className="space-y-2.5 sm:space-y-3.5">
                {[
                  { icon: Phone, label: "Primary Phone", value: hotel?.contact?.phone },
                  hotel?.contact?.reception && { icon: Phone, label: "Reception", value: hotel?.contact?.reception },
                  { icon: Mail, label: "Email", value: hotel?.contact?.email },
                  { icon: Globe, label: "Website", value: hotel?.contact?.website },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">{item.value || "N/A"}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 sm:p-5 animate-slide-up">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-foreground">Location</h2>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start gap-2 sm:gap-3">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-foreground">{hotelLocation}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{hotel?.vatAddress || "Downtown District"}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{hotel?.city || "City, ZIP"}</p>
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden border border-border">
                  <img src="/hotel-location-map.png" alt="Hotel Location Map" className="w-full h-24 sm:h-32 object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 sm:p-5 animate-slide-up">
          <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-foreground">Culinary Excellence</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Highlight culinary delights</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground">Restaurant & Dining</h3>
              {[
                { title: "The Grand Dining Room", desc: "Fine dining experience with international cuisine", time: "Open: 6:00 AM - 11:00 PM" },
                { title: "Rooftop Bar & Lounge", desc: "Craft cocktails with panoramic city views", time: "Open: 5:00 PM - 2:00 AM" },
                { title: "24/7 Room Service", desc: "Gourmet meals delivered to your room", time: "Available around the clock" },
              ].map((item, i) => (
                <div key={i} className="border-l-2 border-l-primary/30 rounded-r-lg bg-muted/50 px-3 sm:px-4 py-2 sm:py-3 hover:bg-muted/80 transition-colors">
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground">{item.title}</h4>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-0.5">{item.time}</p>
                </div>
              ))}
            </div>
            <div>
              <div className="relative rounded-lg overflow-hidden group">
                <img
                  src={foodImages[currentFoodIndex] || "/placeholder.svg"}
                  alt="Hotel Food"
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                <Button variant="outline" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background border-0 shadow-sm rounded-lg" onClick={prevFood}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background border-0 shadow-sm rounded-lg" onClick={nextFood}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {foodImages.map((_, index) => (
                    <button
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${index === currentFoodIndex ? "bg-white w-6" : "bg-white/40 w-1.5"}`}
                      onClick={() => setCurrentFoodIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
