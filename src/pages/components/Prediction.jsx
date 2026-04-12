// src/pages/Dashboard/components/RiskHotspots.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  GitCommit,
  LayoutTemplate,
  Code2,
  AlertCircle,
  RefreshCw,
  FileWarning,
  Bug,
} from 'lucide-react';

// Replace with your actual API fetcher
import { fetchPredictions } from '../../api/predictions';

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
        console.error('Failed to load risk hotspots:', e);
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
        className="flex items-center justify-center h-[500px] border rounded-xl transition-colors duration-300"
      >
        <RefreshCw className="animate-spin mr-3" size={18} />
        <span className="text-sm">
          Calculating codebase risk distribution...
        </span>
      </div>
    );
  }

  if (riskyFiles.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-secondary)',
        }}
        className="flex flex-col items-center justify-center h-[500px] border rounded-xl transition-colors duration-300"
      >
        <FileWarning size={36} className="mb-3 opacity-20" />
        <p
          style={{ color: 'var(--text-primary)' }}
          className="text-base font-medium"
        >
          No high-risk hotspots detected.
        </p>
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
  const fileName =
    file.relative_path.split('\\').pop() || file.relative_path.split('/').pop();

  // Threshold checks
  const hasHighComplexity = file.metrics.cyclomatic_complexity > 3;
  const hasHighDuplication = file.metrics.duplication_ratio > 0.05;
  const isLargeFile = file.metrics.loc > 300;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: isTopRisk
          ? 'rgba(244, 63, 94, 0.3)'
          : 'var(--border-color)',
      }}
      className="relative border rounded-xl overflow-hidden transition-colors duration-300"
    >
      {/* Dynamic Top Border for visual      weight based on risk */}
      <div
        className="absolute top-0 left-0 h-1 bg-rose-500"
        style={{ width: `${riskPercent}%`, opacity: file.risk_score }}
      />

      <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-6">
        {/* Left Column: File Info & Score */}
        <div className="md:w-1/3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                style={{
                  color: isTopRisk ? '#fc3f5e' : 'var(--text-secondary)',
                }}
                className="text-xs font-mono font-bold"
              >
                #{index + 1}
              </span>
              <h3
                style={{ color: 'var(--text-primary)' }}
                className="text-base font-bold truncate"
                title={fileName}
              >
                {fileName}
              </h3>
            </div>
            <p
              style={{ color: 'var(--text-secondary)' }}
              className="text-[10px] font-mono break-all mb-4"
            >
              {file.relative_path}
            </p>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex flex-col">
              <span
                style={{ color: 'var(--text-secondary)' }}
                className="text-[10px] uppercase tracking-wider font-bold mb-0.5"
              >
                Total Risk
              </span>
              <span
                style={{ color: isTopRisk ? '#fc3f5e' : '#ff9500' }}
                className="text-3xl font-mono font-bold leading-none"
              >
                {riskPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Metrics & Issues */}
        <div
          style={{
            borderColor: 'var(--border-color)',
            borderTopWidth: '1px',
            borderLeftWidth: '0px',
            borderLeftWidth: 'md:1px',
          }}
          className="md:w-2/3 flex flex-col gap-4 pt-4 md:pt-0 md:pl-6"
        >
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
            <div
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.05)',
                borderColor: 'var(--border-color)',
              }}
              className="rounded-lg border p-3 mt-1 transition-colors duration-300"
            >
              <h4
                style={{ color: 'var(--text-secondary)' }}
                className="text-[10px] uppercase font-bold mb-2 flex items-center gap-1"
              >
                <Bug size={12} /> Detected Issues ({file.issues.length})
              </h4>
              <div className="space-y-2">
                {file.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <AlertCircle
                      size={14}
                      className="text-amber-400 mt-0.5 shrink-0"
                    />
                    <div
                      style={{ color: 'var(--text-primary)' }}
                      className="flex-1"
                    >
                      <span className="text-amber-400/80 mr-2 font-mono text-[10px]">
                        [{issue.type}]
                      </span>
                      {issue.message}
                      {issue.line && (
                        <span
                          style={{ color: 'var(--text-secondary)' }}
                          className="ml-2 text-[10px] font-mono"
                        >
                          Line {issue.line}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{ color: 'var(--text-secondary)' }}
              className="text-xs italic mt-1"
            >
              No direct linter issues. Risk driven by file size and structural
              complexity.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MetricBlock({ label, value, icon: Icon, warning }) {
  return (
    <div
      style={{
        backgroundColor: warning ? 'rgba(244, 63, 94, 0.05)' : 'transparent',
        borderColor: warning ? 'rgba(244, 63, 94, 0.1)' : 'var(--border-color)',
      }}
      className="p-2 rounded-lg border flex flex-col gap-1 transition-colors duration-300"
    >
      <div className="flex items-center gap-1.5">
        <Icon
          size={12}
          style={{ color: warning ? '#fc3f5e' : 'var(--text-secondary)' }}
        />
        <span
          style={{
            color: warning ? 'rgba(252, 63, 94, 0.8)' : 'var(--text-secondary)',
          }}
          className="text-[9px] uppercase tracking-wider font-bold"
        >
          {label}
        </span>
      </div>
      <span
        style={{ color: warning ? '#fc3f5e' : 'var(--text-primary)' }}
        className="text-sm font-mono font-bold"
      >
        {value}
      </span>
    </div>
  );
}
