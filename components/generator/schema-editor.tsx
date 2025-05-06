"use client";

import { Editor } from "@monaco-editor/react";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
  type: "sql" | "nosql" | "sample";
  disabled?: boolean;
}

export default function SchemaEditor({
  value,
  onChange,
  type,
  disabled = false,
}: SchemaEditorProps) {
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<unknown>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getLanguage = () => {
    if (type === "sql") return "sql";
    if (type === "sample") return "json";
    return "json";
  };

  const handleClear = () => {
    onChange("");
  };

  const handleEditorDidMount = (editor: unknown) => {
    editorRef.current = editor;
  };

  if (!mounted) {
    return (
      <div className="border rounded-md h-72 p-4 bg-muted">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border rounded-md h-72 overflow-hidden relative">
      {value && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-6 w-6 rounded-full bg-muted hover:bg-muted-foreground/30"
            title="Clear editor"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <Editor
        height="100%"
        language={getLanguage()}
        value={value}
        onChange={(value) => onChange(value || "")}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          readOnly: disabled,
        }}
      />
    </div>
  );
}
