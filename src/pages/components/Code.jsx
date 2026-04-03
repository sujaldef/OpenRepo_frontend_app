import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight, ChevronDown, FileCode, Folder, FolderOpen,
  AlertTriangle, Info, XCircle, CheckCircle2,
  FileJson, FileText, Terminal, LayoutTemplate, 
  Loader2, ShieldAlert, GripVertical, Search, Play, X
} from 'lucide-react'

// --- CONFIGURATION ---
const IGNORED_FOLDERS = ['.git', 'node_modules', 'dist', 'build', '.next', '.ds_store']

// --- THEME CONSTANTS (Dashboard Aesthetic) ---
const THEME = {
  bg: 'bg-[#09090b]',
  panelBg: 'bg-[#0c0c0e]', // Slightly lighter for contrast
  border: 'border-zinc-800',
  text: 'text-zinc-400',
  textActive: 'text-zinc-100',
  accent: 'text-indigo-400',
  accentBg: 'bg-indigo-500/10',
  hover: 'hover:bg-zinc-800/50',
  selection: 'selection:bg-indigo-500/30 selection:text-white',
  scroll: 'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700'
}

// --- HELPERS ---
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  switch (ext) {
    case 'js': case 'jsx': return { icon: FileCode, color: 'text-yellow-400' }
    case 'ts': case 'tsx': return { icon: FileCode, color: 'text-blue-400' }
    case 'css': case 'scss': return { icon: FileCode, color: 'text-sky-400' }
    case 'html': return { icon: FileCode, color: 'text-orange-400' }
    case 'json': return { icon: FileJson, color: 'text-amber-300' }
    case 'md': return { icon: FileText, color: 'text-purple-400' }
    default: return { icon: FileText, color: 'text-zinc-500' }
  }
}

const analyzeCode = (code, fileName) => {
  const lines = code.split('\n')
  const issues = []
  
  lines.forEach((line, index) => {
    const i = index + 1
    const text = line.trim()

    if (text.includes('console.log')) issues.push({ line: i, severity: 'info', type: 'Log', message: 'Console statement detected.' })
    if (text.includes('TODO') || text.includes('FIXME')) issues.push({ line: i, severity: 'warning', type: 'Tech Debt', message: 'Pending task annotation found.' })
    if (text.match(/password|secret|key|token/i) && !text.includes('import')) issues.push({ line: i, severity: 'error', type: 'Security', message: 'Potential hardcoded secret.' })
    if (text.length > 120) issues.push({ line: i, severity: 'info', type: 'Style', message: 'Line exceeds 120 chars.' })
    if (text.includes('any') && fileName.match(/\.tsx?$/)) issues.push({ line: i, severity: 'warning', type: 'Type Safety', message: 'Avoid using "any" type.' })
  })

  return issues
}

