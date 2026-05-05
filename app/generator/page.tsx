"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SchemaEditor from "@/components/generator/schema-editor";
import { ConfigPanel } from "@/components/generator/config-panel";
import ResultsViewer from "@/components/results/results-viewer";
import ResultsSkeleton from "@/components/ui/results-skeleton";
import Skeleton from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { SaveSchemaDialog } from "@/components/generator/save-schema-dialog";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Code,
  Loader2,
  Zap,
  Save,
  Download,
  RotateCcw,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAiSettings } from "@/lib/storage";
import { DailyLimitInfo } from "@/components/ui/DailyLimitInfo";
import GenerationProgress, { type StepId } from "@/components/generator/generation-progress";
import TemplatePicker from "@/components/templates/template-picker";
import { TemplateSelection } from "@/types/template";

function GeneratorLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 w-full animate-pulse" aria-live="polite">
      <div className="flex flex-col gap-4 w-full">
        <Card className="flex-1 min-w-0">
          <CardHeader className="space-y-3 px-6 pt-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={`config-skeleton-${index}`}
                className="h-10 w-full rounded-2xl"
              />
            ))}
          </CardContent>
          <CardFooter className="px-6 pb-6 pt-0">
            <Skeleton className="h-10 w-40 rounded-full" />
          </CardFooter>
        </Card>
        <Card className="flex-1 min-w-0">
          <CardHeader className="space-y-3 px-6 pt-6">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Skeleton className="h-[360px] w-full rounded-[1.5rem]" />
          </CardContent>
        </Card>
      </div>
      <div className="w-full">
        <Card className="w-full">
          <CardHeader className="space-y-2 px-6 pt-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Skeleton className="h-[360px] w-full rounded-[1.5rem]" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function GeneratorPageContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const loadSavedAction = session?.user ? (
    <Button variant="outline" size="sm" asChild className="flex items-center gap-2">
      <Link href="/saved" className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        Load Saved
      </Link>
    </Button>
  ) : (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex items-center gap-2 cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Load Saved
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Sign in to access</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
  const schemaId = searchParams?.get("schema");
  const resultsRef = useRef<HTMLDivElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schema, setSchema] = useState("");
  const [schemaType, setSchemaType] = useState<"sql" | "nosql" | "sample">(
    "sql"
  );
  const [recordCount, setRecordCount] = useState(10);
  const [format, setFormat] = useState<string>("json");
  const [examples, setExamples] = useState("");
  const [results, setResults] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"schema" | "examples">("schema");
  const [progressStep, setProgressStep] = useState<StepId>("parsing");
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [generationController, setGenerationController] = useState<AbortController | null>(null);

  const handleTemplateSelected = (selection: TemplateSelection) => {
    const { template, schema: selectedSchema, schemaType: selectedType } = selection
    setSchema(selectedSchema)
    setSchemaType(selectedType)
    setSchemaName(template.name)
    setExamples(template.examples ?? "")
    setActiveTab("schema")
    toast({
      title: "Schema Loaded",
      description: `Loaded "${template.name}" (${selectedType.toUpperCase()}) schema - ready to generate mock data.`,
      variant: "success",
    })
  }

  const handleResetSchemaDefinition = () => {
    setSchema("")
    setSchemaType("sql")
    setExamples("")
    setResults("")
    setActiveTab("schema")
    setSchemaName(null)
    setLoadedInstructions(null)
    setTempInstructions("")
    setFormat("json")
    setRecordCount(10)
    setProgressStep("parsing")
    setProgressPercent(0)
    setProgressMessage("")
    setIsGenerating(false)
    setGenerationController(null)
    router.replace("/generator")
    toast({
      title: "Schema Reset",
      description: "Configuration cleared. Start fresh with a new schema.",
      variant: "default",
    })
  }

  // swap active tab with schema data type (in step 1 and step 2)
  useEffect(() => {
    if (schemaType === "sample" && activeTab !== "examples") {
      setActiveTab("examples");
    } else if (schemaType !== "sample" && activeTab !== "schema") {
      setActiveTab("schema");
    }
  }, [schemaType, activeTab]);

  const handleSchemaTypeChange = (type: "sql" | "nosql" | "sample") => {
    setSchemaType(type);
    if (type === "sample") {
      setActiveTab("examples");
    } else {
      setActiveTab("schema");
    }
  };

  // Handle tab changes from the tabs component
  const handleTabChange = (value: string) => {
    const tab = value as "schema" | "examples";
    setActiveTab(tab);
    if (tab === "examples" && schemaType !== "sample") {
      setSchemaType("sample");
    } else if (tab === "schema" && schemaType === "sample") {
      // Default to SQL when switching back to schema tab
      setSchemaType("sql");
    }
  };

  // State for ConfigPanel overrides (only if user is logged in)
  const [tempModel, setTempModel] = useState("");
  const [tempApiKey, setTempApiKey] = useState("");
  const [tempBaseUrl, setTempBaseUrl] = useState("");
  const [tempTemperature, setTempTemperature] = useState(0.7);
  const [tempMaxTokens, setTempMaxTokens] = useState(4000);
  const [tempHeaders, setTempHeaders] = useState<Record<string, string>>({});
  const [useUserSettings, setUseUserSettings] = useState(true);
  const [userSettings, setUserSettings] =
    useState<Partial<UserAiSettings> | null>(null);

  // State for schema name and loaded instructions
  const [schemaName, setSchemaName] = useState<string | null>(null);
  const [loadedInstructions, setLoadedInstructions] = useState<string | null>(
    null
  );
  const [tempInstructions, setTempInstructions] = useState("");

  // Reference to DailyLimitInfo component
  const dailyLimitRef = useRef<{ refreshUsage: () => Promise<void> } | null>(
    null
  );

  // Load saved schema if schemaId is provided in URL
  useEffect(() => {
    const loadSavedSchema = async () => {
      try {
        setIsLoading(true);

        // Handle "new" schema with data passed in URL
        if (schemaId === "new") {
          const typeParam = searchParams?.get("type");
          const dataParam = searchParams?.get("data");

          if (typeParam && (typeParam === "sql" || typeParam === "nosql")) {
            setSchemaType(typeParam);
          }

          if (dataParam) {
            try {
              const decodedSchema = decodeURIComponent(dataParam);
              setSchema(decodedSchema);
              toast({
                title: "Schema Loaded",
                description: "Test schema loaded - ready to generate mock data",
                variant: "success",
              });
            } catch (error) {
              console.error("Error decoding schema data:", error);
            }
          }

          setIsLoading(false);
          return;
        }

        if (!schemaId) {
          setIsLoading(false);
          return;
        }

        try {
          const response = await fetch(`/api/schemas/${schemaId}`);

          if (!response.ok) {
            throw new Error(`Failed to load schema: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.schema) {
            setSchema(data.schema.schema);
            setSchemaType(data.schema.schemaType);
            setSchemaName(data.schema.name);
            setLoadedInstructions(data.schema.additionalInstructions || null);
            setTempInstructions(data.schema.additionalInstructions || "");

            // Use saved format and record count preferences if available
            if (data.schema.preferredFormat) {
              setFormat(data.schema.preferredFormat);
            }

            if (data.schema.preferredRecordCount) {
              setRecordCount(data.schema.preferredRecordCount);
            }

            // Only show the toast if not coming from saved page
            toast({
              title: "Schema Loaded",
              description: `Loaded "${
                data.schema.name || "Unnamed"
              }" schema - ready to generate mock data`,
              variant: "success",
            });
          } else {
            throw new Error("Schema data not found in API response");
          }
        } catch (apiError) {
          console.error("API fetch error:", apiError);
          toast({
            title: "Load Failed",
            description: `Could not load schema from API. Error: ${
              (apiError as Error).message
            }`,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Load Failed",
          description: (error as Error).message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedSchema();
  }, [schemaId, searchParams]);

  useEffect(() => {
    const templateSchemaParam = searchParams?.get("templateSchema");
    const templateTypeParam = searchParams?.get("templateType") as
      | "sql"
      | "nosql"
      | null;
    const templateNameParam = searchParams?.get("templateName");

    if (templateSchemaParam && templateTypeParam) {
      const decodedSchema = decodeURIComponent(templateSchemaParam);
      setSchema(decodedSchema);
      setSchemaType(templateTypeParam);
      setSchemaName(templateNameParam || "Template");
      setActiveTab("schema");
      toast({
        title: "Schema Loaded",
        description: `Loaded "${
          templateNameParam || "Template"
        }" (${templateTypeParam.toUpperCase()}) schema - ready to generate mock data.`,
        variant: "success",
      });
    }
  }, [searchParams]);

  // Load user settings when authenticated
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          // Import and use the localStorage utility instead of fetching from server
          const { getAiSettingsFromLocal } = await import(
            "@/lib/local-storage"
          );
          const settings = getAiSettingsFromLocal(session.user.id);
          if (settings) {
            setUserSettings(settings);
          } else {
            // Fallback to API to check if settings exist
            const response = await fetch("/api/user/settings");
            if (response.ok) {
              // API now just returns success, it doesn't return actual settings
              // This is just for backward compatibility
              console.log("Settings should be stored in localStorage");
            }
          }
        } catch (error) {
          console.error("Error loading user settings:", error);
        }
      }
    };

    fetchUserSettings();
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (!isGenerating) {
      setProgressPercent(0);
      return;
    }

    const interval = window.setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 95) return prev;
        return Math.min(prev + 4, 95);
      });
    }, 1400);

    return () => {
      window.clearInterval(interval);
    };
  }, [isGenerating]);

  const handleGenerate = async () => {
    try {
      const controller = new AbortController();
      setGenerationController(controller);
      setIsGenerating(true);
      setResults("");
      setProgressStep("parsing");
      setProgressPercent(8);
      setProgressMessage("Validating schema and configuration...");

      // Determine if we're using samples based on schema type
      const usingSamples = schemaType === "sample";

      if (!usingSamples && !schema.trim()) {
        toast({
          title: "Schema Required",
          description: "Please enter a schema definition",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      if (usingSamples && !examples.trim()) {
        toast({
          title: "Examples Required",
          description: "Please provide example records to use as a template",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // Check if using own API key before proceeding
      const isUsingOwnApiKey = useUserSettings && !!userSettings?.apiKey;

      // Only non-authenticated users need to increment usage here
      // For logged-in users, we'll let the API handle it to avoid double-counting
      if (!isUsingOwnApiKey && status !== "authenticated") {
        try {
          // Call usage increment endpoint to check and increment limit
          const limitResponse = await fetch("/api/usage/increment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              usesOwnApiKey: isUsingOwnApiKey,
            }),
          });

          // If hit limit, show error and stop
          if (!limitResponse.ok) {
            toast({
              title: "Daily Limit Reached",
              description:
                "You have reached your free daily generation limit. Wait for reset or use your own API key.",
              variant: "destructive",
            });
            setIsGenerating(false);
            return;
          }
        } catch (limitError) {
          console.error("Error checking daily limit:", limitError);
          // Continue with generation if limit check fails (fail open)
        }
      } else if (!isUsingOwnApiKey && status === "authenticated") {
        // For authenticated users not using their own API key, just check the limit without incrementing
        try {
          const response = await fetch("/api/usage/daily");
          if (response.ok) {
            const data = await response.json();
            // The daily endpoint returns {used, limit, remaining} directly, not inside limitInfo
            if (data && data.remaining <= 0) {
              toast({
                title: "Daily Limit Reached",
                description:
                  "You have reached your free daily generation limit. Wait for reset or use your own API key.",
                variant: "destructive",
              });
              setIsGenerating(false);
              return;
            }
          }
        } catch (error) {
          console.error("Error checking daily limit:", error);
          // Continue with generation if limit check fails (fail open)
        }
      }

      // TODO: fix this linting error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestBody: any = {
        schemaType:
          schemaType === "sample" ? "sql" : (schemaType as "sql" | "nosql"),
        count: recordCount,
        format,
        outputFormat: format,
        additionalInstructions: tempInstructions || undefined,
        schemaName: schemaName === "New Schema" ? undefined : schemaName,
      };

      // Only include AI settings if not using user's stored settings
      if (!useUserSettings) {
        if (tempApiKey) requestBody.overrideApiKey = tempApiKey;
        if (tempModel) requestBody.overrideModel = tempModel;
        if (tempBaseUrl) requestBody.overrideBaseUrl = tempBaseUrl;
        if (tempTemperature) requestBody.overrideTemperature = tempTemperature;
        if (tempMaxTokens) requestBody.overrideMaxTokens = tempMaxTokens;
        if (tempHeaders && Object.keys(tempHeaders).length > 0)
          requestBody.overrideHeaders = tempHeaders;
      } else {
        // Get settings from localStorage if using user settings
        if (session?.user?.id) {
          const { getAiSettingsFromLocal } = await import(
            "@/lib/local-storage"
          );
          const localSettings = getAiSettingsFromLocal(session.user.id);

          if (localSettings) {
            // Pass settings directly in the request since server can't access localStorage
            if (localSettings.apiKey)
              requestBody.overrideApiKey = localSettings.apiKey;
            if (localSettings.model)
              requestBody.overrideModel = localSettings.model;
            if (localSettings.baseUrl)
              requestBody.overrideBaseUrl = localSettings.baseUrl;
            if (localSettings.temperature)
              requestBody.overrideTemperature = localSettings.temperature;
            if (localSettings.maxTokens)
              requestBody.overrideMaxTokens = localSettings.maxTokens;
            if (localSettings.headers)
              requestBody.overrideHeaders = localSettings.headers;
          }
        }
        requestBody.useUserSettings = true;
      }

      // Set up request data based on schema type
      if (usingSamples) {
        requestBody.examples = examples;
        requestBody.schema = "/* Generated from examples */";
      } else {
        requestBody.schema = schema;
        if (examples.trim()) {
          requestBody.examples = examples;
        }
      }

      setProgressStep("generating");
      setProgressPercent(45);
      setProgressMessage("Sending request to the AI service...");

      // Make the API call
      try {
        setProgressMessage("Generating mock records...");
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorMsg = `Error ${response.status}: ${response.statusText}`;

          try {
            const errorData = await response.json();
            if (errorData && errorData.message) {
              errorMsg = errorData.message;
            }
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError);
          }

          toast({
            title: `Generation Failed (${response.status})`,
            description: errorMsg,
            variant: "destructive",
            action:
              status === "authenticated" ? (
                <Button
                  variant="link"
                  className="text-sm underline"
                  onClick={() => router.push("/dashboard/events")}
                >
                  View details in dashboard
                </Button>
              ) : undefined,
          });

          throw new Error(errorMsg);
        }

        const data = await response.json();
        setResults(data.result);

        setProgressStep("formatting");
        setProgressPercent(90);
        setProgressMessage("Formatting the output...");

        // Always refresh the usage counter after generation
        if (dailyLimitRef.current) {
          await dailyLimitRef.current.refreshUsage();
        }

        if (data.warnings && data.warnings.length > 0) {
          toast({
            title: "Generation Completed with Warnings",
            description: data.warnings[0],
            variant: "default",
          });
        } else {
          toast({
            title: "Generation Complete",
            description: `Generated ${recordCount} records.`,
            variant: "success",
          });
        }

        // Scroll to results after successful generation
        setTimeout(() => {
          if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
        setProgressPercent(100);
        setProgressMessage("Results are ready");
      } catch (apiError) {
        console.error("API error:", apiError);
        throw apiError;
      }
    } catch (error) {
      console.error("Generation error:", error);
      if (error instanceof DOMException && error.name === "AbortError") {
        toast({
          title: "Generation Cancelled",
          description: "You cancelled the mock generation.",
          variant: "default",
        });
        setProgressMessage("Generation cancelled");
        setProgressStep("parsing");
        return;
      }

      if (!(error instanceof Error && error.message.includes("Error "))) {
        toast({
          title: "Generation Failed",
          description: (error as Error).message,
          variant: "destructive",
          action:
            status === "authenticated" ? (
              <Button
                variant="link"
                className="text-sm underline"
                onClick={() => router.push("/dashboard/events")}
              >
                View details in dashboard
              </Button>
            ) : undefined,
        });
      }
    } finally {
      setIsGenerating(false);
      setGenerationController(null);
    }
  };

  const handleCancelGeneration = () => {
    if (!generationController) {
      return;
    }

    setProgressMessage("Cancelling...");
    generationController.abort();
  };

  const handleSave = async (
    name: string,
    description?: string,
    preferredFormat?: string,
    preferredRecordCount?: number
  ) => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save schemas.",
        variant: "destructive",
      });
      return;
    }

    if (schemaType !== "sample" && !schema.trim()) {
      toast({
        title: "Schema Required",
        description: "Cannot save an empty schema.",
        variant: "destructive",
      });
      return;
    }

    if (schemaType === "sample" && !examples.trim()) {
      toast({
        title: "Examples Required",
        description: "Cannot save empty examples.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use PATCH for existing schemas, POST for new ones
      const method = schemaId ? "PATCH" : "POST";
      const url = schemaId ? `/api/schemas/${schemaId}` : "/api/schemas";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          schema:
            schemaType !== "sample" ? schema : "/* Generated from examples */",
          examples: schemaType === "sample" ? examples : undefined,
          schemaType: schemaType === "sample" ? "sql" : schemaType,
          additionalInstructions: tempInstructions || undefined,
          preferredFormat: preferredFormat || format,
          preferredRecordCount: preferredRecordCount || recordCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save schema");
      }

      const data = await response.json();

      toast({
        title: schemaId
          ? "Schema Updated"
          : schemaType === "sample"
          ? "Examples Saved"
          : "Schema Saved",
        description: `${
          schemaId ? "Updated" : "Saved"
        } "${name}" successfully.`,
        variant: "success",
      });

      // Update the current schemaId and name if this was a new schema
      if (!schemaId && data.schema && data.schema.id) {
        // Update URL to include the new schema ID without full page reload
        window.history.pushState({}, "", `/generator?schema=${data.schema.id}`);
        // Update state variables
        setSchemaName(name);
      }

      setSaveDialogOpen(false);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const showSkeletonContent = status === "loading" || isLoading;

  return (
    <div className="flex flex-col gap-5 w-full">
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Generator</p>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold leading-tight">Generate Mock Records</h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Craft SQL/NoSQL schemas or example records, run the generator, and get export-ready mock data.
          </p>
        </div>
      </section>

      {showSkeletonContent ? (
        <GeneratorLoadingSkeleton />
      ) : (
        <div className="flex flex-col gap-5 md:flex-row h-full">
          {/* Configuration panel */}
          <div className="flex-1 flex">
            <ConfigPanel
              stepNumber={1}
              title="Configure Record Generation"
              schemaType={schemaType}
              setSchemaType={handleSchemaTypeChange}
              recordsCount={recordCount}
              setRecordsCount={setRecordCount}
              outputFormat={format}
              setOutputFormat={setFormat}
              tempModel={tempModel}
              setTempModel={setTempModel}
              tempApiKey={tempApiKey}
              setTempApiKey={setTempApiKey}
              tempBaseUrl={tempBaseUrl}
              setTempBaseUrl={setTempBaseUrl}
              tempTemperature={tempTemperature}
              setTempTemperature={setTempTemperature}
              tempMaxTokens={tempMaxTokens}
              setTempMaxTokens={setTempMaxTokens}
              tempHeaders={tempHeaders}
              setTempHeaders={setTempHeaders}
              useUserSettings={useUserSettings}
              setUseUserSettings={setUseUserSettings}
              isGenerating={isGenerating}
              isSignedIn={status === "authenticated"}
              loadedInstructions={loadedInstructions}
              tempInstructions={tempInstructions}
              setTempInstructions={setTempInstructions}
              userSettings={userSettings}
            />
          </div>

          {/* Schema/Data Sample Tabs */}
          <div className="flex-1 flex">
            <Card className="flex flex-col h-full w-full">
              <CardHeader className="relative space-y-3 px-4 pt-6 sm:px-6">
                <div
                  className="absolute top-0 right-0 bg-primary/10 text-primary px-2 py-2 rounded-tr-xl text-xs font-medium"
                  style={{ top: "-24px", right: "-24px" }}
                >
                  Step 2
                </div>
                {schemaName && (
                  <div className="flex items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-md w-fit">
                    <div className="text-green-700 dark:text-green-300 text-sm font-medium">
                      Loaded schema: {schemaName}
                    </div>
                  </div>
                )}
                <Tabs
                  value={activeTab}
                  onValueChange={handleTabChange}
                  className="w-full mt-3"
                >
                  <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 mb-8">
                    <TabsTrigger value="schema">
                      <FileText className="mr-1 h-4 w-4" />
                      Use Database Schema
                    </TabsTrigger>
                    <TabsTrigger value="examples">
                      <Code className="mr-1 h-4 w-4" />
                      Use Sample Records
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="schema" >
                    <CardTitle className="text-lg font-semibold mb-1">
                      Database Schema Definition
                    </CardTitle>
                    <CardDescription className="text-sm mb-2">
                      Define your{" "}
                      {schemaType === "sql"
                        ? "SQL table(s)"
                        : schemaType === "nosql"
                        ? "NoSQL collection structure"
                        : schemaType === "sample"
                        ? "schema (unused with Sample Data)"
                        : "database schema"}
                      .
                    </CardDescription>
                  </TabsContent>
                  <TabsContent value="examples" >
                    <CardTitle className="text-lg font-semibold mb-1">
                      Sample Data Records
                    </CardTitle>
                    <CardDescription className="text-sm mb-2">
                      Paste in example records for the AI, in any format. Several
                      records produce better results.
                    </CardDescription>
                  </TabsContent>
                </Tabs>
                <div className="mt-4 flex flex-wrap justify-end gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 rounded-full p-2"
                    onClick={handleResetSchemaDefinition}
                    aria-label="Reset schema definition"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  {session && (
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => setSaveDialogOpen(true)}
                      disabled={
                        isGenerating ||
                        (schemaType !== "sample" && !schema.trim()) ||
                        (schemaType === "sample" && !examples.trim())
                      }
                    >
                      <Save className="mr-2 h-5 w-5" />
                      {schemaName
                        ? "Save Changes"
                        : schemaType === "sample"
                        ? "Save Examples"
                        : "Save New Schema"
                      }
                    </Button>
                  )}
                  {loadSavedAction}
                  <TemplatePicker
                    triggerLabel="Browse Templates"
                    onSelect={handleTemplateSelected}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col p-0">
                {activeTab === "schema" ? (
                  <div className="p-4 pb-0 h-[300px] sm:p-5">
                    <SchemaEditor
                      value={schema}
                      onChange={setSchema}
                      type={schemaType}
                      disabled={isGenerating}
                    />
                  </div>
                ) : (
                  <div className="p-3 h-full flex">
                    <Textarea
                      value={examples}
                      onChange={(e) => setExamples(e.target.value)}
                      placeholder={`# JSON example: {"id": 1, "name": "Jane Smith", "email": "jane.smith@example.com", "role": "user"}
# CSV example: 1, John Doe,john.doe@example.com,admin
# Tab example: 1\tJohn Doe\tjohn.doe@example.com\tadmin
# Literal example: id, name, email, role`}
                      className="h-full flex-grow font-mono text-sm resize-none border border-input rounded-md p-3"
                      disabled={isGenerating}
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground border-t pt-4 mt-4">
                <div className="space-y-3 w-full">
                  <p>
                    By using this service, you agree to our{" "}
                    <a href="/terms" className="text-primary hover:underline">
                      Terms of Use
                    </a>
                    . You are responsible for all content generated and any API
                    charges incurred when using this service with your own API
                    key.
                  </p>
                  <DailyLimitInfo
                    hasOwnApiKey={useUserSettings && !!userSettings?.apiKey}
                    ref={dailyLimitRef}
                  />
                </div>
              </CardFooter>
              <div className="p-4 pt-4 pb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  size="default"
                  className="w-full sm:flex-grow"
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-5 w-5" />
                  )}
                  {isGenerating ? "Generating..." : "Generate Mock Records"}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Results Section */}
      {isGenerating && (
        <div className="w-full">
          <GenerationProgress
            currentStep={progressStep}
            progress={progressPercent}
            description={progressMessage}
            onCancel={handleCancelGeneration}
            isCancelable={!!generationController}
          />
        </div>
      )}
      <div className="w-full" ref={resultsRef}>
        <Card className="w-full">
          <CardHeader className="relative">
            <div
              className="absolute top-0 right-0 bg-primary/10 text-primary px-2 py-2 rounded-tr-xl text-xs font-medium"
              style={{ top: "-24px", right: "-24px" }}
            >
              Results
            </div>
            <CardTitle className="text-lg font-semibold mb-1">
              Generated Results
            </CardTitle>
            <CardDescription>
              {results
                ? "Your mock records are ready"
                : "Results will appear here after generation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating && !results ? (
              <ResultsSkeleton />
            ) : (
              <ResultsViewer
                results={results}
                format={format}
                isLoading={isGenerating}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Schema Dialog, only if user is logged in */}
      <SaveSchemaDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSave}
        schemaData={{
          schema:
            schemaType !== "sample" ? schema : "/* Using examples mode */",
          schemaType:
            schemaType === "sample" ? "sql" : (schemaType as "sql" | "nosql"),
        }}
        userId={session?.user?.id || ""}
        handleApiCall={false}
        initialName={schemaName || ""}
        editMode={!!schemaId}
        schemaId={schemaId || ""}
        preferredFormat={format}
        preferredRecordCount={recordCount}
      />
    </div>
  );
}

// wrap the content in Suspense when exporting
export default function GeneratorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-lg">Loading...</p>
        </div>
      }
    >
      <GeneratorPageContent />
    </Suspense>
  );
}
