// src/pages/Dashboard/Index.jsx
import { useState, useEffect } from 'react';
import {
  Outlet,
  NavLink,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Github,
  Activity,
  FolderOpen,
  X,
  Search,
  FolderGit2,
  Edit2,
  Terminal,
  LogOut,
  LayoutDashboard,
  AlertCircle,
  Lightbulb,
  Code2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';

import { fetchRepos, createRepo as apiCreateRepo, getRepoStructure } from '../../api/repos';
import { fetchMe, updateMe } from '../../api/user';
import { logout } from '../../api/auth';
import { fetchRepoErrors } from '../../api/errors';
import { fetchPredictions } from '../../api/predictions';
import { fetchSummary } from '../../api/summary';
import { useTheme } from '../../contexts/ThemeContext';

// --- MOCK DATA ---
const AVATARS = [
  '/avatar1.png',
  '/avatar2.png',
  '/avatar3.png',
  '/avatar4.png',
  '/avatar5.png',
  '/avatar6.png',
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'));
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setIsAuth(false);
      navigate('/', { replace: true });
    } else {
      setIsAuth(true);
    }
  }, [navigate]);
  const { repoId } = useParams();

  // Data State
  const [repos, setRepos] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const load = async () => {
      try {
        const data = await fetchRepos();

        const normalized = await Promise.all(
          data.map(async (r) => {
            const repoId = r._id || r.id;
            let errorCount = 0;
            let riskLevel = 'Low';
            let risky_files = 0;
            let languages = [];
            let lastAnalyzed = null;
            let overallScore = 0;

            try {
              const errors = await fetchRepoErrors(repoId);
              errorCount = Array.isArray(errors) ? errors.length : 0;
            } catch (e) {
              console.log('Error fetching repo errors:', e);
            }

            try {
              const predictions = await fetchPredictions(repoId);
              if (predictions?.top_risky_files) {
                risky_files = predictions.top_risky_files.length;
                // Determine risk level from predictions
                const avgRisk =
                  predictions.top_risky_files?.reduce(
                    (sum, f) => sum + (f.risk_score || 0),
                    0,
                  ) / (predictions.top_risky_files?.length || 1) || 0;
                riskLevel =
                  avgRisk >= 7
                    ? 'Critical'
                    : avgRisk >= 5
                      ? 'High'
                      : avgRisk >= 3
                        ? 'Medium'
                        : 'Low';
              }
            } catch (e) {
              console.log('Error fetching predictions:', e);
            }

            try {
              const summary = await fetchSummary(repoId);
              if (summary && summary.created_at) {
                lastAnalyzed = summary.created_at;
              }
              if (summary && summary.overall_score) {
                overallScore = summary.overall_score;
              }
            } catch (e) {
              console.log('Error fetching summary:', e);
            }

            try {
              const structure = await getRepoStructure(repoId);
              if (structure && structure.metrics) {
                const langMap = structure.metrics.languages || {};
                languages = Object.keys(langMap).slice(0, 5); // Top 5 languages
              }
            } catch (e) {
              console.log('Error fetching structure:', e);
            }

            return {
              ...r,
              id: repoId,
              name: r.name || 'Unnamed',
              url: r.url || '',
              type: r.type || 'folder',
              errorCount,
              riskLevel,
              risky_files,
              languages,
              lastAnalyzed,
              score: overallScore || r.score || 0,
            };
          }),
        );

        setRepos(normalized);
      } catch (e) {
        console.error(e);

        if (e?.response?.status === 401) {
          localStorage.removeItem('token');
          setIsAuth(false);
          navigate('/', { replace: true });
        }
      }
    };
    load();
  }, []);

  const [selectedRepo, setSelectedRepo] = useState(null);
  useEffect(() => {
    if (!repoId || repos.length === 0) return;

    const found = repos.find((r) => (r._id || r.id) === repoId);
    if (found) setSelectedRepo(found);
  }, [repoId, repos]);
  // UI State
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Global theme
  const { toggleTheme } = useTheme();

  // User Preference State
  const [userProfile, setUserProfile] = useState({
    name: '',
    bio: '',
    avatar: '/avatar1.png',
  });

  const isRootDashboard = location.pathname === '/dashboard';

  // KPI Calc
  const [kpis, setKpis] = useState({
    totalRepos: 0,
    analyzedRepos: 0,
    avgScore: 0,
    activeIssues: 0,
  });

  useEffect(() => {
    const totalRepos = repos.length;
    const analyzedRepos = repos.filter((r) => r.status !== 'Pending').length;
    const avgScore =
      repos.length > 0
        ? Math.round(repos.reduce((sum, r) => sum + r.score, 0) / repos.length)
        : 0;
    setKpis((prev) => ({ ...prev, totalRepos, analyzedRepos, avgScore }));
  }, [repos]);

  // Fetch all errors for all repos
  useEffect(() => {
    const fetchAllErrors = async () => {
      try {
        let totalIssues = 0;
        for (const repo of repos) {
          const errors = await fetchRepoErrors(repo._id || repo.id);
          if (Array.isArray(errors)) {
            totalIssues += errors.length;
          }
        }
        setKpis((prev) => ({ ...prev, activeIssues: totalIssues }));
      } catch (e) {
        console.error('Failed to fetch errors:', e);
      }
    };

    if (repos.length > 0) {
      fetchAllErrors();
    }
  }, [repos]);

  // Handlers
  const handleEnterWorkspace = (repo) => {
    setSelectedRepo(repo);
    navigate(`/dashboard/${repo._id || repo.id}/overview`);
  };

  const handleAddRepo = async (name, source, type) => {
    try {
      const newRepo = await apiCreateRepo({
        name,
        url: source,
        type,
      });

      // reload repo list after creation
      const updated = await fetchRepos();
      setRepos(updated);
      setIsRepoModalOpen(false);
    } catch (e) {
      console.error('Repo create failed', e);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await fetchMe();
        setUserProfile({
          name: me.username,
          bio: me.bio || '',
          avatar: me.avatar || '/avatar1.png',
        });
      } catch (e) {
        console.log('user load failed', e);

        if (e?.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/', { replace: true });
        }
      }
    };
    loadUser();
  }, []);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
      className="min-h-screen font-sans selection:bg-emerald-500/30 overflow-hidden transition-colors duration-300"
    >
      {/* Clean flat background - no gradients or glow effects */}

      <div className="relative z-10 h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {isRootDashboard ? (
            <RepoSelectionView
              key="repo-list"
              repos={repos}
              userProfile={userProfile}
              kpis={kpis}
              onEnter={handleEnterWorkspace}
              onAdd={() => setIsRepoModalOpen(true)}
              onEditProfile={() => setIsProfileModalOpen(true)}
              toggleTheme={toggleTheme}
            />
          ) : (
            <WorkspaceShell
              key="workspace"
              repo={selectedRepo}
              userProfile={userProfile}
            />
          )}
        </AnimatePresence>
      </div>

      {/* MODALS */}
      <AddRepoModal
        isOpen={isRepoModalOpen}
        onClose={() => setIsRepoModalOpen(false)}
        onSubmit={handleAddRepo}
      />

      <ProfileCustomizationModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        setProfile={setUserProfile}
      />
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
            }}
            className="relative z-10 border rounded-lg p-6 max-w-sm w-full"
          >
            <h3
              style={{ color: 'var(--text-primary)' }}
              className="text-lg font-bold mb-2"
            >
              Confirm Logout
            </h3>
            <p
              style={{ color: 'var(--text-secondary)' }}
              className="text-sm mb-4"
            >
              Are you sure you want to log out? You will be taken to the login
              page.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                className="px-4 py-2 rounded-md bg-transparent border transition-colors hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await logout();
                  } catch (e) {
                    /* ignore */
                  }
                  localStorage.removeItem('token');
                  setShowLogoutConfirm(false);
                  navigate('/', { replace: true });
                }}
                className="px-4 py-2 rounded-md bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                Log out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* VIEW 1: REPO SELECTION (The "Bento" Dashboard)                             */
