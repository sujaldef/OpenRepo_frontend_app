// src/pages/Auth/index.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User, ArrowRight, Github, Chrome,
  Terminal, Code2, Loader2, Eye, EyeOff, Cpu,
  Globe, Zap, ShieldCheck
} from 'lucide-react';
import { registerUser, loginUser } from "../../api/auth";

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const navigate = useNavigate(); 
  const toggleMode = () => setMode(prev => prev === 'login' ? 'register' : 'login');
  useEffect(() => {
    const token = localStorage.getItem("token");
  
    if (token) {
      navigate("/dashboard");
    }
  }, []);
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500/30 text-zinc-100">
      
      {/* Global Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"></div>

      <div className="relative z-10 w-full max-w-[1200px] min-h-[700px] flex items-center justify-center perspective-1000">
        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <AuthModel
              key="login"
              mode="login"
              toggle={toggleMode}
              imageSrc="/login.png"
              imageAlt="Dashboard Analytics"
            />
          ) : (
            <AuthModel
              key="register"
              mode="register"
              toggle={toggleMode}
              imageSrc="/signup.png"
              imageAlt="Code Collaboration"
            />
          )}
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
    </div>
  );
}

function AuthModel({ mode, toggle, imageSrc, imageAlt }) {
  const isLogin = mode === 'login';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`
        w-full flex flex-col lg:flex-row
        ${!isLogin ? 'lg:flex-row-reverse' : ''}
        gap-4 lg:gap-12 items-center justify-center
      `}
    >
      <div className="w-full lg:w-1/2 h-[400px] lg:h-[600px] relative flex items-center justify-center">
        <ParallaxVisual imageSrc={imageSrc} mode={mode} />
      </div>

      <div className="w-full lg:w-[480px] relative group">
        <div className="absolute inset-0 bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
          <ScrollingCodeBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-zinc-950"></div>
        </div>
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none"></div>
        
        <div className="relative z-10 p-8 lg:p-12 flex flex-col min-h-[550px] justify-center">
          <FormContent mode={mode} toggle={toggle} />
        </div>
      </div>
    </motion.div>
  );
}

function ParallaxVisual({ imageSrc, mode }) {
  const ref = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / (width / 2);
    const y = (e.clientY - top - height / 2) / (height / 2);
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => setMousePosition({ x: 0, y: 0 });

  const tiltStyle = {
    transform: `
      perspective(1000px)
      rotateY(${mousePosition.x * 15}deg)
      rotateX(${mousePosition.y * -15}deg)
    `,
  };

  const layer1Style = { transform: `translateZ(40px) translateX(${mousePosition.x * -20}px) translateY(${mousePosition.y * -20}px)` };
  const layer2Style = { transform: `translateZ(80px) translateX(${mousePosition.x * -40}px) translateY(${mousePosition.y * -40}px)` };
  const layer3Style = { transform: `translateZ(120px) translateX(${mousePosition.x * -60}px) translateY(${mousePosition.y * -60}px)` };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full h-full flex items-center justify-center perspective-1000 cursor-crosshair"
    >
      <motion.div
        className="relative w-[350px] h-[450px] transition-transform duration-200 ease-out preserve-3d"
        style={tiltStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 blur-[60px] rounded-full transform translate-z-[-50px]"></div>

        <div
          className="absolute inset-0 bg-zinc-900 rounded-2xl border border-zinc-700/50 overflow-hidden shadow-2xl"
          style={layer1Style}
        >
          <img
            src={imageSrc}
            alt="App Preview"
            className="w-full h-full object-cover opacity-80"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
        </div>

        <div className="absolute -right-8 top-12 p-4 bg-zinc-800/90 backdrop-blur-md border border-zinc-700 rounded-xl shadow-xl flex items-center gap-3" style={layer2Style}>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-xs text-zinc-400 font-mono">Performance</div>
            <div className="text-white font-bold text-lg">98ms</div>
          </div>
        </div>

        <div className="absolute -left-6 bottom-20 p-4 bg-zinc-800/90 backdrop-blur-md border border-zinc-700 rounded-xl shadow-xl flex items-center gap-3" style={layer3Style}>
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-xs text-zinc-400 font-mono">Security</div>
            <div className="text-white font-bold text-lg">Audited</div>
          </div>
        </div>

        <div className="absolute -bottom-4 right-4 text-xs font-mono text-zinc-500 bg-black/80 p-3 rounded-lg border border-zinc-800" style={layer2Style}>
          <span className="text-purple-400">const</span> <span className="text-blue-400">init</span> = <span className="text-yellow-400">()</span> {"=>"} <span className="text-emerald-400">true</span>;
        </div>
      </motion.div>
    </div>
  );
}

function FormContent({ mode, toggle }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      let res;
      if (mode === "register") {
        await registerUser(form);
      } else {
        res = await loginUser(form);
        localStorage.setItem("token", res.access_token);
      }
      navigate("/dashboard");
    }catch (err) {
      setError(err.response?.data?.detail || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="space-y-4">
        {mode === "register" && (
          <SpotlightInput
            icon={User}
            placeholder="Username"
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
          />
        )}
        <SpotlightInput
          icon={Mail}
          placeholder="Email address"
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        />
        <SpotlightInput
          icon={Lock}
          placeholder="Password"
          isPassword
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Loading..." : (mode === "login" ? "Login" : "Register")}
        </button>
        <p className="text-center text-sm text-zinc-600">
          {mode === "login" ? "New user? " : "Existing user? "}
          <button onClick={toggle} className="underline hover:text-zinc-300">
            {mode === "login" ? "Create account" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}

function ScrollingCodeBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 font-mono text-[10px] leading-3 text-emerald-900 select-none">
      <div className="grid grid-cols-4 gap-4 p-4">
        {Array.from({ length: 4 }).map((_, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.1 }}
                animate={{ opacity: [0.1, 0.5, 0.1] }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              >
                {Math.random() > 0.5 ? `0x${Math.floor(Math.random()*16777215).toString(16)}` : `::init_v${i}`}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SpotlightInput({ icon: Icon, placeholder, isPassword = false, onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  const wrapperRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const isFocused = useRef(false);

  const handleMouseMove = (e) => {
    // Skip position updates while typing → prevents lag / lost keystrokes
    if (isFocused.current) return;

    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => {
        setOpacity(0);
        // Safety reset
        isFocused.current = false;
      }}
      className="relative group rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden"
    >
      {/* Spotlight effect - only updates when not focused */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 rounded-xl"
        style={{
          opacity,
          background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.09), transparent 60%)`,
        }}
      />

      <div className="relative flex items-center px-4 py-4 z-10">
        <Icon size={18} className="text-zinc-500 group-focus-within:text-emerald-400 transition-colors shrink-0" />
        
        <input
          type={isPassword ? (showPassword ? "text" : "password") : "text"}
          placeholder={placeholder}
          onChange={onChange}
          onFocus={() => { isFocused.current = true; }}
          onBlur={() => { isFocused.current = false; }}
          className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-zinc-600 ml-3 caret-emerald-400"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-zinc-600 hover:text-white transition-colors ml-2"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </motion.div>
  );
}