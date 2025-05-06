"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { UserAiSettings } from "@/lib/storage";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";

interface ConfigPanelProps {
  stepNumber?: number;
  title?: string;
  schemaType: "sql" | "nosql" | "sample";
  setSchemaType: (type: "sql" | "nosql" | "sample") => void;
  recordsCount: number;
  setRecordsCount: (count: number) => void;
  outputFormat: string;
  setOutputFormat: (format: string) => void;
  tempModel: string;
  setTempModel: (model: string) => void;
  tempApiKey: string;
  setTempApiKey: (key: string) => void;
  tempBaseUrl: string;
  setTempBaseUrl: (url: string) => void;
  tempTemperature?: number;
  setTempTemperature?: (temp: number) => void;
  tempMaxTokens?: number;
  setTempMaxTokens?: (tokens: number) => void;
  tempHeaders?: Record<string, string>;
  setTempHeaders?: (headers: Record<string, string>) => void;
  useUserSettings?: boolean;
  setUseUserSettings?: (use: boolean) => void;
  isGenerating: boolean;
  isSignedIn: boolean;
  loadedInstructions: string | null;
  tempInstructions: string;
  setTempInstructions: (instructions: string) => void;
  userSettings?: Partial<UserAiSettings> | null;
}

export function ConfigPanel({
  stepNumber,
  title = "Configuration",
  schemaType,
  setSchemaType,
  recordsCount,
  setRecordsCount,
  outputFormat,
  setOutputFormat,
  tempModel,
  setTempModel,
  tempApiKey,
  setTempApiKey,
  tempBaseUrl,
  setTempBaseUrl,
  tempTemperature,
  setTempTemperature,
  tempMaxTokens,
  setTempMaxTokens,
  tempHeaders,
  setTempHeaders,
  useUserSettings = false,
  setUseUserSettings,
  isGenerating,
  isSignedIn,
  loadedInstructions,
  tempInstructions,
  setTempInstructions,
  userSettings
}: ConfigPanelProps) {
  const [aiOverridesOpen, setAiOverridesOpen] = useState(false);
  const [tempHeadersText, setTempHeadersText] = useState('');
  const router = useRouter();
  
  // Format headers for display
  const formatHeaders = (headers?: Record<string, string> | null) => {
    if (!headers) return '';
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  // Parse headers text to object
  const parseHeaders = (text: string): Record<string, string> => {
    const headers: Record<string, string> = {};
    text.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        if (key && value) {
          headers[key] = value;
        }
      }
    });
    return headers;
  };

  // Update headers when text changes
  useEffect(() => {
    if (setTempHeaders) {
      setTempHeaders(parseHeaders(tempHeadersText));
    }
  }, [tempHeadersText, setTempHeaders]);
  
  // Initialize headers text from tempHeaders prop
  useEffect(() => {
    if (tempHeaders) {
      setTempHeadersText(formatHeaders(tempHeaders));
    }
  }, [tempHeaders]);
  
  // Effect to populate settings from user settings when toggle is enabled
  useEffect(() => {
    if (useUserSettings && userSettings && setTempApiKey && setTempModel && setTempBaseUrl) {
      setTempApiKey(userSettings.apiKey || '');
      setTempModel(userSettings.model || '');
      setTempBaseUrl(userSettings.baseUrl || '');
      
      if (setTempTemperature && userSettings.temperature !== undefined) {
        setTempTemperature(userSettings.temperature);
      }
      
      if (setTempMaxTokens && userSettings.maxTokens !== undefined) {
        setTempMaxTokens(userSettings.maxTokens);
      }
      
      if (setTempHeaders && userSettings.headers) {
        setTempHeaders(userSettings.headers);
        setTempHeadersText(formatHeaders(userSettings.headers));
      }
    }
  }, [useUserSettings, userSettings, setTempApiKey, setTempModel, setTempBaseUrl, setTempTemperature, setTempMaxTokens, setTempHeaders]);
  
  // Add a function to navigate to settings
  const goToSettings = () => {
    router.push('/settings');
  };
  
  return (
    <Card className="h-full w-full overflow-y-auto">
      <CardHeader className="relative">
        {stepNumber && (
          <div className="absolute top-0 right-0 bg-primary/10 text-primary px-2 py-2 rounded-tr-xl text-xs font-medium" style={{ top: "-24px" }}>
            Step 1
          </div>
        )}
        <CardTitle className="text-lg font-semibold mb-1">{title}</CardTitle>
        <CardDescription>
          Adjust mock data generation settings. Logged in users can use their own API keys and models for unlimited generations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="schema-type">Data Source Type</Label>
          <Select value={schemaType} onValueChange={(value) => setSchemaType(value as typeof schemaType)} disabled={isGenerating}>
            <SelectTrigger id="schema-type">
              <SelectValue placeholder="Select data source type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sql">SQL Schema</SelectItem>
              <SelectItem value="nosql">NoSQL Schema</SelectItem>
              <SelectItem value="sample">Sample Data Records</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="record-count">
              Number of Records: {recordsCount}
            </Label>
          </div>
          <Slider
            id="record-count"
            min={1}
            max={100}
            step={1}
            value={[recordsCount]}
            onValueChange={(value) => setRecordsCount(value[0])}
            className="w-full"
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="output-format">Output Format</Label>
          <Select value={outputFormat} onValueChange={setOutputFormat} disabled={isGenerating}>
            <SelectTrigger id="output-format">
              <SelectValue placeholder="Select output format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">XLSX</SelectItem>
              <SelectItem value="xml">XML</SelectItem>
              <SelectItem value="txt">TXT (Tab Separated)</SelectItem>
              <SelectItem value="sql">SQL INSERT</SelectItem>
              <SelectItem value="html">HTML Table</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="temp-instructions">Additional Instructions (Optional)</Label>
          <Textarea
            id="temp-instructions"
            placeholder="e.g., Generate records suitable for a financial institution. Use UUID for IDs."
            className="resize-none h-28"
            value={tempInstructions}
            onChange={(e) => setTempInstructions(e.target.value)}
            disabled={isGenerating}
          />
          {loadedInstructions && (
            <p className="text-xs text-muted-foreground">
              This schema was loaded with saved instructions that you can modify above.
            </p>
          )}
        </div>

        {isSignedIn && (
          <div className="space-y-2 rounded-md border border-dashed p-4">
            <div className="flex items-center justify-between w-full mb-4">
              <Label htmlFor="use-user-settings" className="text-sm font-semibold">
                Use My API Key
              </Label>
              <div className="flex items-center gap-2">
                {setUseUserSettings && (
                  <Switch
                    id="use-user-settings"
                    checked={useUserSettings && !!(userSettings?.apiKey || userSettings?.model)}
                    onCheckedChange={setUseUserSettings}
                    disabled={isGenerating || !(userSettings?.apiKey || userSettings?.model)}
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToSettings}
                  className="ml-2 h-8 px-2"
                  disabled={isGenerating}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  {userSettings && (userSettings.apiKey || userSettings.model) ? "Edit" : "Save"}
                </Button>
              </div>
            </div>
            
            <button 
              className="flex items-center justify-between w-full text-sm font-semibold"
              onClick={() => setAiOverridesOpen(!aiOverridesOpen)}
              type="button"
            >
              <span>AI Configuration {useUserSettings ? "(Using Your Settings)" : "(Custom)"}</span>
              {aiOverridesOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {aiOverridesOpen && (
              <div className="pt-2 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="temp-api-key">API Key</Label>
                  <Input
                    id="temp-api-key"
                    type="password"
                    placeholder={useUserSettings ? "Using your saved API key" : "Use custom API key"}
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    disabled={isGenerating || useUserSettings}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temp-model">Model</Label>
                  <Input
                    id="temp-model"
                    placeholder={useUserSettings ? "Using your saved model" : "Use custom model"}
                    value={tempModel}
                    onChange={(e) => setTempModel(e.target.value)}
                    disabled={isGenerating || useUserSettings}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temp-base-url">Base URL</Label>
                  <Input
                    id="temp-base-url"
                    placeholder={useUserSettings ? "Using your saved URL" : "Use custom base URL"}
                    value={tempBaseUrl}
                    onChange={(e) => setTempBaseUrl(e.target.value)}
                    disabled={isGenerating || useUserSettings}
                  />
                </div>
                
                {setTempTemperature && (
                  <div className="space-y-2">
                    <Label htmlFor="temp-temperature">Temperature: {tempTemperature?.toFixed(1)}</Label>
                    <Slider
                      id="temp-temperature"
                      min={0}
                      max={2}
                      step={0.1}
                      value={[tempTemperature ?? 0.7]}
                      onValueChange={(value) => setTempTemperature(value[0])}
                      disabled={isGenerating || useUserSettings}
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls randomness: 0 is more focused, 2 is more creative.
                    </p>
                  </div>
                )}
                
                {setTempMaxTokens && (
                  <div className="space-y-2">
                    <Label htmlFor="temp-max-tokens">Max Tokens: {tempMaxTokens}</Label>
                    <Slider
                      id="temp-max-tokens"
                      min={1000}
                      max={8000}
                      step={100}
                      value={[tempMaxTokens ?? 4000]}
                      onValueChange={(value) => setTempMaxTokens(value[0])}
                      disabled={isGenerating || useUserSettings}
                    />
                    <p className="text-xs text-muted-foreground">
                      Limit the length of the AI response.
                    </p>
                  </div>
                )}
                
                {setTempHeaders && (
                  <div className="space-y-2">
                    <Label htmlFor="temp-headers">Custom Headers</Label>
                    <Textarea
                      id="temp-headers"
                      placeholder="# Header example: Anthropic-Version: 2023-06-01"
                      value={tempHeadersText}
                      onChange={(e) => setTempHeadersText(e.target.value)}
                      disabled={isGenerating || useUserSettings}
                      className="font-mono text-sm h-24"
                    />
                    <p className="text-xs text-muted-foreground">
                      Add custom headers for specific AI providers.
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {useUserSettings 
                    ? "Using your saved settings from the settings page." 
                    : "Custom settings for this generation only and are not saved."}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
