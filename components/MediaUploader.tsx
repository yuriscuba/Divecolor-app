
import React, { useRef } from 'react';
import { CameraIcon } from './icons/CameraIcon';

interface MediaUploaderProps {
  onMediaUpload: (file: File, type: 'image' | 'video') => void;
  previewUrl: string | null;
  mediaType: 'image' | 'video' | null;
  label: string;
  accept?: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ onMediaUpload, previewUrl, mediaType, label, accept = "image/*,video/*" }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
      if (type) {
        onMediaUpload(file, type);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="relative w-full aspect-video bg-slate-800 rounded-lg border-2 border-dashed border-slate-600 hover:border-cyan-500 transition-colors cursor-pointer group flex items-center justify-center overflow-hidden"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Upload media"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={accept}
      />
      {previewUrl ? (
        <>
            {mediaType === 'image' && <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />}
            {mediaType === 'video' && <video src={previewUrl} className="w-full h-full object-contain" autoPlay muted loop playsInline />}
        </>
      ) : (
        <div className="text-center text-slate-500 group-hover:text-cyan-400 transition-colors">
          <CameraIcon className="mx-auto h-12 w-12" />
          <p className="mt-2 font-semibold">{label}</p>
          <p className="text-sm">PNG, JPG or MP4</p>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