/* -------------------------------------------------------------------------- */

function RepoSelectionView({
  repos,
  userProfile,
  kpis,
  onEnter,
  onAdd,
  onEditProfile,
  toggleTheme,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRepos = repos.filter((r) =>
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-[1400px] mx-auto w-full p-6 lg:p-10 h-full overflow-y-auto scrollbar-none"
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 mb-12">
        {/* Profile Identity */}
        <div className="flex items-center gap-6 group">
          <div
            className="flex items-center gap-6 cursor-pointer"
            onClick={onEditProfile}
          >
            <div className="relative">
              <div
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-elevated)',
                }}
                className="w-24 h-24 rounded-2xl overflow-hidden border shadow-2xl relative z-10 transition-colors"
              >
                <img
                  src={userProfile.avatar}
                  alt="User Avatar"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
                className="absolute -bottom-2 -right-2 z-20 p-1.5 rounded-lg transition-colors shadow-lg group-hover:text-opacity-100"
              >
                <Edit2 size={12} />
              </div>
            </div>

            <div>
              <motion.div
                layoutId="greeting"
                className="flex items-center gap-3"
              >
                <h1
                  style={{ color: 'var(--text-primary)' }}
                  className="text-3xl font-bold tracking-tight"
                >
                  {userProfile.name}
                </h1>
                <span
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest text-emerald-500 font-mono border"
                >
                  Online
                </span>
              </motion.div>
              <p
                style={{ color: 'var(--text-secondary)' }}
                className="mt-1 font-medium"
              >
                {userProfile.bio}
              </p>
              <div
                style={{ color: 'var(--text-secondary)' }}
                className="flex items-center gap-2 mt-3 text-xs font-mono"
              >
                <Terminal size={12} />
                <span>Last login: Today</span>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLogoutConfirm(true);
            }}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
            className="ml-4 p-3 rounded-xl transition-all duration-200 shadow-lg hover:opacity-80"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Action Bar */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-64 group">
            <Search
              style={{ color: 'var(--text-secondary)' }}
              className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:opacity-100"
              size={16}
            />
            <input
              type="text"
              placeholder="        Filter repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              className="w-full  rounded-xl pl-10 pr-4 py-3 text-sm transition-all border focus:outline-none"
            />
          </div>

          <button
            onClick={onAdd}
            style={{
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors hover:opacity-90"
          >
            <Plus size={16} /> New Project
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--accent-color)',
            }}
            className="p-3 rounded-xl transition-all duration-200 border hover:opacity-80"
            title="Toggle theme"
          >
            <Sun
              size={18}
              style={{ display: 'var(--theme-sun-display, block)' }}
            />
            <Moon
              size={18}
              style={{ display: 'var(--theme-moon-display, none)' }}
            />
          </button>
        </div>
      </div>

      {/* STATS STRIP - Clean and minimal */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
        className="grid grid-cols-3 gap-px rounded-2xl border overflow-hidden mb-12 max-w-2xl transition-colors"
      >
        <StatItem label="Total Projects" value={kpis.totalRepos} />
        <StatItem label="Active Issues" value={kpis.activeIssues} />
        <StatItem label="Avg Health" value={`${kpis.avgScore || 0}%`} />
      </div>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
        <AnimatePresence>
          {filteredRepos.map((repo, i) => (
            <TechCard
              key={repo._id || repo.id || i}
              repo={repo}
              index={i}
              onClick={() => onEnter(repo)}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* VIEW 2: UPGRADED WORKSPACE SHELL                                           */
/* -------------------------------------------------------------------------- */

function WorkspaceShell({ repo, userProfile }) {
  const { repoId } = useParams();
  const navigate = useNavigate();

  const handleOpenCodeExplorer = async () => {
    // Call Electron IPC to open new window
    if (window.electronAPI?.openCodeExplorer) {
      try {
        const result = await window.electronAPI.openCodeExplorer(repoId);
        console.log('Code Explorer opened:', result);
      } catch (err) {
        console.error('Failed to open Code Explorer:', err);
        // Fallback to in-dashboard view
        navigate(`/dashboard/${repoId}/code-inline`);
      }
    } else {
      // Running in browser without Electron, navigate to inline view
      navigate(`/dashboard/${repoId}/code-inline`);
    }
  };

  const sidebarLinks = [
    { path: 'overview', label: 'Overview', icon: LayoutDashboard },
    { path: 'issues', label: 'Issues', icon: AlertCircle },
    { path: 'predictions', label: 'Predictions', icon: Activity },
    { path: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
      className="flex h-screen w-full overflow-hidden font-sans transition-colors duration-300"
    >
      {/* SIDEBAR */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
        className="w-64 flex flex-col z-20 shrink-0 transition-colors duration-300 border-r"
      >
        {/* Header / Back Navigation */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
          }}
          className="p-5 transition-colors duration-300 border-b"
        >
          <NavLink
            to="/dashboard"
            style={{
              color: 'var(--text-secondary)',
            }}
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider transition-colors  hover:opacity-80"
          >
            <ArrowLeft size={14} /> Back to Hub
          </NavLink>

          {/* Repo Context Banner */}
        </div>

        {/* Navigation Links */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div
            style={{
              color: 'var(--text-secondary)',
            }}
            className="text-[10px] font-bold uppercase tracking-wider mb-4 px-3 mt-2"
          >
            Analysis Modules
          </div>

          <nav className="space-y-1.5">
            {sidebarLinks.map((link) => (
              <NavLink
                key={link.path}
                to={`/dashboard/${repoId}/${link.path}`}
                className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border-l-2"
                style={({ isActive }) => ({
                  backgroundColor: isActive
                    ? 'var(--bg-elevated)'
                    : 'transparent',
                  borderColor: isActive ? 'var(--accent-color)' : 'transparent',
                  color: isActive
                    ? 'var(--accent-color)'
                    : 'var(--text-secondary)',
                })}
              >
                {({ isActive }) => (
                  <>
                    <link.icon
                      size={18}
                      style={{
                        color: isActive
                          ? 'var(--accent-color)'
                          : 'var(--text-secondary)',
                      }}
                    />
                    {link.label}

                    {isActive && (
                      <motion.div
                        layoutId="active-nav-indicator"
                        style={{
                          backgroundColor: 'var(--accent-color)',
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}

            {/* Code Explorer Button - Opens in NEW Window */}
            <button
              onClick={handleOpenCodeExplorer}
              style={{
                color: 'var(--text-secondary)',
                borderColor: 'transparent',
              }}
              className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border hover:opacity-80"
              title="Opens Code Explorer in a new window"
            >
              <Code2
                size={18}
                style={{
                  color: 'var(--text-secondary)',
                }}
              />
              Code Explorer
              <span
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-elevated)',
                }}
                className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
              >
                New Window
              </span>
            </button>
          </nav>
        </div>

        {/* Footer / User Profile */}
        {userProfile && (
          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
            }}
            className="p-4 transition-colors duration-300 border-t"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--accent-color)',
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 border"
              >
                {userProfile.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div
                  style={{ color: 'var(--text-primary)' }}
                  className="text-xs font-bold truncate"
                >
                  {userProfile.name || 'System User'}
                </div>
                <div
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-[10px] truncate"
                >
                  Workspace Access
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
        }}
        className="flex-1 flex flex-col min-w-0 relative transition-colors duration-300"
      >
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <Outlet context={{ repo }} />
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENT: TECH CARD (The "Creative" Part)                                 */
/* -------------------------------------------------------------------------- */


export function TechCard({ repo, index, onClick }) {
  const getScoreColor = (s) =>
    s >= 80
      ? 'text-emerald-400 border-emerald-500/30'
      : s >= 60
        ? 'text-amber-400 border-amber-500/30'
        : 'text-rose-400 border-rose-500/30';

  const getRiskColor = (risk) =>
    risk === 'Critical'
      ? 'text-rose-400'
      : risk === 'High'
        ? 'text-orange-400'
        : risk === 'Medium'
          ? 'text-amber-400'
          : 'text-emerald-400';

  // Helper to render language tags (handles both arrays and strings)
  const renderLanguages = () => {
    if (Array.isArray(repo.languages) && repo.languages.length > 0) {
      return repo.languages.map((lang, i) => (
        <span 
          key={i} 
          className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border"
          style={{ 
            backgroundColor: 'var(--accent-color)', 
            borderColor: 'var(--accent-color)', 
            color: '#ffffff',
            opacity: 0.8
          }}
          title={lang}
        >
          {lang}
        </span>
      ));
    }
    return (
      <span 
        className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border"
        style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          borderColor: 'var(--border-color)', 
          color: 'var(--text-secondary)' 
        }}
      >
        Not Analyzed
      </span>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
      className="group relative h-[280px] rounded-2xl cursor-pointer overflow-hidden border transition-all hover:border-opacity-80 hover:shadow-lg"
    >
      {/* Subtle hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative h-full p-5 flex flex-col z-10">
        
        {/* --- HEADER: Icon, Status, and Last Analyzed --- */}
        <div className="flex justify-between items-start w-full mb-4">
          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
              className="p-2.5 rounded-xl border transition-all shadow-sm group-hover:text-opacity-100"
            >
              {repo.type === 'folder' ? (
                <FolderOpen size={18} />
              ) : (
                <Github size={18} />
              )}
            </div>
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
              className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm"
            >
              {repo.status || 'Analyzed'}
            </div>
          </div>

          {/* Moved: Last Analyzed Top Right */}
          <div className="text-right flex flex-col justify-center">
            <span 
              style={{ color: 'var(--text-secondary)' }} 
              className="text-[8px] uppercase tracking-wider font-bold opacity-70"
            >
              Last Analyzed
            </span>
            <span 
              style={{ color: 'var(--text-primary)' }} 
              className="text-[10px] font-medium mt-0.5"
            >
              {repo.lastAnalyzed 
                ? new Date(repo.lastAnalyzed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Not analyzed'}
            </span>
          </div>
        </div>

        {/* --- BODY: Title & URL --- */}
        <div className="mb-auto">
          <h3
            style={{ color: 'var(--text-primary)' }}
            className="text-lg font-bold transition-colors line-clamp-1"
            title={repo.name}
          >
            {repo.name}
          </h3>
          <p
            style={{ color: 'var(--text-secondary)' }}
            className="text-xs font-mono mt-1 opacity-70 truncate"
          >
            {repo.url}
          </p>
        </div>

        {/* --- STATS ROW --- */}
        <div className="mt-4 mb-4 grid grid-cols-3 gap-2">
          <div
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}
            className="rounded-xl border p-2.5 flex flex-col items-center justify-center transition-colors group-hover:bg-opacity-80"
          >
            <div style={{ color: 'var(--text-primary)' }} className="text-sm font-bold">
              {repo.errorCount || 0}
            </div>
            <div style={{ color: 'var(--text-secondary)' }} className="text-[9px] uppercase tracking-wider mt-0.5">
              Issues
            </div>
          </div>

          <div
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}
            className="rounded-xl border p-2.5 flex flex-col items-center justify-center transition-colors group-hover:bg-opacity-80"
          >
            <div className={`text-sm font-bold ${getRiskColor(repo.riskLevel)}`}>
              {repo.riskLevel || 'None'}
            </div>
            <div style={{ color: 'var(--text-secondary)' }} className="text-[9px] uppercase tracking-wider mt-0.5">
              Risk
            </div>
          </div>

          <div
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}
            className="rounded-xl border p-2.5 flex flex-col items-center justify-center transition-colors group-hover:bg-opacity-80"
          >
            <div style={{ color: 'var(--text-primary)' }} className="text-sm font-bold">
              {repo.risky_files || 0}
            </div>
            <div style={{ color: 'var(--text-secondary)' }} className="text-[9px] uppercase tracking-wider mt-0.5">
              Risky
            </div>
          </div>
        </div>

        {/* --- FOOTER: Dedicated Languages Section --- */}
        <div 
          style={{ borderColor: 'var(--border-color)' }} 
          className="pt-3 flex flex-col gap-3 border-t"
        >
          {/* Health Score Summary */}
          <div className="flex items-center justify-between">
            <span 
              style={{ color: 'var(--text-secondary)' }} 
              className="text-[9px] uppercase tracking-wider font-bold opacity-70"
            >
              Health Score
            </span>
            <div 
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--accent-color)'
              }}
              className="px-2.5 py-1 rounded-full border text-xs font-bold"
            >
              {repo.score || 0}%
            </div>
          </div>

         
        </div>

      </div>
    </motion.div>
  );
}

function StatItem({ label, value }) {
  return (
    <div
      style={{
        backgroundColor: 'transparent',
      }}
      className="p-4 flex flex-col items-center justify-center transition-colors cursor-default hover:opacity-80"
    >
      <span
        style={{ color: 'var(--text-primary)' }}
        className="text-2xl font-bold tracking-tight"
      >
        {value}
      </span>
      <span
        style={{ color: 'var(--text-secondary)' }}
        className="text-[10px] uppercase font-medium tracking-wider"
      >
        {label}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MODALS                                                                     */
/* -------------------------------------------------------------------------- */

function ProfileCustomizationModal({ isOpen, onClose, profile, setProfile }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)',
        }}
        className="relative w-full max-w-lg border rounded-2xl p-8 z-50 shadow-2xl overflow-hidden transition-colors"
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            style={{ color: 'var(--text-primary)' }}
            className="text-xl font-bold"
          >
            Identity Configuration
          </h2>
          <button onClick={onClose}>
            <X
              style={{ color: 'var(--text-secondary)' }}
              className="hover:opacity-80 transition-opacity"
            />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label
              style={{ color: 'var(--text-secondary)' }}
              className="text-xs uppercase tracking-wider mb-3 block"
            >
              Select Avatar
            </label>
            <div className="grid grid-cols-6 gap-3">
              {AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  onClick={() => setProfile({ ...profile, avatar })}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${profile.avatar === avatar ? 'border-emerald-500 scale-110 shadow-lg shadow-emerald-500/20' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`}
                  style={{
                    borderColor:
                      profile.avatar === avatar ? '#10b981' : 'transparent',
                  }}
                >
                  <img
                    src={avatar}
                    alt={`Avatar ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                style={{ color: 'var(--text-secondary)' }}
                className="text-xs uppercase tracking-wider mb-1.5 block"
              >
                Display Name
              </label>
              <input
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                className="w-full rounded-lg px-4 py-3 border outline-none transition-colors focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label
                style={{ color: 'var(--text-secondary)' }}
                className="text-xs uppercase tracking-wider mb-1.5 block"
              >
                Role / Bio
              </label>
              <input
                value={profile.bio}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                className="w-full rounded-lg px-4 py-3 border outline-none transition-colors focus:border-emerald-500/50"
              />
            </div>
          </div>

          <button
            onClick={async () => {
              await updateMe({
                username: profile.name,
                bio: profile.bio,
                avatar: profile.avatar,
              });
              onClose();
            }}
            style={{
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
            }}
            className="w-full py-3 font-bold rounded-lg transition-colors mt-4 hover:opacity-90"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AddRepoModal({ isOpen, onClose, onSubmit }) {
  const [selectedType, setSelectedType] = useState('github');
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ─── Automatically suggest name from GitHub URL ─────────────────────────────
  const extractRepoNameFromUrl = (url) => {
    if (!url) return '';
    const cleaned = url
      .trim()
      .replace(/\.git$/, '')
      .replace(/^git@[^:]+:/, '')
      .replace(/^https?:\/\/([^/]+\/)+/, '');
    const parts = cleaned.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  };

  useEffect(() => {
    if (selectedType === 'github' && repoUrl) {
      const suggested = extractRepoNameFromUrl(repoUrl);
      if (suggested && !name.trim()) {
        setName(suggested);
      }
    }
  }, [repoUrl, selectedType]);

  // ─── Also auto-fill name from selected folder (both modes) ──────────────────
  useEffect(() => {
    if (folderPath && !name.trim()) {
      const folderName = folderPath.split(/[\\/]/).pop() || '';
      setName(folderName);
    }
  }, [folderPath]);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (selectedType === 'github') {
        const finalPath = `${folderPath}/${name}`.replace(/\\/g, '/');

        await window.electronAPI.cloneRepo({
          url: repoUrl,
          folder: finalPath,
        });

        await onSubmit(name, finalPath, 'github');
      }

      if (selectedType === 'folder') {
        await onSubmit(name, folderPath, 'folder');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)',
        }}
        className="relative w-full max-w-md border rounded-xl p-6 z-50 shadow-2xl transition-colors"
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            style={{ color: 'var(--text-primary)' }}
            className="text-lg font-semibold"
          >
            Import Project
          </h2>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-secondary)' }}
            className="transition-colors hover:opacity-80"
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{ backgroundColor: 'var(--bg-elevated)' }}
          className="flex p-1 rounded-lg mb-5"
        >
          {['github', 'folder'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                color:
                  selectedType === type
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
              }}
              className="relative flex-1 py-2 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all hover:opacity-80"
            >
              {selectedType === type && (
                <motion.div
                  layoutId="modal-tab"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                  className="absolute inset-0 shadow-sm rounded-md"
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {type === 'github' ? (
                  <Github size={14} />
                ) : (
                  <FolderOpen size={14} />
                )}
                {type === 'github' ? 'GitHub URL' : 'Local Folder'}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label
              style={{ color: 'var(--text-secondary)' }}
              className="text-xs mb-1.5 block"
            >
              Project Name
            </label>
            <input
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              className="w-full rounded-lg px-3 py-2.5 border transition-colors focus:border-emerald-500/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {selectedType === 'github' && (
            <>
              <div>
                <label
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-xs mb-1.5 block"
                >
                  Repository URL
                </label>
                <input
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  className="w-full rounded-lg px-3 py-2.5 border font-mono transition-colors"
                  placeholder="https://github.com/user/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
              </div>

              <div>
                <label
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-xs mb-1.5 block"
                >
                  Clone Location
                </label>
                <button
                  onClick={async () => {
                    const folder = await window.electronAPI.selectFolder();
                    if (folder) setFolderPath(folder);
                  }}
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:opacity-80"
                >
                  {folderPath || 'Click to choose folder'}
                </button>
              </div>
            </>
          )}

          {selectedType === 'folder' && (
            <div>
              <label
                style={{ color: 'var(--text-secondary)' }}
                className="text-xs mb-1.5 block"
              >
                Select Source
              </label>
              <button
                onClick={async () => {
                  const folder = await window.electronAPI.selectFolder();
                  if (folder) {
                    setFolderPath(folder);
                    // name is now auto-filled via useEffect
                  }
                }}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:opacity-80"
              >
                {folderPath || 'Select existing folder'}
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
            className="flex-1 py-2.5 text-sm rounded-lg transition-colors border hover:opacity-80"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              (selectedType === 'github'
                ? !name.trim() || !repoUrl.trim() || !folderPath
                : !name.trim() || !folderPath)
            }
            style={{
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
              opacity:
                isLoading ||
                (selectedType === 'github'
                  ? !name.trim() || !repoUrl.trim() || !folderPath
                  : !name.trim() || !folderPath)
                  ? 0.4
                  : 1,
            }}
            className="flex-1 rounded-lg text-sm font-bold py-2.5 transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{
                    borderColor: 'var(--accent-color)',
                    borderTopColor: 'transparent',
                  }}
                  className="w-4 h-4 border-2 rounded-full border-t-transparent"
                />
                Importing project...
              </>
            ) : (
              'Import'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
