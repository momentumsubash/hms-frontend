"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/ui/NavBar";
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
	// Notes state
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
	const [showUserMenu, setShowUserMenu] = useState(false);

	// Fetch notes
		const [hotel, setHotel] = useState(null);
	// Notes hotelId/token must be after hotel is defined
	const hotelId = hotel?._id
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
	const fetchNotes = async () => {
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
	};

	// Create note
	const handleCreateNote = async (e) => {
		e.preventDefault();
		if (!noteText.trim()) return;
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

	// Delete note
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


	// ...existing code...

	// ...existing code...

	// Fetch notes when hotel/user is loaded (must be after hotelId/notesToken are defined)
	// This must be after hotel, hotelId, and notesToken are declared
	// so move this useEffect below those declarations

	const { logout, loading: authLoading } = useAuth();
	const [user, setUser] = useState(() => {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('user');
			return stored ? JSON.parse(stored) : null;
		}
		return null;
	});

		// Fetch notes when hotel/user is loaded (must be after hotelId/notesToken are defined)
		useEffect(() => {
			if (hotelId && notesToken) fetchNotes();
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [hotelId, notesToken]);

	useEffect(() => {
		async function fetchUserAndData() {
			setLoading(true);
			try {
				let userObj = null;
				if (typeof window !== 'undefined') {
					const stored = localStorage.getItem('user');
					if (stored) {
						userObj = JSON.parse(stored);
						setUser(userObj);
					} else {
						const token = localStorage.getItem('token');
						if (token) {
							const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/me`, {
								headers: { Authorization: `Bearer ${token}` },
							});
							if (res.status === 401) {
								localStorage.removeItem('token');
								window.location.href = '/login';
								return;
							}
							if (res.ok) {
								const userInfo = await res.json();
								userObj = userInfo.data || null;
								setUser(userObj);
								localStorage.setItem('user', JSON.stringify(userObj));
							} else {
								setUser(null);
							}
						} else {
							setUser(null);
						}
					}
				}
				// const [hotelRes, guestsRes, roomsRes, ordersRes] = await Promise.all([
					const [hotelRes,guestRes] = await Promise.all([
					getMyHotel(),
					getGuests(),
					// getRooms(),
					// getOrders(),
				]);
	
				setHotel(hotelRes?.data || null);
				setGuests(guestRes?.data || []);
				// setRooms(roomsRes?.data || []);
				// setOrders(ordersRes?.data || []);
			} finally {
				setLoading(false);
			}
		}
		fetchUserAndData();
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
const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Checkouts", href: "/checkouts" },
  { label: "Guests", href: "/guests" },
  { label: "Hotels", href: "/hotels", superAdminOnly: true },
  { label: "Items", href: "/items" },
  { label: "Orders", href: "/orders" },
  { label: "Rooms", href: "/rooms" },
  { label: "Stats", href: "/stats" },
  { label: "Users", href: "/users" },
];
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
			      <NavBar
        user={user}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        logout={logout}
        navLinks={navLinks}
      />
				<div className="max-w-7xl mx-auto space-y-8 p-6">
				{/* Header */}
				<div className="text-center space-y-4">
					<h1 className="text-4xl font-serif font-bold text-gray-800">Welcome to Your Hotel Management Dashboard</h1>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">
						Comprehensive insights at your fingertips. Manage your hotel operations with elegance and efficiency.
					</p>
				</div>

				   {/* Hotel Notes Section - full width above hotel info */}
					 <div className="bg-white rounded-lg shadow p-6 mt-8 mb-8">
						 <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
							 <span>Hotel Notes</span>
						 </h2>
							 <form onSubmit={handleCreateNote} className="flex flex-row gap-2 mb-4 w-full">
								 <input
									 type="text"
									 className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
									 placeholder="Add a new note..."
									 value={noteText}
									 onChange={e => setNoteText(e.target.value)}
									 disabled={notesLoading}
								 />
								 <div className="flex flex-col items-end w-36">{/* fixed width for button */}
									 <Button
										 type="submit"
										 className="w-full min-w-[120px] bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded font-medium shadow-sm"
										 disabled={notesLoading || !noteText.trim()}
									 >
										 Add Note
									 </Button>
								 </div>
							 </form>
						 {notesError && <div className="text-red-600 mb-2">{notesError}</div>}
							 {notesLoading ? (
								 <div>Loading notes...</div>
							 ) : (
								 <ul className="space-y-2 w-full">
									 {notes.length === 0 && <li className="text-gray-500">No notes yet.</li>}
											 {notes.map((note) => (
												 <li key={note._id} className="flex items-center gap-2 bg-slate-100 rounded px-3 py-2 w-full">
													 <span className="flex-1 break-words">{note.text}</span>
																	 <Button
																		 type="button"
																		 size="sm"
																		 className="w-36 min-w-[120px] bg-red-600 text-white hover:bg-red-700 px-4 py-1.5 rounded font-medium shadow-sm"
																		 onClick={() => handleDeleteNote(note._id)}
																		 disabled={notesLoading}
																	 >
																		 Delete
																	 </Button>
												 </li>
											 ))}
								 </ul>
							 )}
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
									<p className="text-2xl font-bold text-gray-800">{guests?.totalGuests}</p>
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
									<p className="text-2xl font-bold text-gray-800">{guests?.occupiedRooms}/{guests?.totalRooms}</p>
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
									<p className="text-sm text-gray-600">Checked Out</p>
									<p className="text-2xl font-bold text-gray-800">{guests?.checkedOut || "-"}</p>
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
											{hotelAmenities.map((am, i) => (
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
										<p className="font-medium">{hotel?.contact?.phone}</p>
										<p className="text-sm text-gray-600">Main Reception</p>
									</div>
								</div>
								<div className="flex items-center space-x-3">
									<Mail className="h-5 w-5 text-gray-500" />
									<div>
										<p className="font-medium">{hotel?.contact?.email}</p>
										<p className="text-sm text-gray-600">General Inquiries</p>
									</div>
								</div>
								<div className="flex items-center space-x-3">
									<Globe className="h-5 w-5 text-gray-500" />
									<div>
										<p className="font-medium">{hotel?.contact?.website}</p>
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
