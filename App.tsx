import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, Facebook, Settings, LogOut, X, Save, RotateCcw, Play, ArrowRight, Move, MousePointer2, ExternalLink, ArrowLeftRight, Trash2, Link as LinkIcon, Cloud, CheckCircle2, Download, Upload, Edit, Loader2 } from 'lucide-react';
import { ProfileData, PortfolioItem, HighlightItem, NavItem } from './types';
import { getData, saveData, resetData } from './services/dataService';
import { EditableText, EditImage, EditGallery, AddButton, DeleteButton, MoveButton } from './components/EditControls';
import { firebaseConfig } from './firebaseConfig';

// Custom icons that aren't in Lucide (TikTok)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} height="1em" width="1em">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"></path>
  </svg>
);

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
      videoUrl: '#'
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
                    <EditableText 
                        tagName="div"
                        value={data.logoText || "TQ."}
                        onChange={(val) => updateField('logoText', val)}
                        isEditing={isAdmin}
                        className="text-2xl font-black tracking-tighter leading-none bg-white text-black px-1"
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
                    <input type="file" ref={importInputRef} onChange={handleImport} className="hidden" accept=".json" />

                    <div className="w-[1px] h-4 bg-white/20 mx-1"></div>

                    <button onClick={handleReset} className="p-2 hover:bg-white/10 rounded text-red-400" title="Reset Data"><RotateCcw size={16}/></button>
                    
                    {/* Save Button with Loading State */}
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className={`p-2 rounded text-green-400 flex items-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`} 
                        title="Save Changes"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                        {isSaving && <span className="text-[10px]">Saving...</span>}
                    </button>
                    
                    <div className="w-[1px] bg-white/20 mx-1"></div>
                    <button onClick={() => setIsAdmin(false)} className="p-2 hover:bg-white/10 rounded text-white" title="Exit Admin"><LogOut size={16}/></button>
                </div>
            )}
            </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 pt-32 pb-24 px-4 sm:px-8 max-w-[1600px] mx-auto cursor-auto">
        
        {/* HERO SECTION */}
        <section id="home" className="min-h-[auto] md:min-h-[60vh] flex flex-col justify-start relative mb-20 md:mb-32 scroll-mt-32">
          
          {/* Background Decorative Type (Editable) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] md:text-[18vw] font-black text-[#111] select-none z-0 font-sans tracking-tighter leading-none opacity-50 whitespace-nowrap text-center">
             <EditableText 
                value={data.config.heroBackgroundText}
                onChange={val => updateConfig('heroBackgroundText', val)}
                isEditing={isAdmin}
                className="whitespace-nowrap"
             />
          </div>

          {/* Admin Toggle Layout Control */}
          {isAdmin && (
             <div className="absolute top-0 right-0 z-50">
                <button 
                   onClick={() => updateConfig('heroLayoutSwapped', !data.config.heroLayoutSwapped)}
                   className="flex items-center gap-2 text-xs bg-blue-900/50 text-blue-200 px-3 py-1 rounded border border-blue-500/30 hover:bg-blue-800"
                >
                   <ArrowLeftRight size={14} /> Swap Layout
                </button>
             </div>
          )}

          {/* Main Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch relative z-10 w-full min-h-[auto] lg:min-h-[350px] mt-[40px]">
             
             {/* Dynamic Order based on config */}
             {/* Column A: Avatar */}
             <div className={`lg:col-span-4 h-[300px] lg:h-auto ${data.config.heroLayoutSwapped ? 'lg:order-2' : 'lg:order-1'}`}>
                 <SelectionFrame 
                    className="w-full h-full bg-[#0A0A0A]" 
                    label={
                        <EditableText 
                            value={data.config.labelPortrait || "PORTRAIT_AVATAR"} 
                            onChange={v => updateConfig('labelPortrait', v)} 
                            isEditing={isAdmin} 
                            tagName="span"
                        />
                    }
                 >
                     <div className="w-full h-full overflow-hidden relative">
                        <EditImage 
                          src={data.avatarUrl}
                          alt="Portrait Avatar"
                          isEditing={isAdmin}
                          onImageChange={(url) => updateField('avatarUrl', url)}
                          className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
                     </div>
                 </SelectionFrame>
             </div>

             {/* Column B: Intro Text */}
             <div className={`lg:col-span-8 h-full ${data.config.heroLayoutSwapped ? 'lg:order-1' : 'lg:order-2'}`}>
                 <SelectionFrame 
                    className="bg-[#050505] p-6 md:p-12 h-full flex flex-col justify-center" 
                    label={
                        <EditableText 
                            value={data.config.labelIntro || "INTRODUCTION"} 
                            onChange={v => updateConfig('labelIntro', v)} 
                            isEditing={isAdmin} 
                            tagName="span"
                        />
                    }
                 >
                    <div className="flex flex-col items-start text-left w-full">
                       
                       <div className="flex items-center gap-3 mb-4 md:mb-6">
                          <span className="h-[1px] w-8 md:w-12 bg-blue-500"></span>
                          <EditableText 
                            tagName="h2"
                            isEditing={isAdmin}
                            value={data.role}
                            onChange={(val) => updateField('role', val)}
                            className="text-blue-500 text-xs md:text-base font-body font-normal tracking-[0.3em] uppercase whitespace-nowrap"
                          />
                       </div>

                       <div className="relative mb-6 md:mb-8 w-full">
                          <EditableText 
                            tagName="h1"
                            isEditing={isAdmin}
                            value={data.name}
                            onChange={(val) => updateField('name', val)}
                            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-heading font-thin text-white relative z-10 mix-blend-lighten leading-tight break-words"
                          />
                          {/* Stylized Cursor (Hidden if interactive cursor is active) */}
                          {isAdmin && (
                            <div className="absolute -top-4 -right-12 animate-bounce hidden md:block opacity-50">
                                <MousePointer2 size={32} className="text-white fill-black" />
                            </div>
                          )}
                       </div>

                       <div className="max-w-xl">
                          <EditableText 
                            tagName="p"
                            multiline
                            isEditing={isAdmin}
                            value={data.bioContent}
                            onChange={(val) => updateField('bioContent', val)}
                            className="text-gray-400 font-extralight text-base md:text-xl leading-relaxed"
                          />
                       </div>
                    </div>
                 </SelectionFrame>
             </div>

          </div>
        </section>


        {/* TABLE OF CONTENTS / HIGHLIGHTS */}
        <section id="highlights" className="mb-20 md:mb-40 max-w-6xl mx-auto scroll-mt-32">
           <div className="flex items-end justify-between mb-8 md:mb-16 px-2 md:px-4">
              <h3 className="text-3xl md:text-6xl font-heading relative z-10 flex flex-col">
                 <span className="font-sans font-black text-transparent stroke-white text-stroke-1 block text-lg md:text-2xl opacity-30 tracking-widest mb-[-5px] md:mb-[-10px]">
                    <EditableText value={data.config.tocSubtitle} onChange={v => updateConfig('tocSubtitle', v)} isEditing={isAdmin} tagName="span" />
                 </span>
                 <EditableText value={data.config.tocTitle} onChange={v => updateConfig('tocTitle', v)} isEditing={isAdmin} tagName="span" />
              </h3>
              <div className="hidden md:block">
                  <Move className="text-blue-500 animate-pulse" />
              </div>
           </div>
           
           <SelectionFrame 
                className="p-0 border-none" 
                label={
                    <EditableText 
                        value={data.config.labelHighlights || "GRID_LAYOUT"} 
                        onChange={v => updateConfig('labelHighlights', v)} 
                        isEditing={isAdmin} 
                        tagName="span"
                    />
                }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                 {data.highlights.map((item, index) => (
                    <div key={index} className="group relative p-6 md:p-8 border border-white/10 hover:border-blue-500/50 bg-[#0A0A0A] transition-all hover:-translate-y-2 h-full min-h-[200px] flex flex-col justify-between overflow-hidden cursor-none">
                       {/* Number Background */}
                       <div className="absolute -right-4 -top-6 text-[80px] md:text-[120px] font-black text-[#111] leading-none select-none group-hover:text-[#161618] transition-colors font-sans z-0">
                          {String(index + 1).padStart(2, '0')}
                       </div>

                       <div className="relative z-10">
                          {isAdmin && (
                              <div className="flex gap-1 mb-2 justify-end">
                                  <MoveButton direction="up" onClick={() => moveHighlight(index, 'up')} disabled={index === 0} />
                                  <MoveButton direction="down" onClick={() => moveHighlight(index, 'down')} disabled={index === data.highlights.length - 1} />
                                  <DeleteButton onClick={() => deleteHighlight(index)} />
                              </div>
                          )}
                          
                          {/* Hyperlink Text Logic */}
                          {item.url && !isAdmin ? (
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="block text-base md:text-lg font-light text-gray-300 hover:text-blue-400 transition-colors z-20 relative cursor-pointer">
                                  {item.text}
                                  <ExternalLink size={12} className="inline ml-1 mb-1 opacity-50"/>
                              </a>
                          ) : (
                              <EditableText 
                                isEditing={isAdmin}
                                multiline
                                value={item.text}
                                onChange={(val) => updateHighlightText(index, val)}
                                className="text-base md:text-lg font-light text-gray-300 group-hover:text-white transition-colors"
                              />
                          )}

                          {/* URL Input (Admin Only) */}
                          {isAdmin && (
                              <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
                                  <LinkIcon size={12} className="text-blue-500" />
                                  <input 
                                    type="text" 
                                    value={item.url || ""} 
                                    onChange={(e) => updateHighlightUrl(index, e.target.value)}
                                    placeholder="Enter URL to make clickable..."
                                    className="bg-transparent text-xs text-blue-300 w-full focus:outline-none border-b border-transparent focus:border-blue-500 placeholder-gray-700"
                                  />
                              </div>
                          )}
                       </div>

                       <div className="mt-6 md:mt-8 pt-4 border-t border-white/5 flex justify-between items-center opacity-50 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs uppercase tracking-widest text-blue-400">Highlight</span>
                          <ArrowRight size={16} className="text-blue-400 -rotate-45 group-hover:rotate-0 transition-transform" />
                       </div>
                    </div>
                 ))}
                 
                 {isAdmin && (
                   <button onClick={addHighlight} className="h-full min-h-[200px] border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 hover:text-blue-400 hover:border-blue-500/50 transition-all">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                         <span className="text-2xl">+</span>
                      </div>
                      <span className="uppercase tracking-widest text-sm">Add Entry</span>
                   </button>
                 )}
              </div>
           </SelectionFrame>
        </section>

        {/* PORTFOLIO SECTION */}
        <section id="work" className="mb-32 scroll-mt-32">
           <div className="max-w-[1600px] mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 px-4">
                 <div>
                    <h3 className="text-[12vw] md:text-8xl font-black text-white leading-[0.8] tracking-tighter flex items-end">
                       <EditableText value={data.config.workTitleMain} onChange={v => updateConfig('workTitleMain', v)} isEditing={isAdmin} tagName="span" />
                       <span className="text-blue-600 ml-4 md:ml-16 opacity-90 font-heading">
                          <EditableText value={data.config.workTitleSub} onChange={v => updateConfig('workTitleSub', v)} isEditing={isAdmin} tagName="span" />
                       </span>
                    </h3>
                 </div>
                 <div className="md:max-w-xs text-sm text-gray-400 font-light border-l border-white/20 pl-4 hidden md:block">
                    <EditableText value={data.config.workDescription} onChange={v => updateConfig('workDescription', v)} isEditing={isAdmin} multiline tagName="p" />
                 </div>
              </div>

              {/* PROJECT LIST */}
              <div className="space-y-24 md:space-y-32">
                  {data.portfolio.map((item, index) => (
                      <div key={item.id} className="relative group">
                         {isAdmin && (
                            <div className="absolute -top-12 left-0 z-20 bg-black/80 border border-white/20 p-2 rounded flex gap-2 items-center">
                                <span className="text-xs text-gray-500 uppercase font-mono mr-2">Project Controls:</span>
                                <MoveButton direction="up" onClick={() => movePortfolioItem(index, 'up')} disabled={index === 0} />
                                <MoveButton direction="down" onClick={() => movePortfolioItem(index, 'down')} disabled={index === data.portfolio.length - 1} />
                                <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
                                <button onClick={() => deletePortfolioItem(index)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16}/></button>
                            </div>
                         )}

                         <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 border-b border-white/5 pb-16">
                             
                             {/* LEFT COLUMN: INFO & VIDEO */}
                             <div className="w-full lg:w-1/3 space-y-8 flex flex-col">
                                 {/* Title & Role */}
                                 <div>
                                     <EditableText 
                                        tagName="h4"
                                        isEditing={isAdmin}
                                        value={item.role || "Role / Position"}
                                        onChange={(val) => updatePortfolioItem(index, 'role', val)}
                                        className="text-sm font-light text-gray-400 mb-2 block uppercase tracking-wide"
                                     />
                                     <EditableText 
                                        tagName="h3"
                                        isEditing={isAdmin}
                                        value={item.title}
                                        onChange={(val) => updatePortfolioItem(index, 'title', val)}
                                        // Changed font-heading to font-body as requested
                                        className="text-3xl md:text-5xl font-body font-medium leading-tight text-white mb-6"
                                     />
                                     <EditableText 
                                        tagName="p"
                                        multiline
                                        isEditing={isAdmin}
                                        value={item.description}
                                        onChange={(val) => updatePortfolioItem(index, 'description', val)}
                                        className="text-base text-gray-300 font-light leading-relaxed max-w-md"
                                     />
                                 </div>

                                 {/* Project Logo */}
                                 <div className="py-6">
                                     <div className="h-16 md:h-20 w-auto inline-block relative group/logo">
                                        <EditImage 
                                          src={item.logoUrl || "https://placehold.co/400x100/000000/FFFFFF/png?text=LOGO"}
                                          alt="Project Logo"
                                          isEditing={isAdmin}
                                          onImageChange={(url) => updatePortfolioItem(index, 'logoUrl', url)}
                                          className="h-full w-auto object-contain invert md:invert-0" 
                                        />
                                     </div>
                                 </div>

                                 {/* Video Button / Thumbnail */}
                                 <div className="mt-auto pt-8">
                                     <div className="relative aspect-video w-full overflow-hidden border border-white/10 group/video cursor-pointer">
                                         <EditImage
                                            src={item.imageUrl} // Using main image as video thumbnail
                                            alt="Video Thumbnail"
                                            isEditing={isAdmin}
                                            onImageChange={(url) => updatePortfolioItem(index, 'imageUrl', url)}
                                            className="w-full h-full object-cover opacity-60 group-hover/video:opacity-80 transition-opacity"
                                         />
                                         <div className="absolute inset-0 flex items-center justify-center">
                                             <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center shadow-2xl group-hover/video:scale-110 transition-transform">
                                                 <Play size={32} fill="white" className="text-white ml-1" />
                                             </div>
                                         </div>
                                         <div className="absolute bottom-4 right-4 flex gap-2">
                                             <span className="bg-black/80 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">Full Show</span>
                                         </div>
                                         {isAdmin && (
                                            <div className="absolute top-2 left-2 bg-black/80 p-2 z-10">
                                                <label className="text-xs text-gray-400 block">Video Link:</label>
                                                <input 
                                                    type="text" 
                                                    value={item.videoUrl} 
                                                    onChange={(e) => updatePortfolioItem(index, 'videoUrl', e.target.value)}
                                                    className="bg-transparent border-b border-white/50 text-white text-xs w-32 focus:outline-none" 
                                                />
                                            </div>
                                         )}
                                     </div>
                                 </div>
                             </div>

                             {/* RIGHT COLUMN: GALLERY */}
                             <div className="w-full lg:w-2/3">
                                <EditGallery 
                                    images={item.gallery || Array(12).fill("https://picsum.photos/400/400")}
                                    isEditing={isAdmin}
                                    onImagesChange={(newImages) => updatePortfolioItem(index, 'gallery', newImages)}
                                />
                             </div>
                         </div>
                      </div>
                  ))}
                  
                  {isAdmin && (
                    <div className="mt-20">
                         <AddButton onClick={addPortfolioItem} label="Add New Project" />
                    </div>
                  )}
              </div>
           </div>
        </section>

        {/* FOOTER / CONTACT */}
        <section id="contact" className="border-t border-white/10 pt-20 scroll-mt-32">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-sm">
                
                <div className="space-y-6">
                    <h4 className="font-heading text-2xl">Contact Me</h4>
                    <div className="space-y-2">
                        <div className="block text-gray-500 uppercase text-xs tracking-widest">Phone</div>
                        <EditableText isEditing={isAdmin} value={data.social.phone} onChange={val => updateSocial('phone', val)} className="text-lg font-light" />
                    </div>
                    <div className="space-y-2">
                        <div className="block text-gray-500 uppercase text-xs tracking-widest">Email</div>
                        <EditableText isEditing={isAdmin} value={data.social.email} onChange={val => updateSocial('email', val)} className="text-lg font-light" />
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="font-heading text-2xl">Socials</h4>
                    <div className="flex gap-4">
                        <a href={data.social.facebook} target="_blank" rel="noreferrer" className="w-12 h-12 border border-white/20 flex items-center justify-center rounded-full hover:bg-blue-600 hover:border-blue-600 transition-colors">
                           <Facebook size={20} />
                        </a>
                         <a href={data.social.tiktok} target="_blank" rel="noreferrer" className="w-12 h-12 border border-white/20 flex items-center justify-center rounded-full hover:bg-pink-600 hover:border-pink-600 transition-colors">
                           <TikTokIcon className="text-xl" />
                        </a>
                    </div>
                    {isAdmin && (
                        <div className="space-y-2">
                            <input type="text" value={data.social.facebook} onChange={e => updateSocial('facebook', e.target.value)} className="w-full bg-transparent border-b border-white/20 text-xs py-1" placeholder="Facebook URL" />
                            <input type="text" value={data.social.tiktok} onChange={e => updateSocial('tiktok', e.target.value)} className="w-full bg-transparent border-b border-white/20 text-xs py-1" placeholder="TikTok URL" />
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 relative">
                    <SelectionFrame 
                        className="h-full min-h-[200px] flex items-center justify-center bg-[#111] p-8" 
                        label={
                            <EditableText 
                                value={data.config.labelQuote || "ART_DIRECTION"} 
                                onChange={v => updateConfig('labelQuote', v)} 
                                isEditing={isAdmin} 
                                tagName="span"
                            />
                        }
                    >
                         <div className="text-center">
                            <p className="font-heading text-3xl md:text-4xl mb-4 italic">
                               <EditableText value={data.config.quoteContent} onChange={v => updateConfig('quoteContent', v)} isEditing={isAdmin} tagName="span" />
                            </p>
                            <p className="text-gray-500 font-light">— <EditableText value={data.config.quoteAuthor} onChange={v => updateConfig('quoteAuthor', v)} isEditing={isAdmin} tagName="span" /></p>
                         </div>
                    </SelectionFrame>
                </div>
            </div>
            
            <div className="mt-20 flex flex-col md:flex-row gap-4 justify-between items-center text-xs text-gray-600 uppercase tracking-widest font-mono">
                <p>© {new Date().getFullYear()} All Rights Reserved.</p>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">Scroll to top</button>
            </div>
        </section>

      </main>
    </div>
  );
};

export default App;