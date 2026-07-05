import { useState, useEffect, useRef } from "react";
import { 
  Scan, GitBranch, Key, AlertCircle, FileCode2, Search,
  Terminal, Globe, Star, Sparkles, BookOpen, Layers, CheckCircle2, RefreshCw, Eye, ArrowRight
} from "lucide-react";
import { RepoInfo, RepoTreeItem, RepoAnalysis, ScanResult } from "../types";
import ChatPanel from "./ChatPanel";

interface DashboardProps {
  scanResult: ScanResult | null;
  setScanResult: (result: ScanResult | null) => void;
}

export default function Dashboard({ scanResult, setScanResult }: DashboardProps) {
  // Input fields
  const [repoUrl, setRepoUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // App states
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"structure" | "overview" | "improvements">("overview");
  const [treeSearchQuery, setTreeSearchQuery] = useState("");
  
  // Demo repository states
  const [demoRepos, setDemoRepos] = useState<string[]>([]);
  const [selectedDemo, setSelectedDemo] = useState("react-todo-app");

  // Chat integration state (shares prompt trigger with ChatPanel)
  const [aiInquiryPrompt, setAiInquiryPrompt] = useState<string | null>(null);

  // Rotating loading messages
  const loadingMessages = [
    "Establishing secure connection tunnel to GitHub...",
    "Validating repository status and permissions...",
    "Reconstructing full folder directory hierarchies recursively...",
    "Analyzing manifest files and package definitions...",
    "Extracting primary README documentation...",
    "Formatting repository tree constraints (files & nodes)...",
    "Streaming structural datasets into Gemini-3.5-Flash context...",
    "Analyzing technological footprints and code dependencies...",
    "Synthesizing logical module pathways and architecture maps...",
    "Drafting codebase suggestions and custom greetings..."
  ];

  // Rotate loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingMsgIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch demo list on mount
  useEffect(() => {
    fetch("/api/demo-repos")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.repos) {
          setDemoRepos(data.repos);
        }
      })
      .catch((err) => console.error("Error loading demo repository list:", err));
  }, []);

  // Initiate scan function
  const handleScan = async (e?: React.FormEvent, forceDemoKey?: string) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const isDemoMode = !!forceDemoKey;
    const targetUrl = isDemoMode ? "" : repoUrl;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: targetUrl,
          githubToken,
          useDemo: isDemoMode,
          demoKey: forceDemoKey
        }),
      });

      const data = await response.json();

      if (data.success) {
        setScanResult({
          repoInfo: data.repoInfo,
          tree: data.tree,
          analysis: data.analysis
        });
        setActiveSubTab("overview");
      } else {
        setErrorMsg(data.error || "An unexpected error occurred during deep analysis.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to communicate with the RepoSpace intelligence API.");
    } finally {
      setLoading(false);
    }
  };

  // Quick select sandbox demos
  const handleSelectDemo = (key: string) => {
    setSelectedDemo(key);
    handleScan(undefined, key);
  };

  // Helper to get depth of file path
  const getFileDepth = (pathStr: string) => {
    const slashes = pathStr.split("/").length - 1;
    return slashes;
  };

  // Helper to extract file name from path
  const getFileName = (pathStr: string) => {
    const parts = pathStr.split("/");
    return parts[parts.length - 1];
  };

  // Quick ask AI helper
  const handleInquireFile = (pathStr: string) => {
    setAiInquiryPrompt(`Can you explain what the file \`${pathStr}\` does in this codebase, detailing its imports, purpose, and logic?`);
  };

  // Filtered files list based on search query
  const filteredTree = scanResult?.tree.filter((item) => 
    item.path.toLowerCase().includes(treeSearchQuery.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8" id="dashboard-root-container">
      
      {/* 1. If not scanned and not loading: Search/Trigger view */}
      {!scanResult && !loading && (
        <div className="max-w-3xl mx-auto bg-slate-950 rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden" id="scan-trigger-card">
          {/* Subtle design gradient glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-6" id="scan-header-box">
            <div className="p-3 bg-cyan-950/50 rounded-lg border border-cyan-800/40 text-cyan-400" id="scan-icon-container">
              <Scan className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-2xl text-white" id="scan-title">
                Deploy Analyzer Core
              </h3>
              <p className="text-slate-400 text-sm" id="scan-subtitle">
                Enter a GitHub URL or select a sandboxed demonstration repository.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={(e) => handleScan(e)} className="space-y-6" id="scan-form">
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-wider text-slate-300 block">
                GitHub Repository URL
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/facebook/react"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-800 focus:border-cyan-500/80 rounded-lg text-sm text-white placeholder-slate-500 outline-none transition-colors"
                    id="input-repo-url"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer"
                  id="btn-trigger-scan"
                >
                  <Sparkles className="w-4 h-4" />
                  Scan Codebase
                </button>
              </div>
            </div>

            {/* Advanced Settings for Custom PAT */}
            <div className="border-t border-slate-900 pt-4" id="advanced-settings-wrapper">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="font-mono text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                id="btn-toggle-advanced"
              >
                <Key className="w-3.5 h-3.5" />
                {showAdvanced ? "Hide Advanced Settings" : "Configure Private Repository Auth Token (Optional)"}
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 bg-slate-900/50 rounded-lg border border-slate-850 space-y-2" id="advanced-input-box">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-slate-400 block">
                    GitHub Personal Access Token (PAT)
                  </label>
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500/80 rounded-md text-xs text-white placeholder-slate-600 outline-none transition-colors font-mono"
                    id="input-pat"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal font-mono">
                    Used to bypass standard GitHub rate limits (60/hr for IP) or scan private repos. Your token remains client-side in context and is never saved.
                  </p>
                </div>
              )}
            </div>
          </form>

          {/* Fallback Error message if scan failed */}
          {errorMsg && (
            <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 rounded-lg flex gap-3 text-red-400 text-xs leading-relaxed" id="scan-error-banner">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1 text-red-300">Analysis Halted</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Dropdown triggers for sandboxed Demo Repos (Immediate Play!) */}
          <div className="mt-8 border-t border-slate-900 pt-6" id="sandbox-demos-block">
            <h4 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Instant Sandbox Playground (Zero Rate Limits)
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="sandbox-triggers-grid">
              {/* Demo 1: React Task App */}
              <button
                onClick={() => handleSelectDemo("react-todo-app")}
                className="p-4 bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-left rounded-xl transition-all group flex items-start justify-between cursor-pointer"
                id="sandbox-demo-1-btn"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-white text-sm">cyber-task-react</span>
                    <span className="text-[10px] px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-full font-mono">Web UI</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                    Futuristic React Todo list featuring motion layouts and client localStorage persistence.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </button>

              {/* Demo 2: Fast API */}
              <button
                onClick={() => handleSelectDemo("python-fastapi-service")}
                className="p-4 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-left rounded-xl transition-all group flex items-start justify-between cursor-pointer"
                id="sandbox-demo-2-btn"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-white text-sm">neural-api-server</span>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-950 border border-indigo-800 text-indigo-400 rounded-full font-mono">Backend API</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                    Python FastAPI async prediction engine configured with Docker, databases, and tasks.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Loading State */}
      {loading && (
        <div className="max-w-2xl mx-auto py-20 text-center flex flex-col items-center justify-center" id="scanning-loading-view">
          <div className="relative w-24 h-24 mb-8" id="loader-spinner-wrapper">
            {/* Spinning Neon Accents */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-indigo-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border border-dashed border-slate-700 animate-reverse-spin" />
            <Terminal className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 text-cyan-400" />
          </div>

          <h3 className="font-sans font-extrabold text-2xl text-white mb-3 tracking-tight flex items-center gap-2 justify-center" id="loading-title">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            Synthesizing Code Repository Intelligence
          </h3>
          
          {/* Animated active step indicator */}
          <div className="min-h-[44px]" id="loading-msg-container">
            <p className="text-slate-400 text-sm font-mono tracking-wide max-w-md mx-auto animate-fade-in-quick" key={loadingMsgIdx}>
              &gt; {loadingMessages[loadingMsgIdx]}
            </p>
          </div>

          <div className="w-48 h-1 bg-slate-900 rounded-full mt-6 overflow-hidden relative" id="loader-progress-bar">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-indigo-500 animate-progress-slide rounded-full" />
          </div>
        </div>
      )}

      {/* 3. Loaded State: Left Dashboard (Repo Info) + Right Chat Panel */}
      {scanResult && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="analysis-dashboard-grid">
          
          {/* Left Column: Repository Dashboard Panel (7 columns) */}
          <div className="lg:col-span-7 space-y-6" id="dashboard-left-column">
            
            {/* Header Metadata block */}
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden" id="repo-banner">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-sans font-extrabold text-2xl text-white tracking-tight" id="active-repo-name">
                    {scanResult.repoInfo.name}
                  </h2>
                  <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-md" id="active-repo-branch">
                    {scanResult.repoInfo.defaultBranch}
                  </span>
                </div>
                <p className="text-slate-400 text-xs max-w-lg leading-normal mb-1" id="active-repo-desc">
                  {scanResult.repoInfo.description}
                </p>
                <p className="text-[10px] text-slate-500 font-mono" id="active-repo-author">
                  Author/Organization: <span className="text-slate-400">{scanResult.repoInfo.owner}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 self-stretch sm:self-auto border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0" id="active-repo-stats-panel">
                {/* Stars */}
                <div className="flex flex-col items-center justify-center bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-lg min-w-[70px]" id="stat-stars">
                  <Star className="w-3.5 h-3.5 text-yellow-500 mb-0.5" />
                  <span className="font-mono text-xs text-slate-300 font-semibold">{scanResult.repoInfo.stars}</span>
                </div>
                {/* Forks */}
                <div className="flex flex-col items-center justify-center bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-lg min-w-[70px]" id="stat-language">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Language</span>
                  <span className="font-mono text-xs text-cyan-400 font-semibold truncate max-w-[65px]">{scanResult.repoInfo.language || "Unknown"}</span>
                </div>
                {/* Reload */}
                <button
                  onClick={() => setScanResult(null)}
                  title="Rescan another repo"
                  className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  id="btn-trigger-rescan"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dashboard Sub-Tabs Navigation */}
            <div className="flex border-b border-slate-900 text-sm font-medium" id="dashboard-subtabs-nav">
              <button
                onClick={() => setActiveSubTab("overview")}
                className={`pb-3 px-4 font-sans tracking-tight relative transition-colors ${
                  activeSubTab === "overview"
                    ? "text-cyan-400 border-b-2 border-cyan-400 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                id="subtab-btn-overview"
              >
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  System Overview
                </div>
              </button>
              <button
                onClick={() => setActiveSubTab("structure")}
                className={`pb-3 px-4 font-sans tracking-tight relative transition-colors ${
                  activeSubTab === "structure"
                    ? "text-cyan-400 border-b-2 border-cyan-400 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                id="subtab-btn-structure"
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Structure Tree
                </div>
              </button>
              <button
                onClick={() => setActiveSubTab("improvements")}
                className={`pb-3 px-4 font-sans tracking-tight relative transition-colors ${
                  activeSubTab === "improvements"
                    ? "text-cyan-400 border-b-2 border-cyan-400 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                id="subtab-btn-improvements"
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  AI Audits
                </div>
              </button>
            </div>

            {/* Sub-Tab 1: System Overview Panel */}
            {activeSubTab === "overview" && (
              <div className="space-y-6" id="overview-panel-content">
                
                {/* 1. Base Summary */}
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-3" id="overview-summary-card">
                  <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Cognitive Summary
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed" id="overview-summary-text">
                    {scanResult.analysis.summary}
                  </p>
                </div>

                {/* 2. Tech Stack Radar & Key Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="overview-grid-bento">
                  {/* Tech stack */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4" id="bento-tech-stack">
                    <h4 className="font-sans font-semibold text-sm text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-indigo-400" />
                      Detected Tech Stack
                    </h4>
                    <div className="flex flex-wrap gap-2" id="tech-stack-pills">
                      {scanResult.analysis.techStack.map((tech, idx) => (
                        <span 
                          key={idx} 
                          className="font-mono text-xs px-2.5 py-1 bg-slate-900 border border-slate-800 text-cyan-300 rounded-md"
                          id={`tech-pill-${idx}`}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Architecture Overview */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4" id="bento-architecture">
                    <h4 className="font-sans font-semibold text-sm text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-violet-400" />
                      Architecture Schema
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed" id="architecture-desc">
                      {scanResult.analysis.architecture}
                    </p>
                  </div>
                </div>

                {/* 3. Core Entry Points / Key Modules */}
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4" id="overview-modules-card">
                  <h3 className="font-sans font-bold text-base text-white">
                    Primary Architectural Entry Points
                  </h3>
                  <div className="divide-y divide-slate-900" id="key-modules-list">
                    {scanResult.analysis.keyModules.map((mod, idx) => (
                      <div 
                        key={idx} 
                        className="py-3 flex flex-col md:flex-row md:items-start justify-between gap-2.5 group hover:bg-slate-900/20 px-2 rounded-md transition-colors"
                        id={`module-item-${idx}`}
                      >
                        <div className="space-y-1">
                          <p className="font-mono text-xs font-semibold text-indigo-300 flex items-center gap-1.5" id={`mod-path-${idx}`}>
                            <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                            {mod.path}
                          </p>
                          <p className="text-slate-400 text-xs leading-normal" id={`mod-desc-${idx}`}>
                            {mod.description}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleInquireFile(mod.path)}
                          className="font-mono text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 md:self-center bg-slate-900 px-2 py-1 rounded border border-slate-850 hover:border-cyan-500/30 transition-all cursor-pointer"
                          id={`btn-ask-mod-${idx}`}
                        >
                          Inquire File
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Sub-Tab 2: Structure Tree Viewer */}
            {activeSubTab === "structure" && (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4" id="structure-panel-content">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" id="tree-controls">
                  <div>
                    <h3 className="font-sans font-bold text-base text-white" id="tree-heading">
                      Repository Filesystem View
                    </h3>
                    <p className="text-slate-500 text-xs" id="tree-subheading">
                      Mapped top 300 active files, organized alphabetically.
                    </p>
                  </div>

                  {/* Search tree input */}
                  <div className="relative w-full sm:w-60" id="tree-search-wrapper">
                    <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 w-4 h-4 self-center" />
                    <input
                      type="text"
                      placeholder="Search files by path..."
                      value={treeSearchQuery}
                      onChange={(e) => setTreeSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500/50"
                      id="input-tree-search"
                    />
                  </div>
                </div>

                {/* Tree render */}
                <div className="max-h-[450px] overflow-y-auto border border-slate-900 rounded-lg divide-y divide-slate-900 bg-slate-950/40 p-2 scrollbar-thin scrollbar-thumb-slate-800" id="file-tree-viewport">
                  {filteredTree.length === 0 ? (
                    <div className="text-center py-12 text-slate-600 font-mono text-xs" id="tree-empty-state">
                      No files matching the search parameters.
                    </div>
                  ) : (
                    filteredTree.map((item, idx) => {
                      const depth = getFileDepth(item.path);
                      const name = getFileName(item.path);
                      const sizeKB = item.size ? (item.size / 1024).toFixed(1) : "0.0";
                      
                      return (
                        <div 
                          key={idx}
                          style={{ paddingLeft: `${Math.min(depth * 14 + 10, 80)}px` }}
                          className="py-2.5 pr-3 hover:bg-slate-900/40 flex items-center justify-between gap-4 transition-all"
                          id={`tree-row-${idx}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {item.type === "tree" ? (
                              <Layers className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            ) : (
                              <FileCode2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            )}
                            <span 
                              title={item.path}
                              className={`font-mono text-xs truncate ${item.type === "tree" ? "text-slate-300 font-semibold" : "text-slate-400"}`}
                              id={`tree-filename-${idx}`}
                            >
                              {name}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0" id={`tree-actions-${idx}`}>
                            {item.type === "blob" && (
                              <span className="font-mono text-[9px] text-slate-600" id={`tree-filesize-${idx}`}>
                                {sizeKB} KB
                              </span>
                            )}
                            
                            {item.type === "blob" && (
                              <button
                                onClick={() => handleInquireFile(item.path)}
                                className="font-mono text-[9px] text-cyan-400 hover:text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 hover:border-cyan-500/30 cursor-pointer"
                                id={`tree-btn-ask-${idx}`}
                              >
                                Ask AI
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Sub-Tab 3: AI Code Audit Improvements */}
            {activeSubTab === "improvements" && (
              <div className="space-y-4" id="improvements-panel-content">
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4" id="audit-main-card">
                  <div className="flex items-center justify-between" id="audit-header">
                    <div>
                      <h3 className="font-sans font-bold text-base text-white" id="audit-title">
                        AI Cognitive Code Audit
                      </h3>
                      <p className="text-slate-500 text-xs" id="audit-subtitle">
                        Identified codebase optimization and architecture improvement suggestions.
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1 bg-yellow-950/50 border border-yellow-800/50 text-yellow-500 rounded-full font-mono uppercase tracking-wider" id="audit-label">
                      Analysis Finished
                    </span>
                  </div>

                  <div className="space-y-4 pt-2" id="audit-suggestions-list">
                    {scanResult.analysis.improvements.map((imp, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 bg-slate-900/50 border border-slate-850 rounded-lg flex gap-3.5"
                        id={`audit-item-${idx}`}
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-xs text-cyan-400 font-semibold font-mono flex-shrink-0" id={`audit-number-${idx}`}>
                          {idx + 1}
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-300 text-xs leading-relaxed" id={`audit-desc-${idx}`}>
                            {imp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: AI Resident Chat Panel (5 columns) */}
          <div className="lg:col-span-5" id="dashboard-right-column">
            <ChatPanel 
              scanResult={scanResult} 
              aiInquiryPrompt={aiInquiryPrompt}
              setAiInquiryPrompt={setAiInquiryPrompt}
            />
          </div>

        </div>
      )}

    </div>
  );
}
