
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, ArrowUp, ArrowDown, CloudUpload, Loader2, FolderOpen, X, Paintbrush, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Type } from 'lucide-react';
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
      type={Tag === 'span' ? 'text' : 'text'}
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
            <div className="bg-[#111] border border-white/20 w-full max-w-4xl max-h-[80vh] flex flex-col rounded-lg shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-body font-extralight text-white">Thư viện ảnh (Cloud)</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">Chưa có ảnh nào được lưu trữ.</div>
                    ) : (
                        <div className="columns-3 md:columns-4 gap-4 space-y-4">
                            {images.map((url, idx) => (
                                <div key={idx} className="break-inside-avoid relative group cursor-pointer" onClick={() => onSelect(url)}>
                                    <img 
                                        src={url} 
                                        alt={`Stored ${idx}`} 
                                        className="w-full h-auto rounded border border-white/10 group-hover:border-blue-500 transition-all"
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
  onDelete?: () => void; // Added for gallery deletion support
}

export const EditImage: React.FC<EditImageProps> = ({ src, alt = "Image", onImageChange, isEditing, className = "", onDelete }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  // Sync internal state with prop
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
        alert("Upload successful! Nhớ nhấn nút SAVE trên thanh Admin để lưu lại.");
      } catch (error: any) {
        console.error("Upload error:", error);
        if (error.code === 'storage/unauthorized') {
            alert("Lỗi quyền truy cập (403): Vui lòng vào Firebase Console -> Storage -> Rules và set 'allow read, write: if true;'");
        } else {
             alert("Upload failed. Xem console để biết chi tiết.");
        }
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
      
      {/* Controls Overlay */}
      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
        {uploading ? (
          <Loader2 className="animate-spin text-white" />
        ) : (
          <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-blue-600 rounded-full hover:bg-blue-500 text-white transition-colors"
                title="Upload New"
              >
                <CloudUpload size={16} />
              </button>
              <button 
                onClick={() => setShowLibrary(true)}
                className="p-2 bg-orange-600 rounded-full hover:bg-orange-500 text-white transition-colors"
                title="Open Library"
              >
                <FolderOpen size={16} />
              </button>
              {onDelete && (
                  <button 
                    onClick={onDelete}
                    className="p-2 bg-red-600 rounded-full hover:bg-red-500 text-white transition-colors"
                    title="Delete Image"
                  >
                    <Trash2 size={16} />
                  </button>
              )}
          </div>
        )}
        <span className="text-xs text-white font-mono">Edit Image</span>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleUpload}
      />

      <ImageLibraryModal 
        isOpen={showLibrary} 
        onClose={() => setShowLibrary(false)} 
        onSelect={handleLibrarySelect} 
      />
    </div>
  );
};

// --- Gallery Management ---
// Single item in the masonry grid
const GalleryItemUploader: React.FC<{ url: string, index: number, onChange: (url: string) => void, onDelete: () => void, isEditing: boolean }> = ({ url, index, onChange, onDelete, isEditing }) => {
    return (
        <div className="break-inside-avoid mb-4 relative group">
             <EditImage 
                src={url} 
                alt={`Gallery ${index}`} 
                onImageChange={onChange} 
                isEditing={isEditing}
                className="w-full h-auto rounded-lg border border-transparent hover:border-white/20 transition-all"
                onDelete={onDelete}
             />
        </div>
    );
};

interface EditGalleryProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  isEditing: boolean;
}

export const EditGallery: React.FC<EditGalleryProps> = ({ images, onImagesChange, isEditing }) => {
  const updateImage = (index: number, newUrl: string) => {
    const newImages = [...images];
    newImages[index] = newUrl;
    onImagesChange(newImages);
  };

  const removeImage = (index: number) => {
      if (window.confirm("Delete this image?")) {
          const newImages = images.filter((_, i) => i !== index);
          onImagesChange(newImages);
      }
  };

  const addImage = () => {
      const newImages = [...images, 'https://picsum.photos/400/600']; // Default placeholder
      onImagesChange(newImages);
  };

  return (
    <div>
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {images.map((url, index) => (
                <GalleryItemUploader 
                    key={index} 
                    url={url} 
                    index={index} 
                    onChange={(newUrl) => updateImage(index, newUrl)}
                    onDelete={() => removeImage(index)}
                    isEditing={isEditing}
                />
            ))}
        </div>
        
        {isEditing && (
            <button 
                onClick={addImage}
                className="mt-4 w-full py-4 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:border-blue-500 hover:bg-blue-500/10 transition-all group"
            >
                <Plus className="mr-2 group-hover:scale-110 transition-transform" />
                <span>Add Image to Gallery</span>
            </button>
        )}
    </div>
  );
};

