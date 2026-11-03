import React, { useState } from 'react';
import { X, UploadCloud, Image as ImageIcon, Camera, Check } from 'lucide-react';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImagesSelected: (urls: string[]) => void;
  title?: string;
  multiple?: boolean;
}

const PRESET_SAMPLE_IMAGES = [
  {
    name: 'Sparking Fan / Wiring',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Water Pipe Burst',
    url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'AC Leaking Water',
    url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Broken Bench / Furniture',
    url: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Fixed / Repaired Proof',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
  },
];

import { uploadComplaintImage } from '../../services/firebase';

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onImagesSelected,
  title = 'Upload Proof Images',
  multiple = true,
}) => {
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [customInputUrl, setCustomInputUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const fileList = Array.from(files);
      for (const file of fileList) {
        if (file.size > 2 * 1024 * 1024) {
          alert(`File ${file.name} is larger than 2MB. Please upload a smaller image.`);
          continue;
        }
        const uploadedUrl = await uploadComplaintImage(file, 'complaint_photos');
        setSelectedUrls((prev) => (multiple ? [...prev, uploadedUrl] : [uploadedUrl]));
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const togglePreset = (url: string) => {
    if (selectedUrls.includes(url)) {
      setSelectedUrls(selectedUrls.filter((u) => u !== url));
    } else {
      setSelectedUrls(multiple ? [...selectedUrls, url] : [url]);
    }
  };

  const handleAddCustomUrl = () => {
    if (customInputUrl.trim()) {
      setSelectedUrls(multiple ? [...selectedUrls, customInputUrl.trim()] : [customInputUrl.trim()]);
      setCustomInputUrl('');
    }
  };

  const handleSave = () => {
    onImagesSelected(selectedUrls);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* File Upload Box */}
          <label className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer text-center transition-all ${
            uploading ? 'border-indigo-400 bg-indigo-50/40 pointer-events-none' : 'border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 group'
          }`}>
            <UploadCloud className={`w-9 h-9 mb-2 transition-transform ${uploading ? 'animate-bounce text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600 group-hover:scale-110'}`} />
            <span className="text-sm font-semibold text-slate-700">
              {uploading ? 'Processing & Uploading Images...' : 'Click or drag images to upload'}
            </span>
            <span className="text-xs text-slate-500 mt-0.5">JPG, PNG, WebP up to 2MB</span>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              multiple={multiple}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Quick presets for hackathon demo convenience */}
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              ⚡ Quick Demo Sample Photos
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_SAMPLE_IMAGES.map((preset) => {
                const isSelected = selectedUrls.includes(preset.url);
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => togglePreset(preset.url)}
                    className={`relative rounded-lg overflow-hidden border-2 text-left p-1 transition-all group ${
                      isSelected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-16 object-cover rounded-md" />
                    <p className="text-[11px] font-medium text-slate-700 truncate mt-1">{preset.name}</p>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Previews */}
          {selectedUrls.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Selected ({selectedUrls.length})
              </p>
              <div className="flex gap-2 overflow-x-auto py-1">
                {selectedUrls.map((url, i) => (
                  <div key={i} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setSelectedUrls(selectedUrls.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            Attach {selectedUrls.length} {selectedUrls.length === 1 ? 'Image' : 'Images'}
          </button>
        </div>
      </div>
    </div>
  );
};
