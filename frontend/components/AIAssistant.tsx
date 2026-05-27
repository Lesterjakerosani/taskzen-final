"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Bot, RefreshCw, Brain, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { cn, generateId } from "@/lib/utils";
import type { ChatMessage } from "@/types";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your AI Study Assistant powered by Google Gemini. I can help you with study plans, explain concepts, boost your motivation, and give productivity tips. What would you like to work on today?",
  timestamp: new Date(),
};

const COOLDOWN_MS = 2000; // minimum 2s between requests
const MAX_HISTORY = 10;   // only send last 10 messages to keep payload small

export function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoadingRef = useRef(false);           // sync guard — prevents double-fire
  const lastRequestTimeRef = useRef(0);         // cooldown tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    lastRequestTimeRef.current = Date.now();
    setCooldownLeft(COOLDOWN_MS / 1000);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((lastRequestTimeRef.current + COOLDOWN_MS - Date.now()) / 1000)
      );
      setCooldownLeft(remaining);
      if (remaining === 0 && cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    }, 200);
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();

    // Guard 1: empty input
    if (!content) return;

    // Guard 2: already loading (ref check is synchronous — no stale state issue)
    if (isLoadingRef.current) return;

    // Guard 3: cooldown
    const msSinceLast = Date.now() - lastRequestTimeRef.current;
    if (msSinceLast < COOLDOWN_MS) return;

    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    isLoadingRef.current = true;
    setIsLoading(true);
    setInput("");
    setMessages((prev) => [...prev, userMsg]);

    // Build trimmed history (exclude welcome, cap at MAX_HISTORY)
    const history = [...messages, userMsg]
      .filter((m) => m.id !== "welcome")
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: data.content ?? "No response received.",
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // request was cancelled — no message

      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit =
        msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests");

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: isRateLimit
            ? "I'm receiving too many requests right now. Please wait a few seconds and try again!"
            : "I'm having trouble connecting. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      startCooldown();
      textareaRef.current?.focus();
    }
  }, [input, messages, startCooldown]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    abortControllerRef.current?.abort();
    isLoadingRef.current = false;
    setIsLoading(false);
    setMessages([WELCOME_MESSAGE]);
    setInput("");
  };

  const canSend = input.trim().length > 0 && !isLoading && cooldownLeft === 0;

  return (
    <Card className="flex flex-col h-[600px] lg:h-[700px]">
      <CardHeader className="flex-row items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-blue flex items-center justify-center shadow-md">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">AI Study Assistant</CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn(
                "w-2 h-2 rounded-full",
                isLoading ? "bg-amber-400 animate-pulse" : "bg-green-500 animate-pulse"
              )} />
              <span className="text-xs text-muted-foreground">
                {isLoading ? "Thinking…" : "Powered by Gemini"}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={clearChat} title="Clear chat">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 flex flex-col gap-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
              <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                <AvatarFallback className={cn(
                  "text-xs",
                  msg.role === "assistant"
                    ? "gradient-blue text-white"
                    : "bg-secondary text-foreground"
                )}>
                  {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : "U"}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === "user"
                  ? "gradient-blue text-white rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              )}>
                {msg.content}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2.5"
            >
              <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                <AvatarFallback className="gradient-blue text-white text-xs">
                  <Bot className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay }}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Suggested prompts — only on fresh chat */}
      {messages.length === 1 && !isLoading && (
        <div className="border-t border-border">
          <SuggestedPrompts onSelect={sendMessage} />
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading
                ? "Waiting for response…"
                : cooldownLeft > 0
                ? `Please wait ${cooldownLeft}s…`
                : "Ask anything about studying… (Enter to send)"
            }
            disabled={isLoading}
            className="min-h-[44px] max-h-[120px] text-sm resize-none disabled:opacity-60"
            rows={1}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!canSend}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl gradient-blue text-white shadow-sm disabled:opacity-40"
          >
            {cooldownLeft > 0 && !isLoading
              ? <Clock className="h-4 w-4" />
              : <Send className="h-4 w-4" />
            }
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 text-center">
          {cooldownLeft > 0 && !isLoading
            ? `Cooldown: ${cooldownLeft}s`
            : "Shift+Enter for new line · Enter to send"
          }
        </p>
      </div>
    </Card>
  );
}