export default function CodeEditorPage() {
  // Layout State
  const [leftWidth, setLeftWidth] = useState(260)
  const [rightWidth, setRightWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(null)

  // File State
  const [fileTree, setFileTree] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [issues, setIssues] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState({})
  const [hoveredIssue, setHoveredIssue] = useState(null)

  // --- RESIZING LOGIC ---
  const startResizing = useCallback((direction) => (e) => {
    e.preventDefault()
    setIsResizing(direction)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return
      if (isResizing === 'left') setLeftWidth(Math.max(200, Math.min(e.clientX, 500)))
      else if (isResizing === 'right') setRightWidth(Math.max(250, Math.min(window.innerWidth - e.clientX, 600)))
    }
    const handleMouseUp = () => setIsResizing(null)

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // --- FILE SYSTEM ---
  const handleOpenFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker()
      const tree = await buildFileTree(dirHandle)
      setFileTree(tree)
      setExpandedFolders({ [tree.name]: true })
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err)
    }
  }

  const buildFileTree = async (dirHandle) => {
    const tree = { name: dirHandle.name, type: 'folder', handle: dirHandle, children: [] }
    for await (const entry of dirHandle.values()) {
      if (IGNORED_FOLDERS.includes(entry.name)) continue
      if (entry.kind === 'directory') tree.children.push(await buildFileTree(entry))
      else tree.children.push({ name: entry.name, type: 'file', handle: entry })
    }
    tree.children.sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1)
    return tree
  }

  const handleFileClick = async (fileNode) => {
    if (fileNode.type !== 'file') return
    setSelectedFile(fileNode)
    setIsAnalyzing(true)
    setFileContent('')
    setIssues([])
    try {
      const file = await fileNode.handle.getFile()
      const text = await file.text()
      setFileContent(text)
      setTimeout(() => {
        setIssues(analyzeCode(text, fileNode.name))
        setIsAnalyzing(false)
      }, 600) // Fake delay for "scanning" effect
    } catch (err) { console.error(err); setIsAnalyzing(false) }
  }

  const toggleFolder = (name) => setExpandedFolders(prev => ({ ...prev, [name]: !prev[name] }))
  const scrollToLine = (line) => document.getElementById(`line-${line}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden ${THEME.bg} ${THEME.text} ${THEME.selection}`}>
      
      {/* BACKGROUND PATTERN */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23525252\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>

      {/* HEADER TOOLBAR */}
      <div className={`relative z-10 h-14 border-b ${THEME.border} bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0`}>
        <div className="flex items-center gap-4">
           {/* Logo / Title Area */}
           <div className="flex items-center gap-3 pr-4 border-r border-zinc-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                <Terminal size={16} className="text-indigo-400" />
              </div>
              <span className="font-semibold text-zinc-100 tracking-tight">Code Audit</span>
           </div>

           {/* Current File Breadcrumb */}
           <div className="flex items-center gap-2 text-xs">
              <span className="opacity-50">{fileTree?.name || 'No Project'}</span>
              <ChevronRight size={12} className="opacity-30" />
              {selectedFile ? (
                <div className="flex items-center gap-2 text-zinc-200 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                   {React.createElement(getFileIcon(selectedFile.name).icon, { size: 12, className: getFileIcon(selectedFile.name).color })}
                   <span>{selectedFile.name}</span>
                </div>
              ) : (
                <span className="opacity-50 italic">Select a file...</span>
              )}
           </div>
        </div>

        <div className="flex items-center gap-3">
           {!fileTree && (
             <button 
               onClick={handleOpenFolder}
               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all shadow-lg shadow-indigo-900/20"
             >
               <FolderOpen size={14} /> Open Project
             </button>
           )}
           {fileTree && (
             <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               Live Analysis
             </div>
           )}
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* --- LEFT: FILE EXPLORER --- */}
        <div style={{ width: leftWidth }} className={`flex flex-col border-r ${THEME.border} bg-[#09090b]/50 backdrop-blur-sm`}>
           <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Explorer</span>
              <Search size={14} className="text-zinc-600 hover:text-zinc-300 cursor-pointer transition-colors" />
           </div>
           
           <div className={`flex-1 overflow-y-auto p-2 ${THEME.scroll}`}>
             {fileTree ? (
               <FileTreeNode 
                 node={fileTree} 
                 level={0} 
                 expandedFolders={expandedFolders} 
                 toggleFolder={toggleFolder} 
                 selectedFile={selectedFile} 
                 onFileClick={handleFileClick} 
               />
             ) : (
               <div className="flex flex-col items-center justify-center h-48 text-zinc-600 gap-2">
                 <Folder size={24} className="opacity-20" />
                 <span className="text-xs">No project loaded</span>
               </div>
             )}
           </div>
        </div>

        {/* RESIZER LEFT */}
        <div onMouseDown={startResizing('left')} className="w-1 hover:bg-indigo-500 cursor-col-resize z-20 flex items-center justify-center group transition-colors"><GripVertical size={8} className="text-white opacity-0 group-hover:opacity-100"/></div>

        {/* --- CENTER: CODE EDITOR --- */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e] relative">
           
           {/* Editor Tabs (Visual Only) */}
           <div className={`h-9 flex items-center border-b ${THEME.border} bg-[#09090b]`}>
              {selectedFile && (
                <div className="h-full px-4 flex items-center gap-2 bg-[#0c0c0e] border-r border-zinc-800 border-t-2 border-t-indigo-500 text-xs text-zinc-200">
                  {React.createElement(getFileIcon(selectedFile.name).icon, { size: 12, className: getFileIcon(selectedFile.name).color })}
                  {selectedFile.name}
                  <button onClick={() => setSelectedFile(null)} className="ml-2 text-zinc-500 hover:text-white"><X size={12} /></button>
                </div>
              )}
           </div>

           {/* Code Area */}
           <div className={`flex-1 relative overflow-hidden ${THEME.scroll}`}>
              {selectedFile ? (
                <div className="absolute inset-0 overflow-auto">
                   {isAnalyzing ? (
                     <div className="flex flex-col items-center justify-center h-full gap-4">
                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                        <p className="text-zinc-500 text-sm animate-pulse">Running static analysis engine...</p>
                     </div>
                   ) : (
                     <CodeRenderer 
                       code={fileContent} 
                       issues={issues} 
                       onHoverIssue={setHoveredIssue} 
                     />
                   )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                   <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-xl">
                      <LayoutTemplate size={32} className="opacity-50" />
                   </div>
                   <p className="text-sm">Select a file from the explorer to audit</p>
                </div>
              )}

              {/* Hover Tooltip */}
              <AnimatePresence>
                {hoveredIssue && <IssueTooltip issue={hoveredIssue} />}
              </AnimatePresence>
           </div>
        </div>

        {/* RESIZER RIGHT */}
        <div onMouseDown={startResizing('right')} className="w-1 hover:bg-indigo-500 cursor-col-resize z-20 flex items-center justify-center group transition-colors"><GripVertical size={8} className="text-white opacity-0 group-hover:opacity-100"/></div>

        {/* --- RIGHT: ISSUES PANEL --- */}
        <div style={{ width: rightWidth }} className={`flex flex-col border-l ${THEME.border} bg-[#09090b]/50 backdrop-blur-sm`}>
           <div className="h-12 border-b border-zinc-800/50 flex items-center justify-between px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Analysis Results</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${issues.length > 0 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                {issues.length} ISSUES
              </span>
           </div>

           <div className={`flex-1 overflow-y-auto p-3 ${THEME.scroll}`}>
              {selectedFile && !isAnalyzing ? (
                 issues.length > 0 ? (
                   <div className="space-y-3">
                     {issues.map((issue, i) => (
                       <IssueCard key={i} issue={issue} onClick={() => scrollToLine(issue.line)} />
                     ))}
                   </div>
                 ) : (
                   <div className="h-64 flex flex-col items-center justify-center text-zinc-600">
                     <CheckCircle2 size={32} className="text-emerald-500/50 mb-3" />
                     <p className="text-xs">No issues detected. Good job!</p>
                   </div>
                 )
              ) : (
                 <div className="text-center p-8 text-xs text-zinc-600">
                    Analysis results will appear here
                 </div>
              )}
           </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="h-6 bg-[#09090b] border-t border-zinc-800 flex items-center justify-between px-4 text-[10px] text-zinc-500 select-none z-10">
         <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"><ShieldAlert size={10}/> Security Guard Active</span>
            {selectedFile && <span>UTF-8 • {fileContent.split('\n').length} Lines</span>}
         </div>
         <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Connected to Local Environment</span>
         </div>
      </div>
      
      {/* GLOBAL RESIZE OVERLAY */}
      {isResizing && <div className="fixed inset-0 z-[100] cursor-col-resize" />}
    </div>
  )
}

