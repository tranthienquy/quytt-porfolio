
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, ArrowUp, ArrowDown, CloudUpload, Loader2, FolderOpen, X, Paintbrush, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Type, Square, GripVertical } from 'lucide-react';
import { uploadFileToFirebase, getStoredImages } from '../services/uploadService';
import { CustomTextStyle } from '../types';

interface EditableTextProps {
  value: string;
  onChange: (val: string) => void;
  isEditing: boolean;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div' | 'a';
  style?: React.CSSProperties;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  isEditing,
  className = '',
  multiline = false,
  placeholder = 'Enter text...',
  tagName: Tag = 'div',
  style = {}
}) => {
  if (!isEditing) {
    return <Tag className={className} style={style}>{value}</Tag>;
  }

  const baseInputStyles = "bg-white/10 border border-blue-500/50 text-white px-2 py-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  if (multiline) {
    return (
      <textarea
        className={`${className} ${baseInputStyles} min-h-[100px]`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={style}
      />
    );
  }

  return (
    <input
      type="text"
      className={`${className} ${baseInputStyles}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={style}
    />
  );
};

// --- Image Library Modal ---
interface ImageLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

const ImageLibraryModal: React.FC<ImageLibraryModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getStoredImages().then(urls => {
                setImages(urls);
                setLoading(false);
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/20 w-full max-w-4xl max-h-[80vh] flex flex-col rounded-lg shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
                    <h3 className="text-xl font-body font-extralight text-white">Thư viện ảnh (Cloud)</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/40">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">Chưa có ảnh nào được lưu trữ.</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {images.map((url, idx) => (
                                <div key={idx} className="relative group cursor-pointer aspect-square" onClick={() => onSelect(url)}>
                                    <img 
                                        src={url} 
                                        alt={`Stored ${idx}`} 
                                        className="w-full h-full object-cover rounded border border-white/10 group-hover:border-blue-500 transition-all"
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">Select</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Image Uploader ---

interface EditImageProps {
  src: string;
  alt?: string;
  onImageChange: (url: string) => void;
  isEditing: boolean;
  className?: string;
  onDelete?: () => void;
}

export const EditImage: React.FC<EditImageProps> = ({ src, alt = "Image", onImageChange, isEditing, className = "", onDelete }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const url = await uploadFileToFirebase(file);
        setImgSrc(url);
        onImageChange(url);
      } catch (error: any) {
        console.error("Upload error:", error);
        alert("Upload failed. Check console for details.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleLibrarySelect = (url: string) => {
      setImgSrc(url);
      onImageChange(url);
      setShowLibrary(false);
  };

  if (!isEditing) {
    return (
        <img 
            src={imgSrc} 
            alt={alt} 
            className={className} 
            loading="lazy" 
            referrerPolicy="no-referrer"
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/600x400/1a1a1a/ffffff?text=Image+Error';
            }}
        />
    );
  }

  return (
    <div className={`relative group min-h-[50px] ${className}`}>
      <img 
        src={imgSrc} 
        alt={alt} 
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
        referrerPolicy="no-referrer"
        onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://placehold.co/600x400/1a1a1a/ffffff?text=Image+Error';
        }}
      />
      
      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2 z-10">
        {uploading ? (
          <Loader2 className="animate-spin text-white" />
        ) : (
          <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-blue-600 rounded-full hover:bg-blue-500 text-white transition-colors" title="Upload New"><CloudUpload size={16} /></button>
              <button onClick={() => setShowLibrary(true)} className="p-2 bg-orange-600 rounded-full hover:bg-orange-500 text-white transition-colors" title="Open Library"><FolderOpen size={16} /></button>
              {onDelete && <button onClick={onDelete} className="p-2 bg-red-600 rounded-full hover:bg-red-500 text-white transition-colors" title="Delete Image"><Trash2 size={16} /></button>}
          </div>
        )}
      </div>
      
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload}/>
      <ImageLibraryModal isOpen={showLibrary} onClose={() => setShowLibrary(false)} onSelect={handleLibrarySelect} />
    </div>
  );
};

// --- Buttons ---

export const AddButton: React.FC<{ onClick: () => void, label?: string }> = ({ onClick, label = "Add Item" }) => (
  <button onClick={onClick} className="w-full py-4 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:border-white hover:bg-white/5 transition-all mt-8">
    <Plus size={20} className="mr-2" />
    <span className="uppercase tracking-widest text-sm font-bold">{label}</span>
  </button>
);

export const DeleteButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete this item?')) onClick(); }} className="absolute -top-3 -right-3 z-50 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover/project:opacity-100 transition-opacity hover:bg-red-500 shadow-lg">
    <Trash2 size={16} />
  </button>
);

export const MoveButton: React.FC<{ direction: 'up' | 'down', onClick: () => void, disabled?: boolean }> = ({ direction, onClick, disabled }) => {
    if (disabled) return null;
    return (
        <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="p-1 bg-white/10 hover:bg-blue-500 text-white rounded transition-colors">
            {direction === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        </button>
    )
}

// --- Style Editor ---

const StyleEditor: React.FC<{
    currentStyle: CustomTextStyle;
    onUpdate: (style: CustomTextStyle) => void;
    onClose: () => void;
}> = ({ currentStyle, onUpdate, onClose }) => {
    
    const handleChange = (key: keyof CustomTextStyle, value: any) => {
        onUpdate({ ...currentStyle, [key]: value });
    };

    return (
        <div className="absolute z-[100] top-full right-0 mt-2 bg-[#1a1a1a] border border-white/20 p-4 rounded-lg shadow-2xl w-[280px] flex flex-col gap-4 text-left cursor-default animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <Paintbrush size={14} className="text-blue-500" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Định dạng chữ</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors"><X size={14} className="text-gray-500 hover:text-white"/></button>
            </div>

            {/* Font Family */}
            <div className="space-y-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Phông chữ (Font)</span>
                <select 
                    value={currentStyle.fontFamily || ''}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    className="bg-black border border-white/10 text-xs p-2 rounded w-full text-white focus:border-blue-500 outline-none"
                >
                    <option value="">Mặc định (Inherit)</option>
                    <option value="'SVN-Gratelos Display', sans-serif">SVN-Gratelos Display (Nghệ thuật)</option>
                    <option value="'Inter', sans-serif">Inter (Hiện đại)</option>
                    <option value="'Playwrite CZ', cursive">Playwrite CZ (Viết tay)</option>
                    <option value="'Be Vietnam Pro', sans-serif">Be Vietnam Pro (Tối giản)</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Color */}
                <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Màu sắc</span>
                    <div className="flex items-center gap-2 bg-black border border-white/10 p-1.5 rounded h-[36px]">
                        <input 
                            type="color" 
                            value={currentStyle.color || '#ffffff'} 
                            onChange={(e) => handleChange('color', e.target.value)}
                            className="w-full h-full rounded cursor-pointer border-none bg-transparent"
                        />
                    </div>
                </div>

                {/* Font Size */}
                <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Cỡ chữ (px/rem)</span>
                    <input 
                        type="text" 
                        value={currentStyle.fontSize || ''} 
                        placeholder="VD: 1.5rem"
                        onChange={(e) => handleChange('fontSize', e.target.value)}
                        className="bg-black border border-white/10 text-xs p-2 rounded w-full text-white h-[36px] outline-none"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {/* Font Weight */}
                <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Độ dày (Bold)</span>
                    <select 
                        value={currentStyle.fontWeight || '400'}
                        onChange={(e) => handleChange('fontWeight', e.target.value)}
                        className="bg-black border border-white/10 text-xs p-2 rounded w-full text-white h-[36px] outline-none"
                    >
                        <option value="100">Siêu mỏng (100)</option>
                        <option value="300">Mỏng (300)</option>
                        <option value="400">Thường (400)</option>
                        <option value="500">Vừa (500)</option>
                        <option value="700">Đậm (700)</option>
                        <option value="900">Siêu đậm (900)</option>
                    </select>
                </div>

                {/* Letter Spacing */}
                <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Khoảng cách chữ</span>
                    <input 
                        type="text" 
                        value={currentStyle.letterSpacing || ''} 
                        placeholder="VD: 2px"
                        onChange={(e) => handleChange('letterSpacing', e.target.value)}
                        className="bg-black border border-white/10 text-xs p-2 rounded w-full text-white h-[36px] outline-none"
                    />
                </div>
            </div>

            {/* Alignment & Styles */}
            <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-between bg-black border border-white/10 p-1 rounded h-[36px]">
                    <button onClick={() => handleChange('textAlign', 'left')} className={`p-1 rounded ${currentStyle.textAlign === 'left' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}><AlignLeft size={14}/></button>
                    <button onClick={() => handleChange('textAlign', 'center')} className={`p-1 rounded ${currentStyle.textAlign === 'center' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}><AlignCenter size={14}/></button>
                    <button onClick={() => handleChange('textAlign', 'right')} className={`p-1 rounded ${currentStyle.textAlign === 'right' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}><AlignRight size={14}/></button>
                </div>
                <div className="flex gap-1 h-[36px]">
                    <button 
                        onClick={() => handleChange('fontStyle', currentStyle.fontStyle === 'italic' ? 'normal' : 'italic')}
                        className={`w-9 rounded border border-white/10 flex items-center justify-center transition-colors ${currentStyle.fontStyle === 'italic' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-black text-gray-500 hover:text-gray-300'}`}
                    >
                        <Italic size={14} />
                    </button>
                    <button 
                        onClick={() => handleChange('textTransform', currentStyle.textTransform === 'uppercase' ? 'none' : 'uppercase')}
                        className={`w-9 rounded border border-white/10 flex items-center justify-center transition-colors ${currentStyle.textTransform === 'uppercase' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-black text-gray-500 hover:text-gray-300'}`}
                    >
                        <Type size={14} />
                    </button>
                </div>
            </div>
            
            <button 
                onClick={() => onUpdate({})} 
                className="text-[10px] text-red-400 hover:text-red-300 text-center uppercase tracking-widest pt-2 border-t border-white/5"
            >
                Reset format mặc định
            </button>
        </div>
    );
};

interface StyledEditableTextProps extends EditableTextProps {
    customStyle?: CustomTextStyle;
    onStyleUpdate?: (style: CustomTextStyle) => void;
    id?: string;
}

export const StyledEditableText: React.FC<StyledEditableTextProps> = (props) => {
    const [showStyleEditor, setShowStyleEditor] = useState(false);
    
    // Merge props style with custom style
    const combinedStyle: React.CSSProperties = {
        ...props.style,
        color: props.customStyle?.color,
        fontSize: props.customStyle?.fontSize,
        fontWeight: props.customStyle?.fontWeight,
        fontStyle: props.customStyle?.fontStyle,
        textAlign: props.customStyle?.textAlign,
        textTransform: props.customStyle?.textTransform,
        fontFamily: props.customStyle?.fontFamily,
        lineHeight: props.customStyle?.lineHeight,
        letterSpacing: props.customStyle?.letterSpacing,
    };

    // If a custom color is set, override the transparent text/gradient styles typically used in this app
    const hasCustomStyle = Object.keys(props.customStyle || {}).length > 0;
    const finalClassName = hasCustomStyle && props.customStyle?.color 
        ? props.className?.replace(/text-transparent|bg-clip-text|bg-gradient-to-[^ ]+/g, '') 
        : props.className;

    return (
        <div className="relative group/style inline-block w-full">
            <EditableText 
                {...props} 
                className={finalClassName}
                style={combinedStyle}
            />
            
            {props.isEditing && props.onStyleUpdate && (
                <>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowStyleEditor(!showStyleEditor); }}
                        className="absolute -top-3 -right-3 z-40 bg-[#222] text-white p-1.5 rounded-full opacity-0 group-hover/style:opacity-100 transition-opacity hover:bg-blue-600 shadow-xl border border-white/10"
                        title="Tùy chỉnh Style"
                    >
                        <Paintbrush size={12} />
                    </button>
                    
                    {showStyleEditor && (
                        <StyleEditor 
                            currentStyle={props.customStyle || {}} 
                            onUpdate={props.onStyleUpdate}
                            onClose={() => setShowStyleEditor(false)}
                        />
                    )}
                </>
            )}
        </div>
    );
};
