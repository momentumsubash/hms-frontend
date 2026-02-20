"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  FireIcon,
  ArrowPathIcon,
  BellAlertIcon,
  PrinterIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  WifiIcon,
   SignalIcon, // For offline/warning state
  CloudIcon  // Alternative for offline state
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { toast } from 'sonner';
import { useRouter } from "next/navigation";

interface KOTItem {
  _id: string;
  kotNumber: string;
  roomNumber: string;
  kotStatus: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  kotSentAt?: string;
  kotPreparingAt?: string;
  kotReadyAt?: string;
  kotServedAt?: string;
  items: Array<{
    name: string;
    quantity: number;
    note?: string;
  }>;
  specialInstructions?: string;
  guestId?: {
    firstName: string;
    lastName: string;
  };
  timeElapsed?: number;
  timeInCurrentStatus?: number;
  priority?: 'high' | 'normal';
  // Print status fields
  printStatus?: 'printed' | 'print_failed' | 'no_printer' | 'not_sent' | 'unknown';
  printMessage?: string;
  printWarning?: boolean;
  printAttempts?: number;
  ui?: {
    showWarning: boolean;
    warningType: 'info' | 'warning';
    borderColor: string;
    icon: string;
  };
  printerNote?: string;
}

interface PrinterStatus {
  id: string;
  name: string;
  isDefault: boolean;
  connected: boolean;
  lastError?: string;
}

interface PrinterHealth {
  status: 'online' | 'offline' | 'not_configured';
  message: string;
    kitchenMessage?: string; // Add this optional property
  details: {
    total: number;
    online: number;
    offline: number;
    printers: PrinterStatus[];
  };
}

interface PrintStats {
  total: number;
  printed: number;
  printFailed: number;
  noPrinter: number;
  pendingPrint: number;
}

interface Notification {
  type: 'info' | 'warning' | 'error';
  message: string;
  action?: string;
}

