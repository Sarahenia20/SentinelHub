"use client";

import { useState, useRef, useEffect } from "react";
import { CommandLineIcon } from "@heroicons/react/24/outline";

interface LightCodeEditorProps {
  language?: string;
  value?: string;
  onChange?: (value: string) => void;
  height?: string | number;
  placeholder?: string;
}

export default function LightCodeEditor({
  language = "javascript",
  value = "",
  onChange,
  height = "300px",
  placeholder = "// Enter your code here..."
}: LightCodeEditorProps) {
  const [code, setCode] = useState(value || placeholder);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setCode(value || placeholder);
    }
  }, [value, placeholder]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCode(newValue);
    onChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newValue);
      onChange?.(newValue);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="relative bg-gray-900/90 border border-cyan-500/30 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/10">
      <div className="flex items-center justify-between bg-gray-800/90 px-4 py-2 border-b border-cyan-500/20">
        <div className="flex items-center space-x-2">
          <CommandLineIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-mono text-cyan-400">SentinelHub Terminal</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      <div style={{ height }}>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent text-white font-mono text-sm leading-6 p-4 resize-none outline-none"
          style={{
            backgroundColor: 'transparent',
            color: '#ffffff',
            fontFamily: 'JetBrains Mono, Cascadia Code, Consolas, monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            tabSize: 2
          }}
          placeholder={placeholder}
          spellCheck={false}
        />
      </div>
    </div>
  );
}