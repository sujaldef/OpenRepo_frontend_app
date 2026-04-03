import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, FileCode, AlertTriangle, Info, RefreshCw, 
  Activity, GitCommit, Layout, ShieldAlert, CheckCircle2 
} from "lucide-react";
import { fetchRepoErrors } from "../../api/errors";

// Helper to extract just the file name and the immediate parent folder
const getShortPath = (path) => {
  if (!path) return "Unknown";
  const parts = path.split(/[/\\]/);
  return parts.length >= 2 ? `${parts[parts.length - 2]}/${parts[parts.length - 1]}` : path;
};

export default function Issues() {
  const { repoId } = useParams();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!repoId) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const reports = await fetchRepoErrors(repoId);
        
        // Sort files so the highest risk score is at the top
        const sortedFiles = reports.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
        
        setFiles(sortedFiles);
        if (sortedFiles.length > 0) {
          setSelectedFile(sortedFiles[0]); // Auto-select the riskiest file
        }
      } catch (e) {
        console.error("Failed to load issues:", e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [repoId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500 bg-[#0a0a0a] border border-white/10 rounded-xl">
        <RefreshCw className="animate-spin mr-3" /> Analyzing codebase metrics...
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-[#0a0a0a] border border-white/10 rounded-xl">
        <CheckCircle2 size={48} className="mb-4 text-green-500/50" />
        <p className="text-lg text-gray-300">No data found.</p>
        <p className="text-sm">Run a full analysis from the Overview tab.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)] min-h-[600px]">
      
      {/* LEFT PANE: File Explorer (Ranked by Risk) */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <h3 className="font-bold text-gray-200">Files by Risk</h3>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">{files.length} Files</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {files.map((file) => {
            const isSelected = selectedFile?._id === file._id;
            const riskPercent = ((file.risk_score || 0) * 100).toFixed(1);
            const issueCount = file.issues?.length || 0;
            
            return (
              <button
                key={file._id}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all ${
                  isSelected 
                    ? "bg-purple-500/10 border border-purple-500/30" 
                    : "border border-transparent hover:bg-white/5"
                }`}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileCode size={14} className={isSelected ? "text-purple-400" : "text-gray-500"} />
                    <span className={`text-sm font-mono truncate ${isSelected ? "text-purple-300" : "text-gray-300"}`}>
                      {getShortPath(file.file_path)}
                    </span>
                  </div>
                  <div className="flex gap-3 text-[10px] uppercase font-bold tracking-wider">
                    <span className={file.risk_score > 0.1 ? "text-red-400" : file.risk_score > 0.05 ? "text-yellow-400" : "text-green-400"}>
                      Risk: {riskPercent}%
                    </span>
                    <span className="text-gray-500">Issues: {issueCount}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANE: Deep Dive Details */}
      <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {selectedFile && (
            <motion.div 
              key={selectedFile._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              {/* File Header Details */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">File Analysis</h2>
                    <p className="text-xs text-gray-500 font-mono break-all">{selectedFile.file_path}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      {((selectedFile.risk_score || 0) * 100).toFixed(1)}<span className="text-lg text-gray-500">%</span>
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Risk Score</div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <MetricCard 
                    label="Complexity" 
                    value={selectedFile.metrics?.cyclomatic_complexity || 0} 
                    icon={Activity} 
                    warning={selectedFile.metrics?.cyclomatic_complexity > 10}
                  />
                  <MetricCard 
                    label="Duplication" 
                    value={`${((selectedFile.metrics?.duplication_ratio || 0) * 100).toFixed(1)}%`} 
                    icon={Layout}
                    warning={selectedFile.metrics?.duplication_ratio > 0.05}
                  />
                  <MetricCard 
                    label="Lines of Code" 
                    value={selectedFile.metrics?.loc || 0} 
                    icon={GitCommit}
                  />
                  <MetricCard 
                    label="Unit Tests" 
                    value={selectedFile.metrics?.has_tests ? "Yes" : "None"} 
                    icon={ShieldAlert}
                    warning={!selectedFile.metrics?.has_tests}
                  />
                </div>
              </div>

              {/* Specific Issues List */}
              <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertCircle size={16} /> Detected Issues ({selectedFile.issues?.length || 0})
                </h3>

                {!selectedFile.issues || selectedFile.issues.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <CheckCircle2 size={32} className="mx-auto text-green-500/50 mb-3" />
                    <p className="text-gray-300 font-medium">No direct code issues detected.</p>
                    {selectedFile.risk_score > 0.05 && (
                      <p className="text-xs text-gray-500 mt-1">
                        * Note: This file still carries a risk score due to its structural metrics (complexity/tests).
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedFile.issues.map((issue, idx) => (
                      <div key={idx} className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-start gap-4">
                        <div className={`mt-0.5 ${issue.severity === 'error' ? 'text-red-500' : 'text-yellow-500'}`}>
                          {issue.severity === 'error' ? <AlertCircle size={18} /> : <AlertTriangle size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-medium text-gray-200">{issue.message}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                              issue.severity === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {issue.type}
                            </span>
                          </div>
                          {issue.line && (
                            <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded mt-2 inline-block">
                              Line {issue.line}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Mini-component for the file metrics grid
function MetricCard({ label, value, icon: Icon, warning = false }) {
  return (
    <div className={`p-3 rounded-lg border ${warning ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/5'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={warning ? 'text-red-400' : 'text-gray-500'} />
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">{label}</span>
      </div>
      <div className={`text-xl font-bold font-mono ${warning ? 'text-red-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}