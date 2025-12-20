"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, X, FileJson, FileText, Table } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Skeleton from "@/components/ui/skeleton";

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
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");

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

  const formatOptions = useMemo(() => {
    const formats = Array.from(new Set(events.map((event) => event.format.toLowerCase())));
    return formats;
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const statusMatch =
        statusFilter === "all" || (statusFilter === "success" && event.success) || (statusFilter === "failed" && !event.success);

      const formatMatch = formatFilter === "all" || event.format.toLowerCase() === formatFilter;

      return statusMatch && formatMatch;
    });
  }, [events, statusFilter, formatFilter]);

  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: "portrait" });
    doc.setFontSize(16);
    doc.text("Generator Requests Log", 14, 16);
    doc.setFontSize(10);
    doc.text(`Filters: status=${statusFilter}, format=${formatFilter}`, 14, 24);

    const headers = ["Schema", "Records", "Format", "Schema ID", "Status", "Timestamp"];
    const rows = filteredEvents.map((event) => [
      event.schemaName || "Generation",
      event.recordsCount.toString(),
      event.format?.toUpperCase() || "N/A",
      event.schemaId ? `${event.schemaId.substring(0, 8)}...` : "—",
      event.success ? "Success" : "Failed",
      formatDate(event.timestamp),
    ]);

    const headerY = 32;
    const rowHeight = 8;
    let cursorY = headerY + rowHeight;

    doc.setFontSize(9);
    const columnWidth = 33;
    const drawHeader = () => {
      headers.forEach((header, index) => {
        doc.text(header, 14 + index * columnWidth, headerY);
      });
      cursorY = headerY + rowHeight;
    };

    drawHeader();

    cursorY += rowHeight;

    rows.forEach((row) => {
      row.forEach((cell, index) => {
        doc.text(cell, 14 + index * 40, cursorY);
      });
      cursorY += rowHeight;
      if (cursorY > 180) {
        doc.addPage();
        drawHeader();
      }
    });

    doc.save("generator-events.pdf");
  };

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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "success" | "failed")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={formatFilter} onValueChange={(value) => setFormatFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All formats</SelectItem>
              {formatOptions.map((format) => (
                <SelectItem key={format} value={format}>
                  {format.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={fetchEvents}
            disabled={loading || cooldown > 0}
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {getRefreshButtonText()}
          </Button>
          <Button onClick={handleExportPdf} variant="outline" className="flex items-center">
            Export as PDF
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 p-4 rounded-md mb-6">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse" aria-live="polite">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-card px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-lg">
            <div className="overflow-auto">
              <div className="space-y-4 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`events-skeleton-row-${index}`}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/5 bg-slate-950/60 px-4 py-3"
                  >
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40 rounded-full" />
                      <Skeleton className="h-3 w-24 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-28 rounded-full" />
                      <Skeleton className="h-3 w-20 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No events found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 shadow-lg">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/60 text-xs uppercase tracking-wide text-white/70">
                <tr>
                  <th className="px-4 py-3 text-left">Schema</th>
                  <th className="px-4 py-3 text-left">Records</th>
                  <th className="px-4 py-3 text-left">Format</th>
                  <th className="px-4 py-3 text-left">Schema ID</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-slate-950/60">
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3">{event.schemaName || "Generation"}</td>
                    <td className="px-4 py-3">{event.recordsCount}</td>
                    <td className="px-4 py-3 flex items-center">
                      {getFormatIcon(event.format)}
                      {event.format?.toUpperCase() || "N/A"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {event.schemaId ? `${event.schemaId.substring(0, 8)}...` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold">
                        {event.success ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-300">Success</span>
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 text-destructive" />
                            <span className="text-destructive">Failed</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{formatDate(event.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
