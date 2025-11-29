import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, Facebook, Settings, LogOut, X, Save, RotateCcw, Play, ArrowRight, Move, MousePointer2, ExternalLink, ArrowLeftRight, Trash2, Link as LinkIcon, Cloud, CheckCircle2, Download, Upload, Edit, Loader2, Plus } from 'lucide-react';
import { ProfileData, PortfolioItem, HighlightItem, NavItem, CustomTextStyle } from './types';
import { getData, saveData, resetData } from './services/dataService';
import { EditableText, EditImage, EditGallery, AddButton, DeleteButton, MoveButton, StyledEditableText } from './components/EditControls';
import { firebaseConfig } from './firebaseConfig';

// Custom icons that aren't in Lucide (TikTok)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} height="1em" width="1em">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"></path>
  </svg>
);

// Helper to extract YouTube ID
const getYouTubeId = (url: string) => {
    if (!url) return null;
    // Enhanced regex to handle more formats and potential whitespace
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.trim().match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// --- GLOWING CURSOR COMPONENT ---
const GlowingCursor = () => {
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
            // Using translate3d for hardware acceleration
            const transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
            
            if (cursorRef.current) {
                cursorRef.current.style.transform = transform;
            }
            if (glowRef.current) {
                glowRef.current.style.transform = transform;
            }
            
            requestRef.current = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', onMouseMove);
        requestRef.current = requestAnimationFrame(animate);
        
        // Hide default cursor
        document.body.style.cursor = 'none';

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            document.body.style.cursor = 'auto';
        };
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
            {/* The Large Glow (Ambient Light) */}
            <div 
                ref={glowRef}
                className="absolute top-0 left-0 w-[120px] h-[120px] bg-white rounded-full opacity-50 mix-blend-screen pointer-events-none will-change-transform"
                style={{
                    filter: 'blur(30px)',
                    // Removed transition here to prevent slipping
                }}
            />
            {/* The Core Sphere (The physical orb) - Size increased to w-8 (32px) */}
            <div 
                ref={cursorRef}
                className="absolute top-0 left-0 w-8 h-8 bg-white rounded-full shadow-[0_0_20px_4px_rgba(255,255,255,0.9)] mix-blend-normal pointer-events-none will-change-transform"
            />
        </div>
    );
};


