import React, { useState, useRef } from 'react';
import { Plus, Trash2, Image as ImageIcon, ArrowUp, ArrowDown, CloudUpload, Loader2 } from 'lucide-react';
import { uploadFileToFirebase } from '../services/uploadService';

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

interface EditImageProps {
  src: string;
  alt: string;
  onImageChange: (url: string) => void;
  isEditing: boolean;
  className?: string;
}

export const EditImage: React.FC<EditImageProps> = ({ src, alt, onImageChange, isEditing, className }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                const url = await uploadFileToFirebase(e.target.files[0]);
                onImageChange(url);
                alert("Upload successful! Don't forget to click the Green Save Button in the toolbar.");
            } catch (error: any) {
                const msg = error.code === 'storage/unauthorized' 
                    ? "Permission denied. Please check Firebase Console -> Storage -> Rules. Must allow write."
                    : error.message;
                alert("Upload failed: " + msg);
            } finally {
                setUploading(false);
            }
        }
    };

    if (!isEditing) return <img src={src} alt={alt} className={className} />;

    return (
        <div className={`relative group ${className}`}>
            <img src={src} alt={alt} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-2">
                 {/* URL Input */}
                 <input 
                    type="text" 
                    value={src} 
                    onChange={(e) => onImageChange(e.target.value)}
                    className="bg-black/80 text-xs w-full p-2 border border-white/20 rounded text-white"
                    placeholder="Image URL..."
                 />
                 
                 {/* Cloud Upload Button */}
                 <div className="flex gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded transition-colors"
                    >
                        {uploading ? <Loader2 size={14} className="animate-spin"/> : <CloudUpload size={14} />}
                        {uploading ? "Uploading..." : "Upload File"}
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        className="hidden" 
                        accept="image/*"
                    />
                 </div>
            </div>
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
                        <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                const newUrl = await uploadFileToFirebase(e.target.files[0]);
                onUpdate(newUrl);
                alert("Upload successful! Save your changes.");
            } catch (error: any) {
                const msg = error.code === 'storage/unauthorized' 
                    ? "Permission denied. Check Firebase Console -> Storage -> Rules."
                    : error.message;
                alert("Err: " + msg);
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <div className="aspect-square relative group bg-gray-900">
            <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover opacity-60" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-1 gap-1">
                {/* Manual URL Input */}
                <input 
                type="text" 
                value={url} 
                onChange={(e) => onUpdate(e.target.value)}
                className="text-[10px] w-full bg-black/80 border border-white/20 p-1 text-white"
                placeholder="URL"
                />

                {/* Upload Button */}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-blue-600/80 hover:bg-blue-500 text-white rounded-full p-1.5 transition-colors"
                    title="Upload Image"
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
            </div>
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