// --- Buttons ---

export const AddButton: React.FC<{ onClick: () => void, label?: string }> = ({ onClick, label = "Add Item" }) => (
  <button 
    onClick={onClick}
    className="w-full py-4 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:border-white hover:bg-white/5 transition-all mt-8"
  >
    <Plus size={20} className="mr-2" />
    <span className="uppercase tracking-widest text-sm font-bold">{label}</span>
  </button>
);

export const DeleteButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete this item?')) onClick(); }}
    className="absolute -top-3 -right-3 z-50 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover/project:opacity-100 transition-opacity hover:bg-red-500 shadow-lg"
    title="Delete Item"
  >
    <Trash2 size={16} />
  </button>
);

export const MoveButton: React.FC<{ direction: 'up' | 'down', onClick: () => void, disabled?: boolean }> = ({ direction, onClick, disabled }) => {
    if (disabled) return null;
    return (
        <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="p-1 bg-white/10 hover:bg-blue-500 text-white rounded transition-colors"
            title={`Move ${direction}`}
        >
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
        <div className="absolute z-50 top-full left-0 mt-2 bg-[#1a1a1a] border border-white/20 p-4 rounded-lg shadow-2xl w-[250px] flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Text Style</span>
                <button onClick={onClose}><X size={14} className="text-gray-500 hover:text-white"/></button>
            </div>

            {/* Color */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-12">Color</span>
                <input 
                    type="color" 
                    value={currentStyle.color || '#ffffff'} 
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                />
            </div>

            {/* Font Size */}
            <div className="flex items-center gap-2">
                 <span className="text-xs text-gray-500 w-12">Size</span>
                 <input 
                    type="text" 
                    value={currentStyle.fontSize || ''} 
                    placeholder="e.g. 2rem"
                    onChange={(e) => handleChange('fontSize', e.target.value)}
                    className="bg-black border border-white/10 text-xs p-1 rounded w-full text-white"
                 />
            </div>
            
             {/* Font Weight */}
             <div className="flex items-center gap-2">
                 <span className="text-xs text-gray-500 w-12">Weight</span>
                 <select 
                    value={currentStyle.fontWeight || 'normal'}
                    onChange={(e) => handleChange('fontWeight', e.target.value)}
                    className="bg-black border border-white/10 text-xs p-1 rounded w-full text-white"
                 >
                     <option value="100">Thin (100)</option>
                     <option value="300">Light (300)</option>
                     <option value="400">Normal (400)</option>
                     <option value="700">Bold (700)</option>
                     <option value="900">Black (900)</option>
                 </select>
            </div>

            {/* Alignment */}
            <div className="flex items-center justify-between bg-black/50 p-1 rounded">
                <button onClick={() => handleChange('textAlign', 'left')} className={`p-1 rounded ${currentStyle.textAlign === 'left' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}><AlignLeft size={14}/></button>
                <button onClick={() => handleChange('textAlign', 'center')} className={`p-1 rounded ${currentStyle.textAlign === 'center' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}><AlignCenter size={14}/></button>
                <button onClick={() => handleChange('textAlign', 'right')} className={`p-1 rounded ${currentStyle.textAlign === 'right' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}><AlignRight size={14}/></button>
            </div>

            {/* Decorations */}
            <div className="flex items-center gap-2">
                 <button 
                    onClick={() => handleChange('fontStyle', currentStyle.fontStyle === 'italic' ? 'normal' : 'italic')}
                    className={`p-1 rounded border border-white/10 flex-1 flex justify-center ${currentStyle.fontStyle === 'italic' ? 'bg-blue-600 border-blue-600' : ''}`}
                 >
                     <Italic size={14} />
                 </button>
                 <button 
                    onClick={() => handleChange('textTransform', currentStyle.textTransform === 'uppercase' ? 'none' : 'uppercase')}
                    className={`p-1 rounded border border-white/10 flex-1 flex justify-center ${currentStyle.textTransform === 'uppercase' ? 'bg-blue-600 border-blue-600' : ''}`}
                 >
                     <Type size={14} />
                 </button>
            </div>
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

    return (
        <div className="relative group/style">
            <EditableText 
                {...props} 
                style={combinedStyle}
            />
            
            {props.isEditing && props.onStyleUpdate && (
                <>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowStyleEditor(!showStyleEditor); }}
                        className="absolute -top-3 -right-3 z-40 bg-gray-700 text-white p-1.5 rounded-full opacity-0 group-hover/style:opacity-100 transition-opacity hover:bg-blue-600 shadow-lg"
                        title="Edit Text Style"
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
