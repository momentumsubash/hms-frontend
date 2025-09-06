// components/EmailStatusDashboard.tsx
"use client";
import { useEffect, useState } from "react";
import { getEmailServiceStatus } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function EmailStatusDashboard() {
  const [emailStatus, setEmailStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmailStatus();
  }, []);

  const loadEmailStatus = async () => {
    try {
      const response = await getEmailServiceStatus();
      setEmailStatus(response.data);
    } catch (error) {
      console.error("Failed to load email status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading email status...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Email Service Status</h2>
      
      {/* Global Status */}
      <Card>
        <CardHeader>
          <CardTitle>Global Email Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Service Available:</strong>
              <Badge variant={emailStatus.global.serviceAvailable ? "default" : "destructive"} className="ml-2">
                {emailStatus.global.serviceAvailable ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <strong>From Address:</strong>
              <span className="ml-2">{emailStatus.global.fromAddress}</span>
            </div>
            <div>
              <strong>Postmark:</strong>
              <Badge variant={emailStatus.global.postmark ? "default" : "outline"} className="ml-2">
                {emailStatus.global.postmark ? "Configured" : "Not Configured"}
              </Badge>
            </div>
            <div>
              <strong>Default Email:</strong>
              <Badge variant={emailStatus.global.defaultEmail ? "default" : "outline"} className="ml-2">
                {emailStatus.global.defaultEmail ? "Configured" : "Not Configured"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hotels Status */}
      <Card>
        <CardHeader>
          <CardTitle>Hotel Notification Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hotel Name</TableHead>
                <TableHead>Daily Reports</TableHead>
                <TableHead>License Alerts</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailStatus.hotels.map((hotel: any) => (
                <TableRow key={hotel.id}>
                  <TableCell className="font-medium">{hotel.name}</TableCell>
                  <TableCell>
                    <Badge variant={hotel.dailyReportEnabled ? "default" : "outline"}>
                      {hotel.dailyReportEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={hotel.licenseAlertsEnabled ? "default" : "outline"}>
                      {hotel.licenseAlertsEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>{hotel.recipientCount}</TableCell>
                  <TableCell>
                    <Badge variant={hotel.hasNotificationSettings ? "default" : "outline"}>
                      {hotel.hasNotificationSettings ? "Configured" : "Not Configured"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}