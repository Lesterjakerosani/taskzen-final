"use client";
import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Music2, Volume2, VolumeX, Play, Pause, ChevronDown, ChevronUp, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "Lo-fi",     emoji: "🎵", query: "lofi hip hop study music" },
  { label: "Rain",      emoji: "🌧️", query: "rain sounds for studying 1 hour" },
  { label: "Nature",    emoji: "🌿", query: "nature ambient sounds study" },
  { label: "Jazz",      emoji: "🎷", query: "smooth jazz study concentration" },
  { label: "Classical", emoji: "🎻", query: "classical music studying focus" },
  { label: "Chill",     emoji: "✨", query: "chill beats focus study music" },
];

function extractYouTubeId(raw: string): { type: "video" | "playlist"; id: string } | null {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const list = url.searchParams.get("list");
    if (list) return { type: "playlist", id: list };
    if (url.hostname === "youtu.be") return { type: "video", id: url.pathname.slice(1).split("?")[0] };
    const v = url.searchParams.get("v");
    if (v) return { type: "video", id: v };
    const m = url.pathname.match(/\/embed\/([^/?]+)/);
    if (m) return { type: "video", id: m[1] };
  } catch {}
  if (/^[A-Za-z0-9_-]{11}$/.test(raw.trim())) return { type: "video", id: raw.trim() };
  return null;
}

function buildEmbedUrl(parsed: { type: "video" | "playlist"; id: string }): string {
  const base = "autoplay=1&enablejsapi=1&modestbranding=1&rel=0";
  if (parsed.type === "playlist")
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${parsed.id}&${base}`;
  return `https://www.youtube-nocookie.com/embed/${parsed.id}?${base}`;
}

export function AmbientPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [activeEmbed, setActiveEmbed] = useState<{ type: "video" | "playlist"; id: string } | null>(null);
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const postCmd = useCallback((func: string, args?: unknown[]) => {
    const msg = JSON.stringify({ event: "command", func, args: args ?? [] });
    iframeRef.current?.contentWindow?.postMessage(msg, "*");
  }, []);

  const handleLoad = useCallback(() => {
    const parsed = extractYouTubeId(inputUrl.trim());
    if (!parsed) return;
    setActiveEmbed(parsed);
    setIsPlaying(true);
  }, [inputUrl]);

  const handleIframeReady = useCallback(() => {
    setTimeout(() => postCmd("setVolume", [volume]), 1200);
  }, [postCmd, volume]);

  const togglePlay = useCallback(() => {
    if (!activeEmbed) return;
    if (isPlaying) postCmd("pauseVideo");
    else postCmd("playVideo");
    setIsPlaying(p => !p);
  }, [activeEmbed, isPlaying, postCmd]);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    setVolume(v);
    postCmd("setVolume", [v]);
  }, [postCmd]);

  const handleStop = useCallback(() => {
    setActiveEmbed(null);
    setIsPlaying(false);
    setInputUrl("");
  }, []);

  return (
    <div className="fixed bottom-0 left-0 lg:left-16 right-0 z-40">

      {/* ── Collapsible panel: genre links + URL input only (no iframe) ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border bg-card/95 backdrop-blur-md"
          >
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 space-y-3">

              {/* Genre quick-links */}
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                  Find on YouTube
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map(p => (
                    <a
                      key={p.label}
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(p.query)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/60 hover:bg-muted text-[10px] font-medium text-foreground transition-colors"
                    >
                      <span>{p.emoji}</span>
                      {p.label}
                      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>

              {/* URL input row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste YouTube URL or video ID…"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLoad()}
                  className="flex-1 h-8 px-3 text-xs rounded-lg bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                />
                <button
                  onClick={handleLoad}
                  disabled={!inputUrl.trim()}
                  className="h-8 px-3 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Play
                </button>
              </div>

              {/* Volume controls — always accessible even when iframe is hidden */}
              {activeEmbed && (
                <div className="flex items-center gap-3">
                  <button
                    aria-label={isPlaying ? "Pause" : "Play"}
                    onClick={togglePlay}
                    className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors shrink-0"
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <VolumeX className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <input
                    type="range"
                    aria-label="Volume"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={handleVolume}
                    className="flex-1 h-1.5 accent-primary cursor-pointer"
                  />
                  <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <button
                    aria-label="Stop"
                    onClick={handleStop}
                    className="w-7 h-7 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── iframe: always mounted in DOM when active so audio never stops ──
           CSS show/hide (not unmount) keeps YouTube playing while minimized   */}
      {activeEmbed && (
        <div
          className={cn(
            "border-t border-border bg-card/95 backdrop-blur-md overflow-hidden transition-all duration-220",
            expanded ? "block" : "hidden"
          )}
        >
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3">
            <iframe
              key={activeEmbed.id}
              ref={iframeRef}
              src={buildEmbedUrl(activeEmbed)}
              onLoad={handleIframeReady}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full rounded-xl border border-border h-[160px]"
              title="YouTube music player"
            />
          </div>
        </div>
      )}

      {/* ── Always-visible bottom bar ── */}
      <div className="border-t border-border bg-card/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center h-11 gap-3">

            {/* Icon + label */}
            <button
              onClick={() => setExpanded(p => !p)}
              className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity"
            >
              <div className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all",
                isPlaying ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}>
                {isPlaying ? <Volume2 className="h-3 w-3" /> : <Music2 className="h-3 w-3" />}
              </div>
              <span className="text-xs font-semibold text-foreground">Music Player</span>
              <span className="text-[11px] text-muted-foreground truncate hidden sm:block">
                {isPlaying ? "▶ Playing — minimized keeps audio on" : "· Paste a YouTube link to play"}
              </span>
            </button>

            {/* Playing indicator bars */}
            {isPlaying && (
              <div className="flex gap-0.5 items-end h-3.5 shrink-0">
                {[0.6, 1, 0.75, 0.9, 0.55].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-primary rounded-full"
                    animate={{ scaleY: [h, 1, h * 0.6, 1, h] }}
                    transition={{ repeat: Infinity, duration: 1.1 + i * 0.18, ease: "easeInOut" }}
                    style={{ height: "100%", transformOrigin: "bottom", scaleY: h }}
                  />
                ))}
              </div>
            )}

            {/* Inline quick controls when playing */}
            {isPlaying && activeEmbed && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  aria-label={isPlaying ? "Pause" : "Play"}
                  onClick={togglePlay}
                  className="w-6 h-6 rounded-md bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
                >
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </button>
                <button
                  aria-label="Stop"
                  onClick={handleStop}
                  className="w-6 h-6 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Expand/collapse chevron */}
            <button
              aria-label={expanded ? "Collapse player" : "Expand player"}
              onClick={() => setExpanded(p => !p)}
              className="p-1 rounded-md hover:bg-accent/10 text-muted-foreground transition-colors shrink-0"
            >
              {expanded
                ? <ChevronDown className="h-3.5 w-3.5" />
                : <ChevronUp className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
