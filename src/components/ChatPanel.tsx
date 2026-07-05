import React, { useState, useEffect, useRef } from "react";
import { Send, Terminal, Sparkles, AlertCircle, Bot, User, Play, RefreshCw, Copy, Check } from "lucide-react";
import { ScanResult, Message } from "../types";

interface ChatPanelProps {
  scanResult: ScanResult;
  aiInquiryPrompt: string | null;
  setAiInquiryPrompt: (prompt: string | null) => void;
}

// Simple internal Markdown content parser for styling code blocks and bullets elegantly without external packages
function renderMarkdownContent(text: string) {
  if (!text) return null;

  // Split content by triple backticks for code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith("```")) {
      // It's a code block
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : "code";
      const code = match ? match[2] : part.slice(3, -3);

      return <CodeSnippet key={index} code={code.trim()} language={language} />;
    } else {
      // Regular text. We can split it by newlines to render paragraphs and lists
      const lines = part.split("\n");
      return (
        <div key={index} className="space-y-2.5">
          {lines.map((line, lineIdx) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return null;

            // Simple Bold parsing: **text**
            const boldRegex = /\*\*([\s\S]*?)\*\*/g;
            const parseInlineFormatting = (txt: string) => {
              const inlineParts = txt.split(boldRegex);
              return inlineParts.map((inlinePart, inlineIdx) => {
                if (inlineIdx % 2 === 1) {
                  return <strong key={inlineIdx} className="font-extrabold text-cyan-300">{inlinePart}</strong>;
                }
                // Check for inline code `code`
                const inlineCodeRegex = /`([^`]+)`/g;
                const inlineCodeParts = inlinePart.split(inlineCodeRegex);
                return inlineCodeParts.map((subPart, subIdx) => {
                  if (subIdx % 2 === 1) {
                    return <code key={subIdx} className="font-mono text-xs px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-pink-400 rounded">{subPart}</code>;
                  }
                  return subPart;
                });
              });
            };

            // Bullet items
            if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
              return (
                <ul key={lineIdx} className="list-disc list-inside pl-2 text-slate-300 text-sm leading-relaxed">
                  <li className="marker:text-cyan-500">
                    <span className="pl-1">{parseInlineFormatting(trimmedLine.slice(2))}</span>
                  </li>
                </ul>
              );
            }

            // Headers: ###, ##, #
            if (trimmedLine.startsWith("### ")) {
              return <h5 key={lineIdx} className="font-sans font-bold text-sm text-white pt-2">{parseInlineFormatting(trimmedLine.slice(4))}</h5>;
            }
            if (trimmedLine.startsWith("## ")) {
              return <h4 key={lineIdx} className="font-sans font-bold text-base text-cyan-400 pt-3">{parseInlineFormatting(trimmedLine.slice(3))}</h4>;
            }
            if (trimmedLine.startsWith("# ")) {
              return <h3 key={lineIdx} className="font-sans font-extrabold text-lg text-white pt-4">{parseInlineFormatting(trimmedLine.slice(2))}</h3>;
            }

            // Standard line
            return (
              <p key={lineIdx} className="text-slate-300 text-sm leading-relaxed">
                {parseInlineFormatting(line)}
              </p>
            );
          })}
        </div>
      );
    }
  });
}

// Stateful Code Block Component with Copy to Clipboard support
function CodeSnippet({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg bg-slate-950 border border-slate-850 overflow-hidden font-mono text-xs">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-850 text-[10px] text-slate-400 uppercase tracking-wider">
        <span>{language || "source"}</span>
        <button
          onClick={handleCopy}
          className="hover:text-white flex items-center gap-1 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code viewport */}
      <pre className="p-4 overflow-x-auto text-slate-300 font-mono leading-relaxed select-text whitespace-pre scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function ChatPanel({ scanResult, aiInquiryPrompt, setAiInquiryPrompt }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize conversations with greeting from scanned analysis
  useEffect(() => {
    if (scanResult) {
      setMessages([
        {
          id: "greeting",
          role: "model",
          content: scanResult.analysis.initialGreeting || "System initialized. Hello! I am the resident Repository Intelligence Agent. How can I help you understand this project?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
  }, [scanResult]);

  // Handle outside code tree trigger inquiry requests
  useEffect(() => {
    if (aiInquiryPrompt) {
      sendMessage(aiInquiryPrompt);
      // Clean trigger source
      setAiInquiryPrompt(null);
    }
  }, [aiInquiryPrompt]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatLoading]);

  // Core Send routine
  const sendMessage = async (customText?: string) => {
    const textToSend = (customText || inputValue).trim();
    if (!textToSend || chatLoading) return;

    if (!customText) {
      setInputValue("");
    }

    setChatError(null);

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoInfo: scanResult.repoInfo,
          tree: scanResult.tree,
          analysis: scanResult.analysis,
          messages: nextMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();

      if (data.success && data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}-ai`,
            role: "model",
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      } else {
        setChatError(data.error || "Failed to receive a response from the intelligence core.");
      }
    } catch (err: any) {
      setChatError(err.message || "Network synchronization lost with the scanning server.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[650px] shadow-2xl relative" id="chat-panel-container">
      {/* Header bar */}
      <div className="px-5 py-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between" id="chat-header">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Terminal className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-white flex items-center gap-1.5">
              Resident Intelligence Agent
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </h3>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Aware of {scanResult.tree.length} codebase files
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (scanResult) {
              setMessages([
                {
                  id: "greeting",
                  role: "model",
                  content: scanResult.analysis.initialGreeting,
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }
              ]);
            }
          }}
          title="Reset chat memory"
          className="p-1.5 bg-slate-950 border border-slate-800 rounded text-slate-500 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
          id="btn-clear-chat"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages body */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-5 space-y-5 bg-slate-950/40 scrollbar-thin scrollbar-thumb-slate-800"
        id="chat-messages-container"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            id={`chat-bubble-${msg.id}`}
          >
            {/* Icon */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === "user" 
                ? "bg-indigo-900/40 text-indigo-300 border border-indigo-700/50" 
                : "bg-cyan-950 text-cyan-400 border border-cyan-800/50"
            }`}>
              {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            {/* Bubble */}
            <div className={`rounded-xl px-4 py-3 text-xs flex flex-col space-y-1 ${
              msg.role === "user"
                ? "bg-indigo-950/30 border border-indigo-900/60 text-slate-200"
                : "bg-slate-900/50 border border-slate-850 text-slate-300"
            }`}>
              {/* Dynamic rendering */}
              <div className="select-text overflow-x-auto">
                {renderMarkdownContent(msg.content)}
              </div>
              <span className="text-[9px] text-slate-500 self-end font-mono mt-1">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Bubble */}
        {chatLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto" id="chat-loading-bubble">
            <div className="w-7 h-7 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 animate-bounce" />
            </div>
            <div className="bg-slate-900/40 border border-slate-850 rounded-xl px-4 py-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] text-slate-500 font-mono ml-1">AI core reasoning...</span>
            </div>
          </div>
        )}

        {/* Chat Error */}
        {chatError && (
          <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg flex gap-2 text-red-400 text-xs font-mono" id="chat-error-banner">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Error: {chatError}</span>
          </div>
        )}
      </div>

      {/* Suggested Questions Section */}
      {scanResult.analysis.suggestedQuestions && scanResult.analysis.suggestedQuestions.length > 0 && messages.length <= 1 && (
        <div className="p-4 bg-slate-950 border-t border-slate-900 space-y-2" id="suggested-questions-panel">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Suggested Inquiries:</p>
          <div className="flex flex-col gap-1.5">
            {scanResult.analysis.suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(q)}
                className="w-full text-left font-mono text-[10px] text-cyan-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-850 px-3 py-1.5 rounded border border-slate-850 hover:border-cyan-800/40 transition-all truncate cursor-pointer"
                id={`suggested-q-${idx}`}
              >
                &gt; {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input controls form */}
      <div className="p-4 bg-slate-900 border-t border-slate-850 flex gap-2.5 items-center" id="chat-input-area">
        <textarea
          rows={1}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask about architecture, custom extensions, or improvement suggestions..."
          className="flex-grow max-h-24 bg-slate-950 border border-slate-800 focus:border-cyan-500/80 rounded-lg py-2.5 px-3 text-xs text-white placeholder-slate-500 outline-none resize-none transition-colors scrollbar-none"
          id="chat-textarea-input"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!inputValue.trim() || chatLoading}
          className="p-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-lg flex-shrink-0 transition-all cursor-pointer"
          id="btn-send-message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
