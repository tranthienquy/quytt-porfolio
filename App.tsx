
import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, Facebook, Settings, LogOut, X, Save, RotateCcw, Play, ArrowRight, Move, MousePointer2, ExternalLink, ArrowLeftRight, Trash2, Link as LinkIcon, Cloud, CheckCircle2, Download, Upload, Edit, Loader2, Plus, ArrowUpRight, MousePointer, Award, Star, Zap, Info, Briefcase, Globe } from 'lucide-react';
import { ProfileData, PortfolioItem, HighlightItem, NavItem, CustomTextStyle } from './types';
import { getData, saveData, resetData } from './services/dataService';
import { EditableText, EditImage, AddButton, DeleteButton, MoveButton, StyledEditableText } from './components/EditControls';
import { firebaseConfig } from './firebaseConfig';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} height="1em" width="1em">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"></path>
  </svg>
);

const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.trim().match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Preloader GenZ Style
 */
const Preloader = ({ onComplete }: { onComplete: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);
    const statuses = [
        "Check đàm 1, 2, 3...",
        "Setting up the stage...",
        "Gần xong rồi nè...",
        "Ready to serve!"
    ];

    useEffect(() => {
        const statusInterval = setInterval(() => {
            setStatusIndex(prev => (prev + 1) % statuses.length);
        }, 400);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    clearInterval(statusInterval);
                    setTimeout(onComplete, 500);
                    return 100;
                }
                return prev + Math.floor(Math.random() * 5) + 1;
            });
        }, 40);

        return () => {
            clearInterval(statusInterval);
            clearInterval(progressInterval);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[10000] bg-[#050505] flex flex-col items-center justify-center p-6 select-none">
            <div className="w-full max-w-md space-y-8">
                <div className="space-y-2 overflow-hidden">
                    <div className="flex justify-between items-end">
                        <h2 className="text-white font-black text-6xl md:text-8xl tracking-tighter italic animate-pulse">
                            {progress}%
                        </h2>
                    </div>
                    <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-[#b0f279] via-[#2dd4bf] to-[#00e5ff] transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                
                <div className="flex flex-col gap-1">
                    <div className="text-blue-500 font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] h-4">
                        {statuses[statusIndex]}
                    </div>
                </div>
            </div>

            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        </div>
    );
};

/**
 * Component hiển thị con trỏ chuột tỏa sáng.
 */
const GlowingCursor = ({ size, glowSize }: { size: number, glowSize: number }) => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };
        const animate = () => {
            const { x, y } = mousePos.current;
            const transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
            if (cursorRef.current) cursorRef.current.style.transform = transform;
            if (glowRef.current) glowRef.current.style.transform = transform;
            requestRef.current = requestAnimationFrame(animate);
        };
        window.addEventListener('mousemove', onMouseMove);
        requestRef.current = requestAnimationFrame(animate);
        document.body.style.cursor = 'none';
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            document.body.style.cursor = 'auto';
        };
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden hidden md:block">
            <div 
                ref={glowRef} 
                className="absolute top-0 left-0 bg-white rounded-full opacity-50 mix-blend-screen pointer-events-none will-change-transform transition-[width,height] duration-300" 
                style={{ 
                    filter: 'blur(30px)', 
                    width: `${glowSize}px`, 
                    height: `${glowSize}px` 
                }} 
            />
            <div 
                ref={cursorRef} 
                className="absolute top-0 left-0 bg-white rounded-full mix-blend-normal pointer-events-none will-change-transform transition-[width,height] duration-300" 
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    boxShadow: `0 0 20px ${size/4}px rgba(255,255,255,0.9)`
                }}
            />
        </div>
    );
};

const SelectionFrame = ({ children, className = "", label }: { children?: React.ReactNode, className?: string, label?: React.ReactNode }) => (
  <div className={`relative border border-dashed border-white/20 group ${className}`}>
    <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-black z-10"></div>
    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-black z-10"></div>
    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-black z-10"></div>
    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-black z-10"></div>
    {label && <div className="absolute -top-6 left-0 text-[10px] uppercase tracking-widest text-gray-500 font-sans flex items-center gap-1">{label}</div>}
    {children}
  </div>
);