// Selection Frame Component for that "Design Tool" look
const SelectionFrame = ({ children, className = "", label }: { children?: React.ReactNode, className?: string, label?: React.ReactNode }) => (
  <div className={`relative border border-dashed border-white/20 group ${className}`}>
    {/* Corners */}
    <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-black z-10"></div>
    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-black z-10"></div>
    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-black z-10"></div>
    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-black z-10"></div>
    
    {/* Middle points */}
    <div className="absolute top-1/2 -left-1 w-2 h-2 bg-white border border-black -translate-y-1/2 hidden md:block z-10"></div>
    <div className="absolute top-1/2 -right-1 w-2 h-2 bg-white border border-black -translate-y-1/2 hidden md:block z-10"></div>
    <div className="absolute -top-1 left-1/2 w-2 h-2 bg-white border border-black -translate-x-1/2 hidden md:block z-10"></div>
    <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-white border border-black -translate-x-1/2 hidden md:block z-10"></div>

    {/* Label */}
    {label && (
      <div className="absolute -top-6 left-0 text-[10px] uppercase tracking-widest text-gray-500 font-sans flex items-center gap-1">
        {label}
      </div>
    )}
    
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
  const [isSaving, setIsSaving] = useState(false); // New state for async save
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load data asynchronously
    getData().then(loadedData => {
        setData(loadedData);
    });
    
    // Check if firebase config is present (simple check)
    if (firebaseConfig.projectId && firebaseConfig.projectId !== "PROJECT_ID") {
        setIsFirebaseReady(true);
    }
  }, []);

  // Scroll Spy Logic
  useEffect(() => {
    const handleScroll = () => {
        if (!data) return;
        const sections = data.config.navItems.map(item => item.targetId);
        
        let current = '';
        for (const section of sections) {
            const element = document.getElementById(section);
            if (element) {
                const rect = element.getBoundingClientRect();
                // Check if element is in view (approx 1/3 of screen height)
                if (rect.top <= window.innerHeight / 3) {
                    current = section;
                }
            }
        }
        setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data]);

  const handleSave = async () => {
    if (data) {
      setIsSaving(true);
      try {
        await saveData(data);
        alert('Upload successful! Dữ liệu đã được lưu lên Cloud.');
      } catch (error: any) {
        console.error("Save error:", error);
        if (error.code === 'permission-denied') {
             alert('Upload failed: Lỗi quyền truy cập! Vui lòng tạo Firestore Database và set Rules "allow read, write: if true;"');
        } else if (error.code === 'unimplemented') {
             alert('Upload failed: Chưa bật Firestore Database trong Firebase Console.');
        } else {
             alert('Upload failed: ' + error.message);
        }
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all data to default? This cannot be undone.')) {
      const def = resetData();
      setData(def);
    }
  };

  // Export Data to JSON file
  const handleExport = () => {
      if (!data) return;
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = "portfolio_backup.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Import Data from JSON file
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              // Basic validation check
              if (json && json.portfolio && json.config) {
                  if (window.confirm("This will overwrite your current data with the imported file. Continue?")) {
                      setData(json);
                      // Auto save to cloud after import
                      setIsSaving(true);
                      await saveData(json);
                      setIsSaving(false);
                      alert("Import successful & Saved to Cloud!");
                  }
              } else {
                  alert("Invalid file format.");
              }
          } catch (err) {
              console.error(err);
              alert("Failed to parse JSON file.");
          }
      };
      reader.readAsText(file);
      // Reset input value
      e.target.value = '';
  };

  const updateField = (field: keyof ProfileData, value: any) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };
  
  const updateConfig = (field: keyof ProfileData['config'], value: any) => {
    if (!data) return;
    setData({ 
        ...data, 
        config: { ...data.config, [field]: value } 
    });
  };

  // --- Style Management ---
  const updateTextStyle = (id: string, newStyle: CustomTextStyle) => {
      if (!data) return;
      setData({
          ...data,
          textStyles: {
              ...data.textStyles,
              [id]: newStyle
          }
      });
  };

  const updateNavItem = (index: number, field: keyof NavItem, value: string) => {
      if (!data) return;
      const newNav = [...data.config.navItems];
      newNav[index] = { ...newNav[index], [field]: value };
      updateConfig('navItems', newNav);
  }

  const updateSocial = (key: keyof ProfileData['social'], val: string) => {
    if (!data) return;
    setData({
      ...data,
      social: { ...data.social, [key]: val }
    });
  };

  // --- Highlights Management ---
  const addHighlight = () => {
    if (!data) return;
    const newH: HighlightItem[] = [...data.highlights, { text: "New highlight description goes here...", url: "" }];
    updateField('highlights', newH);
  };

  const updateHighlightText = (index: number, val: string) => {
    if (!data) return;
    const newH = [...data.highlights];
    newH[index] = { ...newH[index], text: val };
    updateField('highlights', newH);
  };

  const updateHighlightUrl = (index: number, val: string) => {
    if (!data) return;
    const newH = [...data.highlights];
    newH[index] = { ...newH[index], url: val };
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
      if (direction === 'up' && index > 0) {
          [newH[index], newH[index - 1]] = [newH[index - 1], newH[index]];
      } else if (direction === 'down' && index < newH.length - 1) {
          [newH[index], newH[index + 1]] = [newH[index + 1], newH[index]];
      }
      updateField('highlights', newH);
  }

  // --- Portfolio Management ---
  const addPortfolioItem = () => {
    if (!data) return;
    const newItem: PortfolioItem = {
      id: Date.now().toString(),
      title: 'New Project',
      description: 'Project description...',
      role: 'My Role',
      imageUrl: 'https://picsum.photos/800/600',
      logoUrl: 'https://placehold.co/400x100/000000/FFFFFF/png?text=PROJECT+LOGO',
      gallery: Array(12).fill('https://picsum.photos/400/400'),
      videoUrl: ''
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
      if (direction === 'up' && index > 0) {
          [newP[index], newP[index - 1]] = [newP[index - 1], newP[index]];
      } else if (direction === 'down' && index < newP.length - 1) {
          [newP[index], newP[index + 1]] = [newP[index + 1], newP[index]];
      }
      updateField('portfolio', newP);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Quytran097') {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword('');
      // Re-enable cursor when entering admin mode to make editing easier
      document.body.style.cursor = 'auto';
    } else {
      alert('Wrong password!');
    }
  };
  
  // Toggle cursor back on log out
  useEffect(() => {
    if (!isAdmin) {
        document.body.style.cursor = 'none';
    }
  }, [isAdmin]);

  const scrollToSection = (id: string) => {
      const el = document.getElementById(id);
      if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
      }
  };

  if (!data) return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
          <Loader2 size={40} className="animate-spin text-blue-500"/>
          <p>Loading System Data...</p>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-[#EAEAEA] font-body relative overflow-x-hidden cursor-none">
      
      {/* Show Glowing Cursor only when NOT in Admin mode (or make it optional) */}
      {!isAdmin && <GlowingCursor />}

      {/* Admin Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm cursor-auto">
          <div className="bg-[#111] p-8 rounded-none border border-white/20 max-w-sm w-full relative shadow-2xl">
            <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-xl font-body uppercase tracking-widest mb-6 text-center text-blue-500">System Access</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full bg-black border border-white/10 p-3 text-white focus:border-blue-500 focus:outline-none transition-colors font-mono"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="submit" className="w-full bg-white text-black font-bold py-3 hover:bg-gray-200 transition-colors uppercase tracking-wider text-sm">
                Login
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-40 px-4 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center md:items-start bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none">
        
        {/* Left: Logo */}
        <div className="pointer-events-auto flex flex-col items-center md:items-start mb-4 md:mb-0 cursor-auto">
          <div className="flex flex-col gap-1 relative group/navLogo">
            {/* Logo Image or Text Logic */}
            {(data.logoImageUrl || isAdmin) && (
                 <div className="w-20 md:w-32 mb-1">
                     {data.logoImageUrl ? (
                         <div className="relative">
                            <img src={data.logoImageUrl} alt="Logo" className="w-full h-auto object-contain" />
                            {isAdmin && (
                                <button 
                                    onClick={() => updateField('logoImageUrl', '')} 
                                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover/navLogo:opacity-100 transition-opacity"
                                    title="Remove Image Logo"
                                >
                                    <X size={10} />
                                </button>
                            )}
                         </div>
                     ) : isAdmin && (
                         <div className="mb-2">
                             <input 
                                type="text" 
                                placeholder="Paste Logo Image URL..." 
                                className="bg-white/10 text-xs p-1 w-full border border-white/20"
                                onChange={(e) => updateField('logoImageUrl', e.target.value)}
                             />
                             <div className="text-[10px] text-gray-500 mt-1">Or edit text below</div>
                         </div>
                     )}
                 </div>
            )}

            {/* Fallback to Text Logo if no image */}
            {!data.logoImageUrl && (
                <div className="inline-block p-1">
                    <StyledEditableText
                        id="logo_text"
                        tagName="div"
                        value={data.logoText || "TQ."}
                        onChange={(val) => updateField('logoText', val)}
                        isEditing={isAdmin}
                        className="text-2xl font-black tracking-tighter leading-none bg-white text-black px-1"
                        customStyle={data.textStyles['logo_text']}
                        onStyleUpdate={(s) => updateTextStyle('logo_text', s)}
                    />
                </div>
            )}
          </div>
          
          {/* Editable Version Text */}
          <div className="text-[10px] tracking-widest mt-1 opacity-50">
               <EditableText 
                  tagName="span"
                  value={data.config.versionText || "PORTFOLIO V.1.0"}
                  onChange={(val) => updateConfig('versionText', val)}
                  isEditing={isAdmin}
               />
          </div>
        </div>
        
        {/* Right: Navigation & Admin Controls */}
        <div className="flex flex-col md:flex-row items-center gap-4 pointer-events-auto cursor-auto">
            
            {/* PILL NAVIGATION MENU */}
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1.5 shadow-lg">
                {data.config.navItems.map((item, index) => (
                    <div key={index} className="relative group/navItem">
                        <button
                            onClick={() => scrollToSection(item.targetId)}
                            className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300 ${
                                activeSection === item.targetId 
                                ? 'bg-white text-black shadow-white/20 shadow-lg scale-105' 
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {isAdmin ? (
                                <input 
                                    value={item.label}
                                    onChange={(e) => updateNavItem(index, 'label', e.target.value)}
                                    className="bg-transparent text-center w-16 focus:outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : item.label}
                        </button>
                        
                        {/* Edit Link Target Popover (Admin Only) */}
                        {isAdmin && (
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#222] border border-white/20 p-2 rounded shadow-xl opacity-0 group-hover/navItem:opacity-100 pointer-events-none group-hover/navItem:pointer-events-auto transition-opacity z-50 flex gap-2 items-center min-w-[150px]">
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">ID:</span>
                                <input 
                                    value={item.targetId}
                                    onChange={(e) => updateNavItem(index, 'targetId', e.target.value)}
                                    className="bg-black/50 text-xs text-blue-400 w-full p-1 rounded border border-white/10"
                                    placeholder="Section ID"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Admin Controls */}
            <div>
            {!isAdmin ? (
                <button 
                onClick={() => setShowLogin(true)} 
                className="text-xs font-mono opacity-30 hover:opacity-100 transition-opacity flex items-center gap-2 border border-transparent hover:border-white/20 px-3 py-1 rounded-full cursor-pointer"
                >
                <Settings size={12} /> <span className="hidden sm:inline">ADMIN</span>
                </button>
            ) : (
                <div className="flex gap-2 bg-black/80 backdrop-blur border border-white/10 p-1.5 rounded-lg shadow-xl items-center flex-wrap justify-end">
                    {/* Firebase Status Indicator & Rules Link */}
                    {isFirebaseReady && (
                    <a 
                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/storage/rules`}
                        target="_blank"
                        rel="noreferrer"
                        className="hidden md:flex items-center gap-1 px-2 py-1 text-[10px] text-green-400 border border-green-500/30 rounded bg-green-900/20 mr-2 hover:bg-green-900/40 transition-colors"
                        title="Click to check Firebase Storage Rules"
                    >
                        <CheckCircle2 size={12} />
                        <span>Cloud Ready</span>
                    </a>
                    )}

                    {/* Import/Export Buttons */}
                    <button onClick={handleExport} className="p-2 hover:bg-white/10 rounded text-blue-400" title="Export Backup JSON">
                        <Download size={16} />
                    </button>
                    <button onClick={() => importInputRef.current?.click()} className="p-2 hover:bg-white/10 rounded text-orange-400" title="Import JSON">
                        <Upload size={16} />
                    </button>
                    <input type="file" ref={importInputRef} onChange={handleImport} className="hidden" accept="application/json" />
                    
                    <button onClick={handleReset} className="p-2 hover:bg-white/10 rounded text-red-400" title="Reset Data">
                        <RotateCcw size={16} />
                    </button>
                    
                    <button 
                        onClick={handleSave} 
                        className="flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded font-bold text-xs"
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'SAVING...' : 'SAVE'}
                    </button>
                    
                    <button onClick={() => setIsAdmin(false)} className="p-2 hover:bg-white/10 rounded" title="Logout">
                        <LogOut size={16} />
                    </button>
                </div>
            )}
            </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 pt-32 pb-20 relative z-10">
        
        {/* HERO SECTION */}
        <section id="home" className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-[40px] min-h-[350px] items-stretch">
            
            {/* PORTRAIT AVATAR (LEFT) */}
            <div className="lg:col-span-4 flex flex-col h-full">
                 <SelectionFrame 
                    className="flex-1 min-h-[300px] p-2 bg-[#0a0a0a]"
                    label={
                        <EditableText 
                            value={data.config.labelPortrait || "PORTRAIT_AVATAR"} 
                            onChange={val => updateConfig('labelPortrait', val)} 
                            isEditing={isAdmin}
                            tagName="span"
                        />
                    }
                 >
                    <EditImage 
                        src={data.avatarUrl} 
                        alt="Profile" 
                        onImageChange={(url) => updateField('avatarUrl', url)} 
                        isEditing={isAdmin}
                        className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
                    />
                 </SelectionFrame>
            </div>

            {/* INTRODUCTION (RIGHT) */}
            <div className="lg:col-span-8 flex flex-col h-full">
                <SelectionFrame 
                    className="flex-1 flex flex-col justify-center p-8 md:p-12 relative bg-[#080808]"
                    label={
                        <EditableText 
                            value={data.config.labelIntro || "INTRODUCTION"} 
                            onChange={val => updateConfig('labelIntro', val)} 
                            isEditing={isAdmin}
                            tagName="span"
                        />
                    }
                >
                    <div className="max-w-3xl">
                        <StyledEditableText 
                            id="hero_role"
                            tagName="h3"
                            value={data.role}
                            onChange={(val) => updateField('role', val)}
                            isEditing={isAdmin}
                            className="text-blue-500 tracking-[0.2em] text-sm md:text-base font-medium mb-4 flex items-center gap-4 before:content-[''] before:w-12 before:h-[1px] before:bg-blue-500 after:content-[''] after:w-12 after:h-[1px] after:bg-blue-500"
                            customStyle={data.textStyles['hero_role']}
                            onStyleUpdate={(s) => updateTextStyle('hero_role', s)}
                        />
                        
                        <StyledEditableText 
                            id="hero_name"
                            tagName="h1"
                            value={data.name}
                            onChange={(val) => updateField('name', val)}
                            isEditing={isAdmin}
                            className="font-heading text-6xl md:text-8xl lg:text-9xl mb-16 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 leading-normal py-10"
                            customStyle={data.textStyles['hero_name']}
                            onStyleUpdate={(s) => updateTextStyle('hero_name', s)}
                        />
                        
                        <div className="text-gray-400 font-light text-lg md:text-xl leading-relaxed max-w-2xl">
                             <StyledEditableText 
                                id="hero_bio"
                                tagName="p"
                                value={data.bioContent}
                                onChange={(val) => updateField('bioContent', val)}
                                isEditing={isAdmin}
                                multiline
                                customStyle={data.textStyles['hero_bio']}
                                onStyleUpdate={(s) => updateTextStyle('hero_bio', s)}
                            />
                        </div>
                    </div>

                    {/* Stylized Cursor Icon (Purely Visual) */}
                    <div className="absolute top-10 right-10 opacity-20 hidden lg:block pointer-events-none">
                        <MousePointer2 size={120} strokeWidth={0.5} />
                    </div>
                </SelectionFrame>
            </div>

        </section>

        {/* HIGHLIGHTS SECTION */}
        <section id="highlights" className="mt-6">
            <SelectionFrame 
                className="p-8 md:p-12 bg-[#080808]"
                label={
                    <EditableText 
                        value={data.config.labelHighlights || "GRID_LAYOUT"} 
                        onChange={val => updateConfig('labelHighlights', val)} 
                        isEditing={isAdmin}
                        tagName="span"
                    />
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                     {data.highlights.map((highlight, index) => (
                        <div key={index} className="group relative">
                             {/* Highlight Number */}
                             <div className="text-8xl font-black text-[#151515] absolute -top-10 -left-6 z-0 select-none group-hover:text-[#222] transition-colors">
                                {String(index + 1).padStart(2, '0')}
                             </div>
                             
                             {/* Content */}
                             <div className="relative z-10 pt-4 border-t border-white/10 group-hover:border-blue-500/50 transition-colors">
                                <div className="min-h-[60px] flex items-start">
                                    {/* Link Support */}
                                    {highlight.url && !isAdmin ? (
                                        <a href={highlight.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 font-light text-lg leading-relaxed hover:text-blue-400 transition-colors block">
                                            {highlight.text} <ExternalLink size={14} className="inline ml-1 opacity-50"/>
                                        </a>
                                    ) : (
                                        <StyledEditableText
                                            id={`highlight_${index}`}
                                            tagName="p"
                                            value={highlight.text}
                                            onChange={(val) => updateHighlightText(index, val)}
                                            isEditing={isAdmin}
                                            multiline
                                            className="text-gray-300 font-light text-lg leading-relaxed"
                                            customStyle={data.textStyles[`highlight_${index}`]}
                                            onStyleUpdate={(s) => updateTextStyle(`highlight_${index}`, s)}
                                        />
                                    )}
                                </div>

                                {/* Admin Link Input */}
                                {isAdmin && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <LinkIcon size={12} className="text-blue-500" />
                                        <input 
                                            type="text" 
                                            value={highlight.url} 
                                            onChange={(e) => updateHighlightUrl(index, e.target.value)}
                                            placeholder="Paste URL here..."
                                            className="bg-black border border-white/10 text-[10px] p-1 w-full text-blue-300 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                )}
                             </div>

                             {/* Admin Controls */}
                             {isAdmin && (
                                <div className="absolute top-0 right-0 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoveButton direction="up" onClick={() => moveHighlight(index, 'up')} disabled={index === 0} />
                                    <MoveButton direction="down" onClick={() => moveHighlight(index, 'down')} disabled={index === data.highlights.length - 1} />
                                    <button onClick={() => deleteHighlight(index)} className="p-1 bg-red-500/80 rounded text-white"><Trash2 size={14}/></button>
                                </div>
                             )}
                        </div>
                     ))}
                     
                     {isAdmin && (
                        <button onClick={addHighlight} className="min-h-[200px] border border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-blue-500 transition-all rounded">
                            <Plus size={32} />
                            <span className="mt-2 text-sm uppercase tracking-wider">Add Highlight</span>
                        </button>
                     )}
                </div>
            </SelectionFrame>
        </section>

        {/* QUOTE SECTION (ART_DIRECTION) */}
        <section className="mt-6">
             <SelectionFrame 
                className="bg-white text-black p-12 md:p-24 flex flex-col items-center justify-center text-center relative overflow-hidden"
                label={
                    <EditableText 
                        value={data.config.labelQuote || "ART_DIRECTION"} 
                        onChange={val => updateConfig('labelQuote', val)} 
                        isEditing={isAdmin}
                        tagName="span"
                    />
                }
             >
                  {/* Decorative huge typography background */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
                      <span className="text-[40vw] font-heading leading-none">Art</span>
                  </div>

                  <StyledEditableText
                    id="quote_content"
                    tagName="h2"
                    value={data.config.quoteContent}
                    onChange={(val) => updateConfig('quoteContent', val)}
                    isEditing={isAdmin}
                    className="font-heading text-5xl md:text-7xl lg:text-8xl mb-8 relative z-10"
                    multiline
                    customStyle={data.textStyles['quote_content']}
                    onStyleUpdate={(s) => updateTextStyle('quote_content', s)}
                  />
                  
                  <div className="flex items-center gap-4 relative z-10">
                       <div className="h-[1px] w-12 bg-black"></div>
                       <StyledEditableText
                        id="quote_author"
                        tagName="p"
                        value={data.config.quoteAuthor}
                        onChange={(val) => updateConfig('quoteAuthor', val)}
                        isEditing={isAdmin}
                        className="font-sans uppercase tracking-[0.2em] text-sm font-bold"
                        customStyle={data.textStyles['quote_author']}
                        onStyleUpdate={(s) => updateTextStyle('quote_author', s)}
                       />
                       <div className="h-[1px] w-12 bg-black"></div>
                  </div>
             </SelectionFrame>
        </section>

        {/* PORTFOLIO SECTION (WORK Folio) */}
        <section id="work" className="mt-20">
             <div className="mb-12 border-b border-white/10 pb-4 flex justify-between items-end">
                  <div>
                      <StyledEditableText
                        id="work_title_main"
                        tagName="h2"
                        value={data.config.workTitleMain}
                        onChange={(val) => updateConfig('workTitleMain', val)}
                        isEditing={isAdmin}
                        className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter"
                        customStyle={data.textStyles['work_title_main']}
                        onStyleUpdate={(s) => updateTextStyle('work_title_main', s)}
                      />
                      <StyledEditableText 
                        id="work_title_sub"
                        tagName="span"
                        value={data.config.workTitleSub}
                        onChange={(val) => updateConfig('workTitleSub', val)}
                        isEditing={isAdmin}
                        className="font-heading text-4xl md:text-5xl text-gray-500 block -mt-2 ml-2"
                        customStyle={data.textStyles['work_title_sub']}
                        onStyleUpdate={(s) => updateTextStyle('work_title_sub', s)}
                      />
                  </div>
                  <StyledEditableText 
                     id="work_desc"
                     tagName="p"
                     value={data.config.workDescription}
                     onChange={(val) => updateConfig('workDescription', val)}
                     isEditing={isAdmin}
                     className="hidden md:block text-gray-400 max-w-xs text-right text-sm"
                     multiline
                     customStyle={data.textStyles['work_desc']}
                     onStyleUpdate={(s) => updateTextStyle('work_desc', s)}
                  />
             </div>

             <div className="space-y-32">
                 {data.portfolio.map((item, index) => (
                     <div key={item.id} className="relative group/project">
                         {isAdmin && <DeleteButton onClick={() => deletePortfolioItem(index)} />}
                         {isAdmin && (
                            <div className="absolute -top-10 right-10 flex gap-2">
                                <MoveButton direction="up" onClick={() => movePortfolioItem(index, 'up')} disabled={index === 0} />
                                <MoveButton direction="down" onClick={() => movePortfolioItem(index, 'down')} disabled={index === data.portfolio.length - 1} />
                            </div>
                         )}

                         <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
                             
                             {/* LEFT COLUMN: Info & Video */}
                             <div className="lg:w-1/3 lg:sticky lg:top-32 w-full">
                                  {/* Role */}
                                  <StyledEditableText 
                                    id={`proj_role_${item.id}`}
                                    tagName="p"
                                    value={item.role || "Role"}
                                    onChange={(val) => updatePortfolioItem(index, 'role', val)}
                                    isEditing={isAdmin}
                                    className="text-gray-400 text-sm md:text-base mb-2"
                                    customStyle={data.textStyles[`proj_role_${item.id}`]}
                                    onStyleUpdate={(s) => updateTextStyle(`proj_role_${item.id}`, s)}
                                  />

                                  {/* Title (Changed to font-body sans-serif) */}
                                  <StyledEditableText
                                    id={`proj_title_${item.id}`}
                                    tagName="h3"
                                    value={item.title}
                                    onChange={(val) => updatePortfolioItem(index, 'title', val)}
                                    isEditing={isAdmin}
                                    className="font-body text-3xl md:text-5xl font-light text-white mb-6 leading-tight"
                                    multiline
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
                                    className="text-gray-400 leading-relaxed mb-8 font-light"
                                    multiline
                                    customStyle={data.textStyles[`proj_desc_${item.id}`]}
                                    onStyleUpdate={(s) => updateTextStyle(`proj_desc_${item.id}`, s)}
                                  />

                                  {/* Project Logo - Styled with fixed aspect ratio */}
                                  <div className="mb-8" style={{ aspectRatio: '768/354', maxWidth: '100%' }}>
                                      <EditImage 
                                        src={item.logoUrl || ''}
                                        alt="Project Logo"
                                        onImageChange={(url) => updatePortfolioItem(index, 'logoUrl', url)}
                                        isEditing={isAdmin}
                                        className="w-full h-full object-contain" 
                                      />
                                  </div>

                                  {/* Video Section (YouTube Embed) */}
                                  <div className="relative aspect-video bg-black/50 border border-white/10 group overflow-hidden mt-8 w-full">
                                       {/* If valid Youtube ID, show iframe */}
                                       {getYouTubeId(item.videoUrl || '') ? (
                                            <iframe 
                                                width="100%" 
                                                height="100%" 
                                                src={`https://www.youtube.com/embed/${getYouTubeId(item.videoUrl || '')}?rel=0&modestbranding=1&playsinline=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                                                title="YouTube video player" 
                                                frameBorder="0" 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                                allowFullScreen
                                                referrerPolicy="strict-origin-when-cross-origin"
                                                className="absolute inset-0 z-10 w-full h-full"
                                            ></iframe>
                                       ) : (
                                            /* Fallback Thumbnail if no video or invalid link */
                                            <EditImage 
                                                src={item.imageUrl} 
                                                alt={item.title} 
                                                onImageChange={(url) => updatePortfolioItem(index, 'imageUrl', url)} 
                                                isEditing={isAdmin}
                                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                            />
                                       )}

                                       {/* Admin Input for Video URL (Always visible in Admin mode, z-index higher than iframe) */}
                                       {isAdmin && (
                                            <div className="absolute top-0 right-0 z-50 p-2 bg-black/90 w-full border-b border-blue-500/30">
                                                <span className="text-[10px] text-blue-400 block mb-1 font-bold">YOUTUBE URL:</span>
                                                <input 
                                                    type="text" 
                                                    value={item.videoUrl || ''}
                                                    onChange={(e) => updatePortfolioItem(index, 'videoUrl', e.target.value)}
                                                    placeholder="Paste Youtube Link..."
                                                    className="w-full bg-white/10 text-xs border border-white/20 p-1 text-white focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                       )}
                                  </div>
                             </div>

                             {/* RIGHT COLUMN: Gallery Grid */}
                             <div className="lg:w-2/3 w-full">
                                  <EditGallery 
                                    images={item.gallery || []}
                                    onImagesChange={(imgs) => updatePortfolioItem(index, 'gallery', imgs)}
                                    isEditing={isAdmin}
                                  />
                             </div>
                         </div>
                     </div>
                 ))}

                 {isAdmin && <AddButton onClick={addPortfolioItem} label="Add New Project" />}
             </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="mt-32 pt-20 border-t border-white/10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                      <h2 className="text-4xl font-heading mb-8">Let's Create Together</h2>
                      <div className="flex flex-col gap-6">
                           <div className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-widest block">Phone</span>
                                    <StyledEditableText
                                        id="contact_phone"
                                        tagName="a"
                                        value={data.social.phone}
                                        onChange={(val) => updateSocial('phone', val)}
                                        isEditing={isAdmin}
                                        className="text-xl font-light"
                                        customStyle={data.textStyles['contact_phone']}
                                        onStyleUpdate={(s) => updateTextStyle('contact_phone', s)}
                                    />
                                </div>
                           </div>
                           
                           <div className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-widest block">Email</span>
                                    <StyledEditableText
                                        id="contact_email"
                                        tagName="a"
                                        value={data.social.email}
                                        onChange={(val) => updateSocial('email', val)}
                                        isEditing={isAdmin}
                                        className="text-xl font-light"
                                        customStyle={data.textStyles['contact_email']}
                                        onStyleUpdate={(s) => updateTextStyle('contact_email', s)}
                                    />
                                </div>
                           </div>
                      </div>
                  </div>
                  
                  <div className="flex flex-col justify-end items-start md:items-end">
                       <div className="flex gap-4">
                            <a href={data.social.facebook} target="_blank" rel="noreferrer" className="w-16 h-16 border border-white/20 flex items-center justify-center hover:bg-blue-600 hover:border-transparent transition-all">
                                <Facebook size={24} />
                            </a>
                            <a href={data.social.tiktok} target="_blank" rel="noreferrer" className="w-16 h-16 border border-white/20 flex items-center justify-center hover:bg-black hover:border-white transition-all">
                                <TikTokIcon className="text-2xl" />
                            </a>
                       </div>
                       
                       {isAdmin && (
                           <div className="mt-4 flex flex-col gap-2 w-full md:w-auto">
                               <input 
                                value={data.social.facebook} 
                                onChange={(e) => updateSocial('facebook', e.target.value)}
                                className="bg-transparent border border-white/10 p-1 text-xs text-gray-500 w-full"
                                placeholder="Facebook URL"
                               />
                               <input 
                                value={data.social.tiktok} 
                                onChange={(e) => updateSocial('tiktok', e.target.value)}
                                className="bg-transparent border border-white/10 p-1 text-xs text-gray-500 w-full"
                                placeholder="TikTok URL"
                               />
                           </div>
                       )}
                  </div>
             </div>
             
             <div className="mt-20 text-center text-gray-600 text-sm font-light uppercase tracking-widest">
                  © {new Date().getFullYear()} Tran Thien Quy Portfolio
             </div>
        </section>

      </div>
    </div>
  );
};

export default App;