// -----------------------------------------------------------------------------
// SUB COMPONENTS
// -----------------------------------------------------------------------------

function FileTreeNode({ node, level, expandedFolders, toggleFolder, selectedFile, onFileClick }) {
  const isFolder = node.type === 'folder'
  const isExpanded = expandedFolders[node.name]
  const isSelected = selectedFile?.name === node.name
  const { icon: FileIcon, color: fileColor } = isFolder ? { icon: null, color: '' } : getFileIcon(node.name)

  return (
    <div className="select-none">
      <div 
        onClick={(e) => { e.stopPropagation(); isFolder ? toggleFolder(node.name) : onFileClick(node) }}
        className={`
          flex items-center gap-2 py-1.5 px-2 mx-1 rounded-md cursor-pointer transition-all duration-200 border border-transparent
          ${isSelected 
            ? 'bg-indigo-500/10 text-white border-indigo-500/20' 
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          }
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <span className="shrink-0 opacity-70">
          {isFolder && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </span>
        
        {isFolder ? (
           <span className={`${isExpanded ? 'text-zinc-200' : 'text-zinc-500'}`}>
             {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
           </span>
        ) : (
           <FileIcon size={14} className={fileColor} />
        )}
        
        <span className="truncate text-xs font-medium">{node.name}</span>
      </div>
      
      {isFolder && isExpanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
           {node.children.map((child, i) => (
             <FileTreeNode 
               key={i} node={child} level={level + 1} 
               expandedFolders={expandedFolders} toggleFolder={toggleFolder} 
               selectedFile={selectedFile} onFileClick={onFileClick} 
             />
           ))}
        </motion.div>
      )}
    </div>
  )
}

function CodeRenderer({ code, issues, onHoverIssue }) {
  const lines = code.split('\n')
  const issuesMap = issues.reduce((acc, issue) => ({ ...acc, [issue.line]: issue }), {})

  const keywords = ['import', 'export', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'from']
  const types = ['string', 'number', 'boolean', 'any', 'void', 'React', 'useState', 'useEffect']

  const highlight = (text) => {
    return text.split(/(\s+|[(){}[\].,;])/g).map((word, i) => {
      if (keywords.includes(word)) return <span key={i} className="text-purple-400 font-bold">{word}</span>
      if (types.includes(word)) return <span key={i} className="text-yellow-300">{word}</span>
      if (word.match(/^['"`].*['"`]$/)) return <span key={i} className="text-emerald-400">{word}</span>
      if (word.match(/[(){}]/)) return <span key={i} className="text-blue-300">{word}</span>
      return <span key={i} className="text-zinc-300">{word}</span>
    })
  }

  return (
    <div className="font-mono text-[13px] leading-6 min-w-max p-6">
      {lines.map((line, idx) => {
        const lineNum = idx + 1
        const issue = issuesMap[lineNum]
        
        // Dynamic styling based on severity
        const lineStyle = issue 
          ? issue.severity === 'error' ? 'bg-red-500/10' : issue.severity === 'warning' ? 'bg-amber-500/10' : 'bg-blue-500/10'
          : ''
          
        const underline = issue
          ? issue.severity === 'error' ? 'decoration-red-500/50' : issue.severity === 'warning' ? 'decoration-amber-500/50' : 'decoration-blue-500/50'
          : ''

        return (
          <div id={`line-${lineNum}`} key={idx} className={`flex group hover:bg-zinc-800/30 transition-colors ${lineStyle}`}>
            <div className="w-10 text-right pr-4 select-none text-xs text-zinc-700 font-medium group-hover:text-zinc-500">{lineNum}</div>
            <div 
               className={`whitespace-pre flex-1 pl-2 ${issue ? `underline decoration-wavy underline-offset-4 ${underline}` : ''}`}
               onMouseEnter={() => issue && onHoverIssue(issue)}
               onMouseLeave={() => onHoverIssue(null)}
            >
              {highlight(line || ' ')}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IssueCard({ issue, onClick }) {
    const styles = {
        error: { icon: XCircle, color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5 hover:bg-red-500/10' },
        warning: { icon: AlertTriangle, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5 hover:bg-amber-500/10' },
        info: { icon: Info, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5 hover:bg-blue-500/10' }
    }[issue.severity]

    const Icon = styles.icon

    return (
        <motion.div 
           initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
           onClick={onClick} 
           className={`p-3 rounded-lg border ${styles.border} ${styles.bg} cursor-pointer group transition-all`}
        >
            <div className="flex items-start gap-3">
                <Icon size={16} className={`${styles.color} mt-0.5 shrink-0`} />
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.color}`}>{issue.type}</span>
                        <span className="text-[10px] text-zinc-600 font-mono">Ln {issue.line}</span>
                    </div>
                    <p className="text-xs text-zinc-300 font-medium leading-relaxed">{issue.message}</p>
                </div>
            </div>
        </motion.div>
    )
}

function IssueTooltip({ issue }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-12 right-8 max-w-sm w-full bg-[#09090b] border border-zinc-700 shadow-2xl rounded-xl p-4 z-50 ring-1 ring-white/10"
        >
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-800">
                <ShieldAlert size={14} className={issue.severity === 'error' ? 'text-red-400' : 'text-amber-400'} />
                <span className="font-bold text-xs uppercase text-zinc-300">{issue.type} Detected</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{issue.message}</p>
            <div className="mt-3 flex justify-end">
               <button className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-1 rounded transition-colors">Quick Fix</button>
            </div>
        </motion.div>
    )
}