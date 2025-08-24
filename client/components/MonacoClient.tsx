"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

// Dynamic import disables SSR for Monaco
const Monaco = dynamic(() => import("@monaco-editor/react"), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900/80 rounded-lg border border-gray-600/30">
      <div className="flex items-center space-x-3 text-gray-400">
        <ArrowPathIcon className="w-6 h-6 animate-spin" />
        <span>Loading Monaco Editor...</span>
      </div>
    </div>
  )
});

export default function MonacoClient({
  language = "javascript",
  value,
  onChange,
  height = "300px",
  theme = "vs-dark",
  placeholder = "// Enter your code here..."
}: {
  language?: string;
  value?: string;
  onChange?: (value?: string) => void;
  height?: string | number;
  theme?: string;
  placeholder?: string;
}) {
  // Keep options stable to prevent unnecessary re-renders
  const options = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on' as const,
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on' as const,
      suggest: {
        showSnippets: false
      },
      quickSuggestions: false,
      folding: true,
      renderLineHighlight: 'line' as const,
      bracketPairColorization: {
        enabled: true
      },
      fontFamily: 'JetBrains Mono, Cascadia Code, Consolas, monospace',
      lineHeight: 1.5
    }),
    []
  );

  const handleEditorWillMount = (monaco: any) => {
    // Define custom cyberpunk theme
    monaco.editor.defineTheme('cyberpunk', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6B7280' },
        { token: 'keyword', foreground: '06B6D4' },
        { token: 'string', foreground: '10B981' },
        { token: 'number', foreground: 'F59E0B' },
        { token: 'operator', foreground: 'EC4899' }
      ],
      colors: {
        'editor.background': '#00000000', // Transparent
        'editor.lineHighlightBackground': '#1F2937',
        'editorLineNumber.foreground': '#6B7280',
        'editor.selectionBackground': '#374151'
      }
    });
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Set custom theme after mount
    monaco.editor.setTheme('cyberpunk');
    
    // Set placeholder value if no initial value
    if (!value && placeholder) {
      editor.setValue(placeholder);
    }
  };

  return (
    <Monaco
      language={language}
      value={value}
      onChange={onChange}
      options={options}
      height={height}
      theme={theme}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
    />
  );
}