"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { 
  getHotels, addHotel, updateHotel, updateHotelBalance,
  uploadHotelLogo, uploadHotelImages, uploadHotelGallery,
  getHotelLicense, updateHotelLicense,
  getNotificationSettings, updateNotificationSettings,
  addNotificationRecipient, removeNotificationRecipient,
  toggleNotificationRecipient, testNotification,
  getEmailServiceStatus, updateHotelWebsite, 
  addHotelDomain, removeHotelDomain
} from "@/lib/api";
import { getHotel } from "@/lib/api";
import { createExpenditure, getExpenditures, approveExpenditure, rejectExpenditure } from "@/lib/expenditure";
import { Expenditure, ExpenditureFilters, ExpenditureResponse } from "@/types/expenditure";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import Image from "next/image";
import { 
  PhotoIcon, PlusIcon, XMarkIcon, BellIcon, ClockIcon, 
  DocumentTextIcon, EnvelopeIcon, GlobeAltIcon, MagnifyingGlassIcon,
  PrinterIcon, ComputerDesktopIcon, ServerIcon, WifiIcon,
  CheckCircleIcon, XCircleIcon, BeakerIcon, Cog6ToothIcon
} from "@heroicons/react/24/outline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';
import WebsiteContentManager from "@/components/WebsiteContentManager";
import { Hotel } from "@/types/hotel";

// ==================== PRINTER MANAGEMENT COMPONENT ====================

interface Printer {
  _id?: string;
  name: string;
  description?: string;
  model?: string;
  printerSubtype?: 'standard' | 'thermal' | 'auto';  // Add this
  printerType: 'network' | 'system' | 'usb' | 'serial' | 'file';
  networkAddress?: string;
  networkPort?: number;
  printerName?: string;
  usbVendorId?: number;
  usbProductId?: number;
  serialPort?: string;
  baudRate?: number;
  paperWidth?: number;
  isDefault: boolean;
  isActive: boolean;
  testMode: boolean;
  printToFile: boolean;
  printFileLocation?: string;
  assignedCategories: string[];
  status?: {
    connected: boolean;
    lastCheck?: string;
    details?: any;
  };
  lastTested?: string;
  lastError?: string;
  settings?: {
    openDrawer: boolean;
    printReceipt: boolean;
    copies: number;
    timeout: number;
  };
}

