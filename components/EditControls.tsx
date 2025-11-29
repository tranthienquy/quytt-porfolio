
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
  style?: React.CSSProperties; // Add style support
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
    // If tagName is 'a', we assume it might handle its own logic elsewhere, 
    // but here we render basic text. For actual links, use specific wrapper.
    return <Tag className={className} style={style}>{value}</Tag>;
  }

  const baseInputStyles = "bg-white/10 border border-blue-500/50 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-400 w-full transition-all font-inherit";

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseInputStyles} ${className} min-h-[100px] resize-y`}
        placeholder={placeholder}
        style={style}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseInputStyles} ${className}`}
      placeholder={placeholder}
      style={style}
    />
  );
};

// --- STYLE EDITOR COMPONENT ---
interface StyleEditorProps {
    currentStyle: CustomTextStyle;
    onStyleChange: (newStyle: CustomTextStyle) => void;
    onClose: () => void;
}

const StyleEditor: React.FC<StyleEditorProps> = ({ currentStyle, onStyleChange, onClose }) => {
    const updateStyle = (key: keyof CustomTextStyle, value: any) => {
        onStyleChange({ ...currentStyle, [key]: value });
    };

    return (
        <div className="absolute top-full mt-2 left-0 z-50 bg-[#1a1a1a] border border-white/20 p-4 rounded-lg shadow-2xl w-64 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Text Styles</span>
                <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={14}/></button>
            </div>

            {/* Color */}
            <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Color</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="color" 
                        value={currentStyle.color || '#ffffff'} 
                        onChange={(e) => updateStyle('color', e.target.value)}
                        className="w-6 h-6 rounded bg-transparent cursor-pointer border-none p-0"
                    />
                    <span className="text-[10px] font-mono text-gray-500">{currentStyle.color}</span>
                </div>
            </div>

            {/* Size */}
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Font Size</label>
                <div className="flex gap-2">
                    <input 
                        type="range" 
                        min="12" 
                        max="128" 
                        step="1"
                        value={parseInt(currentStyle.fontSize || '16')}
                        onChange={(e) => updateStyle('fontSize', `${e.target.value}px`)}
                        className="flex-1"
                    />
                    <input 
                        type="text"
                        value={currentStyle.fontSize || ''}
                        onChange={(e) => updateStyle('fontSize', e.target.value)}
                        className="w-12 bg-black border border-white/20 text-[10px] p-1 text-center"
                        placeholder="px/rem"
                    />
                </div>
            </div>

            {/* Font Family */}
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Font Family</label>
                <select 
                    value={currentStyle.fontFamily || ''} 
                    onChange={(e) => updateStyle('fontFamily', e.target.value)}
                    className="w-full bg-black border border-white/20 text-xs p-1 rounded text-white"
                >
                    <option value="">Default (Inherit)</option>
                    <option value="'Playwrite CZ', cursive">Playwrite Česko (Script)</option>
                    <option value="'Be Vietnam Pro', sans-serif">Be Vietnam Pro (Sans)</option>
                    <option value="serif">Serif (Classic)</option>
                    <option value="monospace">Monospace</option>
                </select>
            </div>

            {/* Toggles */}
            <div className="flex justify-between bg-black/50 p-1 rounded">
                <button 
                    onClick={() => updateStyle('fontWeight', currentStyle.fontWeight === 'bold' ? 'normal' : 'bold')}
                    className={`p-1 rounded ${currentStyle.fontWeight === 'bold' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    title="Bold"
                >
                    <Bold size={14} />
                </button>
                <button 
                    onClick={() => updateStyle('fontStyle', currentStyle.fontStyle === 'italic' ? 'normal' : 'italic')}
                    className={`p-1 rounded ${currentStyle.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    title="Italic"
                >
                    <Italic size={14} />
                </button>
                <button 
                    onClick={() => updateStyle('textTransform', currentStyle.textTransform === 'uppercase' ? 'none' : 'uppercase')}
                    className={`p-1 rounded ${currentStyle.textTransform === 'uppercase' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    title="Uppercase"
                >
                    <Type size={14} />
                </button>
            </div>

             {/* Alignment */}
             <div className="flex justify-between bg-black/50 p-1 rounded">
                {['left', 'center', 'right'].map((align) => (
                    <button 
                        key={align}
                        onClick={() => updateStyle('textAlign', align as any)}
                        className={`p-1 rounded ${currentStyle.textAlign === align ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                         {align === 'left' && <AlignLeft size={14} />}
                         {align === 'center' && <AlignCenter size={14} />}
                         {align === 'right' && <AlignRight size={14} />}
                    </button>
                ))}
             </div>
        </div>
    );
};

// --- STYLED WRAPPER ---
interface StyledEditableTextProps extends EditableTextProps {
    id?: string; // Unique ID to save style
    customStyle?: CustomTextStyle;
    onStyleUpdate?: (newStyle: CustomTextStyle) => void;
}

export const StyledEditableText: React.FC<StyledEditableTextProps> = (props) => {
    const [showStyleEditor, setShowStyleEditor] = useState(false);

    // Convert CustomTextStyle to React CSS
    const computedStyle: React.CSSProperties = {
        ...props.style,
        color: props.customStyle?.color,
        fontSize: props.customStyle?.fontSize,
        fontFamily: props.customStyle?.fontFamily,
        fontWeight: props.customStyle?.fontWeight,
        fontStyle: props.customStyle?.fontStyle,
        textAlign: props.customStyle?.textAlign,
        textTransform: props.customStyle?.textTransform,
        letterSpacing: props.customStyle?.letterSpacing,
        lineHeight: props.customStyle?.lineHeight,
    };

    return (
        <div className={`relative group/textWrapper ${props.className} ${!props.customStyle?.textAlign ? '' : 'block'}`} style={{ textAlign: props.customStyle?.textAlign }}>
            <EditableText 
                {...props} 
                className="" // Remove base class here, apply via wrapper or style
                style={computedStyle} // Apply dynamic styles directly
            />
            
            {/* Style Trigger Button */}
            {props.isEditing && props.onStyleUpdate && (
                <div className="absolute -top-3 -right-3 z-40 opacity-0 group-hover/textWrapper:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => { e.stopPropagation(); setShowStyleEditor(!showStyleEditor); }}
                        className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-500 hover:scale-110 transition-all"
                        title="Edit Style"
                     >
                        <Paintbrush size={12} />
                     </button>
                     
                     {showStyleEditor && (
                         <StyleEditor 
                            currentStyle={props.customStyle || {}} 
                            onStyleChange={props.onStyleUpdate}
                            onClose={() => setShowStyleEditor(false)}
                         />
                     )}
                </div>
            )}
        </div>
    );
};

// --- IMAGE LIBRARY MODAL ---
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
            getStoredImages()
                .then(urls => setImages(urls))
                .catch(err => alert("Không tải được thư viện ảnh: " + err.message))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/20 w-full max-w-4xl max-h-[80vh] flex flex-col rounded-lg shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
                    <h3 className="text-white font-body font-extralight text-lg flex items-center gap-2">
                        <FolderOpen size={20} className="text-blue-500" /> <span className="font-extralight">Thư viện ảnh (Cloud)</span>
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-500">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                            <p>Đang tải danh sách ảnh...</p>
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">Chưa có ảnh nào được lưu trên Cloud.</div>
                    ) : (
                        // Updated to Masonry layout for library as well
                        <div className="columns-3 sm:columns-4 md:columns-5 gap-3 space-y-3">
                            {images.map((url, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => { onSelect(url); onClose(); }}
                                    className="break-inside-avoid bg-black border border-white/10 cursor-pointer group hover:border-blue-500 relative overflow-hidden rounded mb-3"
                                >
                                    <img 
                                        src={url} 
                                        alt="stored" 
                                        className="w-full h-auto object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all block" 
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-3 border-t border-white/10 bg-[#1a1a1a] text-xs text-gray-500 text-center">
                    Chọn một ảnh để sử dụng lại
                </div>
            </div>
        </div>
    );
};


interface EditImageProps {
  src: string;
  alt: string;
  onImageChange: (url: string) => void;
  isEditing: boolean;
  className?: string;
}

export const EditImage: React.FC<EditImageProps> = ({ src, alt, onImageChange, isEditing, className }) => {
    const [uploading, setUploading] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                const url = await uploadFileToFirebase(e.target.files[0]);
                onImageChange(url);
                alert("Upload thành công! Đừng quên nhấn nút SAVE màu xanh lá để lưu lại.");
            } catch (error: any) {
                console.error("Upload Error Details:", error);
                if (error.code === 'storage/unauthorized') {
                    alert("LỖI QUYỀN TRUY CẬP (Permission Denied):\n\nFirebase chặn upload do bạn chưa mở quyền ghi.\n\nVui lòng vào Firebase Console -> Storage -> Rules\nSửa thành: allow read, write: if true;");
                } else {
                    alert("Lỗi Upload: " + error.message);
                }
            } finally {
                setUploading(false);
            }
        }
    };

    if (!isEditing) return (
        <img 
            src={src} 
            alt={alt} 
            className={className} 
            referrerPolicy="no-referrer"
            onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://placehold.co/400x400/1a1a1a/white?text=Image+Error";
            }}
        />
    );

    return (
        <div className={`relative group ${className}`}>
            <img 
                src={src} 
                alt={alt} 
                className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" 
                referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-2">
                 {/* URL Input */}
                 <input 
                    type="text" 
                    value={src} 
                    onChange={(e) => onImageChange(e.target.value)}
                    className="bg-black/80 text-xs w-full p-2 border border-white/20 rounded text-white"
                    placeholder="Image URL..."
                 />
                 
                 {/* Buttons Row */}
                 <div className="flex gap-2 w-full justify-center">
                    {/* Cloud Upload Button */}
                    <div className="flex flex-col items-center">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded transition-colors"
                        >
                            {uploading ? <Loader2 size={14} className="animate-spin"/> : <CloudUpload size={14} />}
                            {uploading ? "..." : "Mới"}
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect} 
                            className="hidden" 
                            accept="image/*"
                        />
                    </div>

                    {/* Library Button */}
                    <button 
                        onClick={() => setShowLibrary(true)}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded transition-colors"
                        title="Chọn từ thư viện"
                    >
                        <FolderOpen size={14} />
                        Có sẵn
                    </button>
                 </div>
            </div>

            {/* Library Modal */}
            <ImageLibraryModal 
                isOpen={showLibrary} 
                onClose={() => setShowLibrary(false)} 
                onSelect={(url) => {
                    onImageChange(url);
                    alert("Đã chọn ảnh! Nhớ nhấn SAVE để lưu thay đổi.");
                }} 
            />
        </div>
    )
}

