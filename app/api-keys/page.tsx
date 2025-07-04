"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Calendar,
  Activity,
  Code,
  FileText,
  CheckCircle,
  Clock,
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  createdAt: number;
  expiresAt: number;
  lastUsed?: number;
  usageCount: number;
}

interface CreateApiKeyResponse {
  success: boolean;
  apiKey?: string;
  keyId: string;
  name: string;
  expiresAt: number;
}

export default function ApiKeysPage() {
  const { status } = useSession();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchApiKeys();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/user/api-keys");
      if (!response.ok) {
        throw new Error("Failed to fetch API keys");
      }
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.keys);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your API key",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to create API key");
      }

      const data: CreateApiKeyResponse = await response.json();

      if (data.success && data.apiKey) {
        setNewApiKey(data.apiKey);
        setShowNewKey(true);
        setNewKeyName("");
        setIsCreateDialogOpen(false);
        await fetchApiKeys();
        toast({
          title: "Success",
          description: "API key created successfully",
        });
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to revoke API key");
      }

      await fetchApiKeys();
      toast({
        title: "Success",
        description: "API key revoked successfully",
      });
    } catch (error) {
      console.error("Error revoking API key:", error);
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysUntilExpiry = (expiresAt: number) => {
    const now = Date.now();
    const diff = expiresAt - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const getExpiryStatus = (expiresAt: number) => {
    const days = getDaysUntilExpiry(expiresAt);
    if (days < 0)
      return { status: "expired", color: "destructive", text: "Expired" };
    if (days <= 7)
      return {
        status: "warning",
        color: "secondary",
        text: `${days} days left`,
      };
    return { status: "active", color: "default", text: `${days} days left` };
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading API keys...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-12">
        <Key className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Please Log In</h3>
        <p className="text-muted-foreground">
          Log in to view and manage your API keys.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys for external access to AI Mocker
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key to access AI Mocker programmatically. API
                keys expire after 90 days for security.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key-name">API Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Production App, Development Testing"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && createApiKey()}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewKeyName("");
                    setIsCreateDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createApiKey}
                  disabled={creating || !newKeyName.trim()}
                >
                  {creating ? "Creating..." : "Create API Key"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* New API Key Display */}
      {showNewKey && newApiKey && (
        <div className="border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1 text-green-800">
              <div className="space-y-2">
                <p className="font-medium">API Key Created Successfully!</p>
                <p className="text-sm">
                  Copy this key now - it won&apos;t be shown again for security
                  reasons.
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <code className="flex-1 bg-white px-3 py-2 rounded border text-sm">
                        {showApiKey
                          ? newApiKey
                          : "••••••••••••••••••••••••••••••••"}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(newApiKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Key className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You haven&apos;t created any API keys yet. Create your first
                  API key to start using AI Mocker programmatically.
                </p>
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={setIsCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New API Key</DialogTitle>
                      <DialogDescription>
                        Create a new API key to access AI Mocker
                        programmatically.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="key-name">API Key Name</Label>
                        <Input
                          id="key-name"
                          placeholder="e.g., Production App, Development Testing"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && createApiKey()
                          }
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setNewKeyName("");
                            setIsCreateDialogOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={createApiKey}
                          disabled={creating || !newKeyName.trim()}
                        >
                          {creating ? "Creating..." : "Create API Key"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {apiKeys.map((key) => {
                const expiryStatus = getExpiryStatus(key.expiresAt);
                return (
                  <Card key={key.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Key className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <CardTitle className="text-lg">
                              {key.name}
                            </CardTitle>
                            <CardDescription>
                              Created {formatDate(key.createdAt)}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              expiryStatus.color as
                                | "default"
                                | "secondary"
                                | "destructive"
                            }
                          >
                            {expiryStatus.text}
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Revoke API Key
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to revoke &quot;
                                  {key.name}&quot;? This action cannot be undone
                                  and will immediately invalidate the API key.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => revokeApiKey(key.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Revoke API Key
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Expires: {formatDate(key.expiresAt)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>Used {key.usageCount} times</span>
                        </div>
                        {key.lastUsed && (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Last used: {formatDate(key.lastUsed)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>API Documentation</span>
              </CardTitle>
              <CardDescription>
                Learn how to use your API keys to access AI Mocker
                programmatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Authentication</h3>
                <p className="text-muted-foreground mb-4">
                  All API requests require authentication using your API key in
                  the Authorization header:
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <code className="text-sm">
                    Authorization: Bearer YOUR_API_KEY_HERE
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Base URL</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <code className="text-sm">
                    https://our-server-domain.com/api/v1
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Rate Limiting</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Free tier: 5 generations per day</li>
                  <li>Rate limit headers included in all responses</li>
                  <li>Daily reset at midnight UTC</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Generate Mock Data
                </h3>
                <p className="text-muted-foreground mb-2">
                  <strong>Endpoint:</strong> POST /api/v1/generate
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {`{
  "schema": "CREATE TABLE users (id INT, name VARCHAR(100), email VARCHAR(255))",
  "schemaType": "sql",
  "count": 10,
  "format": "json"
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Response Format</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {`{
  "success": true,
  "result": "[{\\"id\\": 1, \\"name\\": \\"John Doe\\", \\"email\\": \\"john@example.com\\"}]",
  "usage": {
    "limit": 5,
    "remaining": 4,
    "resetTimestamp": 1704067200
  }
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-5 w-5" />
                <span>Code Examples</span>
              </CardTitle>
              <CardDescription>
                Ready-to-use examples in different programming languages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                </TabsList>

                <TabsContent value="curl" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Basic Request</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {`curl -X POST https://our-server-domain/api/v1/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "schema": "CREATE TABLE users (id INT, name VARCHAR(100), email VARCHAR(255))",
    "count": 5,
    "format": "json"
  }'`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">NoSQL Schema</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {`curl -X POST https://our-server-domain/api/v1/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "schema": "{\\"type\\": \\"object\\", \\"properties\\": {\\"name\\": {\\"type\\": \\"string\\"}, \\"age\\": {\\"type\\": \\"integer\\"}}}",
    "schemaType": "nosql",
    "count": 10,
    "format": "csv"
  }'`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="javascript" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Using Fetch API</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {`const generateMockData = async (apiKey, schema, options = {}) => {
  const response = await fetch('https://our-server-domain/api/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      schema,
      schemaType: options.schemaType || 'sql',
      count: options.count || 10,
      format: options.format || 'json',
      ...options,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(\`API Error: \${data.error}\`);
  }
  
  return data;
};

// Usage
const result = await generateMockData(
  'YOUR_API_KEY',
  'CREATE TABLE users (id INT, name VARCHAR(100), email VARCHAR(255))',
  { count: 5, format: 'json' }
);`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="python" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Using requests</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {`import requests
import json

def generate_mock_data(api_key, schema, **options):
    url = "https://our-server-domain/api/v1/generate"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "schema": schema,
        "schemaType": options.get("schemaType", "sql"),
        "count": options.get("count", 10),
        "format": options.get("format", "json"),
        "examples": options.get("examples"),
        "additionalInstructions": options.get("additionalInstructions"),
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if not response.ok:
        raise Exception(f"API Error: {data.get('error', 'Unknown error')}")
    
    return data

# Usage
result = generate_mock_data(
    "YOUR_API_KEY",
    "CREATE TABLE users (id INT, name VARCHAR(100), email VARCHAR(255))",
    count=5,
    format="json"
)`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
