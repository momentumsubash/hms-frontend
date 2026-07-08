"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Minus, Plus, ShoppingCart, MapPin, Loader2, AlertCircle, X, ChevronUp, Check, Search } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

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

  const clearCart = useCallback(() => setCart({}), []);

  const getItemQuantity = useCallback((itemId: string): number => {
    return cart[itemId] || 0;
  }, [cart]);

  const cartItemsList = useMemo(() =>
    Object.entries(cart).map(([itemId, qty]) => {
      const item = items.find((i) => i._id === itemId);
      return item ? { ...item, quantity: qty, total: item.price * qty } : null;
    }).filter(Boolean),
    [cart, items]
  );
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

  // Group items by category and filter by search + active tab
  const groupedItems = useMemo(() => {
    const filtered = searchQuery.trim()
      ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : items;

    const activeItems = activeTab === 'all'
      ? filtered
      : filtered.filter((i) => i.category === activeTab);

    return categories
      .map((cat) => ({ ...cat, items: activeItems.filter((i) => i.category === cat._id) }))
      .filter((g) => g.items.length > 0);
  }, [items, categories, searchQuery, activeTab]);

  const allFilteredCount = searchQuery.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase())).length
    : items.length;

  const [showSearch, setShowSearch] = useState(false);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
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

  const tabs = [{ _id: 'all', name: `All (${allFilteredCount})` }, ...categories];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex flex-col" data-cy="qr-order-page">
      {/* Header + Tabs */}
      <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 safe-top">
        <div className="max-w-2xl mx-auto">
          {/* Top row */}
          <div className="flex items-center justify-between gap-2 px-3 sm:px-4 pt-2.5 pb-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-lg font-bold text-white truncate">{hotel?.name}</h1>
              <p className="text-[10px] sm:text-sm text-gray-400">Room {room?.roomNumber}</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => {
                  if (showSearch) { setShowSearch(false); setSearchQuery(""); }
                  else { setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 100); }
                }}
                className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs font-medium rounded-lg transition-colors min-h-[32px] sm:min-h-[36px] ${
                  showSearch
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                data-cy="qr-search-toggle"
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{showSearch ? 'Close' : 'Search'}</span>
              </button>
              {!room?.isOccupied ? (
                <span className="px-2 py-1 text-[10px] sm:text-xs font-medium rounded-full bg-red-500/20 text-red-300 border border-red-500/30" data-cy="qr-room-not-occupied">
                  Not Occupied
                </span>
              ) : hotel?.geoEnabled && locationStatus === 'denied' ? (
                <button onClick={requestLocation} className="flex items-center gap-1 px-2 py-1.5 sm:px-3 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 active:bg-amber-500/30 transition-colors min-h-[32px] sm:min-h-[36px]" data-cy="qr-enable-location-btn">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Location</span>
                </button>
              ) : hotel?.geoEnabled && locationStatus === 'granted' ? (
                <span className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <MapPin className="w-3 h-3" />
                </span>
              ) : null}
            </div>
          </div>
          {/* Collapsible search */}
          <div className={`overflow-hidden transition-all duration-200 ${showSearch ? 'max-h-14' : 'max-h-0'}`}>
            <div className="px-3 sm:px-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menu items..."
                  className="w-full pl-9 pr-9 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  data-cy="qr-search-input"
                />
                {(searchQuery || showSearch) && (
                  <button
                    onClick={() => {
                      if (searchQuery) { setSearchQuery(""); searchRef.current?.focus(); }
                      else { setShowSearch(false); }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Tabs */}
          <div className="border-t border-gray-800" data-cy="qr-category-tabs">
            <div className="flex gap-1.5 px-3 sm:px-4 py-2 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
              {tabs.map((tab) => (
                <button
                  key={tab._id}
                  onClick={() => handleTabChange(tab._id)}
                  className={`snap-start shrink-0 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === tab._id
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                  }`}
                  data-cy={`qr-tab-${tab._id}`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

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

      {/* Items grid */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-36">
        {groupedItems.length === 0 ? (
          <div className="text-center py-16" data-cy="qr-no-items">
            <p className="text-gray-500 text-sm">
              {searchQuery ? `No items match "${searchQuery}"` : 'No menu items available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3">
            {groupedItems.flatMap((group) =>
              group.items.map((item) => {
                const qty = getItemQuantity(item._id);
                return (
                  <div
                    key={item._id}
                    className={`flex flex-col bg-gray-900 border rounded-xl p-3 transition-all ${
                      qty > 0 ? 'border-amber-500/40 shadow-sm shadow-amber-500/10' : 'border-gray-800'
                    }`}
                    data-cy={`qr-item-${item._id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-white leading-snug line-clamp-2">{item.name}</p>
                      {item.description && (
                        <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                      )}
                      <p className="text-xs sm:text-sm font-bold text-amber-400 mt-1.5">Rs {item.price}</p>
                    </div>
                    <div className="mt-2.5">
                      {qty > 0 ? (
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center active:scale-90 transition-all"
                            data-cy={`qr-item-dec-${item._id}`}
                          >
                            <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                          </button>
                          <span className="text-xs sm:text-sm font-bold text-white w-5 text-center" data-cy={`qr-item-qty-${item._id}`}>{qty}</span>
                          <button
                            onClick={() => addToCart(item._id)}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500 hover:bg-amber-600 flex items-center justify-center active:scale-90 transition-all"
                            data-cy={`qr-item-inc-${item._id}`}
                          >
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item._id)}
                          className="w-full py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-black active:scale-95 transition-all"
                          data-cy={`qr-item-add-${item._id}`}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Cart bottom bar */}
      {cartCount > 0 && room?.isOccupied && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900/98 backdrop-blur-md border-t border-gray-800 safe-bottom" data-cy="qr-cart-bar">
          <div className="max-w-2xl mx-auto">
            {/* Items summary */}
            <div className="max-h-48 overflow-y-auto border-b border-gray-800 bg-gray-900/95">
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
            {/* Actions */}
            <div className="px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
              <button
                onClick={clearCart}
                className="text-[11px] sm:text-xs text-gray-500 hover:text-red-400 transition-colors px-1.5 sm:px-2 min-h-[36px]"
                data-cy="qr-cart-clear"
              >
                Clear
              </button>
              <p className="text-sm sm:text-base md:text-lg font-bold text-white whitespace-nowrap">Rs {cartTotal.toLocaleString()}</p>
              <button
                onClick={placeOrder}
                disabled={submitting}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-colors flex items-center gap-1.5 active:scale-95 min-h-[44px] text-xs sm:text-sm"
                data-cy="qr-place-order-btn"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="hidden sm:inline">{submitting ? 'Placing...' : 'Place Order'}</span>
                <span className="sm:hidden">{submitting ? '...' : 'Order'}</span>
              </button>
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