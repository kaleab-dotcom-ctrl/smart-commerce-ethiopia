"use client";

import { useState, useRef, useEffect } from "react";
import { getSession } from "@/lib/auth";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const SUGGESTED_QUESTIONS = [
  "What should I restock?",
  "What are my best-selling products?",
  "How much revenue did I make?",
  "Are there any unusual orders?",
  "Which products are running low?",
  "How is my inventory performing?",
];

export function BusinessAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSendMessage(textToSend?: string) {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    setErrorMsg(null);
    setInputQuery("");

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Retrieve auth session token securely
      const { data: { session } } = await getSession();
      if (!session) {
        setErrorMsg("Session expired. Please log in again.");
        setIsLoading(false);
        return;
      }

      // Send to server-side API route
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response from assistant.");
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClearChat() {
    setMessages([]);
    setErrorMsg(null);
  }

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden flex flex-col h-[520px]">
      {/* Header Bar */}
      <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green font-bold text-base">
            🤖
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Smart Business Assistant
            </h2>
            <p className="text-[11px] text-muted">
              Ask questions about your inventory, sales, orders, and business performance.
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearChat}
            className="text-xs font-semibold text-muted hover:text-foreground px-2 py-1 rounded hover:bg-slate-100 transition-colors"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
        {messages.length === 0 ? (
          /* Empty State & Suggested Questions */
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10 text-xl text-brand-green mb-3">
              ✨
            </div>
            <h3 className="text-sm font-bold text-foreground">
              How can I help your business today?
            </h3>
            <p className="text-xs text-muted mt-1 max-w-sm">
              Select a suggested question below or type your custom query. Answers are generated from your real store data.
            </p>

            {/* Suggested Question Chips */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs font-medium text-foreground hover:border-brand-green hover:bg-brand-green/5 transition-all shadow-2xs"
                >
                  💡 {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages Stream */
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-muted">
                <span className="font-semibold">
                  {m.role === "user" ? "You" : "Smart Business Assistant"}
                </span>
                <span>•</span>
                <span>
                  {m.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-brand-green text-white rounded-br-none shadow-xs font-medium"
                    : "bg-surface border border-border text-foreground rounded-bl-none shadow-2xs whitespace-pre-wrap"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 rounded-xl bg-surface border border-border px-3.5 py-2 text-xs text-muted shadow-2xs">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
              <span>Analyzing your business data…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-xs text-red-700 font-medium flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-[11px] font-bold underline hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-border bg-surface flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask about restocks, sales, orders, forecasts, anomalies…"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={isLoading}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="rounded-lg bg-brand-green px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-green-dark disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