const App: React.FC = () => {
  const [data, setData] = useState<ProfileData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showCursorSettings, setShowCursorSettings] = useState(false);
  const [showSiteSettings, setShowSiteSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getData().then(loadedData => {
        setData(loadedData);
    });
    if (firebaseConfig.projectId && firebaseConfig.projectId !== "PROJECT_ID") setIsFirebaseReady(true);
  }, []);

  // Update real-time meta & favicon
  useEffect(() => {
    if (!data) return;
    
    // Favicon update
    const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (favicon && data.faviconUrl) {
        favicon.href = data.faviconUrl;
    }

    // Social Thumbnail (OG Image) update
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && data.thumbnailUrl) {
        ogImage.setAttribute('content', data.thumbnailUrl);
    }
  }, [data?.faviconUrl, data?.thumbnailUrl]);

  useEffect(() => {
    const handleScroll = () => {
        if (!data) return;
        const sections = data.config.navItems.map(item => item.targetId);
        let current = '';
        for (const section of sections) {
            const element = document.getElementById(section);
            if (element) {
                const rect = element.getBoundingClientRect();
                if (rect.top <= window.innerHeight / 3) current = section;
            }
        }
        setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data]);

  const handleSave = async () => {
    if (data) {
      setIsSaving(true);
      try {
        await saveData(data);
        alert('Upload successful!');
      } catch (error: any) {
        alert('Upload failed: ' + error.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const updateField = (field: keyof ProfileData, value: any) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };
  
  const updateConfig = (field: keyof ProfileData['config'], value: any) => {
    if (!data) return;
    setData({ ...data, config: { ...data.config, [field]: value } });
  };

  const updateTextStyle = (id: string, newStyle: CustomTextStyle) => {
      if (!data) return;
      setData({ ...data, textStyles: { ...data.textStyles, [id]: newStyle } });
  };

  const updateNavItem = (index: number, field: keyof NavItem, value: string) => {
      if (!data) return;
      const newNav = [...data.config.navItems];
      newNav[index] = { ...newNav[index], [field]: value };
      updateConfig('navItems', newNav);
  }

  const updateSocial = (key: keyof ProfileData['social'], val: string) => {
    if (!data) return;
    setData({ ...data, social: { ...data.social, [key]: val } });
  };

  const addHighlight = () => {
    if (!data) return;
    const newH: HighlightItem[] = [...data.highlights, { label: "NEW ITEM", text: "New highlight description...", url: "" }];
    updateField('highlights', newH);
  };

  const updateHighlightField = (index: number, field: keyof HighlightItem, val: string) => {
    if (!data) return;
    const newH = [...data.highlights];
    newH[index] = { ...newH[index], [field]: val };
    updateField('highlights', newH);
  };

  const deleteHighlight = (index: number) => {
    if (!data) return;
    const newH = data.highlights.filter((_, i) => i !== index);
    updateField('highlights', newH);
  }

  const moveHighlight = (index: number, direction: 'up' | 'down') => {
      if (!data) return;
      const newH = [...data.highlights];
      if (direction === 'up' && index > 0) [newH[index], newH[index - 1]] = [newH[index - 1], newH[index]];
      else if (direction === 'down' && index < newH.length - 1) [newH[index], newH[index + 1]] = [newH[index + 1], newH[index]];
      updateField('highlights', newH);
  }

  const addPortfolioItem = () => {
    if (!data) return;
    const newItem: PortfolioItem = {
      id: Date.now().toString(),
      title: 'New Project',
      description: 'Project description...',
      role: 'My Role',
      imageUrl: 'https://picsum.photos/800/600',
      logoUrl: 'https://placehold.co/400x400/1a1a1a/ffffff?text=LOGO',
      gallery: Array(8).fill('https://picsum.photos/400/400'),
      videoUrl: '',
      projectUrl: ''
    };
    updateField('portfolio', [...data.portfolio, newItem]);
  };

  const updatePortfolioItem = (index: number, field: keyof PortfolioItem, val: any) => {
    if (!data) return;
    const newP = [...data.portfolio];
    newP[index] = { ...newP[index], [field]: val };
    updateField('portfolio', newP);
  };

  const deletePortfolioItem = (index: number) => {
    if (!data) return;
    const newP = data.portfolio.filter((_, i) => i !== index);
    updateField('portfolio', newP);
  };

  const movePortfolioItem = (index: number, direction: 'up' | 'down') => {
      if (!data) return;
      const newP = [...data.portfolio];
      if (direction === 'up' && index > 0) [newP[index], newP[index - 1]] = [newP[index - 1], newP[index]];
      else if (direction === 'down' && index < newP.length - 1) [newP[index], newP[index + 1]] = [newP[index + 1], newP[index]];
      updateField('portfolio', newP);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Quytran097') {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword('');
    } else {
      alert('Wrong password!');
    }
  };
  
  useEffect(() => {
    if (!isAdmin) document.body.style.cursor = 'none';
    else document.body.style.cursor = 'auto';
  }, [isAdmin]);

  const scrollToSection = (id: string) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  if (!data) return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
          <Loader2 size={40} className="animate-spin text-blue-500"/>
          <p>Loading System Data...</p>
      </div>
  );

  return (
    <div className={`min-h-screen bg-[#050505] text-[#EAEAEA] font-body relative overflow-x-hidden ${isAdmin ? '' : 'cursor-none md:cursor-none'}`}>
      {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}
      
      {!isAdmin && <GlowingCursor size={data.config.cursorSize} glowSize={data.config.cursorGlowSize} />}

      {showLogin && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm cursor-auto">
          <div className="bg-[#111] p-8 rounded-none border border-white/20 max-w-sm w-full relative shadow-2xl">
            <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-xl font-body uppercase tracking-widest mb-6 text-center text-blue-500">System Access</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="password" placeholder="Password" className="w-full bg-black border border-white/10 p-3 text-white focus:border-blue-500 focus:outline-none transition-colors font-mono" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="submit" className="w-full bg-white text-black font-bold py-3 hover:bg-gray-200 transition-colors uppercase tracking-wider text-sm">Login</button>
            </form>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-40 px-4 md:px-8 py-4 md:py-6 flex flex-row justify-between items-center bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-start cursor-auto">
          <div className="flex flex-col gap-1 relative group/navLogo">
            {(data.logoImageUrl || isAdmin) && (
                 <div className="w-16 md:w-32 mb-1">
                     {data.logoImageUrl ? (
                         <div className="relative">
                            <img src={data.logoImageUrl} alt="Logo" className="w-full h-auto object-contain" />
                            {isAdmin && <button onClick={() => updateField('logoImageUrl', '')} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover/navLogo:opacity-100 transition-opacity"><X size={10} /></button>}
                         </div>
                     ) : isAdmin && (
                         <div className="mb-2">
                             <input type="text" placeholder="Paste Logo Image URL..." className="bg-white/10 text-xs p-1 w-full border border-white/20" onChange={(e) => updateField('logoImageUrl', e.target.value)} />
                         </div>
                     )}
                 </div>
            )}
            {!data.logoImageUrl && (
                <div className="inline-block p-1">
                    <StyledEditableText id="logo_text" tagName="div" value={data.logoText || "TQ."} onChange={(val) => updateField('logoText', val)} isEditing={isAdmin} className="text-xl md:text-2xl font-black tracking-tighter leading-none bg-white text-black px-1" customStyle={data.textStyles['logo_text']} onStyleUpdate={(s) => updateTextStyle('logo_text', s)} />
                </div>
            )}
          </div>
          <div className="hidden sm:block text-[8px] md:text-[10px] tracking-widest mt-1 opacity-50"><EditableText tagName="span" value={data.config.versionText || "PORTFOLIO V.1.0"} onChange={(val) => updateConfig('versionText', val)} isEditing={isAdmin} /></div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 pointer-events-auto cursor-auto">
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-lg overflow-x-auto no-scrollbar">
                {data.config.navItems.map((item, index) => (
                    <div key={index} className="relative group/navItem shrink-0">
                        <button onClick={() => scrollToSection(item.targetId)} className={`px-2.5 md:px-4 py-1.5 rounded-full text-[10px] md:text-sm font-medium transition-all duration-300 ${activeSection === item.targetId ? 'bg-white text-black shadow-white/20 shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            {isAdmin ? <input value={item.label} onChange={(e) => updateNavItem(index, 'label', e.target.value)} className="bg-transparent text-center w-12 md:w-16 focus:outline-none" onClick={(e) => e.stopPropagation()} /> : item.label}
                        </button>
                        {isAdmin && <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#222] border border-white/20 p-2 rounded shadow-xl opacity-0 group-hover/navItem:opacity-100 pointer-events-none group-hover/navItem:pointer-events-auto transition-opacity z-50 flex gap-2 items-center min-w-[150px]"><span className="text-[10px] text-gray-500">ID:</span><input value={item.targetId} onChange={(e) => updateNavItem(index, 'targetId', e.target.value)} className="bg-black/50 text-xs text-blue-400 w-full p-1 rounded border border-white/10" /></div>}
                    </div>
                ))}
            </div>
            <div className="shrink-0">
            {!isAdmin ? (
                <button onClick={() => setShowLogin(true)} className="opacity-30 hover:opacity-100 transition-opacity p-2 border border-transparent hover:border-white/20 rounded-full cursor-pointer" title="Admin Access"><Settings size={14} /></button>
            ) : (
                <div className="flex gap-2 md:gap-4 bg-black/80 backdrop-blur border border-white/10 p-1 rounded-lg shadow-xl items-center flex-wrap justify-end">
                    <div className="relative">
                        <button onClick={() => { setShowSiteSettings(!showSiteSettings); setShowCursorSettings(false); }} className={`p-1.5 md:p-2 rounded transition-colors ${showSiteSettings ? 'bg-blue-600 text-white' : 'hover:bg-white/10'}`} title="Site Settings"><Globe size={16} /></button>
                        {showSiteSettings && (
                            <div className="absolute top-full mt-2 right-0 bg-[#1a1a1a] border border-white/20 p-4 rounded shadow-2xl w-72 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                <h4 className="text-[10px] text-blue-400 uppercase tracking-widest font-bold border-b border-white/10 pb-2">Site Identity</h4>
                                
                                {/* Favicon Section */}
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-500 uppercase tracking-widest flex justify-between items-center">
                                        <span>Favicon (Tab Icon)</span>
                                        {data.faviconUrl && <img src={data.faviconUrl} className="w-4 h-4 rounded-sm object-contain bg-white/10 p-0.5" alt="Favicon preview"/>}
                                    </label>
                                    <EditImage src={data.faviconUrl || ""} onImageChange={(url) => updateField('faviconUrl', url)} isEditing={isAdmin} className="h-12 border border-white/10 rounded-lg overflow-hidden" />
                                </div>

                                {/* Social Thumbnail Section */}
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-500 uppercase tracking-widest">Social Thumbnail (OG Image)</label>
                                    <EditImage src={data.thumbnailUrl || ""} onImageChange={(url) => updateField('thumbnailUrl', url)} isEditing={isAdmin} className="aspect-video border border-white/10 rounded-lg overflow-hidden" />
                                    <p className="text-[9px] text-gray-600 leading-tight italic">Recommended size: 1200x630px for better link sharing preview.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="relative">
                        <button onClick={() => { setShowCursorSettings(!showCursorSettings); setShowSiteSettings(false); }} className={`p-1.5 md:p-2 rounded transition-colors ${showCursorSettings ? 'bg-blue-600 text-white' : 'hover:bg-white/10'}`} title="Cursor Settings"><MousePointer size={16} /></button>
                        {showCursorSettings && (
                            <div className="absolute top-full mt-2 right-0 bg-[#1a1a1a] border border-white/20 p-4 rounded shadow-2xl w-48 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Dot Size: {data.config.cursorSize}px</label>
                                    <input type="range" min="4" max="100" value={data.config.cursorSize} onChange={(e) => updateConfig('cursorSize', parseInt(e.target.value))} className="w-full accent-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Glow Size: {data.config.cursorGlowSize}px</label>
                                    <input type="range" min="40" max="400" value={data.config.cursorGlowSize} onChange={(e) => updateConfig('cursorGlowSize', parseInt(e.target.value))} className="w-full accent-blue-500" />
                                </div>
                                <button onClick={() => { updateConfig('cursorSize', 24); updateConfig('cursorGlowSize', 120); }} className="w-full text-[9px] uppercase tracking-tighter text-gray-400 border border-white/5 py-1 hover:bg-white/5">Reset Cursor</button>
                            </div>
                        )}
                    </div>

                    {isFirebaseReady && <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/storage/rules`} target="_blank" rel="noreferrer" className="hidden lg:flex items-center gap-1 px-2 py-1 text-[10px] text-green-400 border border-green-500/30 rounded bg-green-900/20 mr-1 hover:bg-green-900/40 transition-colors"><CheckCircle2 size={12} /><span>Cloud Ready</span></a>}
                    <button onClick={() => setIsAdmin(false)} className="p-1.5 md:p-2 hover:bg-white/10 rounded" title="Logout"><LogOut size={16} /></button>
                    <button onClick={handleSave} className="flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white px-2 md:px-3 py-1 md:py-1.5 rounded font-bold text-[10px] md:text-xs" disabled={isSaving}>{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{isSaving ? '...' : 'SAVE'}</button>
                </div>
            )}
            </div>
        </div>
      </nav>

      <div className={`max-w-[1400px] mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-20 relative z-10 transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Intro Section */}
        <section id="home" className="flex flex-col lg:grid lg:grid-cols-12 gap-6 mt-4 md:mt-10 items-stretch">
            <div className="lg:col-span-4 flex flex-col w-full">
                 <SelectionFrame className="flex-1 aspect-[4/5] lg:aspect-auto min-h-[300px] lg:min-h-[400px] p-2 bg-[#0a0a0a]" label={<EditableText value={data.config.labelPortrait || "PORTRAIT_AVATAR"} onChange={val => updateConfig('labelPortrait', val)} isEditing={isAdmin} tagName="span" />}>
                    <EditImage src={data.avatarUrl} alt="Profile" onImageChange={(url) => updateField('avatarUrl', url)} isEditing={isAdmin} className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-700" />
                 </SelectionFrame>
            </div>
            <div className="lg:col-span-8 flex flex-col w-full">
                <SelectionFrame className="flex-1 flex flex-col justify-center p-6 md:p-12 lg:p-16 relative bg-[#080808]" label={<EditableText value={data.config.labelIntro || "INTRODUCTION"} onChange={val => updateConfig('labelIntro', val)} isEditing={isAdmin} tagName="span" />}>
                    <div className="max-w-3xl cursor-auto">
                        <StyledEditableText id="hero_role" tagName="h3" value={data.role} onChange={(val) => updateField('role', val)} isEditing={isAdmin} className="text-blue-500 tracking-[0.2em] text-[10px] md:text-base font-medium mb-3 md:mb-4 flex items-center gap-2 md:gap-4 before:content-[''] before:w-6 md:before:w-12 before:h-[1px] before:bg-blue-500 after:content-[''] after:w-6 md:after:w-12 after:h-[1px] after:bg-blue-500" customStyle={data.textStyles['hero_role']} onStyleUpdate={(s) => updateTextStyle('hero_role', s)} />
                        <StyledEditableText id="hero_name" tagName="h1" value={data.name} onChange={(val) => updateField('name', val)} isEditing={isAdmin} className="font-inter text-4xl sm:text-5xl md:text-8xl lg:text-9xl mb-8 md:mb-16 text-transparent bg-clip-text bg-gradient-to-r from-[#b0f279] via-[#2dd4bf] to-[#00e5ff] leading-[1.1] md:leading-normal py-2 md:py-4 font-black uppercase tracking-tighter" customStyle={data.textStyles['hero_name']} onStyleUpdate={(s) => updateTextStyle('hero_name', s)} />
                        <div className="text-gray-400 font-light text-sm md:text-xl leading-relaxed max-w-2xl"><StyledEditableText id="hero_bio" tagName="p" value={data.bioContent} onChange={(val) => updateField('bioContent', val)} isEditing={isAdmin} multiline customStyle={data.textStyles['hero_bio']} onStyleUpdate={(s) => updateTextStyle('hero_bio', s)} /></div>
                    </div>
                </SelectionFrame>
            </div>
        </section>

        {/* Highlights Section */}
        <section id="highlights" className="mt-6">
            <SelectionFrame className="p-4 md:p-12 bg-[#080808]" label={<EditableText value={data.config.labelHighlights || "GRID_LAYOUT"} onChange={val => updateConfig('labelHighlights', val)} isEditing={isAdmin} tagName="span" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 cursor-auto">
                     {data.highlights.map((highlight, index) => (
                        <div key={index} className="group relative bg-[#0a0a0a] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 flex items-center gap-4 md:gap-6 hover:border-blue-500/30 transition-all duration-500 shadow-2xl">
                             
                             {/* Left Icon Part */}
                             <div className="shrink-0 w-12 h-12 md:w-20 md:h-20 rounded-full bg-blue-500/5 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <Zap size={24} className="text-cyan-400 relative z-10" />
                             </div>

                             {/* Right Text Part */}
                             <div className="flex-1 min-w-0">
                                <div className="mb-0.5 md:mb-1">
                                    <StyledEditableText 
                                        id={`highlight_label_${index}`} 
                                        tagName="span" 
                                        value={highlight.label || "HIGHLIGHT"} 
                                        onChange={(val) => updateHighlightField(index, 'label', val)} 
                                        isEditing={isAdmin} 
                                        className="text-[8px] md:text-xs text-gray-500 font-bold uppercase tracking-[0.2em]" 
                                        customStyle={data.textStyles[`highlight_label_${index}`]} 
                                        onStyleUpdate={(s) => updateTextStyle(`highlight_label_${index}`, s)} 
                                    />
                                </div>
                                <div className="flex flex-col">
                                    {highlight.url && !isAdmin ? (
                                        <a href={highlight.url} target="_blank" rel="noopener noreferrer" className="text-white font-bold text-sm md:text-xl leading-snug hover:text-cyan-400 transition-colors truncate">
                                            {highlight.text} <ExternalLink size={12} className="inline ml-1 opacity-50"/>
                                        </a>
                                    ) : (
                                        <StyledEditableText 
                                            id={`highlight_text_${index}`} 
                                            tagName="p" 
                                            value={highlight.text} 
                                            onChange={(val) => updateHighlightField(index, 'text', val)} 
                                            isEditing={isAdmin} 
                                            multiline 
                                            className="text-white font-bold text-sm md:text-xl leading-snug break-words" 
                                            customStyle={data.textStyles[`highlight_text_${index}`]} 
                                            onStyleUpdate={(s) => updateTextStyle(`highlight_text_${index}`, s)} 
                                        />
                                    )}
                                </div>
                                {isAdmin && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <LinkIcon size={12} className="text-blue-500 shrink-0" />
                                        <input 
                                            type="text" 
                                            value={highlight.url || ""} 
                                            onChange={(e) => updateHighlightField(index, 'url', e.target.value)} 
                                            placeholder="Paste URL..." 
                                            className="bg-black/50 border border-white/10 text-[8px] md:text-[10px] p-1 w-full text-blue-300 focus:border-blue-500 focus:outline-none rounded" 
                                        />
                                    </div>
                                )}
                             </div>

                             {/* Admin Controls */}
                             {isAdmin && (
                                <div className="absolute top-2 right-2 md:top-4 md:right-4 flex gap-1 z-20 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoveButton direction="up" onClick={() => moveHighlight(index, 'up')} disabled={index === 0} />
                                    <MoveButton direction="down" onClick={() => moveHighlight(index, 'down')} disabled={index === data.highlights.length - 1} />
                                    <button onClick={() => deleteHighlight(index)} className="p-1 md:p-1.5 bg-red-600/80 rounded-full text-white shadow-lg"><Trash2 size={12}/></button>
                                </div>
                             )}
                        </div>
                     ))}
                     {isAdmin && (
                        <button 
                            onClick={addHighlight} 
                            className="bg-[#0a0a0a]/50 border-2 border-dashed border-white/5 rounded-2xl md:rounded-[2.5rem] flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-blue-500 transition-all p-6 md:p-8"
                        >
                            <Plus size={32} />
                            <span className="mt-2 text-[10px] md:text-sm uppercase tracking-wider font-bold">Add Highlight</span>
                        </button>
                     )}
                </div>
            </SelectionFrame>
        </section>

        {/* Portfolio Section */}
        <section id="work" className="mt-20">
             <div className="mb-8 md:mb-12 border-b border-white/10 pb-4 flex justify-between items-end cursor-auto">
                  <div>
                      <StyledEditableText id="work_title_main" tagName="h2" value={data.config.workTitleMain} onChange={(val) => updateConfig('workTitleMain', val)} isEditing={isAdmin} className="text-4xl sm:text-5xl md:text-8xl font-black text-white leading-none tracking-tighter" customStyle={data.textStyles['work_title_main']} onStyleUpdate={(s) => updateTextStyle('work_title_main', s)} />
                      <StyledEditableText id="work_title_sub" tagName="span" value={data.config.workTitleSub} onChange={(val) => updateConfig('workTitleSub', val)} isEditing={isAdmin} className="font-heading text-2xl md:text-5xl text-gray-500 block -mt-1 md:-mt-2 ml-1 md:ml-2" customStyle={data.textStyles['work_title_sub']} onStyleUpdate={(s) => updateTextStyle('work_title_sub', s)} />
                  </div>
             </div>

             <div className="space-y-24 md:space-y-40">
                 {data.portfolio.map((item, index) => (
                     <div key={item.id} className="relative group/project cursor-auto">
                         {isAdmin && <DeleteButton onClick={() => deletePortfolioItem(index)} />}
                         {isAdmin && <div className="absolute -top-8 right-2 md:right-10 flex gap-2"><MoveButton direction="up" onClick={() => movePortfolioItem(index, 'up')} disabled={index === 0} /><MoveButton direction="down" onClick={() => movePortfolioItem(index, 'down')} disabled={index === data.portfolio.length - 1} /></div>}

                         <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-start">
                             
                             {/* SIDEBAR LEFT (Logo & Buttons) */}
                             <div className="lg:w-[320px] shrink-0 w-full space-y-4 md:space-y-6">
                                  {/* Project Logo Box */}
                                  <div className="aspect-square bg-[#0f111a] rounded-2xl border border-white/5 p-6 md:p-8 flex items-center justify-center overflow-hidden shadow-2xl">
                                      <EditImage 
                                        src={item.logoUrl || ''}
                                        alt="Project Logo"
                                        onImageChange={(url) => updatePortfolioItem(index, 'logoUrl', url)}
                                        isEditing={isAdmin}
                                        className="w-full h-full object-contain brightness-110 contrast-125" 
                                      />
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="space-y-3">
                                      <a 
                                        href={item.projectUrl || '#'} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`w-full py-3 md:py-4 px-4 md:px-6 bg-[#0a0f1c] hover:bg-[#1a2538] border border-white/10 rounded-xl flex items-center justify-between text-[10px] md:text-xs font-bold tracking-[0.2em] text-blue-400 group/btn transition-all uppercase ${!item.projectUrl && !isAdmin ? 'pointer-events-none opacity-50' : ''}`}
                                      >
                                          <span>Visit Project</span>
                                          <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                      </a>
                                      
                                      {isAdmin && (
                                          <div className="p-3 bg-black/50 border border-blue-500/30 rounded-xl space-y-2">
                                              <span className="text-[8px] md:text-[10px] text-blue-400 font-bold uppercase tracking-widest">Link:</span>
                                              <input 
                                                type="text" 
                                                value={item.projectUrl || ''} 
                                                onChange={(e) => updatePortfolioItem(index, 'projectUrl', e.target.value)} 
                                                placeholder="Paste URL..." 
                                                className="w-full bg-white/5 border border-white/10 p-2 text-[8px] md:text-[10px] text-white focus:outline-none focus:border-blue-500"
                                              />
                                          </div>
                                      )}
                                  </div>
                             </div>

                             {/* CONTENT RIGHT */}
                             <div className="flex-1 w-full space-y-4 md:space-y-6">
                                  {/* Metadata/Role */}
                                  <StyledEditableText 
                                    id={`proj_role_${item.id}`}
                                    tagName="p"
                                    value={item.role ? `/ ${item.role.split('/').map(r => r.trim()).join(' / ')}` : "/ PROJECT ROLE"}
                                    onChange={(val) => updatePortfolioItem(index, 'role', val)}
                                    isEditing={isAdmin}
                                    className="text-gray-500 text-[8px] md:text-xs font-bold tracking-[0.3em] uppercase"
                                    customStyle={data.textStyles[`proj_role_${item.id}`]}
                                    onStyleUpdate={(s) => updateTextStyle(`proj_role_${item.id}`, s)}
                                  />

                                  {/* Title */}
                                  <StyledEditableText
                                    id={`proj_title_${item.id}`}
                                    tagName="h3"
                                    value={item.title}
                                    onChange={(val) => updatePortfolioItem(index, 'title', val)}
                                    isEditing={isAdmin}
                                    className="font-body text-2xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
                                    customStyle={data.textStyles[`proj_title_${item.id}`]}
                                    onStyleUpdate={(s) => updateTextStyle(`proj_title_${item.id}`, s)}
                                  />

                                  {/* Description */}
                                  <StyledEditableText
                                    id={`proj_desc_${item.id}`}
                                    tagName="p"
                                    value={item.description}
                                    onChange={(val) => updatePortfolioItem(index, 'description', val)}
                                    isEditing={isAdmin}
                                    className="text-gray-400 leading-relaxed font-light text-sm md:text-xl max-w-4xl"
                                    multiline
                                    customStyle={data.textStyles[`proj_desc_${item.id}`]}
                                    onStyleUpdate={(s) => updateTextStyle(`proj_desc_${item.id}`, s)}
                                  />

                                  {/* Video Player */}
                                  <div className="aspect-video bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/5 relative shadow-2xl my-6 md:my-10">
                                       {getYouTubeId(item.videoUrl || '') ? (
                                            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${getYouTubeId(item.videoUrl || '')}?rel=0&modestbranding=1&playsinline=1`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="absolute inset-0 z-10 w-full h-full"></iframe>
                                       ) : (
                                            <EditImage src={item.imageUrl} alt={item.title} onImageChange={(url) => updatePortfolioItem(index, 'imageUrl', url)} isEditing={isAdmin} className="w-full h-full object-cover" />
                                       )}
                                       {isAdmin && <div className="absolute top-0 right-0 z-50 p-2 bg-black/90 w-full border-b border-blue-500/30 flex flex-col md:flex-row gap-2"><span className="text-[8px] md:text-[10px] text-blue-400 font-bold shrink-0">YOUTUBE:</span><input type="text" value={item.videoUrl || ''} onChange={(e) => updatePortfolioItem(index, 'videoUrl', e.target.value)} placeholder="Link..." className="w-full bg-white/10 text-[8px] md:text-xs border border-white/20 p-1 text-white focus:outline-none focus:border-blue-500" /></div>}
                                  </div>

                                  {/* Gallery Grid */}
                                  <div className="pt-4 md:pt-6">
                                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                            {(item.gallery || []).map((url, gIdx) => (
                                                <div key={gIdx} className="aspect-square rounded-xl overflow-hidden border border-white/5 group/gall relative">
                                                     <EditImage 
                                                        src={url} 
                                                        alt={`Gallery ${gIdx}`} 
                                                        onImageChange={(newUrl) => {
                                                            const newGallery = [...(item.gallery || [])];
                                                            newGallery[gIdx] = newUrl;
                                                            updatePortfolioItem(index, 'gallery', newGallery);
                                                        }} 
                                                        isEditing={isAdmin}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/gall:scale-110"
                                                        onDelete={() => {
                                                            const newGallery = item.gallery?.filter((_, i) => i !== gIdx);
                                                            updatePortfolioItem(index, 'gallery', newGallery);
                                                        }}
                                                     />
                                                </div>
                                            ))}
                                            {isAdmin && (
                                                <button 
                                                    onClick={() => {
                                                        const newGallery = [...(item.gallery || []), 'https://picsum.photos/400/400'];
                                                        updatePortfolioItem(index, 'gallery', newGallery);
                                                    }}
                                                    className="aspect-square border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:border-blue-500 transition-all"
                                                >
                                                    <Plus size={24} />
                                                </button>
                                            )}
                                       </div>
                                  </div>
                             </div>
                         </div>
                     </div>
                 ))}
                 {isAdmin && <AddButton onClick={addPortfolioItem} label="Add New Project" />}
             </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="mt-24 md:mt-32 pt-12 md:pt-20 border-t border-white/10 cursor-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
                  <div>
                      <StyledEditableText 
                        id="contact_heading" 
                        tagName="h2" 
                        value={data.config.contactHeading || "Let's Create Together"} 
                        onChange={(val) => updateConfig('contactHeading', val)} 
                        isEditing={isAdmin} 
                        className="text-2xl md:text-4xl font-heading mb-6 md:mb-8" 
                        customStyle={data.textStyles['contact_heading']} 
                        onStyleUpdate={(s) => updateTextStyle('contact_heading', s)} 
                      />
                      <div className="flex flex-col gap-4 md:gap-6">
                           <div className="flex items-center gap-3 md:gap-4 group">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all shrink-0"><Phone size={20} /></div>
                                <div className="min-w-0"><span className="text-[8px] md:text-xs text-gray-500 uppercase tracking-widest block">Phone</span><StyledEditableText id="contact_phone" tagName="a" value={data.social.phone} onChange={(val) => updateSocial('phone', val)} isEditing={isAdmin} className="text-sm md:text-xl font-light truncate block" customStyle={data.textStyles['contact_phone']} onStyleUpdate={(s) => updateTextStyle('contact_phone', s)} /></div>
                           </div>
                           <div className="flex items-center gap-3 md:gap-4 group">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all shrink-0"><Mail size={20} /></div>
                                <div className="min-w-0"><span className="text-[8px] md:text-xs text-gray-500 uppercase tracking-widest block">Email</span><StyledEditableText id="contact_email" tagName="a" value={data.social.email} onChange={(val) => updateSocial('email', val)} isEditing={isAdmin} className="text-sm md:text-xl font-light truncate block" customStyle={data.textStyles['contact_email']} onStyleUpdate={(s) => updateTextStyle('contact_email', s)} /></div>
                           </div>
                      </div>
                  </div>
                  <div className="flex flex-col justify-end items-center md:items-end">
                       <div className="flex gap-4">
                            <a href={data.social.facebook} target="_blank" rel="noreferrer" className="w-12 h-12 md:w-16 md:h-16 border border-white/20 flex items-center justify-center hover:bg-blue-600 hover:border-transparent transition-all"><Facebook size={24} /></a>
                            <a href={data.social.tiktok} target="_blank" rel="noreferrer" className="w-12 h-12 md:w-16 md:h-16 border border-white/20 flex items-center justify-center hover:bg-white hover:text-black hover:border-transparent transition-all"><TikTokIcon className="text-xl md:text-2xl" /></a>
                       </div>
                       {isAdmin && (
                           <div className="mt-4 flex flex-col gap-2 w-full md:w-64">
                               <input value={data.social.facebook} onChange={(e) => updateSocial('facebook', e.target.value)} className="bg-transparent border border-white/10 p-1 text-[10px] text-gray-500 w-full" placeholder="Facebook URL" />
                               <input value={data.social.tiktok} onChange={(e) => updateSocial('tiktok', e.target.value)} className="bg-transparent border border-white/10 p-1 text-[10px] text-gray-500 w-full" placeholder="TikTok URL" />
                           </div>
                       )}
                  </div>
             </div>
             <div className="mt-12 md:mt-20 text-center text-gray-600 text-[8px] md:text-sm font-light uppercase tracking-widest">© {new Date().getFullYear()} Tran Thien Quy Portfolio</div>
        </section>
      </div>
    </div>
  );
};

export default App;
