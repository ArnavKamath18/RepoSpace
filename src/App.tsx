import { useState } from "react";
import Header from "./components/Header";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import { ScanResult } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "dashboard">("home");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const handleStartScanning = () => {
    setActiveTab("dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 text-slate-100" id="app-root-viewport">
      {/* Absolute ambient grid layout in background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      {/* Main Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Router */}
      <main className="relative z-10" id="main-content-area">
        {activeTab === "home" ? (
          <LandingPage onStartScanning={handleStartScanning} />
        ) : (
          <Dashboard scanResult={scanResult} setScanResult={setScanResult} />
        )}
      </main>
    </div>
  );
}
