"use client";

import React, { useEffect, useState } from "react";
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
		Star,
} from "lucide-react";
import { getMyHotel, getGuests, getRooms, getOrders } from "@/lib/api";
export function HotelDashboard() {
	const navLinks = [
		{ label: "Checkouts", href: "/checkouts" },
		{ label: "Guests", href: "/guests" },
		{ label: "Hotels", href: "/hotels" },
		{ label: "Items", href: "/items" },
		{ label: "Orders", href: "/orders" },
		{ label: "Rooms", href: "/rooms" },
		{ label: "Users", href: "/users" },
	];
	const { logout, loading: authLoading } = useAuth();
	const [user, setUser] = useState<any>(null);
	const [hotel, setHotel] = useState<any>(null);
	const [guests, setGuests] = useState<any[]>([]);
	const [rooms, setRooms] = useState<any[]>([]);
	const [orders, setOrders] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [currentFoodIndex, setCurrentFoodIndex] = useState(0);
	const [showUserMenu, setShowUserMenu] = useState(false);
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

       useEffect(() => {
	       async function fetchData() {
		       setLoading(true);
		       try {
			       // Get token from localStorage
			       const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
			       let userInfo = null;
			       if (token) {
				       const res = await fetch("http://localhost:3000/api/users/me", {
					       headers: { Authorization: `Bearer ${token}` },
				       });
				       if (res.status === 401) {
					       localStorage.removeItem('token');
					       window.location.href = '/login';
					       return;
				       }
				       if (res.ok) {
					       userInfo = await res.json();
					       setUser(userInfo);
				       } else {
					       setUser(null);
				       }
			       } else {
				       setUser(null);
			       }
			       const [hotelRes, guestsRes, roomsRes, ordersRes] = await Promise.all([
				       getMyHotel(),
				       getGuests(),
				       getRooms(),
				       getOrders(),
			       ]);
			       setHotel(hotelRes?.data || null);
			       setGuests(guestsRes?.data || []);
			       setRooms(roomsRes?.data || []);
			       setOrders(ordersRes?.data || []);
		       } finally {
			       setLoading(false);
		       }
	       }
	       fetchData();
	}, []);

	const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % hotelImages.length);
	const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + hotelImages.length) % hotelImages.length);
	const nextFood = () => setCurrentFoodIndex((prev) => (prev + 1) % foodImages.length);
	const prevFood = () => setCurrentFoodIndex((prev) => (prev - 1 + foodImages.length) % foodImages.length);

	if (authLoading || loading) {
		return <div className="min-h-screen flex items-center justify-center text-xl">Loading dashboard...</div>;
	}
	if (!user) {
		return <div className="min-h-screen flex items-center justify-center text-xl">Please log in to access the dashboard.</div>;
	}

	const occupiedRooms = rooms.filter((r) => r.isOccupied).length;
	const totalRooms = rooms.length;
	const hotelName = hotel?.name || "Hotel Name";
	const hotelType = hotel?.description || "Hotel Type";
	const hotelLocation = hotel?.location || "Hotel Location";
	const hotelPhone = hotel?.phone || "+1 (555) 123-4567";
	const hotelEmail = hotel?.email || "info@hotel.com";
	const hotelWebsite = hotel?.website || "www.hotel.com";
	const hotelAmenities = hotel?.amenities?.length ? hotel.amenities : ["Free WiFi", "Parking", "Restaurant", "Spa", "Pool", "Gym"];

	       return (
		       <div className="min-h-screen bg-slate-50">
					{/* Navigation Bar */}
			       <nav className="bg-white shadow mb-6">
				       <div className="max-w-7xl mx-auto px-4">
					       <div className="flex h-16 items-center justify-between">
						       <span className="font-bold text-xl text-primary">Hotel HMS</span>
						       <div className="flex items-center space-x-4">
							       {navLinks.map((link) => (
								       <a
									       key={link.href}
									       href={link.href}
									       className="text-gray-700 hover:text-primary font-medium px-3 py-2 rounded transition-colors"
								       >
									       {link.label}
								       </a>
							       ))}
						       </div>
						       {/* User button in nav bar, now at far right */}
						       <div className="relative">
							       <button
								       className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-100 border border-gray-200"
								       onClick={() => setShowUserMenu((v) => !v)}
							       >
								       <span className="font-medium text-gray-700">
									   {user?.firstName ? user.firstName : user?.email || "User"}
								       </span>
								       <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
							       </button>
							       {showUserMenu && (
								       <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow z-50">
									       <button
										       className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
										       onClick={async () => {
											   setShowUserMenu(false);
											   await logout();
										       }}
									       >
										       Sign out
									       </button>
								       </div>
							       )}
						       </div>
					       </div>
				       </div>
			       </nav>
				<div className="max-w-7xl mx-auto space-y-8 p-6">
				{/* Header */}
				<div className="text-center space-y-4">
					<h1 className="text-4xl font-serif font-bold text-gray-800">Welcome to Your Hotel Management Dashboard</h1>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">
						Comprehensive insights at your fingertips. Manage your hotel operations with elegance and efficiency.
					</p>
				</div>

				{/* Hotel Overview Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<Card className="hover:shadow-lg transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center space-x-4">
								<div className="p-3 bg-purple-100 rounded-lg">
									<Users className="h-6 w-6 text-purple-600" />
								</div>
								<div>
									<p className="text-sm text-gray-600">Total Guests</p>
									<p className="text-2xl font-bold text-gray-800">{guests.length}</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="hover:shadow-lg transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center space-x-4">
								<div className="p-3 bg-blue-100 rounded-lg">
									<Bed className="h-6 w-6 text-blue-600" />
								</div>
								<div>
									<p className="text-sm text-gray-600">Occupied Rooms</p>
									<p className="text-2xl font-bold text-gray-800">{occupiedRooms}/{totalRooms}</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="hover:shadow-lg transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center space-x-4">
								<div className="p-3 bg-green-100 rounded-lg">
									<Star className="h-6 w-6 text-green-600" />
								</div>
								<div>
									<p className="text-sm text-gray-600">Average Rating</p>
									<p className="text-2xl font-bold text-gray-800">{hotel?.rating || "-"}</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="hover:shadow-lg transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center space-x-4">
								<div className="p-3 bg-orange-100 rounded-lg">
									<Utensils className="h-6 w-6 text-orange-600" />
								</div>
								<div>
									<p className="text-sm text-gray-600">Restaurant Orders</p>
									<p className="text-2xl font-bold text-gray-800">{orders.length}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Hotel Information */}
					<div className="lg:col-span-2 space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-2xl font-serif text-gray-800">Hotel Information</CardTitle>
								<p className="text-gray-600">Comprehensive insights at your fingertips</p>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<h3 className="font-semibold text-lg mb-3">{hotelName}</h3>
										<div className="space-y-2 text-sm">
											<p>
												<span className="font-medium">Type:</span> {hotelType}
											</p>
											<p>
												<span className="font-medium">Rooms:</span> {totalRooms} Total
											</p>
											<p>
												<span className="font-medium">Location:</span> {hotelLocation}
											</p>
										</div>
									</div>
									<div>
										<h4 className="font-semibold mb-3">Amenities</h4>
										<div className="flex flex-wrap gap-2">
											{hotelAmenities.map((am: string, i: number) => (
												<Badge key={i} variant="secondary" className="flex items-center gap-1">
													{am}
												</Badge>
											))}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Hotel Images */}
						<Card>
							<CardHeader>
								<CardTitle className="text-2xl font-serif text-gray-800">Hotel Gallery</CardTitle>
								<p className="text-gray-600">Showcase your unique offerings</p>
							</CardHeader>
							<CardContent>
								<div className="relative">
									<img
										src={hotelImages[currentImageIndex] || "/placeholder.svg"}
										alt="Hotel"
										className="w-full h-80 object-cover rounded-lg"
									/>
									<Button
										variant="outline"
										size="icon"
										className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
										onClick={prevImage}
									>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									<Button
										variant="outline"
										size="icon"
										className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
										onClick={nextImage}
									>
										<ChevronRight className="h-4 w-4" />
									</Button>
									<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
										{hotelImages.map((_, index) => (
											<button
												key={index}
												className={`w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-white/50"}`}
												onClick={() => setCurrentImageIndex(index)}
											/>
										))}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Contact & Location */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-xl font-serif text-gray-800">Contact Information</CardTitle>
								<p className="text-gray-600">Stay connected with your guests</p>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center space-x-3">
									<Phone className="h-5 w-5 text-gray-500" />
									<div>
										<p className="font-medium">{hotelPhone}</p>
										<p className="text-sm text-gray-600">Main Reception</p>
									</div>
								</div>
								<div className="flex items-center space-x-3">
									<Mail className="h-5 w-5 text-gray-500" />
									<div>
										<p className="font-medium">{hotelEmail}</p>
										<p className="text-sm text-gray-600">General Inquiries</p>
									</div>
								</div>
								<div className="flex items-center space-x-3">
									<Globe className="h-5 w-5 text-gray-500" />
									<div>
										<p className="font-medium">{hotelWebsite}</p>
										<p className="text-sm text-gray-600">Official Website</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-xl font-serif text-gray-800">Location</CardTitle>
								<p className="text-gray-600">Discover your hotel's surroundings</p>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-start space-x-3">
									<MapPin className="h-5 w-5 text-gray-500 mt-1" />
									<div>
										<p className="font-medium">{hotelLocation}</p>
										<p className="text-sm text-gray-600">{hotel?.vatAddress || "Downtown District"}</p>
										<p className="text-sm text-gray-600">{hotel?.city || "City, ZIP"}</p>
									</div>
								</div>
								<div className="bg-gray-100 rounded-lg p-4">
									<img
										src="/hotel-location-map.png"
										alt="Hotel Location Map"
										className="w-full h-32 object-cover rounded"
									/>
								</div>
								<div className="text-sm text-gray-600">
									<p>• 5 min walk to Central Park</p>
									<p>• 10 min drive to Times Square</p>
									<p>• 15 min to JFK Airport</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Food Section */}
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl font-serif text-gray-800">Culinary Excellence</CardTitle>
						<p className="text-gray-600">Highlight culinary delights</p>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div>
								<h3 className="text-xl font-semibold mb-4">Restaurant & Dining</h3>
								<div className="space-y-4">
									<div className="border-l-4 border-purple-500 pl-4">
										<h4 className="font-semibold">The Grand Dining Room</h4>
										<p className="text-sm text-gray-600">Fine dining experience with international cuisine</p>
										<p className="text-sm text-gray-500">Open: 6:00 AM - 11:00 PM</p>
									</div>
									<div className="border-l-4 border-blue-500 pl-4">
										<h4 className="font-semibold">Rooftop Bar & Lounge</h4>
										<p className="text-sm text-gray-600">Craft cocktails with panoramic city views</p>
										<p className="text-sm text-gray-500">Open: 5:00 PM - 2:00 AM</p>
									</div>
									<div className="border-l-4 border-green-500 pl-4">
										<h4 className="font-semibold">24/7 Room Service</h4>
										<p className="text-sm text-gray-600">Gourmet meals delivered to your room</p>
										<p className="text-sm text-gray-500">Available around the clock</p>
									</div>
								</div>
							</div>
							<div>
								<div className="relative">
									<img
										src={foodImages[currentFoodIndex] || "/placeholder.svg"}
										alt="Hotel Food"
										className="w-full h-64 object-cover rounded-lg"
									/>
									<Button
										variant="outline"
										size="icon"
										className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
										onClick={prevFood}
									>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									<Button
										variant="outline"
										size="icon"
										className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
										onClick={nextFood}
									>
										<ChevronRight className="h-4 w-4" />
									</Button>
									<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
										{foodImages.map((_, index) => (
											<button
												key={index}
												className={`w-2 h-2 rounded-full ${index === currentFoodIndex ? "bg-white" : "bg-white/50"}`}
												onClick={() => setCurrentFoodIndex(index)}
											/>
										))}
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
