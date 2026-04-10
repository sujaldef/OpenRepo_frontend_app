import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  Search,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  FolderOpen,
  FileCode,
  Activity,
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

// ============================================================
// MOCK DATA
// ============================================================
const MOCK_DATA = {
  repositoryName: 'openrepo-backend',
  files: [
    {
      path: 'src/components/FormHandler.jsx',
      language: 'jsx',
      content: `import React, { useState } from 'react';\n\nexport default function FormHandler({ onSubmit }) {\n  const [data, setData] = useState({});\n  \n  const handleChange = (e) => {\n    setData({ ...data, [e.target.name]: e.target.value });\n  };\n  \n  const handleSubmit = (e) => {\n    e.preventDefault();\n    // TODO: Add validation here\n    onSubmit(data);\n  };\n  \n  return (\n    <form onSubmit={handleSubmit}>\n      <input \n        name="email" \n        type="email" \n        onChange={handleChange}\n        placeholder="Enter email"\n      />\n      <button type="submit">Submit</button>\n    </form>\n  );\n}`,
    },
    {
      path: 'src/utils/validators.js',
      language: 'javascript',
      content: `export function validateEmail(email) {\n  // Missing proper email validation\n  return email.includes('@');\n}\n\nexport function validatePassword(pwd) {\n  // Password validation too simple\n  return pwd.length > 3;\n}\n\nexport function validateUsername(name) {\n  // No checks for reserved words\n  if (!name) return false;\n  return name.length > 2;\n}\n\nexport function getUserData(userId) {\n  // Security issue: no auth check\n  return fetch(\`/api/users/\${userId}\`);\n}`,
    },
    {
      path: 'services/core_analysis/defect_detection.py',
      language: 'python',
      content: `def analyze_code_defects(file_content):\n    """Analyze code for potential defects"""\n    defects = []\n    lines = file_content.split('\\n')\n    \n    for i, line in enumerate(lines, 1):\n        # Check for common issues\n        if 'TODO' in line:\n            defects.append({\n                'line': i,\n                'severity': 'warning',\n                'message': 'TODO comment found',\n                'code': line.strip()\n            })\n        \n        if 'FIXME' in line:\n            defects.append({\n                'line': i,\n                'severity': 'error',\n                'message': 'FIXME comment found',\n                'code': line.strip()\n            })\n            \n        # Security: hardcoded credentials\n        if 'password' in line.lower() and '=' in line:\n            if any(c in line for c in ['123', 'admin', 'pass']):\n                defects.append({\n                    'line': i,\n                    'severity': 'critical',\n                    'message': 'Potential hardcoded credential',\n                    'code': line.strip()\n                })\n    \n    return defects`,
    },
    {
      path: 'controllers/auth_controller.py',
      language: 'python',
      content: `from fastapi import APIRouter, HTTPException\nfrom models.user_model import User\nimport jwt\n\nrouter = APIRouter(prefix="/api/auth", tags=["auth"])\n\n@router.post("/login")\ndef login(email: str, password: str):\n    # TODO: Implement proper JWT validation\n    user = User.find_by_email(email)\n    if not user:\n        raise HTTPException(status_code=401, detail="Invalid credentials")\n    \n    if not user.verify_password(password):\n        raise HTTPException(status_code=401, detail="Invalid credentials")\n    \n    # FIX: Token expiry too long\n    token = jwt.encode({"user_id": user.id}, "secret")\n    return {"access_token": token}\n\n@router.post("/register")\ndef register(email: str, password: str):\n    # SECURITY: No password strength validation\n    user = User.create(email=email, password=password)\n    return {"id": user.id, "email": user.email}`,
    },
  ],
  issues: [
    {
      file: 'src/components/FormHandler.jsx',
      line: 11,
      severity: 'warning',
      message: 'TODO comment - validation not implemented',
      type: 'todo',
    },
    {
      file: 'src/utils/validators.js',
      line: 1,
      severity: 'error',
      message: 'Weak email validation - missing @ check is insufficient',
      type: 'security',
    },
    {
      file: 'src/utils/validators.js',
      line: 17,
      severity: 'critical',
      message: 'No authentication check before exposing user data',
      type: 'security',
    },
    {
      file: 'services/core_analysis/defect_detection.py',
      line: 25,
      severity: 'error',
      message: 'Hardcoded credential detection pattern too simple',
      type: 'logic',
    },
    {
      file: 'controllers/auth_controller.py',
      line: 7,
      severity: 'warning',
      message: 'TODO - JWT validation logic missing',
      type: 'todo',
    },
    {
      file: 'controllers/auth_controller.py',
      line: 17,
      severity: 'critical',
      message: 'Token expiry too long - security risk',
      type: 'security',
    },
  ],
  predictions: [
    {
      file: 'src/utils/validators.js',
      line: 1,
      message: 'Email validation is too permissive',
      confidence: 92,
      type: 'vulnerability',
    },
    {
      file: 'controllers/auth_controller.py',
      line: 17,
      message: 'JWT implementation may have security flaws',
      confidence: 85,
      type: 'security',
    },
  ],
  recommendations: [
    {
      file: 'src/utils/validators.js',
      message: 'Use regex pattern for proper email validation',
      priority: 1,
      timeEstimate: '15 min',
    },
    {
      file: 'controllers/auth_controller.py',
      message: 'Implement proper JWT expiry (15-30 min) and refresh tokens',
      priority: 1,
      timeEstimate: '1 hour',
    },
    {
      file: 'src/components/FormHandler.jsx',
      message: 'Add client-side form validation before submission',
      priority: 2,
      timeEstimate: '30 min',
    },
  ],
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CodeExplorer() {
  const { repoId } = useParams();
  const { isDarkTheme } = useTheme();
  const [selectedFile, setSelectedFile] = useState(MOCK_DATA.files[0].path);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Accordion State
  const [expandedSections, setExpandedSections] = useState({
    issues: true,
    predictions: true,
    recommendations: true,
  });

  // Resizable Panel States
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(340);
  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);

  // Resize Handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft.current) {
        let newWidth = e.clientX;
        if (newWidth < 200) newWidth = 200;
        if (newWidth > 500) newWidth = 500;
        setLeftWidth(newWidth);
      } else if (isResizingRight.current) {
        let newWidth = document.body.clientWidth - e.clientX;
        if (newWidth < 280) newWidth = 280;
        if (newWidth > 600) newWidth = 600;
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizingLeft.current || isResizingRight.current) {
        isResizingLeft.current = false;
        isResizingRight.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Build file tree structure
  const fileTree = useMemo(() => {
    const tree = {};
    MOCK_DATA.files.forEach((file) => {
      const parts = file.path.split('/');
      let current = tree;
      parts.slice(0, -1).forEach((part) => {
        if (!current[part]) current[part] = {};
        current = current[part];
      });
      current[parts[parts.length - 1]] = file.path;
    });
    return tree;
  }, []);

  // Current file scoped insights
  const currentFile = MOCK_DATA.files.find((f) => f.path === selectedFile);
  const fileIssues = MOCK_DATA.issues.filter((i) => i.file === selectedFile);
  const filePredictions = MOCK_DATA.predictions.filter(
    (p) => p.file === selectedFile,
  );
  const fileRecommendations = MOCK_DATA.recommendations.filter(
    (r) => r.file === selectedFile,
  );

  // Filter files by search
  const filteredFiles = useMemo(() => {
    if (!searchTerm) return MOCK_DATA.files.map((f) => f.path);
    return MOCK_DATA.files
      .filter((f) => f.path.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((f) => f.path);
  }, [searchTerm]);

  const toggleFolder = (folderPath) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Render file tree recursively
  const renderFileTree = (obj, prefix = '') => {
    return Object.entries(obj).map(([name, value]) => {
      const fullPath = prefix ? `${prefix}/${name}` : name;
      const isFile = typeof value === 'string';

      if (isFile) {
        const isHidden = searchTerm && !filteredFiles.includes(value);
        if (isHidden) return null;

        const fileIssueCount = MOCK_DATA.issues.filter(
          (i) => i.file === value,
        ).length;
        const isSelected = selectedFile === value;

        return (
          <div
            key={value}
            className={`tree-item file-item ${isSelected ? 'selected' : ''}`}
            onClick={() => setSelectedFile(value)}
          >
            <FileCode size={14} className="tree-icon file-icon" />
            <span className="tree-name">{name}</span>
            {fileIssueCount > 0 && (
              <span className="file-badge error-badge">{fileIssueCount}</span>
            )}
          </div>
        );
      }

      const isExpanded = expandedFolders[fullPath] !== false; // Default expanded
      return (
        <div key={name} className="folder-node">
          <div
            className="tree-item folder-item"
            onClick={() => toggleFolder(fullPath)}
          >
            {isExpanded ? (
              <ChevronDown size={14} className="chevron" />
            ) : (
              <ChevronRight size={14} className="chevron" />
            )}
            <FolderOpen size={14} className="tree-icon folder-icon" />
            <span className="tree-name">{name}</span>
          </div>
          {isExpanded && (
            <div className="folder-children">
              {renderFileTree(value, fullPath)}
            </div>
          )}
        </div>
      );
    });
  };

  // Simple Regex-based Syntax Highlighting
  const highlightLine = (line) => {
    if (!line) return '';
    let html = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const keywords = [
      'import',
      'export',
      'const',
      'let',
      'var',
      'function',
      'return',
      'if',
      'else',
      'for',
      'while',
      'def',
      'class',
      'from',
      'async',
      'await',
    ];
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      html = html.replace(
        regex,
        `<span class="syntax-keyword">${keyword}</span>`,
      );
    });
    html = html.replace(
      /'[^']*'/g,
      (match) => `<span class="syntax-string">${match}</span>`,
    );
    html = html.replace(
      /"[^"]*"/g,
      (match) => `<span class="syntax-string">${match}</span>`,
    );
    html = html.replace(
      /\/\/.*$/g,
      (match) => `<span class="syntax-comment">${match}</span>`,
    );
    html = html.replace(
      /#.*$/g,
      (match) => `<span class="syntax-comment">${match}</span>`,
    );
    return html;
  };

  const renderCodeLines = () => {
    if (!currentFile) return null;
    const lines = currentFile.content.split('\n');

    // Map annotations by line
    const issueMap = {};
    const predMap = {};
    const recMap = {};

    fileIssues.forEach((i) => {
      if (!issueMap[i.line]) issueMap[i.line] = [];
      issueMap[i.line].push(i);
    });
    filePredictions.forEach((p) => {
      if (!predMap[p.line]) predMap[p.line] = [];
      predMap[p.line].push(p);
    });
    // Note: MOCK_DATA recommendations don't have lines, but we can assume them or leave as document level

    return lines.map((line, idx) => {
      const lineNum = idx + 1;
      const issues = issueMap[lineNum] || [];
      const predictions = predMap[lineNum] || [];

      let highestSeverity = null;
      if (
        issues.some((i) => i.severity === 'critical' || i.severity === 'error')
      )
        highestSeverity = 'error';
      else if (issues.some((i) => i.severity === 'warning'))
        highestSeverity = 'warning';
      else if (predictions.length > 0) highestSeverity = 'prediction';

      return (
        <div
          key={lineNum}
          className={`code-line ${highestSeverity ? `highlight-${highestSeverity}` : ''}`}
        >
          <div className="line-gutter-marker"></div>
          <div className="line-number">{lineNum}</div>
          <div className="line-content">
            <code dangerouslySetInnerHTML={{ __html: highlightLine(line) }} />
            {highestSeverity && (
              <div className="line-tooltip">
                {issues.map((issue, i) => (
                  <div
                    key={`i-${i}`}
                    className={`tooltip tooltip-${issue.severity}`}
                  >
                    <div className="tooltip-header">
                      <AlertTriangle size={12} />
                      <strong>{issue.severity.toUpperCase()}</strong>
                    </div>
                    <p>{issue.message}</p>
                  </div>
                ))}
                {predictions.map((pred, i) => (
                  <div key={`p-${i}`} className="tooltip tooltip-prediction">
                    <div className="tooltip-header">
                      <Lightbulb size={12} />
                      <strong>PREDICTION ({pred.confidence}%)</strong>
                    </div>
                    <p>{pred.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EXPLORER_STYLES }} />

      <div className="ide-container">
        {/* Header */}
        <div className="ide-header">
          <div className="ide-title-bar">
            <h2>Code Explorer</h2>
          </div>
          <div className="repo-badge">
            <FolderOpen size={14} className="repo-icon" />
            <span className="repo-label">Repository:</span>
            <span className="repo-name">{MOCK_DATA.repositoryName}</span>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="ide-workspace">
          {/* Left Panel: File Tree */}
          <div className="ide-panel left-panel" style={{ width: leftWidth }}>
            <div className="panel-header">
              <h3>EXPLORER</h3>
            </div>
            <div className="search-container">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="file-tree">{renderFileTree(fileTree)}</div>
          </div>

          {/* Left Resizer */}
          <div
            className="resizer"
            onMouseDown={() => {
              isResizingLeft.current = true;
              document.body.style.cursor = 'col-resize';
              document.body.style.userSelect = 'none';
            }}
          />

          {/* Center Panel: Code Viewer */}
          <div className="ide-panel center-panel">
            <div className="editor-tabs">
              <div className="editor-tab active">
                <FileCode size={14} className="tab-icon" />
                {currentFile?.path.split('/').pop() || 'Untitled'}
              </div>
              <div className="breadcrumb">
                {currentFile?.path.replace(/\//g, ' / ')}
              </div>
            </div>
            <div className="editor-content">
              {currentFile ? (
                renderCodeLines()
              ) : (
                <div className="empty-editor">Select a file to view code</div>
              )}
            </div>
          </div>

          {/* Right Resizer */}
          <div
            className="resizer"
            onMouseDown={() => {
              isResizingRight.current = true;
              document.body.style.cursor = 'col-resize';
              document.body.style.userSelect = 'none';
            }}
          />

          {/* Right Panel: Accordion Insights */}
          <div className="ide-panel right-panel" style={{ width: rightWidth }}>
            <div className="panel-header header-with-icon">
              <Activity size={14} />
              <h3>INSPECTOR</h3>
            </div>

            <div className="analysis-accordion-container">
              {/* Accordion 1: Issues */}
              <div className="accordion-section">
                <button
                  className="accordion-header"
                  onClick={() => toggleSection('issues')}
                >
                  <div className="accordion-title">
                    {expandedSections.issues ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    Issues
                  </div>
                  <span
                    className={`count-badge ${fileIssues.length > 0 ? 'count-error' : ''}`}
                  >
                    {fileIssues.length}
                  </span>
                </button>
                {expandedSections.issues && (
                  <div className="accordion-content">
                    {fileIssues.length > 0 ? (
                      fileIssues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`insight-card card-${issue.severity}`}
                        >
                          <div className="card-header">
                            <span className={`badge badge-${issue.severity}`}>
                              Line {issue.line}
                            </span>
                            <span className="card-type">{issue.type}</span>
                          </div>
                          <p className="card-message">{issue.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="empty-text">No issues found.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 2: Predictions */}
              <div className="accordion-section">
                <button
                  className="accordion-header"
                  onClick={() => toggleSection('predictions')}
                >
                  <div className="accordion-title">
                    {expandedSections.predictions ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    Predictions
                  </div>
                  <span className="count-badge">{filePredictions.length}</span>
                </button>
                {expandedSections.predictions && (
                  <div className="accordion-content">
                    {filePredictions.length > 0 ? (
                      filePredictions.map((pred, idx) => (
                        <div key={idx} className="insight-card card-prediction">
                          <div className="card-header">
                            <span className="badge badge-prediction">
                              Line {pred.line}
                            </span>
                            <span className="confidence">
                              {pred.confidence}% match
                            </span>
                          </div>
                          <p className="card-message">{pred.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="empty-text">No predictions available.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 3: Recommendations */}
              <div className="accordion-section">
                <button
                  className="accordion-header"
                  onClick={() => toggleSection('recommendations')}
                >
                  <div className="accordion-title">
                    {expandedSections.recommendations ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    Recommendations
                  </div>
                  <span className="count-badge">
                    {fileRecommendations.length}
                  </span>
                </button>
                {expandedSections.recommendations && (
                  <div className="accordion-content">
                    {fileRecommendations.length > 0 ? (
                      fileRecommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="insight-card card-recommendation"
                        >
                          <div className="card-header">
                            <span className="badge badge-recommendation">
                              Priority {rec.priority}
                            </span>
                            <span className="time-est">{rec.timeEstimate}</span>
                          </div>
                          <p className="card-message">{rec.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="empty-text">Code looks optimal.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// CSS-IN-JS STYLES (Native App Design System)
// ============================================================
const EXPLORER_STYLES = `
.ide-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  /* Modern Zinc/Neutral dark palette */
  background-color: #09090b; 
  color: #e4e4e7;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden;
}

/* Header */
.ide-header {
  height: 48px;
  background-color: #09090b;
  border-bottom: 1px solid #27272a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 10;
}

.ide-title-bar h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fafafa;
}

.repo-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  background: #18181b;
  border: 1px solid #27272a;
  padding: 6px 12px;
  border-radius: 6px;
  color: #e4e4e7;
}
.repo-icon { color: #a1a1aa; }
.repo-label { color: #71717a; }
.repo-name { font-weight: 500; color: #fafafa; }

/* Workspace */
.ide-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.ide-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #09090b;
}

/* Resizers */
.resizer {
  width: 1px;
  background: #27272a;
  cursor: col-resize;
  position: relative;
  z-index: 5;
}
.resizer::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0; left: -3px; right: -3px;
}
.resizer:hover, .resizer:active {
  background: #3f3f46;
}

/* Side Panels Shared */
.left-panel, .right-panel {
  background-color: #09090b;
}

.panel-header {
  padding: 14px 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #71717a;
  text-transform: uppercase;
}
.panel-header h3 { margin: 0; }
.header-with-icon { display: flex; align-items: center; gap: 8px; }

/* Left Panel - File Tree */
.search-container {
  display: flex;
  align-items: center;
  background: #18181b;
  margin: 0 16px 16px 16px;
  border-radius: 6px;
  padding: 6px 10px;
  border: 1px solid #27272a;
  transition: border-color 0.15s;
}
.search-container:focus-within {
  border-color: #52525b;
}
.search-icon { color: #71717a; margin-right: 6px; }
.search-container input {
  flex: 1;
  background: transparent;
  border: none;
  color: #e4e4e7;
  font-size: 13px;
  outline: none;
}
.search-container input::placeholder { color: #52525b; }

.file-tree {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 16px 8px;
}
.file-tree::-webkit-scrollbar { width: 8px; }
.file-tree::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }

.tree-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  margin-bottom: 2px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  color: #a1a1aa;
  user-select: none;
  transition: all 0.15s ease;
}
.tree-item:hover { background-color: #18181b; color: #e4e4e7; }
.tree-item.selected { background-color: #18181b; color: #fafafa; font-weight: 500; }

.tree-icon { margin-right: 8px; }
.folder-icon { color: #a1a1aa; }
.file-icon { color: #71717a; margin-left: 4px; }
.chevron { color: #52525b; margin-right: 4px; }
.tree-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.folder-children { padding-left: 16px; margin-top: 2px; }

.file-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  font-weight: 600;
}

/* Center Panel - Editor */
.center-panel {
  flex: 1;
  background-color: #09090b;
}

.editor-tabs {
  display: flex;
  background-color: #09090b;
  border-bottom: 1px solid #27272a;
  height: 40px;
  align-items: center;
}
.editor-tab {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 100%;
  background-color: #18181b;
  border-right: 1px solid #27272a;
  border-top: 2px solid #3b82f6; /* Accent top border */
  color: #e4e4e7;
  font-size: 13px;
  gap: 8px;
  font-weight: 500;
}
.tab-icon { color: #71717a; }
.breadcrumb {
  margin-left: 16px;
  font-size: 12px;
  color: #71717a;
}

.editor-content {
  flex: 1;
  overflow: auto;
  font-family: "JetBrains Mono", "SF Mono", Consolas, Menlo, monospace;
  font-size: 14px;
  line-height: 1.6;
  padding: 16px 0;
}
.editor-content::-webkit-scrollbar { width: 12px; height: 12px; }
.editor-content::-webkit-scrollbar-corner { background: #09090b; }
.editor-content::-webkit-scrollbar-thumb { background: #27272a; border: 3px solid #09090b; border-radius: 6px; }

.empty-editor {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #52525b;
  font-size: 14px;
}

/* Code Highlights & Gutter */
.code-line {
  display: flex;
  position: relative;
  transition: background-color 0.1s;
}
.code-line:hover { background-color: #18181b; }

.line-gutter-marker {
  width: 4px;
  flex-shrink: 0;
  background-color: transparent;
}

/* Semantic Line Highlights */
.highlight-error { background-color: rgba(239, 68, 68, 0.08); }
.highlight-error .line-gutter-marker { background-color: #ef4444; }

.highlight-warning { background-color: rgba(245, 158, 11, 0.06); }
.highlight-warning .line-gutter-marker { background-color: #f59e0b; }

.highlight-prediction { background-color: rgba(139, 92, 246, 0.06); }
.highlight-prediction .line-gutter-marker { background-color: #8b5cf6; }

.line-number {
  width: 44px;
  padding-right: 16px;
  text-align: right;
  color: #52525b;
  user-select: none;
  flex-shrink: 0;
}
.code-line:hover .line-number { color: #a1a1aa; }

.line-content {
  flex: 1;
  padding-right: 16px;
  white-space: pre;
  color: #d4d4d8;
  position: relative;
}

/* Syntax Highlighting (Neutral/Subtle) */
.syntax-keyword { color: #3b82f6; font-weight: 500; }
.syntax-string { color: #10b981; }
.syntax-comment { color: #71717a; font-style: italic; }

/* Tooltips */
.line-tooltip {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 50;
  background: #18181b;
  border: 1px solid #27272a;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  border-radius: 6px;
  padding: 10px 12px;
  min-width: 260px;
  display: none;
  white-space: normal;
  display: none;
  flex-direction: column;
  gap: 8px;
}
.code-line:hover .line-tooltip { display: flex; }

.tooltip { font-family: "Inter", -apple-system, sans-serif; font-size: 12px; line-height: 1.4; }
.tooltip-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.tooltip-header strong { letter-spacing: 0.05em; font-size: 11px; }
.tooltip p { margin: 0; color: #a1a1aa; }

.tooltip-error .tooltip-header { color: #f87171; }
.tooltip-critical .tooltip-header { color: #f87171; }
.tooltip-warning .tooltip-header { color: #fbbf24; }
.tooltip-prediction .tooltip-header { color: #a78bfa; }


/* Right Panel - Accordion */
.analysis-accordion-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.analysis-accordion-container::-webkit-scrollbar { width: 8px; }
.analysis-accordion-container::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }

.accordion-section {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 8px;
  overflow: hidden;
}

.accordion-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: transparent;
  border: none;
  color: #e4e4e7;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.accordion-header:hover { background: rgba(255, 255, 255, 0.03); }
.accordion-title { display: flex; align-items: center; gap: 8px; }
.accordion-title svg { color: #71717a; }

.count-badge {
  background: #27272a;
  color: #a1a1aa;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
.count-error { background: rgba(239, 68, 68, 0.15); color: #f87171; }

.accordion-content {
  padding: 0 12px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid #27272a;
  padding-top: 12px;
}

/* Insight Cards */
.insight-card {
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 6px;
  padding: 12px;
  transition: border-color 0.15s;
}
.insight-card:hover { border-color: #3f3f46; }

.card-error, .card-critical { border-left: 3px solid #ef4444; }
.card-warning { border-left: 3px solid #f59e0b; }
.card-prediction { border-left: 3px solid #8b5cf6; }
.card-recommendation { border-left: 3px solid #10b981; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.badge-error, .badge-critical { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.badge-prediction { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
.badge-recommendation { background: rgba(16, 185, 129, 0.15); color: #34d399; }

.card-type, .confidence, .time-est {
  font-size: 11px;
  color: #71717a;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-message {
  margin: 0;
  font-size: 13px;
  color: #d4d4d8;
  line-height: 1.5;
}

.empty-text {
  margin: 0;
  padding: 8px 0;
  font-size: 12px;
  color: #71717a;
  text-align: center;
}
`;
