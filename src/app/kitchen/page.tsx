"use client";

import React, { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  CheckCircle, 
  XCircle,
  Flame,
  RefreshCw,
  BellRing,
  Printer,
  AlertTriangle,
  Info,
  Wifi,
  WifiOff,
  Cloud,
  Search,
  SlidersHorizontal,
  X
} from "lucide-react";
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
  const router = useRouter();
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
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
    const colors: Record<string, string> = {
      pending: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
      preparing: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
      ready: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
      served: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
      cancelled: "bg-destructive/10 text-destructive border-destructive/30"
    };
    return colors[status] || "bg-muted text-muted-foreground border-border";
  };

  const getPrintStatusBadge = (printStatus?: string) => {
    switch(printStatus) {
      case 'printed':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 ml-2">
          <Printer className="w-3 h-3 mr-1" />
          Printed
        </Badge>;
      case 'print_failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/30 ml-2">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Print Failed
        </Badge>;
      case 'no_printer':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 ml-2">
          <Info className="w-3 h-3 mr-1" />
          No Printer
        </Badge>;
      default:
        return null;
    }
  };

  const getTimeColor = (minutes: number) => {
    if (minutes > 20) return "text-destructive font-bold";
    if (minutes > 10) return "text-orange-600 dark:text-orange-400";
    if (minutes > 5) return "text-amber-600 dark:text-amber-400";
    return "text-muted-foreground";
  };

  const KOTCard = ({ kot, status }: { kot: KOTItem; status: string }) => {
    // Determine border color based on print warning
    const borderColor = kot.printWarning 
      ? kot.ui?.warningType === 'info' ? 'border-l-amber-500' : 'border-l-destructive'
      : 'border-l-primary';
    
    return (
      <Card className={`hover:shadow-lg transition-shadow border-l-4 ${borderColor}`}>
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
                  <Badge className="bg-destructive/10 text-destructive border-destructive/30">
                    <BellRing className="w-3 h-3 mr-1" />
                    URGENT
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Room {kot.roomNumber} • {kot.guestId?.firstName} {kot.guestId?.lastName}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
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
            <div className={`mb-3 p-2 rounded-lg text-sm flex items-start gap-2 ${
              kot.ui?.warningType === 'info' 
                ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' 
                : 'bg-destructive/10 border border-destructive/30'
            }`}>
              {kot.ui?.warningType === 'info' ? (
                <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              )}
              <span className="text-foreground">{kot.printMessage}</span>
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
                  <span className="text-xs text-muted-foreground italic">Note: {item.note}</span>
                )}
              </div>
            ))}
          </div>

          {/* Special Instructions */}
          {kot.specialInstructions && (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg mb-3 text-sm border border-amber-200 dark:border-amber-800">
              <span className="font-medium"><Info className="w-3.5 h-3.5 inline mr-1 text-amber-600" /> Special: </span>
              {kot.specialInstructions}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            {status === 'pending' && (
              <Button
                onClick={() => updateKOTStatus(kot._id, 'preparing')}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Flame className="w-4 h-4 mr-2" />
                Start Preparing
              </Button>
            )}
            
            {status === 'preparing' && (
              <Button
                onClick={() => updateKOTStatus(kot._id, 'ready')}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Ready
              </Button>
            )}
            
            {status === 'ready' && (
              <>
                <Button
                  onClick={() => updateKOTStatus(kot._id, 'served')}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Served
                </Button>
                <Button
                  onClick={() => updateKOTStatus(kot._id, 'preparing')}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
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
                <RefreshCw className="w-4 h-4 mr-2" />
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
                <XCircle className="w-4 h-4 mr-1" />
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
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="bg-card rounded-xl border border-border p-3 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-xs text-muted-foreground">
              {hotel?.name}{hotel?.name && ' • '}Last updated: {format(lastUpdated, 'HH:mm:ss')}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                variant={autoRefresh ? "default" : "outline"}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Auto ON' : 'Auto OFF'}
              </Button>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1 max-w-xs w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-all shrink-0 ${showMobileFilters ? 'bg-primary text-white border-primary' : 'bg-muted/50 border-input text-muted-foreground hover:text-foreground'}`}
              title="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Filter Panel */}
        {showMobileFilters && (
          <div className="mb-4 p-4 rounded-lg border border-border bg-card md:hidden space-y-3">
            <div className="text-sm font-medium text-foreground">Filters</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-xs text-muted-foreground">Filter options</div>
            </div>
          </div>
        )}

        {/* Printer Health Banner */}
        {printerHealth.status !== 'online' && (
          <div className={`mb-4 p-3 rounded-lg flex items-start gap-3 ${
            printerHealth.status === 'not_configured' 
              ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' 
              : 'bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
          }`}>
            {printerHealth.status === 'not_configured' ? (
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <WifiOff className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium text-foreground">{printerHealth.message}</p>
              <p className="text-sm text-muted-foreground mt-1">
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
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800" 
                          : "bg-destructive/10 text-destructive border-destructive/30"
                        }
                      >
                        {printer.connected ? (
                          <Wifi className="w-3 h-3 mr-1" />
                        ) : (
                          <WifiOff className="w-3 h-3 mr-1" />
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
            <Card className="bg-destructive/10 border-destructive/30">
              <CardContent className="p-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <div>
                  <div className="text-lg font-bold text-destructive">{printStats.printFailed}</div>
                  <div className="text-xs text-destructive/80">Orders with print issues</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="p-3 flex items-center gap-3">
                <Info className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-lg font-bold text-amber-700 dark:text-amber-300">{printStats.printed}</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">Successfully printed</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-lg font-bold text-primary">{stats.pending}</div>
                  <div className="text-xs text-primary/80">Pending in kitchen</div>
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
                    ? 'bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                    : notification.type === 'error'
                    ? 'bg-destructive/10 border border-destructive/30'
                    : 'bg-primary/5 border border-primary/20'
                }`}
              >
                {notification.type === 'warning' && (
                  <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                )}
                {notification.type === 'error' && (
                  <XCircle className="w-5 h-5 text-destructive shrink-0" />
                )}
                {notification.type === 'info' && (
                  <Info className="w-5 h-5 text-primary shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm">{notification.message}</p>
                  {notification.action && (
                    <p className="text-xs text-muted-foreground mt-1">{notification.action}</p>
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
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.preparing}</div>
              <div className="text-sm text-muted-foreground">Preparing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.ready}</div>
              <div className="text-sm text-muted-foreground">Ready</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.served}</div>
              <div className="text-sm text-muted-foreground">Served</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.avgPrepTime} min</div>
              <div className="text-sm text-muted-foreground">Avg Prep Time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Today</div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-5 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="p-1 hover:bg-destructive/10 rounded transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* KOT Columns */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="pending" className="relative">
              Pending
              {stats.pending > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white dark:bg-orange-600">{stats.pending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preparing">
              Preparing
              {stats.preparing > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white dark:bg-amber-600">{stats.preparing}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready">
              Ready
              {stats.ready > 0 && (
                <Badge className="ml-2 bg-emerald-500 text-white dark:bg-emerald-600">{stats.ready}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="served">
              Served
              {stats.served > 0 && (
                <Badge className="ml-2 bg-primary text-primary-foreground">{stats.served}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {kots.pending.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="text-center py-12">
                    <Clock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending orders</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {kots.preparing.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="text-center py-12">
                    <Flame className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No orders in preparation</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {kots.ready.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No ready orders</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {kots.served.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No served orders</p>
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
          <div className="mt-6 text-center text-sm text-muted-foreground border-t border-border pt-4">
            {printerHealth.kitchenMessage}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}