"use client";

import { useEffect, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ResultsViewerProps {
  results: string;
  format: string;
  isLoading: boolean;
}

export default function ResultsViewer({
  results,
  format,
  isLoading,
}: ResultsViewerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getLanguage = () => {
    switch (format.toLowerCase()) {
      case "json":
        return "json";
      case "sql":
        return "sql";
      case "csv":
      case "xlsx":
      case "txt":
        return "plaintext";
      case "xml":
      case "html":
        return "xml";
      default:
        return "plaintext";
    }
  };

  // Enhanced clean function to process results
  const cleanResults = (content: string): string => {
    if (!content || content.trim() === "") return "";
    
    let cleaned = content.trim();
    
    // Remove code block markers
    cleaned = cleaned.replace(/^```\w*\s*\n/m, "");
    cleaned = cleaned.replace(/```\s*$/m, "");
    
    // Remove explanatory text before the actual data
    if (format.toLowerCase() === "json") {
      // For JSON, try to find the first [ or { character
      const jsonStartMatch = cleaned.match(/[\[\{]/);
      if (jsonStartMatch && jsonStartMatch.index !== undefined && jsonStartMatch.index > 0) {
        cleaned = cleaned.substring(jsonStartMatch.index);
      }
      
      // Remove any trailing text after the last valid JSON character
      const lastBracketIndex = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
      if (lastBracketIndex !== -1 && lastBracketIndex < cleaned.length - 1) {
        cleaned = cleaned.substring(0, lastBracketIndex + 1);
      }
    } else if (format.toLowerCase() === "sql") {
      // For SQL, try to find the first INSERT or CREATE statement
      const sqlStartMatch = cleaned.match(/((INSERT|CREATE)\s+)/i);
      if (sqlStartMatch && sqlStartMatch.index !== undefined && sqlStartMatch.index > 0) {
        cleaned = cleaned.substring(sqlStartMatch.index);
      }
    } else if (format.toLowerCase() === "html") {
      // For HTML, try to find the first <table> or related tag
      const htmlStartMatch = cleaned.match(/(<table|<thead|<tbody|<tr|<div)/i);
      if (htmlStartMatch && htmlStartMatch.index !== undefined && htmlStartMatch.index > 0) {
        cleaned = cleaned.substring(htmlStartMatch.index);
      }
      
      // Remove any text after the closing tag
      const htmlEndMatch = cleaned.match(/(<\/table>|<\/div>)[^<]*/i);
      if (htmlEndMatch && htmlEndMatch.index !== undefined) {
        const endIndex = htmlEndMatch.index + htmlEndMatch[0].length;
        if (endIndex < cleaned.length) {
          cleaned = cleaned.substring(0, endIndex);
        }
      }
    } else if (format.toLowerCase() === "xml") {
      // For XML, try to find the first < character
      const xmlStartMatch = cleaned.match(/</);
      if (xmlStartMatch && xmlStartMatch.index !== undefined && xmlStartMatch.index > 0) {
        cleaned = cleaned.substring(xmlStartMatch.index);
      }
      
      // Look for the last > character
      const lastAngleBracketIndex = cleaned.lastIndexOf('>');
      if (lastAngleBracketIndex !== -1 && lastAngleBracketIndex < cleaned.length - 1) {
        cleaned = cleaned.substring(0, lastAngleBracketIndex + 1);
      }
    } else if (format.toLowerCase() === "csv") {
      // For CSV, try to find the first line that might be headers
      const lines = cleaned.split('\n');
      if (lines.length > 1) {
        // Check if first line has explanatory text (usually no commas)
        const firstLineHasCommas = lines[0].includes(',');
        const secondLineHasCommas = lines.length > 1 && lines[1].includes(',');
        
        if (!firstLineHasCommas && secondLineHasCommas) {
          // First line is probably explanatory text, remove it
          cleaned = lines.slice(1).join('\n');
        }
      }
      
      // Remove trailing explanatory text (look for lines without commas at the end)
      const csvLines = cleaned.split('\n');
      let lastDataLineIndex = csvLines.length - 1;
      for (let i = csvLines.length - 1; i >= 0; i--) {
        if (csvLines[i].includes(',')) {
          lastDataLineIndex = i;
          break;
        }
      }
      
      if (lastDataLineIndex < csvLines.length - 1) {
        cleaned = csvLines.slice(0, lastDataLineIndex + 1).join('\n');
      }
    }
    
    // Generic cleanup for all generated data restults, remove common explanatory phrases AI tacks on
    // TODO: find a better way to do this, this is is hacky
    cleaned = cleaned.replace(/^(Here's?|Here are|Here|Below is|I've generated|These are|Following is|Feel|Sure|Please find|Generated).*?:\n*/i, "");
    cleaned = cleaned.replace(/\n*You can (use|copy|paste|edit|download|modify|save) this.*/i, "");
    cleaned = cleaned.replace(/\n*Feel free to (adjust|modify|change|customize|update|edit|alter|adapt|tweak).*?as needed.*/i, "");

    
    return cleaned.trim();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanResults(results));
      toast({
        title: "Copied!",
        description: "Results copied to clipboard",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    try {
      const cleanedContent = cleanResults(results);
      
      // file extensions and MIME types
      let fileExtension = format.toLowerCase();
      let mimeType = 'text/plain';
      
      switch (format.toLowerCase()) {
        case 'json':
          mimeType = 'application/json';
          break;
        case 'csv':
          mimeType = 'text/csv';
          break;
        case 'xml':
          mimeType = 'application/xml';
          break;
        case 'html':
          mimeType = 'text/html';
          break;
        case 'sql':
          mimeType = 'application/sql';
          break;
        case 'txt':
          fileExtension = 'txt';
          mimeType = 'text/plain';
          break;
        case 'xlsx':
          // convert XLSX to CSV for download, workaround
          fileExtension = 'csv';
          mimeType = 'text/csv';
          toast({
            title: "Format Note",
            description: "XLSX format converted to CSV for download",
          });
          break;
      }

      const blob = new Blob([cleanedContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mock-data.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded!",
        description: `Results saved as mock-data.${fileExtension}`,
      });
    } catch {
      toast({
        title: "Download Failed",
        description: "Unable to download results",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ResultsButtons */}
      <div className="flex justify-end space-x-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={!results || isLoading}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={!results || isLoading}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
      
      <div className="border rounded-md h-[300px] overflow-hidden">
        {mounted ? (
          <Editor
            height="100%"
            language={getLanguage()}
            value={cleanResults(results)}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: "on",
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted p-4">
            Loading editor...
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p>Generating mock records...</p>
              <p className="text-sm text-muted-foreground">
                This may take a few moments
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