interface EditGalleryProps {
    images: string[];
    onImagesChange: (newImages: string[]) => void;
    isEditing: boolean;
}

export const EditGallery: React.FC<EditGalleryProps> = ({ images = [], onImagesChange, isEditing }) => {
    
    const handleImageUpdate = (index: number, url: string) => {
        const newImages = [...images];
        newImages[index] = url;
        onImagesChange(newImages);
    };

    if (!isEditing) {
        return (
            // Changed from Grid to Masonry layout
            <div className="columns-2 md:columns-3 gap-4 w-full space-y-4">
                {images.map((img, i) => (
                    <div key={i} className="break-inside-avoid overflow-hidden bg-gray-900 rounded-lg shadow-lg group">
                        <img 
                            src={img} 
                            alt={`Gallery ${i}`} 
                            className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500 block" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "https://placehold.co/400x400/1a1a1a/white?text=Error";
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        // Masonry layout for editing as well
        <div className="columns-2 md:columns-3 gap-4 w-full p-4 border border-dashed border-blue-500/30 rounded bg-blue-500/5 space-y-4">
            {images.map((img, i) => (
                <div key={i} className="break-inside-avoid">
                     <GalleryItemUploader 
                        url={img} 
                        onUpdate={(url) => handleImageUpdate(i, url)} 
                        index={i}
                    />
                </div>
            ))}
            {/* Add placeholder button */}
            {images.length < 24 && (
                 <button 
                    onClick={() => onImagesChange([...images, 'https://picsum.photos/400/600'])}
                    className="w-full h-40 flex items-center justify-center border border-white/10 hover:bg-white/5 transition-colors rounded-lg break-inside-avoid mb-4"
                    title="Add Image"
                 >
                    <Plus size={32} className="text-blue-500"/>
                 </button>
            )}
        </div>
    );
};

// Sub-component to handle individual upload state in gallery
const GalleryItemUploader: React.FC<{ url: string, onUpdate: (url: string) => void, index: number }> = ({ url, onUpdate, index }) => {
    const [uploading, setUploading] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                const newUrl = await uploadFileToFirebase(e.target.files[0]);
                onUpdate(newUrl);
                alert("Upload thành công! Hãy nhấn SAVE để lưu lại.");
            } catch (error: any) {
                console.error("Gallery Upload Error:", error);
                if (error.code === 'storage/unauthorized') {
                    alert("LỖI QUYỀN TRUY CẬP (Permission Denied):\n\nFirebase chặn upload do bạn chưa mở quyền ghi.\n\nVui lòng vào Firebase Console -> Storage -> Rules\nSửa thành: allow read, write: if true;");
                } else {
                    alert("Lỗi Upload: " + error.message);
                }
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        // Removed aspect-square to allow variable heights
        <div className="relative group bg-gray-900 rounded-lg overflow-hidden">
            <img src={url} alt={`Gallery ${index}`} className="w-full h-auto object-cover opacity-60 min-h-[100px]" referrerPolicy="no-referrer" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                {/* Manual URL Input */}
                <input 
                type="text" 
                value={url} 
                onChange={(e) => onUpdate(e.target.value)}
                className="text-[10px] w-full bg-black/80 border border-white/20 p-1 text-white rounded"
                placeholder="URL"
                />

                <div className="flex gap-2 w-full">
                    {/* Upload Button */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-blue-600 hover:bg-blue-500 text-white rounded p-1.5 transition-colors flex-1 flex justify-center"
                        title="Upload New"
                    >
                        {uploading ? <Loader2 size={14} className="animate-spin"/> : <CloudUpload size={14} />}
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        className="hidden" 
                        accept="image/*"
                    />

                    {/* Library Button */}
                     <button 
                        onClick={() => setShowLibrary(true)}
                        className="bg-gray-600 hover:bg-gray-500 text-white rounded p-1.5 transition-colors flex-1 flex justify-center"
                        title="Select Existing"
                    >
                        <FolderOpen size={14} />
                    </button>
                </div>
            </div>

             <ImageLibraryModal 
                isOpen={showLibrary} 
                onClose={() => setShowLibrary(false)} 
                onSelect={(selectedUrl) => {
                    onUpdate(selectedUrl);
                    alert("Đã chọn ảnh từ thư viện.");
                }} 
            />
        </div>
    )
}


export const AddButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-2 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-800 border-dashed rounded-lg p-4 w-full justify-center transition-all mt-4"
    >
        <Plus size={20} />
        <span>{label}</span>
    </button>
)

export const DeleteButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button 
        onClick={onClick}
        className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full z-10 transition-colors"
        title="Delete item"
    >
        <Trash2 size={16} />
    </button>
)

export const MoveButton: React.FC<{ direction: 'up' | 'down'; onClick: () => void; disabled?: boolean }> = ({ direction, onClick, disabled }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`p-1 bg-gray-700/80 hover:bg-blue-600 text-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}
        title={`Move ${direction}`}
    >
        {direction === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
    </button>
)
