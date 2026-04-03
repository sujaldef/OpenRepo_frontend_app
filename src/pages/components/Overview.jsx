// src/pages/Dashboard/components/Overview.jsx
import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { motion } from 'framer-motion';
import { 
  Activity, Zap, RefreshCw, ShieldAlert, AlertTriangle, 
  FileWarning, Code, Layers, PieChart, Target 
} from 'lucide-react';

import { fetchSummary } from "../../api/summary";
import { analyzeRepo } from "../../api/repos";

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { repoId } = useParams();

  const loadSummary = async () => {
    if (!repoId) return;
    try {
      const data = await fetchSummary(repoId);
      setSummary(data);
    } catch (e) {
      console.log("summary load failed", e);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [repoId]);

  const handleReanalyze = async () => {
    if (!repoId) return;
    try {
      setIsAnalyzing(true);
      await analyzeRepo(repoId);
      await loadSummary();
    } catch (error) {
      console.error("Reanalysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <RefreshCw className="animate-spin mr-3" /> Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Repository Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time health, risk, and structural metrics.</p>
        </div>
        
        <button
          onClick={handleReanalyze}
          disabled={isAnalyzing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            isAnalyzing 
              ? "bg-purple-600/50 text-white/70 cursor-not-allowed" 
              : "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]"
          }`}
        >
          <RefreshCw size={16} className={isAnalyzing ? "animate-spin" : ""} />
          {isAnalyzing ? "Running Pipeline..." : "Reanalyze Repository"}
        </button>
      </div>

      {/* 1. Executive Health (Top KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HudCard 
          label="Overall Score" 
          value={`${summary.overall_score}/100`} 
          sub="System health" 
          icon={Activity} 
          color={summary.overall_score > 80 ? "text-green-400" : summary.overall_score > 60 ? "text-yellow-400" : "text-red-400"} 
        />
        <HudCard 
          label="Repo Risk" 
          value={(summary.repo_risk_score * 100).toFixed(1) + "%"} 
          sub="Codebase vulnerability" 
          icon={AlertTriangle} 
          color="text-orange-400" 
        />
        <HudCard 
          label="Total Issues" 
          value={summary.total_issues} 
          sub="Pending fixes" 
          icon={Zap} 
          color="text-purple-400" 
        />
        <HudCard 
          label="Security Flags" 
          value={summary.security_issues || 0} 
          sub="Requires attention" 
          icon={ShieldAlert} 
          color={summary.security_issues > 0 ? "text-red-500" : "text-green-500"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Quality & Structure Snapshot (Left 2/3) */}
        <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-xl p-6 flex flex-col"
>
  <div className="flex items-center gap-2 mb-6 text-gray-200">
    <Code size={20} className="text-purple-400" />
    <h3 className="text-lg font-bold">Code Quality & Architecture</h3>
  </div>
  
  {/* Use flex + gap instead of grid → better control over spacing */}
  <div className="flex flex-col md:flex-row gap-8">
    
    {/* Left: Progress bars & metrics */}
    <div className="flex-1 space-y-5">
      <ProgressBar label="Structure Score" value={summary.structure_score || 0} />
      <ProgressBar label="Test Coverage" value={summary.test_coverage_ratio * 100 || 0} reverseColors />
      
      <div className="pt-4 border-t border-white/10 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Avg Complexity:</span>
          <span className="text-white font-mono">{summary.avg_complexity?.toFixed(2) || "—"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Avg Duplication:</span>
          <span className="text-white font-mono">{(summary.avg_duplication * 100 || 0).toFixed(2)}%</span>
        </div>
      </div>
    </div>

    {/* Right: Repository Size & Depth */}
    <div className="md:w-80 bg-white/5 rounded-lg p-5 border border-white/5 flex flex-col justify-center space-y-6">
      <div className="flex items-center gap-3">
        <Layers className="text-blue-400" size={24} />
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Repository Size</p>
          <p className="text-xl font-bold text-white">
            {summary.total_files || 0} <span className="text-sm font-normal text-gray-400">files</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] text-gray-500 uppercase">Avg Depth</p>
          <p className="text-lg font-mono text-white">{summary.avg_depth?.toFixed(1) || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase">Max Depth</p>
          <p className="text-lg font-mono text-white">{summary.max_depth || "—"}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] text-gray-500 uppercase">Folder Entropy</p>
          <p className="text-lg font-mono text-white">{summary.folder_entropy?.toFixed(2) || "—"}</p>
        </div>
      </div>
    </div>
  </div>
</motion.div>

        {/* 3. Immediate Focus (Right 1/3) */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#0a0a0a] border border-red-500/30 rounded-xl p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Target size={80} className="text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-4">
              <FileWarning size={16} /> Critical Focus Area
            </h3>
            
            {summary.critical_file ? (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Most Risky File:</p>
                <p className="text-sm font-mono text-gray-200 break-all mb-2">
                  {summary.critical_file.file_path}
                </p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-red-400 font-bold">Risk Score: {(summary.critical_file.risk_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No critical files detected.</p>
            )}

            {summary.top_recommendation && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-2">Top Recommendation:</p>
                <h4 className="font-bold text-sm text-gray-200">{summary.top_recommendation.title}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{summary.top_recommendation.description}</p>
              </div>
            )}
          </motion.div>

          {/* 4. Risk Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5"
          >
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2 mb-4">
              <PieChart size={16} className="text-blue-400" /> Risk Distribution
            </h3>
            
            <div className="space-y-3">
              <RiskBar label="High Risk Files" percent={summary.risk_distribution?.high_percent || 0} color="bg-red-500" />
              <RiskBar label="Medium Risk Files" percent={summary.risk_distribution?.medium_percent || 0} color="bg-orange-400" />
              <RiskBar label="Low Risk Files" percent={summary.risk_distribution?.low_percent || 0} color="bg-green-500" />
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

// Sub-components for styling
function HudCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl flex items-center justify-between shadow-lg">
      <div>
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">{label}</p>
        <h4 className="text-xl font-bold text-white">{value}</h4>
        <p className="text-[10px] text-gray-600 mt-1">{sub}</p>
      </div>
      <div className={`p-2.5 rounded-lg bg-white/5 ${color}`}>
        <Icon size={18} />
      </div>
    </div>
  );
}

function ProgressBar({ label, value, reverseColors = false }) {
  const safeValue = isNaN(value) ? 0 : Math.min(100, Math.max(0, value));
  
  // For things like Test Coverage, higher is better (green). 
  // For things like risk/complexity, lower is better. We default to higher is better.
  let colorClass = 'bg-red-500';
  if (safeValue > 70) colorClass = reverseColors ? 'bg-red-500' : 'bg-green-500';
  else if (safeValue > 40) colorClass = 'bg-yellow-500';
  else colorClass = reverseColors ? 'bg-green-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-mono">{safeValue.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safeValue}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${colorClass}`}
        />
      </div>
    </div>
  );
}

function RiskBar({ label, percent, color }) {
  const safePercent = isNaN(percent) ? 0 : percent;
  return (
    <div>
      <div className="flex justify-between text-[10px] uppercase font-mono mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white">{safePercent}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safePercent}%` }}
          transition={{ duration: 1 }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}