export default function KitchenPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [kots, setKots] = useState<{
    pending: KOTItem[];
    preparing: KOTItem[];
    ready: KOTItem[];
    served: KOTItem[];
    cancelled: KOTItem[];
    all: KOTItem[];
  }>({
    pending: [],
    preparing: [],
    ready: [],
    served: [],
    cancelled: [],
    all: []
  });
  const [printerHealth, setPrinterHealth] = useState<PrinterHealth>({
    status: 'not_configured',
    message: 'Checking printer status...',
    details: { total: 0, online: 0, offline: 0, printers: [] }
  });
  const [printStats, setPrintStats] = useState<PrintStats>({
    total: 0,
    printed: 0,
    printFailed: 0,
    noPrinter: 0,
    pendingPrint: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    cancelled: 0,
    avgPrepTime: 0,
    avgServeTime: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hotel, setHotel] = useState<any>(null);
  const [showPrintWarnings, setShowPrintWarnings] = useState(true);
  
  // Sound alert for new orders
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playedOrders, setPlayedOrders] = useState<Set<string>>(new Set());

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/new-order.mp3');
  }, []);

  // Fetch KOTs from kitchen view endpoint
  const fetchKOTs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push('/login');
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/kot/kitchen-view?showPrintErrors=true`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error("Failed to fetch KOTs");
      }

      const data = await res.json();
      if (data.success) {
        // Store previous pending orders count for sound alert
        const previousPendingCount = kots.pending.length;
        
        setKots(data.data);
        setLastUpdated(new Date());
        
        // Update printer health
        if (data.printerHealth) {
          setPrinterHealth(data.printerHealth);
        }
        
        // Update print stats
        if (data.printStats) {
          setPrintStats(data.printStats);
        }
        
        // Update notifications
        if (data.notifications) {
          setNotifications(data.notifications);
        }
        
        // Calculate stats
        const total = data.data.all?.length || 0;
        const pending = data.data.pending?.length || 0;
        const preparing = data.data.preparing?.length || 0;
        const ready = data.data.ready?.length || 0;
        const served = data.data.served?.length || 0;
        const cancelled = data.data.cancelled?.length || 0;

        setStats({
          total,
          pending,
          preparing,
          ready,
          served,
          cancelled,
          avgPrepTime: 12, // This would come from API
          avgServeTime: 5   // This would come from API
        });

        // Play sound for new pending orders
        if (pending > previousPendingCount && audioRef.current) {
          const newPendingOrders = data.data.pending.filter(
            (order: KOTItem) => !playedOrders.has(order._id)
          );
          
          if (newPendingOrders.length > 0) {
            audioRef.current.play().catch(() => {
              // Autoplay might be blocked by browser
              console.log("Sound play failed - user interaction needed");
            });
            
            // Mark these orders as played
            const newPlayedSet = new Set(playedOrders);
            newPendingOrders.forEach((order: KOTItem) => newPlayedSet.add(order._id));
            setPlayedOrders(newPlayedSet);
          }
        }

        // Show toast for critical print issues
        if (data.printStats?.printFailed > 0 && showPrintWarnings) {
          toast.warning(`${data.printStats.printFailed} order(s) have printing issues`, {
            description: "Kitchen can still see them, but check printers",
            duration: 5000
          });
        }
      }
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch kitchen orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Update KOT status
  const updateKOTStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/kot/status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`KOT ${data.data.kotNumber} updated to ${newStatus}`);
        fetchKOTs(); // Refresh the list
      } else {
        throw new Error(data.message || "Failed to update status");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchKOTs();
  };

  // Test printer
  const testPrinter = async (printerId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/kot/printers/${printerId}/test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        if (data.data.success) {
          toast.success("Printer test successful");
        } else {
          toast.warning(`Printer test failed: ${data.data.message}`);
        }
        fetchKOTs(); // Refresh to update printer status
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchKOTs();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchKOTs();
      }, 30000); // 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Fetch hotel info
  useEffect(() => {
    const fetchHotel = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
          const res = await fetch(`${apiBase}/hotels/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          setHotel(data.data);
        } catch (error) {
          console.error("Failed to fetch hotel:", error);
        }
      }
    };
    fetchHotel();
  }, []);

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-orange-100 text-orange-800 border-orange-200",
      preparing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      ready: "bg-green-100 text-green-800 border-green-200",
      served: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPrintStatusBadge = (printStatus?: string) => {
    switch(printStatus) {
      case 'printed':
        return <Badge className="bg-green-100 text-green-800 border-green-200 ml-2">
          <PrinterIcon className="w-3 h-3 mr-1" />
          Printed
        </Badge>;
      case 'print_failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200 ml-2">
          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
          Print Failed
        </Badge>;
      case 'no_printer':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 ml-2">
          <InformationCircleIcon className="w-3 h-3 mr-1" />
          No Printer
        </Badge>;
      default:
        return null;
    }
  };

  const getTimeColor = (minutes: number) => {
    if (minutes > 20) return "text-red-600 font-bold";
    if (minutes > 10) return "text-orange-600";
    if (minutes > 5) return "text-yellow-600";
    return "text-gray-600";
  };

  const KOTCard = ({ kot, status }: { kot: KOTItem; status: string }) => {
    // Determine border color based on print warning
    const borderColor = kot.printWarning 
      ? kot.ui?.warningType === 'info' ? 'border-l-yellow-500' : 'border-l-red-500'
      : 'border-l-blue-500';
    
    return (
      <Card className={`mb-4 hover:shadow-lg transition-shadow border-l-4 ${borderColor}`}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg">{kot.kotNumber}</h3>
                <Badge className={getStatusBadge(status)}>
                  {status.toUpperCase()}
                </Badge>
                {getPrintStatusBadge(kot.printStatus)}
                {kot.priority === 'high' && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <BellAlertIcon className="w-3 h-3 mr-1" />
                    URGENT
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Room {kot.roomNumber} • {kot.guestId?.firstName} {kot.guestId?.lastName}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Sent: {kot.kotSentAt ? format(new Date(kot.kotSentAt), 'HH:mm') : '-'}
              </div>
              {kot.timeInCurrentStatus !== undefined && (
                <div className={`text-sm font-medium ${getTimeColor(kot.timeInCurrentStatus)}`}>
                  {kot.timeInCurrentStatus} min
                </div>
              )}
            </div>
          </div>

          {/* Print Warning Message */}
          {kot.printWarning && kot.printMessage && (
            <div className={`mb-3 p-2 rounded text-sm flex items-start gap-2 ${
              kot.ui?.warningType === 'info' 
                ? 'bg-yellow-50 border border-yellow-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {kot.ui?.warningType === 'info' ? (
                <InformationCircleIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-gray-700">{kot.printMessage}</span>
            </div>
          )}

          {/* Items */}
          <div className="border-t border-b py-2 my-2">
            {kot.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span>
                  <span className="font-medium">{item.quantity}x</span> {item.name}
                </span>
                {item.note && (
                  <span className="text-xs text-gray-500 italic">Note: {item.note}</span>
                )}
              </div>
            ))}
          </div>

          {/* Special Instructions */}
          {kot.specialInstructions && (
            <div className="bg-yellow-50 p-2 rounded mb-3 text-sm border border-yellow-200">
              <span className="font-medium">📝 Special: </span>
              {kot.specialInstructions}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            {status === 'pending' && (
              <Button
                onClick={() => updateKOTStatus(kot._id, 'preparing')}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <FireIcon className="w-4 h-4 mr-2" />
                Start Preparing
              </Button>
            )}
            
            {status === 'preparing' && (
              <Button
                onClick={() => updateKOTStatus(kot._id, 'ready')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Mark as Ready
              </Button>
            )}
            
            {status === 'ready' && (
              <>
                <Button
                  onClick={() => updateKOTStatus(kot._id, 'served')}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Mark as Served
                </Button>
                <Button
                  onClick={() => updateKOTStatus(kot._id, 'preparing')}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Back to Preparing
                </Button>
              </>
            )}
            
            {status === 'served' && (
              <Button
                onClick={() => updateKOTStatus(kot._id, 'ready')}
                variant="outline"
                className="flex-1"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Reopen
              </Button>
            )}

            {status !== 'cancelled' && status !== 'served' && (
              <Button
                onClick={() => updateKOTStatus(kot._id, 'cancelled')}
                variant="destructive"
                size="sm"
                className="ml-auto"
              >
                <XCircleIcon className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading kitchen orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar
        user={user}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        logout={logout}
        nepaliFlag={hotel?.nepaliFlag}
      />

      <div className="max-w-9xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Kitchen Display System</h1>
            <p className="text-sm text-gray-500 mt-1">
              {hotel?.name} • Last updated: {format(lastUpdated, 'HH:mm:ss')}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <ArrowPathIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
          </div>
        </div>

        {/* Printer Health Banner */}
        {printerHealth.status !== 'online' && (
          <div className={`mb-4 p-3 rounded-lg flex items-start gap-3 ${
            printerHealth.status === 'not_configured' 
              ? 'bg-yellow-50 border border-yellow-200' 
              : 'bg-orange-50 border border-orange-200'
          }`}>
            {printerHealth.status === 'not_configured' ? (
              <InformationCircleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            ) : (
              <SignalIcon  className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">{printerHealth.message}</p>
              <p className="text-sm text-gray-600 mt-1">
                All orders are visible in this dashboard. 
                {printerHealth.status === 'not_configured' 
                  ? ' Contact manager to configure printers for automatic printing.'
                  : ' Kitchen staff can still prepare food from this screen.'}
              </p>
              {printerHealth.details.printers.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Printer Status:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {printerHealth.details.printers.map(printer => (
                      <Badge 
                        key={printer.id}
                        variant="outline"
                        className={printer.connected 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {printer.connected ? (
                          <WifiIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <SignalIcon  className="w-3 h-3 mr-1" />
                        )}
                        {printer.name} {printer.isDefault && "(Default)"}
                        {!printer.connected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-5 text-xs"
                            onClick={() => testPrinter(printer.id)}
                          >
                            Test
                          </Button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Print Stats Summary */}
        {printStats.printFailed > 0 && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-3 flex items-center gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                <div>
                  <div className="text-lg font-bold text-red-700">{printStats.printFailed}</div>
                  <div className="text-xs text-red-600">Orders with print issues</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-3 flex items-center gap-3">
                <InformationCircleIcon className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="text-lg font-bold text-yellow-700">{printStats.printed}</div>
                  <div className="text-xs text-yellow-600">Successfully printed</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-lg font-bold text-blue-700">{stats.pending}</div>
                  <div className="text-xs text-blue-600">Pending in kitchen</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-4 space-y-2">
            {notifications.map((notification, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg flex items-start gap-2 ${
                  notification.type === 'warning'
                    ? 'bg-orange-50 border border-orange-200'
                    : notification.type === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                {notification.type === 'warning' && (
                  <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                )}
                {notification.type === 'error' && (
                  <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                {notification.type === 'info' && (
                  <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm">{notification.message}</p>
                  {notification.action && (
                    <p className="text-xs text-gray-500 mt-1">{notification.action}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.preparing}</div>
              <div className="text-sm text-gray-600">Preparing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
              <div className="text-sm text-gray-600">Ready</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.served}</div>
              <div className="text-sm text-gray-600">Served</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.avgPrepTime} min</div>
              <div className="text-sm text-gray-600">Avg Prep Time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Today</div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button onClick={() => setError("")} className="float-right">×</button>
          </div>
        )}

        {/* KOT Columns */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="pending" className="relative">
              Pending
              {stats.pending > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white">{stats.pending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preparing">
              Preparing
              {stats.preparing > 0 && (
                <Badge className="ml-2 bg-yellow-500 text-white">{stats.preparing}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready">
              Ready
              {stats.ready > 0 && (
                <Badge className="ml-2 bg-green-500 text-white">{stats.ready}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="served">
              Served
              {stats.served > 0 && (
                <Badge className="ml-2 bg-blue-500 text-white">{stats.served}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="space-y-4">
              {kots.pending.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No pending orders</p>
                  </CardContent>
                </Card>
              ) : (
                kots.pending.map(kot => (
                  <KOTCard key={kot._id} kot={kot} status="pending" />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="preparing">
            <div className="space-y-4">
              {kots.preparing.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <FireIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No orders in preparation</p>
                  </CardContent>
                </Card>
              ) : (
                kots.preparing.map(kot => (
                  <KOTCard key={kot._id} kot={kot} status="preparing" />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="ready">
            <div className="space-y-4">
              {kots.ready.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No ready orders</p>
                  </CardContent>
                </Card>
              ) : (
                kots.ready.map(kot => (
                  <KOTCard key={kot._id} kot={kot} status="ready" />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="served">
            <div className="space-y-4">
              {kots.served.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No served orders</p>
                  </CardContent>
                </Card>
              ) : (
                kots.served.slice(0, 20).map(kot => (
                  <KOTCard key={kot._id} kot={kot} status="served" />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Kitchen Message */}
        {printerHealth.kitchenMessage && (
          <div className="mt-6 text-center text-sm text-gray-500 border-t pt-4">
            {printerHealth.kitchenMessage}
          </div>
        )}
      </div>
    </div>
  );
}