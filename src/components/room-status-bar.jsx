"use client";

import React, { useState } from "react";
import { Info, Bed } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function RoomStatusBar({ rooms = [] }) {
  const [showPrices, setShowPrices] = useState(false);

  const occupied = rooms.filter(r => r.isOccupied);
  const available = rooms.filter(r => !r.isOccupied && r.maintenanceStatus !== "maintenance");
  const maintenance = rooms.filter(r => r.maintenanceStatus === "maintenance");

  return (
    <div className="bg-card rounded-xl border border-border p-3 sm:p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Bed className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Room Status</h2>
            <p className="text-xs text-muted-foreground">{rooms.length} rooms total</p>
          </div>
        </div>
        <button
          onClick={() => setShowPrices(true)}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prices</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-1 sm:gap-2 overflow-x-hidden">
        {rooms.map((room) => (
          <div
            key={room._id}
            className={cn(
              "px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded text-[10px] sm:text-xs font-semibold border transition-all duration-200 hover:scale-105 cursor-default select-none whitespace-nowrap",
              room.maintenanceStatus === "maintenance"
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
                : room.isOccupied
                  ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
            )}
            title={`${room.roomNumber} - ${room.maintenanceStatus === "maintenance" ? "Maintenance" : room.isOccupied ? "Occupied" : "Available"} - $${room.rate}/night`}
          >
            {room.roomNumber}
          </div>
        ))}
        {rooms.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 w-full text-center">No rooms available</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-1 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
          <span className="text-xs text-muted-foreground">Available ({available.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shrink-0" />
          <span className="text-xs text-muted-foreground">Occupied ({occupied.length})</span>
        </div>
        {maintenance.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
            <span className="text-xs text-muted-foreground">Maintenance ({maintenance.length})</span>
          </div>
        )}
      </div>

      <Dialog open={showPrices} onOpenChange={setShowPrices}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Room Prices</DialogTitle>
            <DialogDescription>Room-wise pricing details</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-1.5">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0",
                      room.maintenanceStatus === "maintenance"
                        ? "bg-amber-500"
                        : room.isOccupied
                          ? "bg-red-500"
                          : "bg-emerald-500"
                    )} />
                    <span className="text-sm font-medium">{room.roomNumber}</span>
                    <span className="text-xs text-muted-foreground capitalize">({room.type || "standard"})</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold text-foreground">${room.rate}</span>
                    <span className="text-xs text-muted-foreground ml-1">/night</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
