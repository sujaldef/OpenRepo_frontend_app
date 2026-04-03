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
} from 'lucide-react';

import { fetchRepos, createRepo as apiCreateRepo } from '../../api/repos';
import { fetchMe, updateMe } from '../../api/user';
import { logout } from '../../api/auth';

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

        const normalized = data.map((r) => ({
          ...r,
          id: r._id || r.id,
          name: r.name || 'Unnamed',
          url: r.url || '',
          type: r.type || 'folder',
        }));

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
  });

  useEffect(() => {
    const totalRepos = repos.length;
    const analyzedRepos = repos.filter((r) => r.status !== 'Pending').length;
    const avgScore =
      repos.length > 0
        ? Math.round(repos.reduce((sum, r) => sum + r.score, 0) / repos.length)
        : 0;
    setKpis({ totalRepos, analyzedRepos, avgScore });
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
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-emerald-500/30 overflow-hidden">
      {/* Cinematic Background - Subtle Grain & Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 blur-[120px] rounded-full"></div>
      </div>

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
            className="relative z-10 bg-[#0b0b0d] border border-white/10 rounded-lg p-6 max-w-sm w-full"
          >
            <h3 className="text-lg font-bold mb-2">Confirm Logout</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Are you sure you want to log out? You will be taken to the login
              page.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-md bg-transparent border border-white/10 text-zinc-300"
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
                className="px-4 py-2 rounded-md bg-rose-500 text-white"
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
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative z-10 bg-zinc-900">
                <img
                  src={userProfile.avatar}
                  alt="User Avatar"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
              <div className="absolute -inset-2 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -bottom-2 -right-2 z-20 bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg text-zinc-400 group-hover:text-white transition-colors shadow-lg">
                <Edit2 size={12} />
              </div>
            </div>

            <div>
              <motion.div
                layoutId="greeting"
                className="flex items-center gap-3"
              >
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {userProfile.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] uppercase tracking-widest text-emerald-500 font-mono">
                  Online
                </span>
              </motion.div>
              <p className="text-zinc-500 mt-1 font-medium">
                {userProfile.bio}
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-zinc-600 font-mono">
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
            className="ml-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-500 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all duration-200 shadow-lg"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Action Bar */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-64 group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-300 transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="Filter repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/30 border border-zinc-800/60 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:bg-zinc-900/80 focus:border-zinc-700 transition-all"
            />
          </div>

          <button
            onClick={onAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold text-sm hover:bg-zinc-200 transition-colors shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
          >
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {/* STATS STRIP - Minimalist */}
      <div className="grid grid-cols-3 gap-px bg-zinc-800/30 rounded-2xl border border-zinc-800/50 overflow-hidden mb-12 max-w-2xl">
        <StatItem label="Total Projects" value={kpis.totalRepos} />
        <StatItem
          label="Active Issues"
          value={Math.floor(Math.random() * 20)}
        />{' '}
        {/* Mock data */}
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

  const sidebarLinks = [
    { path: 'overview', label: 'Overview', icon: LayoutDashboard },
    { path: 'issues', label: 'Issues', icon: AlertCircle },
    { path: 'predictions', label: 'Predictions', icon: Activity },
    { path: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { path: 'code', label: 'Code Explorer', icon: Code2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-screen w-full bg-[#000000] text-zinc-200 overflow-hidden font-sans"
    >
      {/* SIDEBAR */}
      <div className="w-64 bg-[#0a0a0c] border-r border-white/10 flex flex-col z-20 shrink-0">
        {/* Header / Back Navigation */}
        <div className="p-5 border-b border-white/10 bg-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full  " />

          <NavLink
            to="/dashboard"
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors mb-5"
          >
            <ArrowLeft size={14} /> Back to Hub
          </NavLink>

          {/* Repo Context Banner */}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-4 px-3 mt-2">
            Analysis Modules
          </div>

          <nav className="space-y-1.5">
            {sidebarLinks.map((link) => (
              <NavLink
                key={link.path}
                to={`/dashboard/${repoId}/${link.path}`}
                className={({ isActive }) =>
                  `relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border
                   ${
                     isActive
                       ? 'bg-white/10 text-white font-medium border-white/10 shadow-sm'
                       : 'text-zinc-500 border-transparent hover:bg-white/5 hover:text-zinc-300'
                   }`
                }
              >
                {({ isActive }) => (
                  <>
                    <link.icon
                      size={18}
                      className={isActive ? 'text-white' : 'text-zinc-500'}
                    />
                    {link.label}

                    {isActive && (
                      <motion.div
                        layoutId="active-nav-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full"
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
          </nav>
        </div>

        {/* Footer / User Profile */}
        {userProfile && (
          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                {userProfile.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-zinc-300 truncate">
                  {userProfile.name || 'System User'}
                </div>
                <div className="text-[10px] text-zinc-500 truncate">
                  Workspace Access
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-[#050505] to-[#0a0a0c] relative">
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

function TechCard({ repo, index, onClick }) {
  const getScoreColor = (s) =>
    s >= 80
      ? 'text-emerald-400 border-emerald-500/30'
      : s >= 60
        ? 'text-amber-400 border-amber-500/30'
        : 'text-rose-400 border-rose-500/30';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onClick={onClick}
      className="group relative h-[220px] bg-zinc-900/20 rounded-2xl cursor-pointer overflow-hidden border border-white/5 hover:border-white/10 transition-colors"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative h-full p-6 flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
          <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/5 text-zinc-400 group-hover:text-white group-hover:border-white/20 transition-all shadow-lg">
            {repo.type === 'folder' ? (
              <FolderOpen size={20} />
            ) : (
              <Github size={20} />
            )}
          </div>
          <div
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider border ${repo.status === 'Healthy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
          >
            {repo.status || 'Analyzed'}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-bold text-zinc-200 group-hover:text-white transition-colors">
            {repo.name}
          </h3>
          <p className="text-xs text-zinc-500 font-mono mt-1 opacity-70 truncate">
            {repo.url}
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border bg-zinc-900/50 font-mono text-xs font-bold ${getScoreColor(repo.score || 0)}`}
            >
              {repo.score || 0}
            </div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
              Health Score
            </span>
          </div>

          <div className="text-right">
            <span className="block text-xs text-white font-medium">
              {repo.language || 'Mixed'}
            </span>
            <span className="text-[10px] text-zinc-600">
              {repo.lastUpdated || 'Just now'}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 blur-[50px] rounded-full group-hover:bg-white/10 transition-all duration-700"></div>
    </motion.div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="p-4 flex flex-col items-center justify-center hover:bg-white/5 transition-colors cursor-default">
      <span className="text-2xl font-bold text-white tracking-tight">
        {value}
      </span>
      <span className="text-[10px] uppercase text-zinc-500 font-medium tracking-wider">
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
        className="relative w-full max-w-lg bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-8 z-50 shadow-2xl overflow-hidden"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            Identity Configuration
          </h2>
          <button onClick={onClose}>
            <X className="text-zinc-500 hover:text-white" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-3 block">
              Select Avatar
            </label>
            <div className="grid grid-cols-6 gap-3">
              {AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  onClick={() => setProfile({ ...profile, avatar })}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${profile.avatar === avatar ? 'border-emerald-500 scale-110 shadow-lg shadow-emerald-500/20' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`}
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
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">
                Display Name
              </label>
              <input
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">
                Role / Bio
              </label>
              <input
                value={profile.bio}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-colors"
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
            className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors mt-4"
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
        className="relative w-full max-w-md bg-[#09090b] border border-zinc-800 rounded-xl p-6 z-50 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Import Project</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex bg-zinc-900 p-1 rounded-lg mb-5">
          {['github', 'folder'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`relative flex-1 py-2 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                selectedType === type
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {selectedType === type && (
                <motion.div
                  layoutId="modal-tab"
                  className="absolute inset-0 bg-zinc-700 shadow-sm rounded-md"
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
            <label className="text-xs text-zinc-500 mb-1.5 block">
              Project Name
            </label>
            <input
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {selectedType === 'github' && (
            <>
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">
                  Repository URL
                </label>
                <input
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-white font-mono"
                  placeholder="https://github.com/user/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">
                  Clone Location
                </label>
                <button
                  onClick={async () => {
                    const folder = await window.electronAPI.selectFolder();
                    if (folder) setFolderPath(folder);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-left hover:bg-zinc-800 text-sm text-zinc-300"
                >
                  {folderPath || 'Click to choose folder'}
                </button>
              </div>
            </>
          )}

          {selectedType === 'folder' && (
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">
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
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-left hover:bg-zinc-800 text-sm text-zinc-300"
              >
                {folderPath || 'Select existing folder'}
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-900 rounded-lg transition-colors"
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
            className="flex-1 bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-lg text-sm font-bold py-2.5 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
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
