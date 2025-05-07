"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, X, FileJson, FileText, Table } from "lucide-react";

interface GenerationEvent {
  id: string;
  userId: string;
  schemaId?: string;
  schemaName?: string;
  recordsCount: number;
  format: string;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
}

export function EventsList() {
  const [events, setEvents] = useState<GenerationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const COOLDOWN_SECONDS = 30;

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SECONDS);

    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/events?count=20");
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const data = await response.json();
      setEvents(data.events || []);

      // Start cooldown after successful fetch
      startCooldown();
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [startCooldown]);

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case "json":
        return <FileJson className="h-4 w-4 mr-1" />;
      case "csv":
        return <FileText className="h-4 w-4 mr-1" />;
      case "sql":
        return <Table className="h-4 w-4 mr-1" />;
      default:
        return <FileText className="h-4 w-4 mr-1" />;
    }
  };

  // Determine the refresh button text based on state
  const getRefreshButtonText = () => {
    if (loading) return "Loading...";
    if (cooldown > 0) return `Refresh (${cooldown}s)`;
    return "Refresh";
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={fetchEvents}
          disabled={loading || cooldown > 0}
          variant="outline"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          {getRefreshButtonText()}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 p-4 rounded-md mb-6">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      )}

      {loading && events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No events found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card
              key={event.id}
              className={event.success ? "" : "border-destructive/30"}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">
                    {event.schemaName || "Generation"}
                  </CardTitle>
                  <Badge variant={event.success ? "default" : "destructive"}>
                    {event.success ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <X className="mr-1 h-3 w-3" />
                    )}
                    {event.success ? "Success" : "Failed"}
                  </Badge>
                </div>
                <CardDescription>{formatDate(event.timestamp)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Records:</span>{" "}
                    {event.recordsCount}
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground mr-1">Format:</span>{" "}
                    <div className="flex items-center">
                      {getFormatIcon(event.format)}
                      {event.format ? event.format.toUpperCase() : "N/A"}
                    </div>
                  </div>
                  {event.schemaId && (
                    <div>
                      <span className="text-muted-foreground">Schema ID:</span>{" "}
                      <span className="font-mono text-xs">
                        {event.schemaId.substring(0, 10)}...
                      </span>
                    </div>
                  )}
                </div>
                {event.errorMessage && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                    {event.errorMessage}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
