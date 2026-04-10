// src/pages/Dashboard/components/Recommendations.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  Zap,
  ShieldAlert,
  GitPullRequest,
  Activity,
  CheckCircle2,
  Layers,
  RefreshCw,
  Code2,
  ArrowRight,
} from 'lucide-react';

// Replace with your actual API fetcher
import { fetchRepoRecommendations } from '../../api/recommendations';
import { useTheme } from '../../contexts/ThemeContext';

export default function Recommendations() {
  const { repoId } = useParams();
  const { isDarkTheme } = useTheme();
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
        console.error('Failed to load recommendations:', e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [repoId]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center h-[500px] rounded-xl transition-colors duration-300 ${
          isDarkTheme
            ? 'text-zinc-500 bg-[#0a0a0c] border border-white/10'
            : 'text-slate-400 bg-slate-50 border border-slate-200'
        }`}
      >
        <RefreshCw className="animate-spin mr-3" size={18} />
        <span className="text-sm">Analyzing repository architecture...</span>
      </div>
    );
  }

  if (!data || !data.items || data.items.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-[500px] rounded-xl transition-colors duration-300 ${
          isDarkTheme
            ? 'text-zinc-500 bg-[#0a0a0c] border border-white/10'
            : 'text-slate-400 bg-slate-50 border border-slate-200'
        }`}
      >
        <CheckCircle2
          size={36}
          className={`mb-3 ${isDarkTheme ? 'text-emerald-500/50' : 'text-emerald-400'}`}
        />
        <p
          className={`text-base font-medium ${isDarkTheme ? 'text-zinc-300' : 'text-slate-700'}`}
        >
          No major architectural issues detected.
        </p>
        <p
          className={`text-xs mt-1 ${isDarkTheme ? 'text-zinc-500' : 'text-slate-500'}`}
        >
          Your codebase maintainability is currently optimal.
        </p>
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
          percentageValue={parseFloat(repoRiskPercent)}
          description="Technical debt & security."
          icon={Activity}
          isDarkTheme={isDarkTheme}
        />
        <MetricCard
          label="Structural Debt"
          value={`${structurePercent}%`}
          percentageValue={parseFloat(structurePercent)}
          description="Complexity & duplication."
          icon={Layers}
          isDarkTheme={isDarkTheme}
        />
      </div>

      {/* BOTTOM SECTION: Dense AI Action Items */}
      <div
        className={`flex-1 rounded-xl flex flex-col min-h-0 transition-colors duration-300 ${
          isDarkTheme
            ? 'bg-[#0a0a0c] border border-white/10'
            : 'bg-white border border-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 transition-colors duration-300 ${
            isDarkTheme
              ? 'border-b border-white/10 bg-white/5'
              : 'border-b border-slate-200 bg-slate-50'
          }`}
        >
          <h2
            className={`text-sm font-bold flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}
          >
            <Lightbulb size={16} className="text-yellow-400" />
            Strategic Recommendations
          </h2>
          <span
            className={`text-[10px] font-mono font-medium px-2 py-1 rounded transition-colors duration-300 ${
              isDarkTheme
                ? 'text-zinc-300 bg-zinc-800 border border-white/10'
                : 'text-slate-700 bg-slate-100 border border-slate-300'
            }`}
          >
            {data.items.length} Items
          </span>
        </div>

        {/* Scrollable List Area */}
        <div
          className={`flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar transition-colors duration-300 ${isDarkTheme ? '' : ''}`}
        >
          <AnimatePresence>
            {[...data.items]
              .sort((a, b) => {
                const ranks = { High: 3, Medium: 2, Low: 1 };
                return (ranks[b.priority] || 0) - (ranks[a.priority] || 0);
              })
              .map((item, i) => (
                <RecommendationRow
                  key={i}
                  item={item}
                  index={i}
                  isDarkTheme={isDarkTheme}
                />
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

function MetricCard({
  label,
  value,
  percentageValue,
  description,
  icon: Icon,
  isDarkTheme,
}) {
  // Determine color based on percentage value thresholds
  let valueColorStyle = { color: 'var(--color-success)' }; // Default green (0-20%)
  if (percentageValue > 35) {
    valueColorStyle = { color: 'var(--color-danger)' }; // Red (>35%)
  } else if (percentageValue > 20) {
    valueColorStyle = { color: 'var(--color-warning)' }; // Yellow (20-35%)
  }

  // Use accent color from CSS with reduced opacity for background
  const bgStyle = {
    backgroundColor: 'rgba(var(--accent-color-rgb), 0.05)',
    borderColor: 'rgba(var(--accent-color-rgb), 0.1)',
  };

  return (
    <div
      className={`p-4 rounded-xl border flex items-center gap-4 transition-colors duration-300`}
      style={bgStyle}
    >
      <div
        className="p-3 rounded-lg"
        style={{
          backgroundColor: 'rgba(var(--accent-color-rgb), 0.1)',
        }}
      >
        <Icon size={20} style={{ color: 'var(--accent-color)' }} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-baseline mb-0.5">
          <span
            className={`text-[11px] uppercase tracking-wider font-bold ${isDarkTheme ? 'text-zinc-400' : 'text-slate-500'}`}
          >
            {label}
          </span>
          <span className="text-xl font-bold font-mono" style={valueColorStyle}>
            {value}
          </span>
        </div>
        <p
          className={`text-[11px] ${isDarkTheme ? 'text-zinc-500' : 'text-slate-600'}`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function RecommendationRow({ item, index, isDarkTheme }) {
  const getStyleParams = (priority, type) => {
    let Icon = GitPullRequest;
    if (type === 'Security') Icon = ShieldAlert;
    if (type === 'Performance') Icon = Zap;
    if (type === 'Maintainability') Icon = Code2;

    if (priority === 'High') {
      return {
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        badge: 'bg-rose-500/20 text-rose-300',
        Icon,
      };
    }
    if (priority === 'Medium') {
      return {
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        badge: 'bg-amber-500/20 text-amber-300',
        Icon,
      };
    }
    return {
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      badge: 'bg-blue-500/20 text-blue-300',
      Icon,
    };
  };

  const style = getStyleParams(item.priority, item.type);
  const severityScore = ((item.score || 0) * 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
        isDarkTheme
          ? `${style.border} bg-[#0f0f11] hover:bg-white/5`
          : `${style.border} bg-slate-50 hover:bg-slate-100`
      }`}
    >
      {/* Icon Area */}
      <div
        className={`mt-0.5 p-2 rounded-md ${style.bg} ${style.color} shrink-0`}
      >
        <style.Icon size={16} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 truncate">
            <h3
              className={`text-sm font-bold truncate transition-colors ${isDarkTheme ? 'text-zinc-200 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-900'}`}
            >
              {item.title}
            </h3>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${style.badge}`}
            >
              {item.priority}
            </span>
          </div>
          <div
            className={`text-xs font-mono font-bold shrink-0 ${style.color}`}
          >
            Impact: {severityScore}%
          </div>
        </div>

        {/* Description limited to 2 lines to save vertical space */}
        <p
          className={`text-xs leading-relaxed line-clamp-2 pr-4 ${isDarkTheme ? 'text-zinc-400' : 'text-slate-600'}`}
        >
          {item.description}
        </p>

        {/* Bottom Metadata */}
        <div
          className={`flex items-center justify-between mt-2 pt-2 transition-colors ${
            isDarkTheme
              ? 'border-t border-white/5'
              : 'border-t border-slate-200'
          }`}
        >
          <span
            className={`text-[10px] uppercase tracking-wider font-mono ${isDarkTheme ? 'text-zinc-500' : 'text-slate-500'}`}
          >
            {item.type}
          </span>
          <span
            className={`text-[10px] flex items-center gap-1 font-semibold transition-colors ${
              isDarkTheme
                ? 'text-zinc-500 group-hover:text-zinc-300'
                : 'text-slate-500 group-hover:text-slate-700'
            }`}
          >
            View Modules <ArrowRight size={10} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
