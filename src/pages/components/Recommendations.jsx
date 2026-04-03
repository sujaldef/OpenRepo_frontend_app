// src/pages/Dashboard/components/Recommendations.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightbulb, Zap, ShieldAlert, GitPullRequest, 
  Activity, CheckCircle2, Layers, RefreshCw, Code2, ArrowRight
} from "lucide-react";

// Replace with your actual API fetcher
import { fetchRepoRecommendations } from "../../api/recommendations"; 

export default function Recommendations() {
  const { repoId } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!repoId) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetchRepoRecommendations(repoId);
        setData(response);
      } catch (e) {
        console.error("Failed to load recommendations:", e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [repoId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px] text-zinc-500 bg-[#0a0a0c] border border-white/10 rounded-xl">
        <RefreshCw className="animate-spin mr-3" size={18} /> 
        <span className="text-sm">Analyzing repository architecture...</span>
      </div>
    );
  }

  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-zinc-500 bg-[#0a0a0c] border border-white/10 rounded-xl">
        <CheckCircle2 size={36} className="mb-3 text-emerald-500/50" />
        <p className="text-base text-zinc-300 font-medium">No major architectural issues detected.</p>
        <p className="text-xs mt-1">Your codebase maintainability is currently optimal.</p>
      </div>
    );
  }

  const repoRiskPercent = ((data.repo_risk_score || 0) * 100).toFixed(1);
  const structurePercent = ((data.structure_score || 0) * 100).toFixed(1);

  return (
    <div className="flex flex-col h-full gap-4 max-h-[calc(100vh-8rem)]">
      
      {/* TOP SECTION: Compact Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
        <MetricCard 
          label="Overall Repo Risk" 
          value={`${repoRiskPercent}%`} 
          description="Technical debt & security."
          icon={Activity} 
          isWarning={data.repo_risk_score > 0.1}
        />
        <MetricCard 
          label="Structural Debt" 
          value={`${structurePercent}%`} 
          description="Complexity & duplication."
          icon={Layers} 
          isWarning={data.structure_score > 0.1}
        />
      </div>

      {/* BOTTOM SECTION: Dense AI Action Items */}
      <div className="flex-1 bg-[#0a0a0c] border border-white/10 rounded-xl flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Lightbulb size={16} className="text-yellow-400" /> 
            Strategic Recommendations
          </h2>
          <span className="text-[10px] font-mono font-medium bg-zinc-800 border border-white/10 px-2 py-1 rounded text-zinc-300">
            {data.items.length} Items
          </span>
        </div>
        
        {/* Scrollable List Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          <AnimatePresence>
            {[...data.items]
              .sort((a, b) => {
                const ranks = { High: 3, Medium: 2, Low: 1 };
                return (ranks[b.priority] || 0) - (ranks[a.priority] || 0);
              })
              .map((item, i) => (
                <RecommendationRow key={i} item={item} index={i} />
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS                                                             */
/* -------------------------------------------------------------------------- */

function MetricCard({ label, value, description, icon: Icon, isWarning }) {
  const colorClass = isWarning ? "text-amber-400" : "text-emerald-400";
  const bgClass = isWarning ? "bg-amber-500/5 border-amber-500/10" : "bg-emerald-500/5 border-emerald-500/10";
  const iconBg = isWarning ? "bg-amber-500/10" : "bg-emerald-500/10";

  return (
    <div className={`p-4 rounded-xl border flex items-center gap-4 ${bgClass}`}>
      <div className={`p-3 rounded-lg ${iconBg}`}>
        <Icon size={20} className={colorClass} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400">
            {label}
          </span>
          <span className={`text-xl font-bold font-mono ${colorClass}`}>
            {value}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

function RecommendationRow({ item, index }) {
  const getStyleParams = (priority, type) => {
    let Icon = GitPullRequest;
    if (type === 'Security') Icon = ShieldAlert;
    if (type === 'Performance') Icon = Zap;
    if (type === 'Maintainability') Icon = Code2;

    if (priority === 'High') {
      return { 
        color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', 
        badge: 'bg-rose-500/20 text-rose-300', Icon 
      };
    }
    if (priority === 'Medium') {
      return { 
        color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', 
        badge: 'bg-amber-500/20 text-amber-300', Icon 
      };
    }
    return { 
      color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', 
      badge: 'bg-blue-500/20 text-blue-300', Icon 
    };
  };

  const style = getStyleParams(item.priority, item.type);
  const severityScore = ((item.score || 0) * 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group flex items-start gap-3 p-3 rounded-lg border ${style.border} bg-[#0f0f11] hover:bg-white/5 transition-colors cursor-pointer`}
    >
      {/* Icon Area */}
      <div className={`mt-0.5 p-2 rounded-md ${style.bg} ${style.color} shrink-0`}>
        <style.Icon size={16} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 truncate">
            <h3 className="text-sm font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
              {item.title}
            </h3>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${style.badge}`}>
              {item.priority}
            </span>
          </div>
          <div className={`text-xs font-mono font-bold shrink-0 ${style.color}`}>
            Impact: {severityScore}%
          </div>
        </div>

        {/* Description limited to 2 lines to save vertical space */}
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 pr-4">
          {item.description}
        </p>

        {/* Bottom Metadata */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
            {item.type}
          </span>
          <span className="text-[10px] flex items-center gap-1 font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors">
            View Modules <ArrowRight size={10} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}