interface PrinterManagementProps {
  hotelId: string;
  hotelName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PrinterManagement({ hotelId, hotelName, open, onOpenChange }: PrinterManagementProps) {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState<string | null>(null);
  const [systemPrinters, setSystemPrinters] = useState<string[]>([]);
  
  const [newPrinter, setNewPrinter] = useState<Printer>({
    name: "",
    description: "",
    model: "",                    // Add this
  printerSubtype: "auto",        // Add this (default to auto)
    printerType: "network",
    networkAddress: "",
    networkPort: 9100,
    printerName: "",
    usbVendorId: undefined,
    usbProductId: undefined,
    serialPort: "",
    baudRate: 9600,
    paperWidth: 42,
    isDefault: false,
    isActive: true,
    testMode: false,
    printToFile: true,
    printFileLocation: "./printed_kots/",
    assignedCategories: [],
    settings: {
      openDrawer: false,
      printReceipt: true,
      copies: 1,
      timeout: 10000
    }
  });

  const availableCategories = [
    "Appetizers", "Main Course", "Grill", "Pizza", "Beverages", 
    "Desserts", "Breakfast", "Lunch", "Dinner", "Bar", "Specials"
  ];

  const fetchSystemPrinters = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kot/printers/system/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSystemPrinters(data.data.printers.map((p: any) => p.name));
      }
    } catch (error) {
      console.error("Error fetching system printers:", error);
    }
  };

  const fetchPrinters = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kot/printers?hotel=${hotelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPrinters(data.data);
      }
    } catch (error) {
      console.error("Error fetching printers:", error);
      toast.error("Failed to load printers");
    } finally {
      setLoading(false);
    }
  };

  const addPrinter = async () => {
    try {
      if (newPrinter.printerType === 'network' && !newPrinter.networkAddress) {
        toast.error("Network address is required");
        return;
      }
      if (newPrinter.printerType === 'system' && !newPrinter.printerName) {
        toast.error("Printer name is required");
        return;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kot/printers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...newPrinter, hotel: hotelId })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Printer added successfully");
        setShowAddPrinter(false);
        setNewPrinter({
          name: "",
          description: "",
          printerType: "network",
          networkAddress: "",
          networkPort: 9100,
          printerName: "",
          usbVendorId: undefined,
          usbProductId: undefined,
          serialPort: "",
          baudRate: 9600,
          paperWidth: 42,
          isDefault: false,
          isActive: true,
          testMode: false,
          printToFile: true,
          printFileLocation: "./printed_kots/",
          assignedCategories: [],
          settings: {
            openDrawer: false,
            printReceipt: true,
            copies: 1,
            timeout: 10000
          }
        });
        fetchPrinters();
      } else {
        toast.error(data.message || "Failed to add printer");
      }
    } catch (error) {
      console.error("Error adding printer:", error);
      toast.error("Failed to add printer");
    }
  };

  const updatePrinter = async (printerId: string, updates: Partial<Printer>) => {
    try {
      const token = localStorage.getItem("token");
      const printer = printers.find(p => p._id === printerId);
      if (!printer) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kot/printers/${printerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...printer, ...updates })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Printer updated successfully");
        fetchPrinters();
      } else {
        toast.error(data.message || "Failed to update printer");
      }
    } catch (error) {
      console.error("Error updating printer:", error);
      toast.error("Failed to update printer");
    }
  };

  const deletePrinter = async (printerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kot/printers/${printerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Printer deleted successfully");
        fetchPrinters();
      } else {
        toast.error(data.message || "Failed to delete printer");
      }
    } catch (error) {
      console.error("Error deleting printer:", error);
      toast.error("Failed to delete printer");
    }
  };

  const testPrinter = async (printerId: string) => {
    try {
      setTestingPrinter(printerId);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kot/printers/${printerId}/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        if (data.data.connection?.connected) {
          toast.success(`✅ Printer test successful! Connected to ${data.data.connection?.address || 'printer'}`);
        } else {
          toast.warning(`⚠️ Printer test completed with issues: ${data.data.message || 'Check printer connection'}`);
        }
        fetchPrinters();
      } else {
        toast.error(data.message || "Failed to test printer");
      }
    } catch (error) {
      console.error("Error testing printer:", error);
      toast.error("Failed to test printer");
    } finally {
      setTestingPrinter(null);
    }
  };

  const togglePrinterActive = async (printerId: string, currentActive: boolean) => {
    await updatePrinter(printerId, { isActive: !currentActive });
  };

  const setAsDefault = async (printerId: string) => {
    await updatePrinter(printerId, { isDefault: true });
  };

  const getPrinterIcon = (type: string) => {
    switch(type) {
      case 'network': return <WifiIcon className="w-4 h-4" />;
      case 'system': return <ComputerDesktopIcon className="w-4 h-4" />;
      case 'usb': return <ServerIcon className="w-4 h-4" />;
      default: return <PrinterIcon className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    if (open) {
      fetchPrinters();
      fetchSystemPrinters();
    }
  }, [open, hotelId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <PrinterIcon className="w-6 h-6" />
            Printer Management - {hotelName}
          </DialogTitle>
          <DialogDescription>
            Configure printers for kitchen orders. Each printer can be assigned to specific item categories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Configured Printers</h3>
            <Button onClick={() => { setShowAddPrinter(true); fetchSystemPrinters(); }} className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Printer
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading printers...</div>
          ) : printers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <PrinterIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No printers configured yet</p>
                <p className="text-sm text-gray-400 mt-2">Click "Add Printer" to set up your first printer</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setNewPrinter({
                      ...newPrinter,
                      name: "Kitchen Printer",
                      networkAddress: "192.168.1.102",
                      networkPort: 80,
                      isDefault: true
                    });
                    setShowAddPrinter(true);
                  }}
                >
                  Quick Setup: 192.168.1.102
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {printers.map((printer) => (
                <Card key={printer._id} className={`relative overflow-hidden ${!printer.isActive ? 'opacity-70' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <div className={`p-2 rounded-lg ${printer.status?.connected ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {getPrinterIcon(printer.printerType)}
                          </div>
                          <h4 className="font-semibold text-lg">{printer.name}</h4>
                          <div className="flex gap-2 flex-wrap">
                            {printer.isDefault && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">Default</Badge>
                            )}
                            {printer.status?.connected ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                                <CheckCircleIcon className="w-3 h-3" /> Online
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <XCircleIcon className="w-3 h-3" /> Offline
                              </Badge>
                            )}
                            {printer.testMode && (
                              <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">
                                Test Mode
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 min-w-[80px]">Type:</span>
                            <span className="font-medium capitalize px-2 py-1 bg-gray-100 rounded">
                              {printer.printerType}
                            </span>
                          </div>
                          
                          {printer.printerType === 'network' && printer.networkAddress && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 min-w-[80px]">Address:</span>
                              <span className="font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                                {printer.networkAddress}:{printer.networkPort}
                              </span>
                            </div>
                          )}
                          
                          {printer.printerType === 'system' && printer.printerName && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 min-w-[80px]">Printer:</span>
                              <span className="font-medium">{printer.printerName}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 min-w-[80px]">Categories:</span>
                            <span className="font-medium">
                              {printer.assignedCategories && printer.assignedCategories.length > 0 ? (
                                <div className="flex gap-1 flex-wrap">
                                  {printer.assignedCategories.map(cat => (
                                    <Badge key={cat} variant="outline" className="text-xs">
                                      {cat}
                                    </Badge>
                                  ))}
                                </div>
                              ) : 'All'}
                            </span>
                          </div>

                          {printer.settings && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 min-w-[80px]">Copies:</span>
                              <span className="font-medium">{printer.settings.copies}</span>
                            </div>
                          )}

                          {printer.lastTested && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 min-w-[80px]">Last Test:</span>
                              <span className="text-xs text-gray-600">
                                {new Date(printer.lastTested).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {printer.lastError && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                            Error: {printer.lastError}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row lg:flex-col gap-2 justify-end lg:min-w-[140px]">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printer._id && testPrinter(printer._id)}
                          disabled={testingPrinter === printer._id}
                          className="flex items-center justify-center gap-1"
                        >
                          <BeakerIcon className="w-4 h-4" />
                          {testingPrinter === printer._id ? 'Testing...' : 'Test'}
                        </Button>
                        
                        {printer._id && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePrinterActive(printer._id!, printer.isActive)}
                              className={`flex items-center justify-center gap-1 ${
                                printer.isActive ? 'text-green-600' : 'text-gray-600'
                              }`}
                            >
                              {printer.isActive ? 'Active' : 'Inactive'}
                            </Button>
                            
                            {!printer.isDefault && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAsDefault(printer._id!)}
                                className="flex items-center justify-center gap-1"
                              >
                                Set Default
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete printer "${printer.name}"?`)) {
                                  deletePrinter(printer._id!);
                                }
                              }}
                              className="flex items-center justify-center gap-1"
                            >
                              <XMarkIcon className="w-4 h-4" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add Printer Modal */}
        <Dialog open={showAddPrinter} onOpenChange={setShowAddPrinter}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Printer</DialogTitle>
              <DialogDescription>
                Configure your printer settings. For your printer at 192.168.1.102, use Network type with port 80 or 9100.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="printer-name">Printer Name *</Label>
                  <Input
                    id="printer-name"
                    value={newPrinter.name}
                    onChange={(e) => setNewPrinter({...newPrinter, name: e.target.value})}
                    placeholder="e.g., Main Kitchen Printer"
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="printer-type">Printer Type *</Label>
                  <Select
                    value={newPrinter.printerType}
                    onValueChange={(value: 'network' | 'system' | 'usb' | 'serial' | 'file') => setNewPrinter({...newPrinter, printerType: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select printer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="network">Network Printer (Ethernet/WiFi)</SelectItem>
                      <SelectItem value="system">System Printer (USB/Shared)</SelectItem>
                      <SelectItem value="file">File Printer (Save to file)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="printer-description">Description (Optional)</Label>
                  <Input
                    id="printer-description"
                    value={newPrinter.description || ''}
                    onChange={(e) => setNewPrinter({...newPrinter, description: e.target.value})}
                    placeholder="e.g., Kitchen printer for food orders"
                    className="mt-1"
                  />
                </div>
              </div>

{/* Network Printer Settings */}
{/* Network Printer Settings */}
{/* Network Printer Settings */}
{newPrinter.printerType === 'network' && (
  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
    <h4 className="font-medium flex items-center gap-2">
      <WifiIcon className="w-4 h-4" />
      Network Printer Configuration
    </h4>
    
    {/* Printer Name */}
    <div>
      <Label htmlFor="network-name">Printer Name *</Label>
      <Input
        id="network-name"
        value={newPrinter.name}
        onChange={(e) => setNewPrinter({...newPrinter, name: e.target.value})}
        placeholder="e.g., Kitchen Printer"
        className="mt-1"
      />
    </div>
    
    {/* NEW: Printer Model - Critical for detection */}
    <div>
      <Label htmlFor="network-model">Printer Model</Label>
      <Input
        id="network-model"
        value={newPrinter.model || ''}
        onChange={(e) => setNewPrinter({...newPrinter, model: e.target.value})}
        placeholder="e.g., Canon G3020 series, Epson TM-T20"
        className="mt-1"
      />
      <p className="text-sm text-blue-600 mt-1">
        ℹ️ Enter the model name (e.g., "Canon G3020") for automatic format detection
      </p>
    </div>
    
    {/* IP Address and Port */}
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 md:col-span-1">
        <Label htmlFor="network-address">IP Address *</Label>
        <Input
          id="network-address"
          value={newPrinter.networkAddress || ''}
          onChange={(e) => {
            const cleanValue = e.target.value.replace(/^https?:\/\//, '');
            setNewPrinter({...newPrinter, networkAddress: cleanValue});
          }}
          placeholder="192.168.1.102"
          className="mt-1 font-mono"
        />
      </div>
      <div className="col-span-2 md:col-span-1">
        <Label htmlFor="network-port">Port</Label>
        <Input
          id="network-port"
          type="number"
          value={newPrinter.networkPort || 9100}
          onChange={(e) => setNewPrinter({...newPrinter, networkPort: parseInt(e.target.value) || 9100})}
          placeholder="9100"
          className="mt-1 font-mono"
        />
      </div>
    </div>
    
{/* Printer Type Selection - NEW */}
<div>
  <Label htmlFor="printer-subtype">Printer Technology</Label>
  <Select
    value={newPrinter.printerSubtype || 'standard'}
    onValueChange={(value: 'standard' | 'thermal' | 'auto') => 
      setNewPrinter({...newPrinter, printerSubtype: value})
    }
  >
    <SelectTrigger className="mt-1">
      <SelectValue placeholder="Select printer type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="standard">Standard Printer (Canon, HP, Brother)</SelectItem>
      <SelectItem value="thermal">Thermal Printer (ESC/POS)</SelectItem>
      <SelectItem value="auto">Auto-detect from model</SelectItem>
    </SelectContent>
  </Select>
  <p className="text-sm text-gray-500 mt-1">
    Select "Standard" for your Canon G3020
  </p>
</div>
  </div>
)}

{/* System Printer Settings */}
{/* System Printer Settings */}
{newPrinter.printerType === 'system' && (
  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
    <h4 className="font-medium flex items-center gap-2">
      <ComputerDesktopIcon className="w-4 h-4" />
      System Printer Configuration
    </h4>
    
    {/* Manual printer name entry */}
    <div>
      <Label htmlFor="system-printer-name">Windows Printer Name</Label>
      <Input
        id="system-printer-name"
        value={newPrinter.printerName || ''}
        onChange={(e) => setNewPrinter({
          ...newPrinter, 
          printerName: e.target.value
        })}
        placeholder="e.g., Canon G3020 series"
        className="mt-1"
      />
      <p className="text-sm text-gray-500 mt-1">
        Enter the exact printer name as shown in Windows Devices and Printers
      </p>
    </div>
    
    {/* Keep network info for reference (optional) */}
    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-sm text-blue-700">
        <strong>Network Printer Info:</strong> {newPrinter.networkAddress || '192.168.1.102'}:{newPrinter.networkPort || '80'}
      </p>
      <p className="text-xs text-blue-600 mt-1">
        This printer is installed in Windows. Windows will handle all network communication.
      </p>
    </div>
  </div>
)}

{/* Category Assignment */}
<div className="bg-gray-50 p-4 rounded-lg space-y-4">
  <h4 className="font-medium">Category Assignment</h4>
  <div>
    <Label htmlFor="assigned-categories">Assign to Categories</Label>
    <Select
      value={newPrinter.assignedCategories[0] || "none"}
      onValueChange={(value) => setNewPrinter({
        ...newPrinter, 
        assignedCategories: value === "none" ? [] : [value]
      })}
    >
      <SelectTrigger className="mt-1">
        <SelectValue placeholder="Select category (optional)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">All Categories</SelectItem>
        {availableCategories.map(cat => (
          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    <p className="text-sm text-gray-500 mt-1">
      Leave as "All Categories" to use for all orders
    </p>
  </div>
</div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Cog6ToothIcon className="w-4 h-4" />
                  Printer Settings
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="copies">Number of Copies</Label>
                    <Input
                      id="copies"
                      type="number"
                      min="1"
                      max="5"
                      value={newPrinter.settings?.copies || 1}
                      onChange={(e) => setNewPrinter({
                        ...newPrinter, 
                        settings: {
                          ...(newPrinter.settings || { openDrawer: false, printReceipt: true, copies: 1, timeout: 10000 }),
                          copies: parseInt(e.target.value) || 1
                        }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paper-width">Paper Width (chars)</Label>
                    <Input
                      id="paper-width"
                      type="number"
                      min="32"
                      max="64"
                      value={newPrinter.paperWidth || 42}
                      onChange={(e) => setNewPrinter({...newPrinter, paperWidth: parseInt(e.target.value) || 42})}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-default" className="cursor-pointer">Set as default printer</Label>
                    <Switch
                      id="is-default"
                      checked={newPrinter.isDefault}
                      onCheckedChange={(checked) => setNewPrinter({...newPrinter, isDefault: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="test-mode" className="cursor-pointer">Test mode (save to file)</Label>
                    <Switch
                      id="test-mode"
                      checked={newPrinter.testMode}
                      onCheckedChange={(checked) => setNewPrinter({...newPrinter, testMode: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="print-to-file" className="cursor-pointer">Save backup copies to file</Label>
                    <Switch
                      id="print-to-file"
                      checked={newPrinter.printToFile}
                      onCheckedChange={(checked) => setNewPrinter({...newPrinter, printToFile: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="open-drawer" className="cursor-pointer">Open cash drawer on print</Label>
                    <Switch
                      id="open-drawer"
                      checked={newPrinter.settings?.openDrawer || false}
                      onCheckedChange={(checked) => setNewPrinter({
                        ...newPrinter, 
                        settings: {
                          ...(newPrinter.settings || { openDrawer: false, printReceipt: true, copies: 1, timeout: 10000 }),
                          openDrawer: checked
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowAddPrinter(false)}>Cancel</Button>
              <Button onClick={addPrinter} className="bg-blue-600 hover:bg-blue-700">Add Printer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== HELPER FUNCTIONS ====================

const safeString = (value: string | undefined | null): string => value ?? '';
const safeNumber = (value: number | undefined | null): number => value ?? 0;
const safeArray = <T,>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];
const safeObject = <T extends object>(value: T | undefined | null, defaultValue: T): T => value ?? defaultValue;

// ==================== MAIN HOTELS PAGE ====================

export default function HotelsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [showExpenditureModal, setShowExpenditureModal] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [domainType, setDomainType] = useState<"whitelistedDomains" | "customDomains">("whitelistedDomains");
  const [showNotificationSettingsModal, setShowNotificationSettingsModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showTestNotificationModal, setShowTestNotificationModal] = useState(false);
  const [emailServiceStatus, setEmailServiceStatus] = useState<any>(null);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [expenditureFilters, setExpenditureFilters] = useState<ExpenditureFilters>({});
  const [newExpenditure, setNewExpenditure] = useState<Partial<Expenditure>>({
    amount: 0,
    category: "supplies",
    description: "",
    date: new Date().toISOString(),
    notes: ""
  });
  const [selectedExpenditure, setSelectedExpenditure] = useState<Expenditure | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notificationSettings, setNotificationSettings] = useState({
    dailyReport: { enabled: true, time: "18:00", recipients: [] },
    licenseExpiryAlerts: { enabled: true, recipients: [], daysBefore: [30, 15, 7, 1] }
  });
  const [licenseInfo, setLicenseInfo] = useState({
    licenseNumber: "",
    expiryDate: "",
    licenseDocument: "",
    status: "active"
  });
  const [testNotificationData, setTestNotificationData] = useState({
    type: "daily_report",
    testEmail: "",
    date: new Date().toISOString().split('T')[0]
  });
  const [newRecipient, setNewRecipient] = useState({ email: "", name: "", role: "manager" });
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [showNepali, setShowNepali] = useState(false);
  
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ name: "", city: "", search: "" });

  const [hotel, setHotel] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hotel');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const [newHotel, setNewHotel] = useState<Hotel>({
    name: "",
    description: "",
    phone: "",
    logo: "",
    images: [],
    vatNumber: "",
    companyName: "",
    vatAddress: "",
    type: "",
    roomCount: 0,
    floors: 0,
    established: new Date().getFullYear(),
    amenities: [],
    gallery: [],
    contact: { phone: "", reception: "", email: "", website: "" },
    address: { street: "", area: "", city: "", state: "", zip: "" },
    locationMap: "",
    nearby: [],
    notes: [],
    initialAmount: 0,
    currentBalance: 0,
    createdAt: new Date().toISOString(),
    whitelistedDomains: [],
    customDomains: [],
    website: {
      heroTitle: "",
      heroSubtitle: "",
      heroImage: "",
      aboutDescription: "",
      amenitiesDescription: "",
      experiencesDescription: "",
      testimonialsDescription: "",
      footerDescription: "",
      rooms: [],
      amenities: [],
      testimonials: [],
      contactInfo: { phone: "", email: "", address: "" }
    },
    seo: { title: "", description: "", keywords: [] },
    nepaliLanguage: false
  });

  useEffect(() => {
    loadData();
    checkEmailServiceStatus();
  }, []);

  useEffect(() => {
    if (user && ["manager", "staff"].includes(user.role)) {
      loadExpenditures();
    }
  }, [user, expenditureFilters]);

  useEffect(() => {
    if (showEditModal && selectedHotel) {
      setShowNepali(!!selectedHotel.nepaliLanguage);
    }
  }, [showEditModal, selectedHotel]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getHotels();
      setHotels(response.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenditures = async () => {
    try {
      const res = await getExpenditures(expenditureFilters) as ExpenditureResponse;
      setExpenditures(res?.data || []);
      setFilteredTotal(res?.filteredTotal || 0);
      setFilteredCount(res?.filteredCount || 0);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const checkEmailServiceStatus = async () => {
    try {
      const response = await getEmailServiceStatus();
      setEmailServiceStatus(response.data);
    } catch (e: any) {
      setEmailServiceStatus({
        global: { postmark: false, defaultEmail: false, serviceAvailable: false, fromAddress: 'not configured' },
        hotels: []
      });
    }
  };

  const isValidDomain = (domain: string) => {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain);
  };

  const handleAddDomain = async () => {
    if (!selectedHotel?._id || !newDomain) return;
    try {
      if (!isValidDomain(newDomain)) {
        toast.error("Invalid Domain: Please enter a valid domain name");
        return;
      }
      await addHotelDomain(selectedHotel._id, domainType, newDomain);
      setHotels(prev => prev.map(h => 
        h._id === selectedHotel._id ? { ...h, [domainType]: [...(h[domainType] || []), newDomain] } : h
      ));
      setSelectedHotel(prev => prev ? { ...prev, [domainType]: [...(prev[domainType] || []), newDomain] } : null);
      setNewDomain("");
      toast.success(`Domain ${newDomain} added successfully.`);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || "Failed to add domain");
    }
  };

  const handleRemoveDomain = async (domain: string, type: "whitelistedDomains" | "customDomains") => {
    if (!selectedHotel?._id) return;
    try {
      await removeHotelDomain(selectedHotel._id, type, domain);
      setHotels(prev => prev.map(h => 
        h._id === selectedHotel._id ? { ...h, [type]: h[type]?.filter(d => d !== domain) || [] } : h
      ));
      setSelectedHotel(prev => prev ? { ...prev, [type]: prev[type]?.filter(d => d !== domain) || [] } : null);
      toast.success(`Domain ${domain} removed successfully.`);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || "Failed to remove domain");
    }
  };

  const handleCreateExpenditure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExpenditure({ ...newExpenditure, hotel: selectedHotel?._id || "" } as any);
      setShowExpenditureModal(false);
      loadExpenditures();
      setNewExpenditure({ amount: 0, category: "supplies", description: "", date: new Date().toISOString(), notes: "" });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleApproveExpenditure = async (id: string) => {
    try {
      await approveExpenditure(id);
      loadExpenditures();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleRejectExpenditure = async (id: string) => {
    try {
      await rejectExpenditure(id, rejectReason);
      setRejectReason("");
      loadExpenditures();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpdateBalance = async () => {
    if (!selectedHotel?._id) return;
    try {
      await updateHotelBalance(selectedHotel._id, balanceAmount);
      setShowBalanceModal(false);
      loadData();
      setBalanceAmount(0);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleOpenNotificationSettings = async (hotel: Hotel) => {
    try {
      setSelectedHotel(hotel);
      const response = await getNotificationSettings(hotel._id!);
      const settings = response.data || { dailyReport: { enabled: true, time: "18:00", recipients: [] }, licenseExpiryAlerts: { enabled: true, recipients: [], daysBefore: [30, 15, 7, 1] } };
      setNotificationSettings(settings);
      setShowNotificationSettingsModal(true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleOpenLicenseModal = async (hotel: Hotel) => {
    try {
      setSelectedHotel(hotel);
      const response = await getHotelLicense(hotel._id!);
      setLicenseInfo(response.data || { licenseNumber: "", expiryDate: "", licenseDocument: "", status: "active" });
      setShowLicenseModal(true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSaveNotificationSettings = async () => {
    if (!selectedHotel?._id) return;
    try {
      await updateNotificationSettings(selectedHotel._id, notificationSettings);
      setShowNotificationSettingsModal(false);
      toast.success("Notification settings updated successfully");
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to update notification settings");
    }
  };

  const handleSaveLicenseInfo = async () => {
    if (!selectedHotel?._id) return;
    try {
      await updateHotelLicense(selectedHotel._id, licenseInfo);
      setShowLicenseModal(false);
      toast.success("License information updated successfully");
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to update license information");
    }
  };

  const handleAddRecipient = async () => {
    if (!selectedHotel?._id || !newRecipient.email) return;
    try {
      await addNotificationRecipient(selectedHotel._id, newRecipient);
      const response = await getNotificationSettings(selectedHotel._id);
      setNotificationSettings(response.data);
      setNewRecipient({ email: "", name: "", role: "manager" });
      toast.success("Recipient added successfully");
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to add recipient");
    }
  };

  const handleRemoveRecipient = async (email: string) => {
    if (!selectedHotel?._id) return;
    try {
      await removeNotificationRecipient(selectedHotel._id, email);
      const response = await getNotificationSettings(selectedHotel._id);
      setNotificationSettings(response.data);
      toast.success("Recipient removed successfully");
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to remove recipient");
    }
  };

  const handleToggleRecipient = async (email: string) => {
    if (!selectedHotel?._id) return;
    try {
      await toggleNotificationRecipient(selectedHotel._id, email);
      const response = await getNotificationSettings(selectedHotel._id);
      setNotificationSettings(response.data);
      toast.success("Recipient status updated");
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to update recipient status");
    }
  };

  const handleTestNotification = async () => {
    if (!selectedHotel?._id) return;
    try {
      const response = await testNotification(selectedHotel._id, testNotificationData.type, testNotificationData.testEmail, testNotificationData.date);
      if (response.success) {
        toast.success(`Test notification sent successfully: ${response.message}`);
        setShowTestNotificationModal(false);
      } else {
        setError(`Failed to send test notification: ${response.message}`);
        toast.error(`Failed to send test notification: ${response.message}`);
      }
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to send test notification");
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>, hotelId: string) => {
    if (!e.target.files?.[0]) return;
    try {
      setUploading(true);
      setUploadProgress(0);
      const file = e.target.files[0];
      const interval = setInterval(() => {
        setUploadProgress(prev => prev >= 90 ? prev : prev + 10);
      }, 100);
      const formData = new FormData();
      formData.append("logo", file);
      const response = await uploadHotelLogo(hotelId, formData);
      setUploadProgress(100);
      setHotels(prev => prev.map(h => h._id === hotelId ? { ...h, logo: response.url } : h));
      if (selectedHotel?._id === hotelId) {
        setSelectedHotel(prev => prev ? { ...prev, logo: response.url } : null);
      }
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
      toast.success("Logo uploaded successfully");
    } catch (e: any) {
      setError(e.message);
      setUploading(false);
      setUploadProgress(0);
      toast.error("Failed to upload logo");
    }
  };

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>, hotelId: string, type: 'images' | 'gallery') => {
    if (!e.target.files?.length) return;
    try {
      setUploading(true);
      setUploadProgress(0);
      const files = Array.from(e.target.files);
      const interval = setInterval(() => {
        setUploadProgress(prev => prev >= 90 ? 90 : prev + 10);
      }, 200);
      const formData = new FormData();
      files.forEach(file => formData.append(type, file));
      const response = type === 'images' ? await uploadHotelImages(hotelId, formData) : await uploadHotelGallery(hotelId, formData);
      setUploadProgress(100);
      setHotels(prev => prev.map(h => h._id === hotelId ? { ...h, [type]: [...(h[type] || []), ...response.urls] } : h));
      if (selectedHotel?._id === hotelId) {
        setSelectedHotel(prev => prev ? { ...prev, [type]: [...(prev[type] || []), ...response.urls] } : null);
      }
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
      toast.success(`${files.length} ${type} uploaded successfully`);
    } catch (e: any) {
      setError(e.message);
      setUploading(false);
      setUploadProgress(0);
      toast.error(`Failed to upload ${type}`);
    }
  };

  const handleRemoveImage = async (hotelId: string, imageUrl: string, type: 'logo' | 'images' | 'gallery') => {
    try {
      setHotels(prev => prev.map(h => {
        if (h._id === hotelId) {
          if (type === 'logo') return { ...h, logo: '' };
          return { ...h, [type]: h[type]?.filter(img => img !== imageUrl) || [] };
        }
        return h;
      }));
      if (selectedHotel?._id === hotelId) {
        if (type === 'logo') {
          setSelectedHotel(prev => prev ? { ...prev, logo: '' } : null);
        } else {
          setSelectedHotel(prev => prev ? { ...prev, [type]: prev[type]?.filter(img => img !== imageUrl) || [] } : null);
        }
      }
      toast.success("Image removed successfully");
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to remove image");
    }
  };

  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try { new URL(url); return true; } catch { return false; }
  };

  const filteredHotels = hotels.filter((hotel: Hotel) => {
    const matchesName = !filters.name || (hotel.name && hotel.name.toLowerCase().includes(filters.name.toLowerCase()));
    const matchesCity = !filters.city || (hotel.address?.city && hotel.address.city.toLowerCase().includes(filters.city.toLowerCase()));
    const matchesSearch = !filters.search || 
      (hotel.name && hotel.name.toLowerCase().includes(filters.search.toLowerCase())) ||
      (hotel.address?.city && hotel.address.city.toLowerCase().includes(filters.search.toLowerCase()));
    return matchesName && matchesCity && matchesSearch;
  });

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Hotels Management</h1>
          {user?.role === 'super_admin' && (
            <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add New Hotel
            </Button>
          )}
        </div>

        {/* Create Hotel Modal */}
        {user?.role === 'super_admin' && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Hotel</DialogTitle>
              </DialogHeader>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await addHotel(newHotel);
                  setShowCreateModal(false);
                  loadData();
                  setNewHotel({
                    name: "", description: "", phone: "", logo: "", images: [], vatNumber: "", companyName: "", vatAddress: "", type: "",
                    roomCount: 0, floors: 0, established: new Date().getFullYear(), amenities: [], gallery: [],
                    contact: { phone: "", reception: "", email: "", website: "" },
                    address: { street: "", area: "", city: "", state: "", zip: "" },
                    locationMap: "", nearby: [], notes: [], initialAmount: 0, currentBalance: 0, createdAt: new Date().toISOString(),
                    whitelistedDomains: [], customDomains: [],
                    website: { heroTitle: "", heroSubtitle: "", heroImage: "", aboutDescription: "", amenitiesDescription: "",
                      experiencesDescription: "", testimonialsDescription: "", footerDescription: "", rooms: [], amenities: [], testimonials: [],
                      contactInfo: { phone: "", email: "", address: "" } },
                    seo: { title: "", description: "", keywords: [] },
                    nepaliLanguage: false
                  });
                  toast.success("Hotel created successfully");
                } catch (e: any) {
                  setError(e.message);
                  toast.error("Failed to create hotel");
                }
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hotel Name *</label>
                    <Input type="text" value={newHotel.name || ''} onChange={(e) => setNewHotel({...newHotel, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <Input type="text" value={newHotel.type || ''} onChange={(e) => setNewHotel({...newHotel, type: e.target.value})} placeholder="e.g., 5-Star Luxury Hotel" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input type="text" value={newHotel.phone || ''} onChange={(e) => setNewHotel({...newHotel, phone: e.target.value})} placeholder="+1-555-123-4567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Room Count</label>
                    <Input type="number" value={newHotel.roomCount || 0} onChange={(e) => setNewHotel({...newHotel, roomCount: parseInt(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Floors</label>
                    <Input type="number" value={newHotel.floors || 0} onChange={(e) => setNewHotel({...newHotel, floors: parseInt(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Established Year</label>
                    <Input type="number" value={newHotel.established || new Date().getFullYear()} onChange={(e) => setNewHotel({...newHotel, established: parseInt(e.target.value) || new Date().getFullYear()})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">VAT Number</label>
                    <Input type="text" value={newHotel.vatNumber || ''} onChange={(e) => setNewHotel({...newHotel, vatNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name</label>
                    <Input type="text" value={newHotel.companyName || ''} onChange={(e) => setNewHotel({...newHotel, companyName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">VAT Address</label>
                    <Input type="text" value={newHotel.vatAddress || ''} onChange={(e) => setNewHotel({...newHotel, vatAddress: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Initial Amount</label>
                    <Input type="number" step="0.01" value={newHotel.initialAmount || 0} onChange={(e) => setNewHotel({...newHotel, initialAmount: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={newHotel.description || ''} onChange={(e) => setNewHotel({...newHotel, description: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" rows={3} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input type="text" value={newHotel.address?.street || ''} onChange={(e) => setNewHotel({...newHotel, address: {...newHotel.address, street: e.target.value}})} placeholder="Street" />
                    <Input type="text" value={newHotel.address?.area || ''} onChange={(e) => setNewHotel({...newHotel, address: {...newHotel.address, area: e.target.value}})} placeholder="Area" />
                    <Input type="text" value={newHotel.address?.city || ''} onChange={(e) => setNewHotel({...newHotel, address: {...newHotel.address, city: e.target.value}})} placeholder="City" />
                    <Input type="text" value={newHotel.address?.state || ''} onChange={(e) => setNewHotel({...newHotel, address: {...newHotel.address, state: e.target.value}})} placeholder="State" />
                    <Input type="text" value={newHotel.address?.zip || ''} onChange={(e) => setNewHotel({...newHotel, address: {...newHotel.address, zip: e.target.value}})} placeholder="ZIP Code" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Contact Information</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input type="text" value={newHotel.contact?.phone || ''} onChange={(e) => setNewHotel({...newHotel, contact: {...newHotel.contact, phone: e.target.value}})} placeholder="Phone" />
                    <Input type="text" value={newHotel.contact?.reception || ''} onChange={(e) => setNewHotel({...newHotel, contact: {...newHotel.contact, reception: e.target.value}})} placeholder="Reception" />
                    <Input type="email" value={newHotel.contact?.email || ''} onChange={(e) => setNewHotel({...newHotel, contact: {...newHotel.contact, email: e.target.value}})} placeholder="Email" />
                    <Input type="url" value={newHotel.contact?.website || ''} onChange={(e) => setNewHotel({...newHotel, contact: {...newHotel.contact, website: e.target.value}})} placeholder="Website URL" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Amenities (comma-separated)</label>
                  <Input type="text" value={newHotel.amenities?.join(", ") || ''} onChange={(e) => setNewHotel({...newHotel, amenities: e.target.value.split(",").map(item => item.trim()).filter(Boolean)})} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Nearby Attractions (comma-separated)</label>
                  <Input type="text" value={newHotel.nearby?.join(", ") || ''} onChange={(e) => setNewHotel({...newHotel, nearby: e.target.value.split(",").map(item => item.trim()).filter(Boolean)})} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location Map URL</label>
                  <Input type="url" value={newHotel.locationMap || ''} onChange={(e) => setNewHotel({...newHotel, locationMap: e.target.value})} />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Create Hotel</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button onClick={() => setError("")} className="float-right text-red-700 hover:text-red-900">×</button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input type="text" value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} placeholder="Search hotels..." />
            <Input type="text" value={filters.name} onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))} placeholder="Filter by name..." />
            <Input type="text" value={filters.city} onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))} placeholder="Filter by city..." />
          </div>
        </div>

        {/* Hotels Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statistics</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHotels.map((hotel: Hotel) => (
                  <tr key={hotel._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-medium">{hotel.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{hotel.description || ''}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{hotel.address?.city || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{hotel.address?.street || ''}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{hotel.contact?.phone || hotel.phone || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{hotel.contact?.email || ''}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{safeNumber(hotel.roomCount)} Total Rooms</div>
                      <div className="text-sm text-gray-500">{safeArray(hotel.amenities).length} Amenities</div>
                      <div className="text-sm text-gray-500">{hotel.type || 'N/A'} Type</div>
                      {hotel.currentBalance !== undefined && (
                        <div className="text-sm text-green-600 font-medium">Balance: रु{hotel.currentBalance.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">Created: {hotel.createdAt ? new Date(hotel.createdAt).toLocaleDateString() : 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4">
                      {hotel.license ? (
                        <Badge variant={hotel.license.status === 'active' ? 'default' : 'destructive'} className={`capitalize ${hotel.license.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}`}>
                          {hotel.license.status}
                          {hotel.license.expiryDate && <span className="ml-1">({new Date(hotel.license.expiryDate).toLocaleDateString()})</span>}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No License</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 space-y-2 min-w-[140px]">
                      <Button onClick={() => { setSelectedHotel(hotel); setShowEditModal(true); }} variant="outline" size="sm" className="w-full">Edit</Button>
                      {(user?.role === 'manager' || user?.role === 'super_admin') && (
                        <Button onClick={() => { setSelectedHotel(hotel); setBalanceAmount(hotel.initialAmount || 0); setShowBalanceModal(true); }} variant="outline" size="sm" className="w-full bg-green-100 text-green-800 hover:bg-green-200">Update Balance</Button>
                      )}
                      {user?.role === 'super_admin' && (
                        <>
                          <Button onClick={() => handleOpenNotificationSettings(hotel)} variant="outline" size="sm" className="w-full bg-blue-100 text-blue-800 hover:bg-blue-200"><BellIcon className="w-4 h-4 mr-1" />Notifications</Button>
                          <Button onClick={() => handleOpenLicenseModal(hotel)} variant="outline" size="sm" className="w-full bg-purple-100 text-purple-800 hover:bg-purple-200"><DocumentTextIcon className="w-4 h-4 mr-1" />License</Button>
                          <Button onClick={async () => { try { const res = await getHotel(hotel._id!); setSelectedHotel(res?.data || hotel); } catch { setSelectedHotel(hotel); } finally { setShowWebsiteModal(true); } }} variant="outline" size="sm" className="w-full bg-teal-100 text-teal-800 hover:bg-teal-200"><GlobeAltIcon className="w-4 h-4 mr-1" />Website</Button>
                          <Button onClick={() => { setSelectedHotel(hotel); setShowDomainModal(true); }} variant="outline" size="sm" className="w-full bg-orange-100 text-orange-800 hover:bg-orange-200"><GlobeAltIcon className="w-4 h-4 mr-1" />Domains</Button>
                          <Button onClick={() => { setSelectedHotel(hotel); setShowPrinterModal(true); }} variant="outline" size="sm" className="w-full bg-indigo-100 text-indigo-800 hover:bg-indigo-200"><PrinterIcon className="w-4 h-4 mr-1" />Printers</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredHotels.length === 0 && <div className="text-center py-12 text-gray-500">No hotels found matching your criteria.</div>}
        </div>

        {/* Edit Hotel Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Hotel - {selectedHotel?.name}</DialogTitle>
            </DialogHeader>
            {selectedHotel && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={!!selectedHotel.nepaliLanguage} onChange={e => setSelectedHotel({ ...selectedHotel, nepaliLanguage: e.target.checked })} className="accent-blue-600" />
                    <span>Enable Nepali Language</span>
                  </div>
                  <h3 className="text-lg font-semibold">Hotel Details</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!selectedHotel._id) return;
                    try {
                      const updatedHotel = { ...selectedHotel, nepaliLanguage: !!selectedHotel.nepaliLanguage };
                      await updateHotel(selectedHotel._id, updatedHotel);
                      localStorage.setItem('hotel', JSON.stringify(updatedHotel));
                      window.dispatchEvent(new StorageEvent('storage', { key: 'hotel', newValue: JSON.stringify(updatedHotel) }));
                      setShowEditModal(false);
                      loadData();
                      toast.success("Hotel updated successfully");
                    } catch (e: any) {
                      setError(e.message);
                      toast.error("Failed to update hotel");
                    }
                  }} className="space-y-4">
                    
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <Label htmlFor="edit-name">Hotel Name *</Label>
    <Input
      id="edit-name"
      type="text"
      value={selectedHotel.name || ''}
      onChange={(e) => setSelectedHotel({...selectedHotel, name: e.target.value})}
      required
    />
  </div>
  
  <div>
    <Label htmlFor="edit-type">Type</Label>
    <Input
      id="edit-type"
      type="text"
      value={selectedHotel.type || ''}
      onChange={(e) => setSelectedHotel({...selectedHotel, type: e.target.value})}
      placeholder="e.g., 5-Star Luxury Hotel"
    />
  </div>
  
  <div>
    <Label htmlFor="edit-phone">Phone</Label>
    <Input
      id="edit-phone"
      type="text"
      value={selectedHotel.contact?.phone || selectedHotel.phone || ''}
      onChange={(e) => setSelectedHotel({
        ...selectedHotel, 
        contact: { ...selectedHotel.contact, phone: e.target.value }
      })}
      placeholder="+1-555-123-4567"
    />
  </div>
  
  <div>
    <Label htmlFor="edit-roomCount">Room Count</Label>
    <Input
      id="edit-roomCount"
      type="number"
      value={selectedHotel.roomCount || 0}
      onChange={(e) => setSelectedHotel({...selectedHotel, roomCount: parseInt(e.target.value) || 0})}
    />
  </div>
  
  <div>
    <Label htmlFor="edit-floors">Floors</Label>
    <Input
      id="edit-floors"
      type="number"
      value={selectedHotel.floors || 0}
      onChange={(e) => setSelectedHotel({...selectedHotel, floors: parseInt(e.target.value) || 0})}
    />
  </div>
  
  <div>
    <Label htmlFor="edit-established">Established Year</Label>
    <Input
      id="edit-established"
      type="number"
      value={selectedHotel.established || new Date().getFullYear()}
      onChange={(e) => setSelectedHotel({...selectedHotel, established: parseInt(e.target.value) || new Date().getFullYear()})}
    />
  </div>
  
  <div>
    <Label htmlFor="edit-vatNumber">VAT Number</Label>
    <Input
      id="edit-vatNumber"
      type="text"
      value={selectedHotel.vatNumber || ''}
      onChange={(e) => setSelectedHotel({...selectedHotel, vatNumber: e.target.value})}
    />
  </div>
  
  <div>
    <Label htmlFor="edit-companyName">Company Name</Label>
    <Input
      id="edit-companyName"
      type="text"
      value={selectedHotel.companyName || ''}
      onChange={(e) => setSelectedHotel({...selectedHotel, companyName: e.target.value})}
    />
  </div>
  
  <div>
    <Label htmlFor="edit-vatAddress">VAT Address</Label>
    <Input
      id="edit-vatAddress"
      type="text"
      value={selectedHotel.vatAddress || ''}
      onChange={(e) => setSelectedHotel({...selectedHotel, vatAddress: e.target.value})}
    />
  </div>
</div>

                    <textarea value={selectedHotel.description || ''} onChange={(e) => setSelectedHotel({...selectedHotel, description: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" rows={3} placeholder="Description" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input type="text" value={selectedHotel.address?.street || ''} onChange={(e) => setSelectedHotel({...selectedHotel, address: { ...selectedHotel.address, street: e.target.value }})} placeholder="Street" />
                      <Input type="text" value={selectedHotel.address?.area || ''} onChange={(e) => setSelectedHotel({...selectedHotel, address: { ...selectedHotel.address, area: e.target.value }})} placeholder="Area" />
                      <Input type="text" value={selectedHotel.address?.city || ''} onChange={(e) => setSelectedHotel({...selectedHotel, address: { ...selectedHotel.address, city: e.target.value }})} placeholder="City" />
                      <Input type="text" value={selectedHotel.address?.state || ''} onChange={(e) => setSelectedHotel({...selectedHotel, address: { ...selectedHotel.address, state: e.target.value }})} placeholder="State" />
                      <Input type="text" value={selectedHotel.address?.zip || ''} onChange={(e) => setSelectedHotel({...selectedHotel, address: { ...selectedHotel.address, zip: e.target.value }})} placeholder="ZIP Code" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input type="text" value={selectedHotel.contact?.phone || ''} onChange={(e) => setSelectedHotel({...selectedHotel, contact: { ...selectedHotel.contact, phone: e.target.value }})} placeholder="Phone" />
                      <Input type="text" value={selectedHotel.contact?.reception || ''} onChange={(e) => setSelectedHotel({...selectedHotel, contact: { ...selectedHotel.contact, reception: e.target.value }})} placeholder="Reception" />
                      <Input type="email" value={selectedHotel.contact?.email || ''} onChange={(e) => setSelectedHotel({...selectedHotel, contact: { ...selectedHotel.contact, email: e.target.value }})} placeholder="Email" />
                      <Input type="url" value={selectedHotel.contact?.website || ''} onChange={(e) => setSelectedHotel({...selectedHotel, contact: { ...selectedHotel.contact, website: e.target.value }})} placeholder="Website URL" />
                    </div>

                    <Input type="text" value={selectedHotel.amenities?.join(", ") || ''} onChange={(e) => setSelectedHotel({...selectedHotel, amenities: e.target.value.split(",").map(item => item.trim()).filter(Boolean)})} placeholder="Amenities" />
                    <Input type="text" value={selectedHotel.nearby?.join(", ") || ''} onChange={(e) => setSelectedHotel({...selectedHotel, nearby: e.target.value.split(",").map(item => item.trim()).filter(Boolean)})} placeholder="Nearby" />
                    <Input type="url" value={selectedHotel.locationMap || ''} onChange={(e) => setSelectedHotel({...selectedHotel, locationMap: e.target.value})} placeholder="Location Map URL" />

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Update Hotel</Button>
                    </DialogFooter>
                  </form>
                </div>

                {/* Image Management */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Image Management</h3>
                  
                  {/* Logo Upload */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Hotel Logo</h4>
                    {selectedHotel.logo && isValidUrl(selectedHotel.logo) ? (
                      <div className="relative w-32 h-32">
                        <img src={selectedHotel.logo} alt="Hotel Logo" className="w-full h-full object-cover rounded-lg" />
                        <button onClick={() => handleRemoveImage(selectedHotel._id!, selectedHotel.logo!, 'logo')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><XMarkIcon className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-2">No logo uploaded</p>
                        <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded text-sm">
                          Upload Logo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadLogo(e, selectedHotel._id!)} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Main Images */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Main Images</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {selectedHotel.images?.filter(url => isValidUrl(url)).map((image, index) => (
                        <div key={index} className="relative w-full h-24">
                          <img src={image} alt={`Hotel ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                          <button onClick={() => handleRemoveImage(selectedHotel._id!, image, 'images')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                    <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded text-sm inline-block">
                      <PlusIcon className="w-4 h-4 inline mr-1" />Add Images
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUploadImages(e, selectedHotel._id!, 'images')} />
                    </label>
                  </div>

                  {/* Gallery Images */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Gallery Images</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {selectedHotel.gallery?.filter(url => isValidUrl(url)).map((image, index) => (
                        <div key={index} className="relative w-full h-24">
                          <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                          <button onClick={() => handleRemoveImage(selectedHotel._id!, image, 'gallery')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                    <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded text-sm inline-block">
                      <PlusIcon className="w-4 h-4 inline mr-1" />Add Gallery Images
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUploadImages(e, selectedHotel._id!, 'gallery')} />
                    </label>
                  </div>

                  {uploading && (
                    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        <div>
                          <p className="text-sm font-medium">Uploading... {uploadProgress}%</p>
                          <div className="w-32 h-2 bg-gray-200 rounded-full mt-1"><div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Other Modals */}
<Dialog open={showBalanceModal} onOpenChange={setShowBalanceModal}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Update Hotel Balance</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <Label htmlFor="balance-amount">Initial Amount</Label>
        <Input
          id="balance-amount"
          type="number"
          step="0.01"
          value={balanceAmount}
          onChange={(e) => setBalanceAmount(parseFloat(e.target.value) || 0)}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setShowBalanceModal(false)}>
          Cancel
        </Button>
        <Button onClick={handleUpdateBalance} className="bg-blue-600 hover:bg-blue-700 text-white">
          Update Balance
        </Button>
      </DialogFooter>
    </div>
  </DialogContent>
</Dialog>

        <Dialog open={showDomainModal} onOpenChange={setShowDomainModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Domain Management - {selectedHotel?.name}</DialogTitle>
              <DialogDescription>Manage domains for this hotel. Whitelisted domains are used for CORS and domain-based routing.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={domainType} onValueChange={(value: "whitelistedDomains" | "customDomains") => setDomainType(value)}>
                <SelectTrigger><SelectValue placeholder="Select domain type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whitelistedDomains">Whitelisted Domains</SelectItem>
                  <SelectItem value="customDomains">Custom Domains</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex space-x-2">
                <Input placeholder="example.com" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} />
                <Button onClick={handleAddDomain} disabled={!newDomain}>Add</Button>
              </div>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                {selectedHotel && selectedHotel[domainType] && selectedHotel[domainType]!.length > 0 ? (
                  selectedHotel[domainType]!.map((domain, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded mb-2">
                      <span className="font-medium">{domain}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDomain(domain, domainType)}><XMarkIcon className="w-4 h-4" /></Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">No domains configured</div>
                )}
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowDomainModal(false)}>Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showNotificationSettingsModal} onOpenChange={setShowNotificationSettingsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Notification Settings - {selectedHotel?.name}</DialogTitle></DialogHeader>
            {emailServiceStatus && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center">
                  <EnvelopeIcon className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium">Email Service Status:</span>
                  <Badge variant="outline" className={`ml-2 ${emailServiceStatus.global.serviceAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {emailServiceStatus.global.serviceAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </div>
            )}
            <Tabs defaultValue="daily">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="daily">Daily Reports</TabsTrigger>
                <TabsTrigger value="license">License Alerts</TabsTrigger>
              </TabsList>
<TabsContent value="daily" className="space-y-4 mt-4">
  <div className="flex items-center justify-between">
    <Label htmlFor="daily-reports-enabled" className="flex flex-col space-y-1">
      <span>Enable Daily Reports</span>
      <span className="font-normal text-sm text-gray-500">
        Send daily financial reports via email
      </span>
    </Label>
    <Switch
      id="daily-reports-enabled"
      checked={notificationSettings.dailyReport.enabled}
      onCheckedChange={(checked) => setNotificationSettings({
        ...notificationSettings,
        dailyReport: { ...notificationSettings.dailyReport, enabled: checked }
      })}
    />
  </div>

  <div>
    <Label htmlFor="report-time">Report Time</Label>
    <Input
      id="report-time"
      type="time"
      value={notificationSettings.dailyReport.time}
      onChange={(e) => setNotificationSettings({
        ...notificationSettings,
        dailyReport: { ...notificationSettings.dailyReport, time: e.target.value }
      })}
    />
    <p className="text-sm text-gray-500 mt-1">
      Time when daily reports will be sent (24-hour format)
    </p>
  </div>

  <div>
    <Label className="mb-2 block">Recipients</Label>
    <div className="space-y-2">
      {notificationSettings.dailyReport.recipients.map((recipient: any, index) => (
        <div key={index} className="flex items-center justify-between p-2 border rounded">
          <div>
            <div className="font-medium">{recipient.name || recipient.email}</div>
            {recipient.name && (
              <div className="text-sm text-gray-500">{recipient.email}</div>
            )}
            {recipient.role && (
              <Badge variant="outline" className="text-xs mt-1">
                {recipient.role}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={recipient.active}
              onCheckedChange={() => handleToggleRecipient(recipient.email)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveRecipient(recipient.email)}
            >
              <XMarkIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>

    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
      <h4 className="font-medium mb-2">Add New Recipient</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <Label htmlFor="recipient-email">Email</Label>
          <Input
            id="recipient-email"
            type="email"
            placeholder="Email"
            value={newRecipient.email}
            onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="recipient-name">Name (optional)</Label>
          <Input
            id="recipient-name"
            placeholder="Name"
            value={newRecipient.name}
            onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="recipient-role">Role</Label>
          <Select
            value={newRecipient.role}
            onValueChange={(value) => setNewRecipient({ ...newRecipient, role: value })}
          >
            <SelectTrigger id="recipient-role">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="accountant">Accountant</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        className="mt-2"
        onClick={handleAddRecipient}
        disabled={!newRecipient.email}
      >
        Add Recipient
      </Button>
    </div>
  </div>
</TabsContent>
              <TabsContent value="license" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label>Enable License Expiry Alerts</Label>
                  <Switch checked={notificationSettings.licenseExpiryAlerts.enabled} onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, licenseExpiryAlerts: {...notificationSettings.licenseExpiryAlerts, enabled: checked}})} />
                </div>
                <Label>Alert Before Expiry (days)</Label>
                <div className="flex flex-wrap gap-2">
                  {[30, 15, 7, 1].map((days) => {
                    const daysBefore = notificationSettings.licenseExpiryAlerts.daysBefore || [];
                    return (
                      <Badge key={days} variant={daysBefore.includes(days) ? "default" : "outline"} className="cursor-pointer" onClick={() => {
                        const newDays = daysBefore.includes(days) ? daysBefore.filter(d => d !== days) : [...daysBefore, days].sort((a, b) => b - a);
                        setNotificationSettings({...notificationSettings, licenseExpiryAlerts: {...notificationSettings.licenseExpiryAlerts, daysBefore: newDays}});
                      }}>
                        {days} day{days !== 1 ? 's' : ''}
                      </Badge>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTestNotificationModal(true)}>Test Notification</Button>
              <Button variant="outline" onClick={() => setShowNotificationSettingsModal(false)}>Cancel</Button>
              <Button onClick={handleSaveNotificationSettings}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

<Dialog open={showLicenseModal} onOpenChange={setShowLicenseModal}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>License Management - {selectedHotel?.name}</DialogTitle>
      <DialogDescription>
        Manage hotel license information and expiry dates.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      <div>
        <Label htmlFor="license-number">License Number</Label>
        <Input
          id="license-number"
          value={licenseInfo.licenseNumber}
          onChange={(e) => setLicenseInfo({...licenseInfo, licenseNumber: e.target.value})}
          placeholder="Enter license number"
        />
      </div>

      <div>
        <Label htmlFor="expiry-date">Expiry Date</Label>
        <Input
          id="expiry-date"
          type="date"
          value={licenseInfo.expiryDate ? new Date(licenseInfo.expiryDate).toISOString().split('T')[0] : ''}
          onChange={(e) => setLicenseInfo({...licenseInfo, expiryDate: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="license-document">License Document URL (optional)</Label>
        <Input
          id="license-document"
          type="url"
          value={licenseInfo.licenseDocument}
          onChange={(e) => setLicenseInfo({...licenseInfo, licenseDocument: e.target.value})}
          placeholder="https://example.com/license.pdf"
        />
      </div>

      {licenseInfo.expiryDate && (
        <div className="p-3 rounded-lg bg-gray-100">
          <div className="flex items-center">
            <span className="font-medium">Status:</span>
            <Badge 
              variant={new Date(licenseInfo.expiryDate) > new Date() ? 'default' : 'destructive'}
              className={`ml-2 ${new Date(licenseInfo.expiryDate) > new Date() ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
            >
              {new Date(licenseInfo.expiryDate) > new Date() ? "Active" : "Expired"}
            </Badge>
          </div>
          {new Date(licenseInfo.expiryDate) > new Date() && (
            <div className="text-sm text-gray-600 mt-1">
              Expires in {Math.ceil((new Date(licenseInfo.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
            </div>
          )}
        </div>
      )}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setShowLicenseModal(false)}>
        Cancel
      </Button>
      <Button onClick={handleSaveLicenseInfo}>
        Save License Info
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog open={showTestNotificationModal} onOpenChange={setShowTestNotificationModal}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Test Notification</DialogTitle>
      <DialogDescription>
        Send a test notification to verify your settings.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      <div>
        <Label htmlFor="test-type">Notification Type</Label>
        <Select
          value={testNotificationData.type}
          onValueChange={(value) => setTestNotificationData({...testNotificationData, type: value})}
        >
          <SelectTrigger id="test-type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily_report">Daily Report</SelectItem>
            <SelectItem value="license_expiry">License Expiry Alert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="test-email">Test Email Address</Label>
        <Input
          id="test-email"
          type="email"
          value={testNotificationData.testEmail}
          onChange={(e) => setTestNotificationData({...testNotificationData, testEmail: e.target.value})}
          placeholder="test@example.com"
        />
        <p className="text-sm text-gray-500 mt-1">
          Leave empty to use your account email
        </p>
      </div>

      {testNotificationData.type === 'daily_report' && (
        <div>
          <Label htmlFor="test-date">Report Date</Label>
          <Input
            id="test-date"
            type="date"
            value={testNotificationData.date}
            onChange={(e) => setTestNotificationData({...testNotificationData, date: e.target.value})}
          />
          <p className="text-sm text-gray-500 mt-1">
            Date for the test report (default: today)
          </p>
        </div>
      )}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setShowTestNotificationModal(false)}>
        Cancel
      </Button>
      <Button onClick={handleTestNotification}>
        Send Test
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

        <Dialog open={showWebsiteModal} onOpenChange={setShowWebsiteModal}>
          <DialogContent className="max-w-4xl h-[90vh]">
            <DialogHeader><DialogTitle>Website Content - {selectedHotel?.name}</DialogTitle></DialogHeader>
            {selectedHotel && (
              <WebsiteContentManager
                hotel={selectedHotel as any}
                onSave={async (content: { website: any; seo: any }) => {
                  try {
                    const updatedHotel = await updateHotelWebsite(selectedHotel._id!, content);
                    setSelectedHotel(updatedHotel);
                    loadData();
                    toast.success("Website content updated successfully");
                  } catch (error: any) {
                    toast.error("Failed to update website content: " + error.message);
                  }
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {selectedHotel && (
          <PrinterManagement
            hotelId={selectedHotel._id!}
            hotelName={selectedHotel.name || ''}
            open={showPrinterModal}
            onOpenChange={setShowPrinterModal}
          />
        )}

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent><div className="text-2xl font-bold text-blue-600">{hotels.length}</div><div className="text-sm text-gray-600">Total Hotels</div></CardContent></Card>
          <Card><CardContent><div className="text-2xl font-bold text-green-600">{hotels.reduce((sum, h) => sum + (h.roomCount || 0), 0)}</div><div className="text-sm text-gray-600">Total Rooms</div></CardContent></Card>
          <Card><CardContent><div className="text-2xl font-bold text-orange-600">{hotels.reduce((sum, h) => sum + (h.amenities?.length || 0), 0)}</div><div className="text-sm text-gray-600">Total Amenities</div></CardContent></Card>
          <Card><CardContent><div className="text-2xl font-bold text-purple-600">{hotels.filter(h => h.license?.status === 'active').length}</div><div className="text-sm text-gray-600">Active Licenses</div></CardContent></Card>
        </div>

        {/* Expenditures Section */}
        {user && ["manager", "staff"].includes(user.role) && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Expenditures</h2>
              {selectedHotel && <Button onClick={() => setShowExpenditureModal(true)} className="bg-green-600 hover:bg-green-700 text-white">Add Expenditure</Button>}
            </div>

            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Input type="text" value={expenditureFilters.search || ''} onChange={(e) => setExpenditureFilters(prev => ({ ...prev, search: e.target.value }))} placeholder="Search description..." />
                <Input type="date" value={expenditureFilters.startDate?.split('T')[0] || ''} onChange={(e) => setExpenditureFilters(prev => ({ ...prev, startDate: e.target.value }))} />
                <Input type="date" value={expenditureFilters.endDate?.split('T')[0] || ''} onChange={(e) => setExpenditureFilters(prev => ({ ...prev, endDate: e.target.value }))} />
                <Select value={expenditureFilters.category || ''} onValueChange={(value) => setExpenditureFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="salary">Salaries</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={expenditureFilters.status || ''} onValueChange={(value) => setExpenditureFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg shadow mb-6 border border-blue-100">
              <div className="flex justify-between items-center">
                <div><h3 className="text-sm font-medium text-gray-600">Filtered Results</h3><span className="text-3xl font-bold text-blue-700">रु{filteredTotal.toFixed(2)}</span></div>
                <div className="flex gap-4">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-sm"><span className="text-xs text-gray-500">Count</span><div className="text-xl font-semibold">{filteredCount}</div></div>
                  <div className="bg-white px-4 py-2 rounded-lg shadow-sm"><span className="text-xs text-gray-500">Average</span><div className="text-xl font-semibold">रु{filteredCount > 0 ? (filteredTotal / filteredCount).toFixed(2) : '0.00'}</div></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenditures.map((expenditure) => (
                    <TableRow key={expenditure._id}>
                      <TableCell>{format(new Date(expenditure.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="capitalize">{expenditure.category}</TableCell>
                      <TableCell>{expenditure.description}</TableCell>
                      <TableCell>रु{expenditure.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={expenditure.status === 'approved' ? 'default' : expenditure.status === 'rejected' ? 'destructive' : 'outline'}>
                          {expenditure.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === 'manager' && expenditure.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleApproveExpenditure(expenditure._id)} className="bg-green-600 hover:bg-green-700 text-white">Approve</Button>
                            <Button size="sm" onClick={() => { setSelectedExpenditure(expenditure); setShowRejectModal(true); }} className="bg-red-600 hover:bg-red-700 text-white">Reject</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

<Dialog open={showExpenditureModal} onOpenChange={setShowExpenditureModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add New Expenditure</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleCreateExpenditure} className="space-y-4">
      <div>
        <Label htmlFor="expenditure-amount">Amount</Label>
        <Input
          id="expenditure-amount"
          type="number"
          step="0.01"
          required
          value={newExpenditure.amount}
          onChange={(e) => setNewExpenditure(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
        />
      </div>

      <div>
        <Label htmlFor="expenditure-category">Category</Label>
        <Select
          value={newExpenditure.category}
          onValueChange={(value) => setNewExpenditure(prev => ({ ...prev, category: value as any }))}
        >
          <SelectTrigger id="expenditure-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="supplies">Supplies</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="utilities">Utilities</SelectItem>
            <SelectItem value="salary">Salaries</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="expenditure-description">Description</Label>
        <textarea
          id="expenditure-description"
          required
          value={newExpenditure.description}
          onChange={(e) => setNewExpenditure(prev => ({ ...prev, description: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2"
          rows={3}
          placeholder="Description"
        />
      </div>

      <div>
        <Label htmlFor="expenditure-date">Date</Label>
        <Input
          id="expenditure-date"
          type="date"
          required
          value={newExpenditure.date ? new Date(newExpenditure.date).toISOString().split('T')[0] : ''}
          onChange={(e) => setNewExpenditure(prev => ({ ...prev, date: new Date(e.target.value).toISOString() }))}
        />
      </div>

      <div>
        <Label htmlFor="expenditure-notes">Notes (Optional)</Label>
        <textarea
          id="expenditure-notes"
          value={newExpenditure.notes || ''}
          onChange={(e) => setNewExpenditure(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2"
          rows={2}
          placeholder="Additional notes"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setShowExpenditureModal(false)}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
          Create Expenditure
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
              <DialogContent>
                <DialogHeader><DialogTitle>Reject Expenditure</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); if (selectedExpenditure) { handleRejectExpenditure(selectedExpenditure._id); setShowRejectModal(false); } }} className="space-y-4">
                  <textarea required value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" rows={3} placeholder="Reason for Rejection" />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">Reject</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}