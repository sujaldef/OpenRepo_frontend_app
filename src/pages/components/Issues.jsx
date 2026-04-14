import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  FileCode,
  AlertTriangle,
  Info,
  RefreshCw,
  Activity,
  GitCommit,
  Layout,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { fetchRepoErrors } from '../../api/errors';

// Helper to extract just the file name and the immediate parent folder
const getShortPath = (path) => {
  if (!path) return 'Unknown';
  const parts = path.split(/[/\\]/);
  return parts.length >= 2
    ? `${parts[parts.length - 2]}/${parts[parts.length - 1]}`
    : path;
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
        const sortedFiles = reports.sort(
          (a, b) => (b.risk_score || 0) - (a.risk_score || 0),
        );

        setFiles(sortedFiles);
        
        // Auto-select the first filtered file (issues found or risk > 35%)
        const filtered = sortedFiles.filter((file) => {
          const riskPercent = (file.risk_score || 0) * 100;
          const issueCount = file.issues?.length || 0;
          return issueCount > 0 || riskPercent > 35;
        });
        
        if (filtered.length > 0) {
          setSelectedFile(filtered[0]);
        }
      } catch (e) {
        console.error('Failed to load issues:', e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [repoId]);

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-secondary)',
        }}
        className="flex items-center justify-center h-96 border rounded-xl transition-colors duration-300"
      >
        <RefreshCw className="animate-spin mr-3" /> Analyzing codebase
        metrics...
      </div>
    );
  }

  const filteredFiles = files.filter((file) => {
    const riskPercent = (file.risk_score || 0) * 100;
    const issueCount = file.issues?.length || 0;
    return issueCount > 0 || riskPercent > 35;
  });

  if (files.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-secondary)',
        }}
        className="flex flex-col items-center justify-center h-96 border rounded-xl transition-colors duration-300"
      >
        <CheckCircle2 size={48} className="mb-4 text-green-500/50" />
        <p style={{ color: 'var(--text-primary)' }} className="text-lg">
          No data found.
        </p>
        <p className="text-sm">Run a full analysis from the Overview tab.</p>
      </div>
    );
  }

  if (filteredFiles.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-secondary)',
        }}
        className="flex flex-col items-center justify-center h-96 border rounded-xl transition-colors duration-300"
      >
        <CheckCircle2 size={48} className="mb-4 text-green-500/50" />
        <p style={{ color: 'var(--text-primary)' }} className="text-lg">
          No files with issues or risk greater 35%.
        </p>
        <p className="text-sm">All analyzed files are within acceptable thresholds.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)] min-h-[600px]">
      {/* LEFT PANE: File Explorer (Ranked by  Risk) */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
        className="border rounded-xl overflow-hidden flex flex-col transition-colors duration-300"
      >
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderBottomColor: 'var(--border-color)',
          }}
          className="p-4 border-b flex justify-between items-center transition-colors duration-300"
        >
          <h3 style={{ color: 'var(--text-primary)' }} className="font-bold">
            Files by Risk
          </h3>
          <span
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
            }}
            className="text-xs border px-2 py-1 rounded transition-colors duration-300"
          >
            {filteredFiles.length} Files
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredFiles.map((file) => {
            const isSelected = selectedFile?._id === file._id;
            const riskPercent = ((file.risk_score || 0) * 100).toFixed(1);
            const issueCount = file.issues?.length || 0;

            return (
              <button
                key={file._id}
                onClick={() => setSelectedFile(file)}
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(139, 92, 246, 0.1)'
                    : 'transparent',
                  borderColor: isSelected
                    ? 'rgba(139, 92, 246, 0.3)'
                    : 'transparent',
                }}
                className="w-full text-left p-3 rounded-lg flex items-center justify-between transition-all border hover:bg-white/5"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileCode
                      size={14}
                      style={{
                        color: isSelected ? '#8b5cf6' : 'var(--text-secondary)',
                      }}
                    />
                    <span
                      style={{
                        color: isSelected ? '#a78bfa' : 'var(--text-primary)',
                      }}
                      className="text-sm font-mono truncate transition-colors duration-300"
                    >
                      {getShortPath(file.file_path)}
                    </span>
                  </div>
                  <div className="flex gap-3 text-[10px] uppercase font-bold tracking-wider">
                    <span
                      style={{
                        color:
                          file.risk_score > 0.1
                            ? '#fc3f5e'
                            : file.risk_score > 0.05
                              ? '#ff9500'
                              : '#22c55e',
                      }}
                      className="transition-colors duration-300"
                    >
                      Risk: {riskPercent}%
                    </span>
                    <span
                      style={{ color: 'var(--text-secondary)' }}
                      className="transition-colors duration-300"
                    >
                      Issues: {issueCount}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANE: Deep Dive Details */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
        className="lg:col-span-2 border rounded-xl overflow-hidden flex flex-col transition-colors duration-300"
      >
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
              <div
                style={{
                  borderBottomColor: 'var(--border-color)',
                  backgroundImage: `linear-gradient(to bottom, rgba(139, 92, 246, 0.05), transparent)`,
                }}
                className="p-6 border-b transition-colors duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2
                      style={{ color: 'var(--text-primary)' }}
                      className="text-xl font-bold mb-1"
                    >
                      File Analysis
                    </h2>
                    <p
                      style={{ color: 'var(--text-secondary)' }}
                      className="text-xs font-mono break-all"
                    >
                      {selectedFile.file_path}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      style={{ color: 'var(--text-primary)' }}
                      className="text-3xl font-bold"
                    >
                      {((selectedFile.risk_score || 0) * 100).toFixed(1)}
                      <span
                        style={{ color: 'var(--text-secondary)' }}
                        className="text-lg"
                      >
                        %
                      </span>
                    </div>
                    <div
                      style={{ color: 'var(--text-secondary)' }}
                      className="text-[10px] uppercase tracking-widest"
                    >
                      Risk Score
                    </div>
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
                    value={selectedFile.metrics?.has_tests ? 'Yes' : 'None'}
                    icon={ShieldAlert}
                    warning={!selectedFile.metrics?.has_tests}
                  />
                </div>
              </div>

              {/* Specific Issues List */}
              <div
                style={{
                }}
                className="flex-1 overflow-y-auto p-6 transition-colors duration-300"
              >
                <h3
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
                >
                  <AlertCircle size={16} /> Detected Issues (
                  {selectedFile.issues?.length || 0})
                </h3>

                {!selectedFile.issues || selectedFile.issues.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-color)',
                    }}
                    className="text-center py-8 border border-dashed rounded-xl transition-colors duration-300"
                  >
                    <CheckCircle2
                      size={32}
                      className="mx-auto text-green-500/50 mb-3"
                    />
                    <p
                      style={{ color: 'var(--text-primary)' }}
                      className="font-medium"
                    >
                      No direct code issues detected.
                    </p>
                    {selectedFile.risk_score > 0.05 && (
                      <p
                        style={{ color: 'var(--text-secondary)' }}
                        className="text-xs mt-1"
                      >
                        * Note: This file still carries a risk score due to its
                        structural metrics (complexity/tests).
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedFile.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-color)',
                        }}
                        className="border p-4 rounded-xl flex items-start gap-4 transition-colors duration-300"
                      >
                        <div
                          style={{
                            color:
                              issue.severity === 'error'
                                ? '#ef4444'
                                : '#eab308',
                          }}
                        >
                          {issue.severity === 'error' ? (
                            <AlertCircle size={18} />
                          ) : (
                            <AlertTriangle size={18} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span
                              style={{ color: 'var(--text-primary)' }}
                              className="text-sm font-medium"
                            >
                              {issue.message}
                            </span>
                            <span
                              style={{
                                backgroundColor:
                                  issue.severity === 'error'
                                    ? 'rgba(239, 68, 68, 0.2)'
                                    : 'rgba(234, 179, 8, 0.2)',
                                color:
                                  issue.severity === 'error'
                                    ? '#ef4444'
                                    : '#eab308',
                              }}
                              className="text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider"
                            >
                              {issue.type}
                            </span>
                          </div>
                          {issue.line && (
                            <span
                              style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-secondary)',
                              }}
                              className="text-xs font-mono border px-2 py-0.5 rounded mt-2 inline-block"
                            >
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
    <div
      style={{
        backgroundColor: warning
          ? 'rgba(239, 68, 68, 0.1)'
          : 'var(--bg-elevated)',
        borderColor: warning ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-color)',
      }}
      className="p-3 rounded-lg border transition-colors duration-300"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon
          size={14}
          style={{ color: warning ? '#ef4444' : 'var(--text-secondary)' }}
        />
        <span
          style={{ color: 'var(--text-secondary)' }}
          className="text-[10px] uppercase font-bold tracking-wider"
        >
          {label}
        </span>
      </div>
      <div
        style={{ color: warning ? '#ef4444' : 'var(--text-primary)' }}
        className="text-xl font-bold font-mono transition-colors duration-300"
      >
        {value}
      </div>
    </div>
  );
}
