"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PrinterIcon, PlusIcon, XMarkIcon, CheckCircleIcon, XCircleIcon, BeakerIcon } from "@heroicons/react/24/outline";
import { toast } from 'sonner';

interface Printer {
  _id?: string;
  name: string;
  description?: string;
  printerType: 'network' | 'system' | 'usb' | 'serial' | 'file';
  networkAddress?: string;
  networkPort?: number;
  printerName?: string;
  isDefault: boolean;
  isActive: boolean;
  testMode: boolean;
  printToFile: boolean;
  assignedCategories: string[];
  status?: {
    connected: boolean;
    lastCheck?: string;
    details?: any;
  };
  lastTested?: string;
  lastError?: string;
}

interface PrinterManagementProps {
  hotelId: string;
  hotelName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrinterManagement({ hotelId, hotelName, open, onOpenChange }: PrinterManagementProps) {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState<string | null>(null);
  
  // New printer form
  const [newPrinter, setNewPrinter] = useState<Printer>({
    name: "",
    description: "",
    printerType: "network",
    networkAddress: "",
    networkPort: 9100,
    printerName: "",
    isDefault: false,
    isActive: true,
    testMode: false,
    printToFile: true,
    assignedCategories: []
  });

  // Available categories (you can fetch these from your items)
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    "Grill", "Pizza", "Beverages", "Desserts", "Breakfast", "Lunch", "Dinner"
  ]);

  // Fetch printers
  const fetchPrinters = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kot/printers?hotel=${hotelId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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

  // Add printer
  const addPrinter = async () => {
    try {
      // Validate based on printer type
      if (newPrinter.printerType === 'network' && !newPrinter.networkAddress) {
        toast.error("Network address is required");
        return;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kot/printers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newPrinter,
          hotel: hotelId
        })
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
          isDefault: false,
          isActive: true,
          testMode: false,
          printToFile: true,
          assignedCategories: []
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

  // Delete printer
  const deletePrinter = async (printerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kot/printers/${printerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
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

  // Test printer
  const testPrinter = async (printerId: string) => {
    try {
      setTestingPrinter(printerId);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kot/printers/${printerId}/test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (data.success) {
        if (data.data.success) {
          toast.success(`Printer test successful! Connected to ${data.data.details?.address || 'printer'}`);
        } else {
          toast.warning(`Printer connected but test print may have issues: ${data.data.message}`);
        }
        // Update printer status
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

  // Set as default
  const setAsDefault = async (printerId: string) => {
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
        body: JSON.stringify({
          ...printer,
          isDefault: true
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Default printer updated");
        fetchPrinters();
      } else {
        toast.error(data.message || "Failed to update printer");
      }
    } catch (error) {
      console.error("Error setting default printer:", error);
      toast.error("Failed to set default printer");
    }
  };

  useEffect(() => {
    if (open) {
      fetchPrinters();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PrinterIcon className="w-5 h-5" />
            Printer Management - {hotelName}
          </DialogTitle>
          <DialogDescription>
            Configure printers for kitchen orders. Each printer can be assigned to specific item categories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Printer Button */}
          <Button onClick={() => setShowAddPrinter(true)} className="w-full sm:w-auto">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Printer
          </Button>

          {/* Printer List */}
          {loading ? (
            <div className="text-center py-8">Loading printers...</div>
          ) : printers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <PrinterIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No printers configured yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Add Printer" to set up your first printer</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {printers.map((printer) => (
                <Card key={printer._id} className={`relative ${!printer.isActive ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{printer.name}</h3>
                          {printer.isDefault && (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Default</Badge>
                          )}
                          {printer.status?.connected ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Online</Badge>
                          ) : (
                            <Badge variant="destructive">Offline</Badge>
                          )}
                          {printer.testMode && (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">Test Mode</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Type:</span>{' '}
                            <span className="font-medium capitalize">{printer.printerType}</span>
                          </div>
                          {printer.printerType === 'network' && (
                            <>
                              <div>
                                <span className="text-gray-500">Address:</span>{' '}
                                <span className="font-medium">{printer.networkAddress}:{printer.networkPort}</span>
                              </div>
                            </>
                          )}
                          {printer.printerType === 'system' && (
                            <div>
                              <span className="text-gray-500">Printer Name:</span>{' '}
                              <span className="font-medium">{printer.printerName}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Categories:</span>{' '}
                            <span className="font-medium">
                              {printer.assignedCategories?.length ? printer.assignedCategories.join(', ') : 'All'}
                            </span>
                          </div>
                          {printer.lastTested && (
                            <div>
                              <span className="text-gray-500">Last Tested:</span>{' '}
                              <span className="font-medium">
                                {new Date(printer.lastTested).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {printer.lastError && (
                            <div className="col-span-2 text-red-600 text-xs mt-1">
                              Error: {printer.lastError}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testPrinter(printer._id!)}
                          disabled={testingPrinter === printer._id}
                          className="flex items-center"
                        >
                          <BeakerIcon className="w-4 h-4 mr-1" />
                          {testingPrinter === printer._id ? 'Testing...' : 'Test'}
                        </Button>
                        {!printer.isDefault && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAsDefault(printer._id!)}
                            className="flex items-center"
                          >
                            Set as Default
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
                          className="flex items-center"
                        >
                          <XMarkIcon className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Printer</DialogTitle>
              <DialogDescription>
                Configure your printer settings. For your printer at 192.168.1.102, use Network type.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="printer-name">Printer Name *</Label>
                <Input
                  id="printer-name"
                  value={newPrinter.name}
                  onChange={(e) => setNewPrinter({...newPrinter, name: e.target.value})}
                  placeholder="e.g., Main Kitchen Printer"
                />
              </div>

              <div>
                <Label htmlFor="printer-description">Description (Optional)</Label>
                <Input
                  id="printer-description"
                  value={newPrinter.description}
                  onChange={(e) => setNewPrinter({...newPrinter, description: e.target.value})}
                  placeholder="e.g., Kitchen printer for food orders"
                />
              </div>

              <div>
                <Label htmlFor="printer-type">Printer Type</Label>
                <Select
                  value={newPrinter.printerType}
                  onValueChange={(value: any) => setNewPrinter({...newPrinter, printerType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select printer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="network">Network Printer (Ethernet/WiFi)</SelectItem>
                    <SelectItem value="system">System Printer (USB/Shared)</SelectItem>
                    <SelectItem value="file">File Printer (Save to file)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newPrinter.printerType === 'network' && (
                <>
                  <div>
                    <Label htmlFor="network-address">IP Address *</Label>
                    <Input
                      id="network-address"
                      value={newPrinter.networkAddress}
                      onChange={(e) => setNewPrinter({...newPrinter, networkAddress: e.target.value})}
                      placeholder="192.168.1.102"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Your printer IP: 192.168.1.102 (port 80 will work)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="network-port">Port</Label>
                    <Input
                      id="network-port"
                      type="number"
                      value={newPrinter.networkPort}
                      onChange={(e) => setNewPrinter({...newPrinter, networkPort: parseInt(e.target.value) || 9100})}
                      placeholder="9100"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Standard ESC/POS port is 9100, but your printer also accepts port 80
                    </p>
                  </div>
                </>
              )}

              {newPrinter.printerType === 'system' && (
                <div>
                  <Label htmlFor="printer-name-system">Windows Printer Name</Label>
                  <Input
                    id="printer-name-system"
                    value={newPrinter.printerName}
                    onChange={(e) => setNewPrinter({...newPrinter, printerName: e.target.value})}
                    placeholder="EPSON TM-T20"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="assigned-categories">Assign to Categories</Label>
                <Select
                  value={newPrinter.assignedCategories[0] || ""}
                  onValueChange={(value) => setNewPrinter({...newPrinter, assignedCategories: [value]})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to use for all orders
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-default"
                  checked={newPrinter.isDefault}
                  onCheckedChange={(checked) => setNewPrinter({...newPrinter, isDefault: checked})}
                />
                <Label htmlFor="is-default">Set as default printer</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="test-mode"
                  checked={newPrinter.testMode}
                  onCheckedChange={(checked) => setNewPrinter({...newPrinter, testMode: checked})}
                />
                <Label htmlFor="test-mode">Test mode (save to file instead of printing)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="print-to-file"
                  checked={newPrinter.printToFile}
                  onCheckedChange={(checked) => setNewPrinter({...newPrinter, printToFile: checked})}
                />
                <Label htmlFor="print-to-file">Save backup copies to file</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddPrinter(false)}>
                Cancel
              </Button>
              <Button onClick={addPrinter}>
                Add Printer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}