import React, { useState } from "react";
import { Search, Globe, ExternalLink, Loader2, Sparkles, BookOpen, Info } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { cn } from "../lib/utils";

export default function AISearchModule() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setResult(null);
    setSources([]);

    try {
      // Create a new instance right before the call to ensure fresh API key
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: query }] }],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      if (!response.text) {
        setResult("The search returned no text results. Try a different query.");
      } else {
        setResult(response.text);
      }
      
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const chunks = groundingMetadata?.groundingChunks;
      
      if (chunks && Array.isArray(chunks)) {
        const extractedSources = chunks
          .filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({
            title: chunk.web.title || "Untitled Source",
            uri: chunk.web.uri || "#",
          }));
        setSources(extractedSources);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      setResult(`Search failed: ${error.message || "Unknown error"}. Please ensure your query is specific.`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">AI Academic Search</h3>
        <p className="text-sm font-medium text-slate-500">Get real-time academic information and research grounded in Google Search.</p>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder="Ask anything (e.g., 'Latest CBSE curriculum updates 2026', 'Best teaching methods for Class 5 Math')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border-2 border-slate-100 bg-white py-4 pl-12 pr-24 text-sm font-bold shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="rounded-lg bg-emerald-100 p-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                </div>
                <h4 className="font-black text-slate-900 uppercase tracking-widest">AI Analysis</h4>
              </div>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{result}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-4 w-4 text-slate-400" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sources & Citations</h4>
              </div>
              {sources.length > 0 ? (
                <div className="space-y-3">
                  {sources.map((source, i) => (
                    <a
                      key={i}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-emerald-500 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                          {source.title}
                        </p>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 text-slate-300 group-hover:text-emerald-500" />
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400 truncate">{source.uri}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Info className="h-8 w-8 text-slate-200 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No direct sources found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!result && !isSearching && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Latest educational trends in Pakistan 2026",
            "Effective classroom management for primary schools",
            "Digital literacy curriculum for middle school",
            "Mental health support strategies for students"
          ].map((suggestion, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(suggestion);
                // Trigger search automatically
              }}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-emerald-500 hover:bg-emerald-50/30 group"
            >
              <div className="rounded-lg bg-slate-100 p-2 group-hover:bg-emerald-100 transition-colors">
                <Sparkles className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
              </div>
              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
