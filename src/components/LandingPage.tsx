import { ArrowRight, Code, Cpu, Database, FileText, GitBranch, MessageSquare, Terminal } from "lucide-react";

interface LandingPageProps {
  onStartScanning: () => void;
}

export default function LandingPage({ onStartScanning }: LandingPageProps) {
  const features = [
    {
      icon: GitBranch,
      title: "File Tree Mapping",
      description: "Recursively scans your public or private repository's file structure to establish a comprehensive map of directories and files.",
      gradient: "from-cyan-500 to-blue-600"
    },
    {
      icon: Cpu,
      title: "Architectural Synthesis",
      description: "Gemini AI analyzes the file distributions and manifests to diagnose design patterns, directory hierarchies, and core dependencies.",
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      icon: MessageSquare,
      title: "AI Code Resident",
      description: "Instantly chat with a dedicated context-aware agent that answers questions, suggests refactors, and drafts new code modules directly inside your tree.",
      gradient: "from-violet-500 to-pink-600"
    },
    {
      icon: FileText,
      title: "Real-time Audits",
      description: "Identifies codebase bottlenecks, security concerns, and code smells, returning structured improvements and clicking recommendation shortcuts.",
      gradient: "from-emerald-500 to-teal-600"
    }
  ];

  const valueStats = [
    { label: "AI Scans Processed", value: "148,200+" },
    { label: "Language Adaptations", value: "45+" },
    { label: "Average Analysis Time", value: "< 12s" }
  ];

  return (
    <div className="text-white min-h-[calc(100vh-80px)] flex flex-col justify-between py-12 px-6" id="landing-page-root">
      <div className="max-w-6xl mx-auto w-full flex-grow flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16" id="hero-container">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/50 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-6" id="badge-announcement">
            <Terminal className="w-3.5 h-3.5 animate-pulse" />
            Next-Gen Codebase Parsing
          </div>
          
          <h2 className="font-sans font-extrabold text-5xl md:text-6xl tracking-tight text-white mb-6 leading-tight" id="hero-heading">
            Deconstruct and Map Any Codebase in <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-500 bg-clip-text text-transparent">Seconds</span>
          </h2>
          
          <p className="text-slate-400 text-lg md:text-xl font-normal leading-relaxed mb-10" id="hero-description">
            RepoSpace is an AI repository intelligence system. Enter a GitHub URL to analyze folder structure, deconstruct architecture, and consult a dedicated resident Gemini agent with total repository awareness.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4" id="hero-action-buttons">
            <button
              onClick={onStartScanning}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium rounded-lg flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 group cursor-pointer"
              id="btn-get-started"
            >
              Access Intelligence Core
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#features-section"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium rounded-lg border border-slate-800 transition-colors text-center"
              id="btn-learn-more"
            >
              Explore Capabilities
            </a>
          </div>
        </div>

        {/* Features Bento / Grid */}
        <div className="mb-20 scroll-mt-24" id="features-section">
          <div className="text-center mb-10">
            <h3 className="font-sans font-bold text-2xl tracking-tight text-white mb-2" id="features-title">
              Engineered for Cognitive Code Comprehension
            </h3>
            <p className="text-slate-400 text-sm max-w-lg mx-auto" id="features-subtitle">
              Traditional code searches index text. RepoSpace generates semantic models mapping your files to intent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="features-grid">
            {features.map((feat, idx) => (
              <div 
                key={idx} 
                className="bg-slate-950 p-6 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-all duration-350 hover:-translate-y-1 flex flex-col justify-between"
                id={`feature-card-${idx}`}
              >
                <div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-5 shadow-inner`} id={`feature-icon-box-${idx}`}>
                    <feat.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-sans font-semibold text-lg text-white mb-2" id={`feature-header-${idx}`}>
                    {feat.title}
                  </h4>
                  <p className="text-slate-400 text-sm leading-relaxed" id={`feature-desc-${idx}`}>
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Value Metrics */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl py-8 px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto w-full mb-12" id="stats-banner">
          {valueStats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center" id={`stat-column-${idx}`}>
              <span className="font-sans font-extrabold text-3xl text-cyan-400 mb-1" id={`stat-val-${idx}`}>{stat.value}</span>
              <span className="text-slate-400 text-xs font-mono uppercase tracking-widest" id={`stat-lbl-${idx}`}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 pt-8 mt-12 text-center text-xs text-slate-500 font-mono" id="landing-footer">
        <p>© 2026 RepoSpace Inc. Equipped with Gemini-3.5-Flash cognitive context mappings.</p>
      </footer>
    </div>
  );
}
