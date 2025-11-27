
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, ArrowUp, ArrowDown, CloudUpload, Loader2, FolderOpen, X } from 'lucide-react';
import { uploadFileToFirebase, getStoredImages } from '../services/uploadService';

interface EditableTextProps {
  value: string;
  onChange: (val: string) => void;
  isEditing: boolean;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  isEditing,
  className = '',
  multiline = false,
  placeholder = 'Enter text...',
  tagName: Tag = 'div'
}) => {
  if (!isEditing) {
    return <Tag className={className}>{value}</Tag>;
  }

  const baseInputStyles = "bg-white/10 border border-blue-500/50 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-400 w-full transition-all";

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseInputStyles} ${className} min-h-[100px] resize-y`}
        placeholder={placeholder}
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
    />
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
                        <FolderOpen size={20} className="text-blue-500" /> Thư viện ảnh (Cloud)
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
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {images.map((url, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => { onSelect(url); onClose(); }}
                                    className="aspect-square bg-black border border-white/10 cursor-pointer group hover:border-blue-500 relative overflow-hidden rounded"
                                >
                                    <img 
                                        src={url} 
                                        alt="stored" 
                                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all" 
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
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 w-full h-full">
                {images.map((img, i) => (
                    <div key={i} className="aspect-square overflow-hidden bg-gray-900">
                        <img 
                            src={img} 
                            alt={`Gallery ${i}`} 
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "https://placehold.co/400x400/1a1a1a/white?text=Error";
                            }}
                        />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 w-full h-full p-2 border border-dashed border-blue-500/30 rounded">
            {images.map((img, i) => (
                <GalleryItemUploader 
                    key={i} 
                    url={img} 
                    onUpdate={(url) => handleImageUpdate(i, url)} 
                    index={i}
                />
            ))}
            {/* Add placeholder slots if less than 12 */}
            {images.length < 12 && (
                 <button 
                    onClick={() => onImagesChange([...images, 'https://picsum.photos/400/400'])}
                    className="aspect-square flex items-center justify-center border border-white/10 hover:bg-white/5 transition-colors"
                 >
                    <Plus size={20} className="text-blue-500"/>
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
        <div className="aspect-square relative group bg-gray-900">
            <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-1 gap-1">
                {/* Manual URL Input */}
                <input 
                type="text" 
                value={url} 
                onChange={(e) => onUpdate(e.target.value)}
                className="text-[10px] w-full bg-black/80 border border-white/20 p-1 text-white"
                placeholder="URL"
                />

                <div className="flex gap-1">
                    {/* Upload Button */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-blue-600/80 hover:bg-blue-500 text-white rounded p-1 transition-colors flex-1 flex justify-center"
                        title="Upload New"
                    >
                        {uploading ? <Loader2 size={12} className="animate-spin"/> : <CloudUpload size={12} />}
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
                        className="bg-gray-600/80 hover:bg-gray-500 text-white rounded p-1 transition-colors flex-1 flex justify-center"
                        title="Select Existing"
                    >
                        <FolderOpen size={12} />
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
