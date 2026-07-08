"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { Minus, Plus, ShoppingCart, MapPin, Loader2, AlertCircle, X, ChevronDown, ChevronUp, Check } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:30005";

interface Category {
  _id: string;
  name: string;
  description?: string;
}

interface Item {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

interface RoomInfo {
  _id: string;
  roomNumber: string;
  isOccupied: boolean;
}

interface HotelInfo {
  _id: string;
  name: string;
  geoEnabled: boolean;
}

export default function QROrderPage() {
  const params = useParams();
  const roomId = params?.roomId as string;
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [hotel, setHotel] = useState<HotelInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cartExpanded, setCartExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [guestPhone, setGuestPhone] = useState("");
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!roomId || !token) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/public/menu/${roomId}/${token}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load menu');
        }
        const data = await res.json();
        setRoom(data.room);
        setHotel(data.hotel);
        setCategories(data.categories);
        setItems(data.items.filter((i: Item) => i.isAvailable !== false));

        if (!data.room.isOccupied) {
          setError('This room is currently not occupied.');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load menu');
      }
      setLoading(false);
    })();
  }, [roomId, token]);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('requesting');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocationStatus('granted');
    } catch {
      setLocationStatus('denied');
    }
  }, []);

  const addToCart = useCallback((itemId: string) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[itemId] <= 1) delete next[itemId];
      else next[itemId]--;
      return next;
    });
  }, []);

  const getItemQuantity = useCallback((itemId: string): number => {
    return cart[itemId] || 0;
  }, [cart]);

  const cartItemsList = Object.entries(cart).map(([itemId, qty]) => {
    const item = items.find((i) => i._id === itemId);
    return item ? { ...item, quantity: qty, total: item.price * qty } : null;
  }).filter(Boolean);

  const cartTotal = cartItemsList.reduce((sum, item) => sum + (item?.total || 0), 0);
  const cartCount = cartItemsList.reduce((sum, item) => sum + (item?.quantity || 0), 0);

  const placeOrder = async () => {
    if (!room?.isOccupied) return;
    if (!guestPhone.trim()) {
      setShowPhoneDialog(true);
      return;
    }
    if (hotel?.geoEnabled && locationStatus !== 'granted') {
      await requestLocation();
      if (locationStatus === 'denied') {
        setError('Location access is required. Please enable location services.');
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    setPhoneError("");
    try {
      const body: any = {
        items: Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity })),
        phone: guestPhone.trim(),
      };
      if (userLocation) {
        body.lat = userLocation.lat;
        body.lng = userLocation.lng;
      }
      const res = await fetch(`${API_URL}/public/orders/${roomId}/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');
      setSuccess(true);
      setCart({});
      setCartExpanded(false);
      setShowPhoneDialog(false);
    } catch (e: any) {
      setError(e.message || 'Failed to place order');
    }
    setSubmitting(false);
  };

  const submitPhoneOrder = () => {
    if (!guestPhone.trim()) {
      setPhoneError("Please enter your phone number");
      return;
    }
    setShowPhoneDialog(false);
    setPhoneError("");
    placeOrder();
  };

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    categoryRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center" data-cy="qr-order-loading">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-gray-400 text-sm">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center p-4" data-cy="qr-order-error">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Unable to Load Menu</h2>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center p-4" data-cy="qr-order-success">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Order Placed!</h2>
          <p className="text-gray-400 text-sm mb-6">Order for Room {room?.roomNumber} placed successfully.</p>
          <button
            onClick={() => setSuccess(false)}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-xl transition-colors active:scale-[0.98]"
            data-cy="qr-order-more-btn"
          >
            Order More
          </button>
        </div>
      </div>
    );
  }

  const groupedItems = categories.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat._id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex flex-col" data-cy="qr-order-page">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 safe-top">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">{hotel?.name}</h1>
              <p className="text-xs sm:text-sm text-gray-400">Room {room?.roomNumber}</p>
            </div>
            {!room?.isOccupied ? (
              <span className="shrink-0 px-3 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-300 border border-red-500/30" data-cy="qr-room-not-occupied">
                Not Occupied
              </span>
            ) : hotel?.geoEnabled && locationStatus === 'denied' ? (
              <button onClick={requestLocation} className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 active:bg-amber-500/30 transition-colors min-h-[44px]" data-cy="qr-enable-location-btn">
                <MapPin className="w-4 h-4" />
                Enable Location
              </button>
            ) : hotel?.geoEnabled && locationStatus === 'granted' ? (
              <span className="shrink-0 flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <MapPin className="w-3 h-3" />
                Location On
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Category pills (mobile quick nav) */}
      {groupedItems.length > 1 && (
        <div className="sticky top-[57px] z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 overflow-x-auto hide-scrollbar" data-cy="qr-category-nav">
          <div className="flex gap-2 px-4 py-2.5 max-w-2xl mx-auto">
            {groupedItems.map((group) => (
              <button
                key={group._id}
                onClick={() => scrollToCategory(group._id)}
                className={`shrink-0 px-3.5 py-2 text-xs font-medium rounded-full whitespace-nowrap min-h-[36px] transition-colors ${
                  activeCategory === group._id
                    ? 'bg-amber-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                data-cy={`qr-cat-pill-${group._id}`}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="max-w-2xl mx-auto px-4 pt-3 w-full" data-cy="qr-order-error-banner">
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="p-1">
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* Menu items */}
      <div className="flex-1 max-w-2xl mx-auto px-4 py-4 space-y-6 pb-32">
        {groupedItems.length === 0 ? (
          <div className="text-center py-12" data-cy="qr-no-items">
            <p className="text-gray-500">No menu items available</p>
          </div>
        ) : (
          groupedItems.map((group) => (
            <section
              key={group._id}
              ref={(el) => { categoryRefs.current[group._id] = el; }}
              data-cy={`qr-category-${group._id}`}
            >
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-1">{group.name}</h2>
              {group.description && (
                <p className="text-xs text-gray-500 mb-3">{group.description}</p>
              )}
              <div className="space-y-2">
                {group.items.map((item) => {
                  const qty = getItemQuantity(item._id);
                  return (
                    <div key={item._id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 active:bg-gray-850 transition-colors" data-cy={`qr-item-${item._id}`}>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
                        )}
                        <p className="text-sm font-bold text-amber-400 mt-1">Rs {item.price}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {qty > 0 ? (
                          <div className="flex items-center gap-2 bg-gray-800 rounded-full px-1 py-1">
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="w-9 h-9 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center active:scale-90 transition-all min-h-[44px] min-w-[44px]"
                              data-cy={`qr-item-dec-${item._id}`}
                            >
                              <Minus className="w-4 h-4 text-white" />
                            </button>
                            <span className="w-7 text-center text-sm font-bold text-white" data-cy={`qr-item-qty-${item._id}`}>{qty}</span>
                            <button
                              onClick={() => addToCart(item._id)}
                              className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center active:scale-90 transition-all min-h-[44px] min-w-[44px]"
                              data-cy={`qr-item-inc-${item._id}`}
                            >
                              <Plus className="w-4 h-4 text-black" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item._id)}
                            className="px-4 py-2.5 text-sm font-medium rounded-xl bg-amber-500 hover:bg-amber-600 text-black active:scale-95 transition-all min-h-[44px]"
                            data-cy={`qr-item-add-${item._id}`}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Cart bottom bar */}
      {cartCount > 0 && room?.isOccupied && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900/98 backdrop-blur-md border-t border-gray-800 safe-bottom" data-cy="qr-cart-bar">
          <div className="max-w-2xl mx-auto">
            {/* Expandable cart items */}
            {cartExpanded && (
              <div className="max-h-48 overflow-y-auto border-b border-gray-800 bg-gray-900" data-cy="qr-cart-items">
                <div className="px-4 py-2 space-y-1.5">
                  {cartItemsList.map((item) => (
                    <div key={item!._id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300 truncate flex-1">
                        <span className="text-amber-400 font-medium mr-1.5">{item!.quantity}x</span>
                        {item!.name}
                      </span>
                      <span className="text-white font-medium ml-2 shrink-0">Rs {item!.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <button
                onClick={() => setCartExpanded(!cartExpanded)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white min-h-[44px]"
                data-cy="qr-cart-toggle"
              >
                {cartExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                <span>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
              </button>
              <div className="flex items-center gap-3">
                <p className="text-base sm:text-lg font-bold text-white whitespace-nowrap">Rs {cartTotal.toLocaleString()}</p>
                <button
                  onClick={placeOrder}
                  disabled={submitting}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-colors flex items-center gap-2 active:scale-95 min-h-[48px] text-sm sm:text-base"
                  data-cy="qr-place-order-btn"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">{submitting ? 'Placing...' : 'Place Order'}</span>
                  <span className="sm:hidden">{submitting ? 'Placing...' : 'Order'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone verification dialog */}
      {showPhoneDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" data-cy="qr-phone-dialog">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Verify Your Phone</h3>
            <p className="text-sm text-gray-400 mb-4">
              Enter the phone number registered with Room {room?.roomNumber} to confirm your order.
            </p>
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => { setGuestPhone(e.target.value); setPhoneError(""); }}
              onKeyDown={(e) => e.key === "Enter" && submitPhoneOrder()}
              placeholder="e.g. 98XXXXXXXX"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 mb-3"
              autoFocus
              data-cy="qr-phone-input"
            />
            {phoneError && (
              <p className="text-sm text-red-400 mb-3" data-cy="qr-phone-error">{phoneError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPhoneDialog(false); setPhoneError(""); }}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors text-sm"
                data-cy="qr-phone-cancel"
              >
                Cancel
              </button>
              <button
                onClick={submitPhoneOrder}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors text-sm active:scale-95"
                data-cy="qr-phone-confirm"
              >
                Confirm & Order
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .safe-top { padding-top: env(safe-area-inset-top, 0px); }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
      `}</style>
    </div>
  );
}
