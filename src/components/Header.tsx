import { Code, Terminal } from "lucide-react";

interface HeaderProps {
  activeTab: "home" | "dashboard";
  setActiveTab: (tab: "home" | "dashboard") => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => setActiveTab("home")} 
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          id="header-logo-container"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20" id="logo-icon-box">
            <Terminal className="w-5 h-5 text-white" id="logo-terminal-icon" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-xl tracking-tight text-white flex items-center gap-1.5" id="logo-text-title">
              Repo<span className="text-cyan-400">Space</span>
            </h1>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest" id="logo-subtext">
              Repository Intelligence
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800" id="header-nav">
          <button
            onClick={() => setActiveTab("home")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "home"
                ? "bg-slate-800 text-cyan-400 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            id="nav-btn-home"
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === "dashboard"
                ? "bg-slate-800 text-cyan-400 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            id="nav-btn-dashboard"
          >
            <Code className="w-4 h-4" />
            Intelligence Core
          </button>
        </nav>
      </div>
    </header>
  );
}
