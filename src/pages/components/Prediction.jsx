// src/pages/Dashboard/components/RiskHotspots.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  AlertTriangle, GitCommit, LayoutTemplate, 
  Code2, AlertCircle, RefreshCw, FileWarning, Bug
} from "lucide-react";

// Replace with your actual API fetcher
import { fetchPredictions } from "../../api/predictions"; 

export default function RiskHotspots() {
  const { repoId } = useParams();
  const [riskyFiles, setRiskyFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!repoId) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetchPredictions(repoId); 
        setRiskyFiles(response.top_risky_files || []);
      } catch (e) {
        console.error("Failed to load risk hotspots:", e);
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
        <span className="text-sm">Calculating codebase risk distribution...</span>
      </div>
    );
  }

  if (riskyFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-zinc-500 bg-[#0a0a0c] border border-white/10 rounded-xl">
        <FileWarning size={36} className="mb-3 opacity-20" />
        <p className="text-base text-zinc-300 font-medium">No high-risk hotspots detected.</p>
        <p className="text-xs mt-1">Your file architecture is stable.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2 space-y-4 custom-scrollbar">
      {riskyFiles.map((file, index) => (
        <FileRiskCard key={file.relative_path} file={file} index={index} />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS                                                             */
/* -------------------------------------------------------------------------- */

function FileRiskCard({ file, index }) {
  const riskPercent = (file.risk_score * 100).toFixed(0);
  const isTopRisk = index === 0;
  
  // Extract filename from the path
  const fileName = file.relative_path.split('\\').pop() || file.relative_path.split('/').pop();
  
  // Threshold checks
  const hasHighComplexity = file.metrics.cyclomatic_complexity > 3;
  const hasHighDuplication = file.metrics.duplication_ratio > 0.05;
  const isLargeFile = file.metrics.loc > 300;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative bg-[#0a0a0c] border rounded-xl overflow-hidden ${
        isTopRisk ? "border-rose-500/30" : "border-white/10"
      }`}
    >
      {/* Dynamic Top Border for visual weight based on risk */}
      <div 
        className="absolute top-0 left-0 h-1 bg-rose-500" 
        style={{ width: `${riskPercent}%`, opacity: file.risk_score }} 
      />

      <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-6">
        
        {/* Left Column: File Info & Score */}
        <div className="md:w-1/3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-mono font-bold ${isTopRisk ? 'text-rose-400' : 'text-zinc-500'}`}>
                #{index + 1}
              </span>
              <h3 className="text-base font-bold text-zinc-200 truncate" title={fileName}>
                {fileName}
              </h3>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 break-all mb-4">
              {file.relative_path}
            </p>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5">
                Total Risk
              </span>
              <span className={`text-3xl font-mono font-bold leading-none ${isTopRisk ? 'text-rose-400' : 'text-orange-400'}`}>
                {riskPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Metrics & Issues */}
        <div className="md:w-2/3 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
          
          {/* Dense Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricBlock 
              label="Lines" 
              value={file.metrics.loc} 
              icon={GitCommit} 
              warning={isLargeFile} 
            />
            <MetricBlock 
              label="Functions" 
              value={file.metrics.function_count} 
              icon={Code2} 
              warning={file.metrics.function_count > 15} 
            />
            <MetricBlock 
              label="Complexity" 
              value={file.metrics.cyclomatic_complexity} 
              icon={LayoutTemplate} 
              warning={hasHighComplexity} 
            />
            <MetricBlock 
              label="Duplication" 
              value={`${(file.metrics.duplication_ratio * 100).toFixed(1)}%`} 
              icon={AlertTriangle} 
              warning={hasHighDuplication} 
            />
          </div>

          {/* Issues List (If any) */}
          {file.issues && file.issues.length > 0 ? (
            <div className="bg-white/5 rounded-lg border border-white/5 p-3 mt-1">
              <h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-2 flex items-center gap-1">
                <Bug size={12} /> Detected Issues ({file.issues.length})
              </h4>
              <div className="space-y-2">
                {file.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1 text-zinc-300">
                      <span className="text-amber-400/80 mr-2 font-mono text-[10px]">[{issue.type}]</span>
                      {issue.message}
                      {issue.line && (
                        <span className="ml-2 text-[10px] font-mono text-zinc-500">Line {issue.line}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 italic mt-1">
              No direct linter issues. Risk driven by file size and structural complexity.
            </div>
          )}
          
        </div>
      </div>
    </motion.div>
  );
}

function MetricBlock({ label, value, icon: Icon, warning }) {
  return (
    <div className={`p-2 rounded-lg border flex flex-col gap-1 ${warning ? 'bg-rose-500/5 border-rose-500/10' : 'bg-transparent border-white/5'}`}>
      <div className="flex items-center gap-1.5">
        <Icon size={12} className={warning ? 'text-rose-400' : 'text-zinc-500'} />
        <span className={`text-[9px] uppercase tracking-wider font-bold ${warning ? 'text-rose-400/80' : 'text-zinc-500'}`}>
          {label}
        </span>
      </div>
      <span className={`text-sm font-mono font-bold ${warning ? 'text-rose-400' : 'text-zinc-200'}`}>
        {value}
      </span>
    </div>
  );
}