"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { UserAiSettings } from "@/lib/storage";
import { FileWarning, Loader2, Settings, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { DailyLimitInfo } from "@/components/ui/DailyLimitInfo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  // Add global CSS for button hover cursor
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      button, [role="button"] {
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []); // Empty dependency array ensures this runs once

  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { toast } = useToast();

  const [aiSettings, setAiSettings] = useState<Partial<UserAiSettings>>({
    apiKey: "",
    model: "",
    baseUrl: "",
    temperature: 0.7,
    maxTokens: 4000,
    headers: {},
  });

  const [headersText, setHeadersText] = useState('');
  const [showModelReference, setShowModelReference] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (status === "authenticated" && session?.user?.id) {
      setIsLoading(true);
      try {
        // Try to load settings from localStorage first
        const { getAiSettingsFromLocal } = await import('@/lib/local-storage');
        const localSettings = getAiSettingsFromLocal(session.user.id);
        
        if (localSettings) {
          // If found in localStorage, use those settings
          setAiSettings({
            apiKey: localSettings.apiKey || "",
            model: localSettings.model || "",
            baseUrl: localSettings.baseUrl || "",
            temperature: localSettings.temperature ?? 0.7,
            maxTokens: localSettings.maxTokens ?? 4000,
            headers: localSettings.headers || {},
          });
          
          // Format headers for display
          if (localSettings.headers) {
            setHeadersText(formatHeaders(localSettings.headers));
          }
          
          setSettingsSaved(true);
        } else {
          setSettingsSaved(false);
          // Otherwise make the API call for backward compatibility
          const response = await fetch("/api/user/settings");
          if (!response.ok) {
            throw new Error("Failed to fetch settings");
          }
          // API now just returns success, not actual settings
          // This is just to check if the API works
        }
      } catch (error) {
        console.error("Error fetching AI settings:", error);
        toast({
          title: "Error",
          description: "Could not load your AI settings.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [status, session?.user?.id, toast]);

  // Helper to format headers object to text
  const formatHeaders = (headers: Record<string, string>) => {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  // Helper to parse headers text to object
  const parseHeaders = (text: string): Record<string, string> => {
    const headers: Record<string, string> = {};
    text.split('\n').forEach(line => {
      line = line.trim();
      if (!line) return;
      
      // Support both "key: value" and "key:value" formats
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        if (key && value) {
          headers[key] = value;
        }
      }
    });
    
    // Special handling for anthropic-version if model contains "claude"
    if (aiSettings.model?.toLowerCase().includes('claude') && !headers['anthropic-version'] && !headers['Anthropic-Version']) {
      headers['anthropic-version'] = '2023-06-01';
    }
    
    return headers;
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'model') {
      // Auto-detect model and set appropriate base URL and headers
      const modelName = value.toLowerCase();
      const updates: Partial<UserAiSettings> = { [name]: value };
      
      // Default Anthropic Claude settings
      if (modelName.includes('claude')) {
        if (!aiSettings.baseUrl) {
          updates.baseUrl = 'https://api.anthropic.com/v1/messages';
        }
        
        // Add Anthropic version header if not present
        const currentHeadersText = headersText || '';
        if (!currentHeadersText.includes('anthropic-version') && !currentHeadersText.includes('Anthropic-Version')) {
          setHeadersText((prev) => {
            const newText = prev ? `${prev}\nanthropic-version: 2023-06-01` : 'anthropic-version: 2023-06-01';
            return newText;
          });
        }
      }
      // Default Cohere settings
      else if (modelName.startsWith('command-') || modelName.includes('cohere')) {
        if (!aiSettings.baseUrl) {
          updates.baseUrl = 'https://api.cohere.ai/v1/generate';
        }
      }
      // Default Gemini settings
      else if (modelName.includes('gemini')) {
        if (!aiSettings.baseUrl) {
          updates.baseUrl = 'https://generativelanguage.googleapis.com/v1/models';
          
          // Show a hint for authentication
          toast({
            title: "Gemini Authentication Note",
            description: "For Gemini models, the API key is sent as a URL parameter, not in an authorization header.",
          });
        }
      }
      // Default Mistral settings
      else if (modelName.includes('mistral')) {
        if (!aiSettings.baseUrl) {
          updates.baseUrl = 'https://api.mistral.ai/v1/chat/completions';
        }
      }
      // Azure OpenAI settings hint
      else if (modelName.startsWith('azure:')) {
        toast({
          title: "Azure OpenAI Format",
          description: "For Azure OpenAI, use 'azure:deployment-name' format and set your Azure endpoint as the base URL.",
        });
      }
      
      setAiSettings(prev => ({ ...prev, ...updates }));
    } else {
    setAiSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleHeadersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHeadersText(e.target.value);
  };

  const handleTemperatureChange = (value: number[]) => {
    setAiSettings(prev => ({ ...prev, temperature: value[0] }));
  };
  
  const handleMaxTokensChange = (value: number[]) => {
    setAiSettings(prev => ({ ...prev, maxTokens: value[0] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsToSave: Partial<UserAiSettings> = {};
      if (aiSettings.apiKey !== undefined) settingsToSave.apiKey = aiSettings.apiKey;
      if (aiSettings.model !== undefined) settingsToSave.model = aiSettings.model;
      if (aiSettings.baseUrl !== undefined) settingsToSave.baseUrl = aiSettings.baseUrl;
      if (aiSettings.temperature !== undefined) settingsToSave.temperature = aiSettings.temperature;
      if (aiSettings.maxTokens !== undefined) settingsToSave.maxTokens = aiSettings.maxTokens;
      
      // Parse headers from text input
      if (headersText) {
        settingsToSave.headers = parseHeaders(headersText);
      } else {
        settingsToSave.headers = {};
      }

      // First save settings to localStorage
      const { saveAiSettingsToLocal } = await import('@/lib/local-storage');
      if (session?.user?.id) {
        const saveResult = saveAiSettingsToLocal(session.user.id, settingsToSave);
        if (!saveResult) {
          throw new Error('Failed to save settings to local storage');
        }
      }

      // Still call the API for validation but not storage
      const response = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsToSave)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save settings");
      }

      // Set settingsSaved to true after successful save
      setSettingsSaved(true);
      
      toast({ 
        title: "Success", 
        description: "AI settings saved securely to your browser's local storage.",
        variant: "success"
      });
    } catch (error) {
      console.error("Error saving AI settings:", error);
      toast({
        title: "Error Saving Settings",
        description: (error as Error).message || "Could not save your AI settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    // No need for browser confirm since we're using a dialog
    setAiSettings({
      apiKey: "",
      model: "",
      baseUrl: "",
      temperature: 0.7,
      maxTokens: 4000,
      headers: {},
    });
    setHeadersText('');
    
    if (session?.user?.id) {
      try {
        const { clearAiSettings } = await import('@/lib/local-storage');
        const clearResult = clearAiSettings(session.user.id);
        if (clearResult) {
          // Set settingsSaved to false after clearing
          setSettingsSaved(false);
          
          toast({
            title: "Settings Cleared",
            description: "Your API settings have been cleared from local storage.",
            variant: "success"
          });
        }
      } catch (error) {
        console.error("Error clearing settings:", error);
      }
    }
    
    // Close the confirmation dialog
    setConfirmDeleteOpen(false);
  };
  
  // New function to clear form fields only without touching localStorage
  const handleClearForm = () => {
    setAiSettings({
      apiKey: "",
      model: "",
      baseUrl: "",
      temperature: 0.7,
      maxTokens: 4000,
      headers: {},
    });
    setHeadersText('');
  };

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
         <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Please Log In</h3>
          <p className="text-muted-foreground">
            Log in to manage settings, such as your API key, saved schemas, and more.
          </p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Provider Configuration</CardTitle>
            <CardDescription>
              Override default AI settings. Leave blank to use defaults.
            </CardDescription>
            <CardDescription>
              <FileWarning className="w-4 h-4 inline-block text-red-400" />
              <span className="text-xs text-red-400 px-1">
                Your API keys are stored securely in your browsers local storage, not on our servers. 
                Your settings will be lost if you clear your browser data.
              </span>
            </CardDescription>
            <button
              type="button"
              onClick={() => setShowModelReference(!showModelReference)}
              className="flex items-center text-sm font-medium mt-2 text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Model Configuration Reference
              {showModelReference ? (
                <ChevronUp className="ml-auto h-4 w-4" />
              ) : (
                <ChevronDown className="ml-auto h-4 w-4" />
              )}
            </button>
            
            {showModelReference && (
              <div className="space-y-3 text-xs text-muted-foreground mt-2 p-3 border rounded-md bg-muted/30">
                <div>
                  <h4 className="font-semibold">OpenAI</h4>
                  <p>Model: <code>gpt-4o, gpt-4-turbo, gpt-3.5-turbo</code></p>
                  <p>Base URL: <code>https://api.openai.com/v1</code> (default)</p>
                  <p>Auth: API key as Bearer token</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Anthropic Claude</h4>
                  <p>Model: <code>claude-3-7-sonnet, claude-3-haiku</code></p>
                  <p>Base URL: <code>https://api.anthropic.com/v1/messages</code></p>
                  <p>Header: <code>anthropic-version: 2023-06-01</code></p>
                  <p>Auth: API key as <code>x-api-key</code> header</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Mistral AI</h4>
                  <p>Model: <code>mistral-tiny, mistral-small, mistral-medium</code></p>
                  <p>Base URL: <code>https://api.mistral.ai/v1/chat/completions</code></p>
                  <p>Auth: API key as Bearer token</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Google Gemini</h4>
                  <p>Model: <code>gemini-pro, gemini-1.5-pro</code></p>
                  <p>Base URL: <code>https://generativelanguage.googleapis.com/v1/models</code></p>
                  <p>Auth: API key sent as URL parameter</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Cohere</h4>
                  <p>Model: <code>command, command-r, command-r-plus</code></p>
                  <p>Base URL: <code>https://api.cohere.ai/v1/generate</code></p>
                  <p>Auth: API key as Bearer token</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Azure OpenAI</h4>
                  <p>Model: <code>azure:deployment-name</code></p>
                  <p>Base URL: <code>https://your-resource.openai.azure.com/openai/deployments</code></p>
                  <p>Auth: API key as Bearer token</p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Your API Key</Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder="sk-... (leave blank to use default)"
                value={aiSettings.apiKey}
                onChange={handleSettingChange}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model Name</Label>
              <Input
                id="model"
                name="model"
                type="text"
                placeholder="e.g., gpt-4o-mini, claude-3-7-sonnet, gemini-pro, etc."
                value={aiSettings.model}
                onChange={handleSettingChange}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseUrl">API Base URL (Optional)</Label>
              <Input
                id="baseUrl"
                name="baseUrl"
                type="text"
                placeholder="e.g., https://api.groq.com/openai/v1"
                value={aiSettings.baseUrl}
                onChange={handleSettingChange}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature: {aiSettings.temperature?.toFixed(1)}</Label>
              <Slider
                id="temperature"
                min={0}
                max={2}
                step={0.1}
                value={[aiSettings.temperature ?? 0.7]}
                onValueChange={handleTemperatureChange}
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Controls randomness: 0 is more focused, 2 is more creative.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens: {aiSettings.maxTokens}</Label>
              <Slider
                id="maxTokens"
                min={1000}
                max={8000}
                step={100}
                value={[aiSettings.maxTokens ?? 4000]}
                onValueChange={handleMaxTokensChange}
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Limit the length of the AI response.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="headers">Custom Headers (Optional)</Label>
              <Textarea
                id="headers"
                placeholder="# Header example: Anthropic-Version: 2023-06-01"
                value={headersText}
                onChange={handleHeadersChange}
                disabled={isSaving}
                className="font-mono text-sm h-14"
              />
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                    <p className="text-sm mb-1">
                      <strong>Important:</strong> By using this service, you agree to our{" "}
                      <a href="/terms" className="text-primary hover:underline">
                        Terms of Use
                      </a>
                      .
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You are responsible for all API charges incurred when using your API keys with our service.
                    </p>
                  </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? "Saving..." : settingsSaved ? "Settings Saved" : "Save AI Settings"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClearForm} 
              disabled={isSaving || isLoading}
            >
              Clear Form
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your current account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {session?.user ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <p className="font-medium">Name:</p>
                  <div className="font-medium text-foreground">
                    {session.user.name || "Not available"}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">Email:</p>
                  <p>{session.user.email || "Not provided"}</p>
                </div>
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Manage your stored API settings. These actions only affect your local device, 
                    the local storage in the browser is cleared when you delete your API settings.
                  </p>
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDeleteOpen(true)}
                    disabled={!settingsSaved || isSaving}
                    className="mt-2"
                  >
                    Delete API Settings
                  </Button>
                </div>
                <div className="space-y-2 mt-6 pt-6 border-t">
x                  <DailyLimitInfo 
                    hasOwnApiKey={!!aiSettings.apiKey} 
                    variant="detailed" 
                    className="mt-2" 
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Free users are limited to 5 generations per day. Add your own API key above to bypass this limit.
                  </p>
                </div>
              </div>
            ) : (
              <p>Not signed in</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="flex flex-col items-center">
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full mb-4">
              <FileWarning className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle>Delete API Settings</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Are you sure you want to delete your API settings? This will remove your API keys and configuration from this device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center sm:space-x-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              Delete Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
