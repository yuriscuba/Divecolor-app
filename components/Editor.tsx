


import React, { useState, useCallback, useMemo, useRef } from 'react';
import MediaUploader from './MediaUploader';
import LoadingSpinner from './LoadingSpinner';
import { fileToBase64 } from '../utils/fileUtils';
import { correctColor } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import GalleryPicker from './GalleryPicker';
import { ImageIcon } from './icons/ImageIcon';
import { ResetIcon } from './icons/ResetIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { DivePhoto } from '../types';
import { addGalleryPhotos } from '../utils/dbService';
import { SaveIcon } from './icons/SaveIcon';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { CropIcon } from './icons/CropIcon';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { TrashIcon } from './icons/TrashIcon';


const FILTERS = ['Tropical', 'Cold', 'Deep', 'Green Water'];
const INITIAL_ADJUSTMENTS = { brightness: 100, contrast: 100, saturate: 100 };

const Slider: React.FC<{label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({ label, value, onChange }) => (
    <div>
        <label className="flex justify-between text-sm font-medium text-slate-300 mb-1">
            <span>{label}</span>
            <span>{value}%</span>
        </label>
        <input
            type="range"
            min="0"
            max="200"
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
    </div>
);

const Editor: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<{ file: File; base64?: string; mimeType?: string; } | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [correctedImage, setCorrectedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>(FILTERS[0]);
  const [adjustments, setAdjustments] = useState(INITIAL_ADJUSTMENTS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSavingToGallery, setIsSavingToGallery] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New state for editing tools
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [trim, setTrim] = useState({ start: 0, end: 0 });
  const [videoDuration, setVideoDuration] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const resetState = () => {
    setCorrectedImage(null);
    setError(null);
    setSelectedMedia(null);
    setMediaType(null);
    setPreviewUrl(null);
    setAdjustments(INITIAL_ADJUSTMENTS);
    setIsSavingToGallery(false);
    setSaveSuccess(false);
    // Reset new state
    setIsCropping(false);
    setCrop(undefined);
    setCompletedCrop(null);
    setTrim({ start: 0, end: 0 });
    setVideoDuration(0);
  };

  const handleMediaUpload = async (file: File, type: 'image' | 'video') => {
    resetState();
    setMediaType(type);
    setPreviewUrl(URL.createObjectURL(file));

    if (type === 'image') {
      try {
        const { base64, mimeType } = await fileToBase64(file);
        setSelectedMedia({ file, base64, mimeType });
      } catch (e) {
        setError('Failed to read the uploaded file.');
        setPreviewUrl(null);
      }
    } else {
      setSelectedMedia({ file });
    }
  };
  
  const handlePhotoSelect = (photo: DivePhoto) => {
    resetState();
    setMediaType('image');
    
    const byteString = atob(photo.base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: photo.mimeType });
    const file = new File([blob], photo.name, { type: photo.mimeType });
    
    setSelectedMedia({ file, base64: photo.base64, mimeType: photo.mimeType });
    setPreviewUrl(`data:${photo.mimeType};base64,${photo.base64}`);
    setIsGalleryOpen(false);
  };

  const handleCorrection = useCallback(async () => {
    if (!selectedMedia?.base64 || !selectedMedia?.mimeType) return;

    setIsLoading(true);
    setError(null);
    setCorrectedImage(null);

    try {
      const correctedBase64 = await correctColor(selectedMedia.base64, selectedMedia.mimeType, selectedFilter);
      setCorrectedImage(`data:image/png;base64,${correctedBase64}`);
    } catch (err)
 {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMedia, selectedFilter]);
  
  const getCanvasWithAppliedFilters = async (sourceUrlOverride?: string): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
        const sourceUrl = sourceUrlOverride || correctedImage || previewUrl!;
        const image = new Image();
        image.crossOrigin = 'anonymous';
        
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturate}%)`;
            ctx.drawImage(image, 0, 0);
            resolve(canvas);
        };

        image.onerror = () => reject(new Error("Failed to load image for canvas rendering."));
        image.src = sourceUrl;
    });
  }

  const handleDownload = async () => {
    if (mediaType !== 'image' || (!previewUrl && !correctedImage)) return;
    try {
        const canvas = await getCanvasWithAppliedFilters();
        const link = document.createElement('a');
        link.download = `edited-${selectedMedia?.file.name || 'image'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        setError('Failed to prepare image for download.');
        console.error(err);
    }
  };

  const handleSaveToGallery = async () => {
    if (mediaType !== 'image' || (!previewUrl && !correctedImage)) return;

    setIsSavingToGallery(true);
    setSaveSuccess(false);
    setError(null);

    try {
        const canvas = await getCanvasWithAppliedFilters();
        const dataUrl = canvas.toDataURL('image/png');
        const [, base64] = dataUrl.split(',');

        const originalName = selectedMedia?.file.name || 'image.png';
        const newName = `edited-${originalName.split('.').slice(0, -1).join('.') || originalName}.png`;

        const newPhoto: DivePhoto = {
            id: `${Date.now()}-edited-${originalName}`,
            base64,
            mimeType: 'image/png',
            name: newName,
        };

        await addGalleryPhotos([newPhoto]);
        
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);

    } catch (err) {
        setError('Failed to save image to gallery.');
        console.error(err);
    } finally {
        setIsSavingToGallery(false);
    }
  };

  const filterStyle = useMemo(() => ({
    filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturate}%)`
  }), [adjustments]);

  const filterButtonClasses = (filter: string) =>
    `px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 ${
      selectedFilter === filter
        ? 'bg-cyan-600 text-white'
        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    }`;
  
  // -- Tool handlers -- //

  const handleVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration && video.duration !== Infinity) {
        setVideoDuration(video.duration);
        setTrim({ start: 0, end: video.duration });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= trim.end) {
        videoRef.current.currentTime = trim.start;
        videoRef.current.play();
    }
  };

  const handleTrimChange = (type: 'start' | 'end', value: number) => {
    if (type === 'start') {
      setTrim(currentTrim => {
        if (value < currentTrim.end) {
          if (videoRef.current) {
            videoRef.current.currentTime = value;
          }
          return { ...currentTrim, start: value };
        }
        return currentTrim;
      });
    } else { // type === 'end'
      setTrim(currentTrim => {
        if (value > currentTrim.start) {
          return { ...currentTrim, end: value };
        }
        return currentTrim;
      });
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '00:00';
    const floor = Math.floor;
    const min = floor(seconds / 60);
    const sec = floor(seconds % 60);
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const toggleCropping = () => {
    if (!isCropping) {
        const img = imgRef.current;
        if (img) {
            const { width, height } = img;
            const newCrop = centerCrop(
                makeAspectCrop({ unit: '%', width: 90 }, width / height, width, height),
                width,
                height
            );
            setCrop(newCrop);
            setCompletedCrop(null);
        }
    } else {
      setCrop(undefined);
    }
    setIsCropping(!isCropping);
  };
  
  const applyCrop = async () => {
      const image = imgRef.current;
      if (!image || !completedCrop) {
          setError("Could not apply crop. Please select an area first.");
          return;
      }
  
      const sourceUrl = correctedImage || previewUrl;
      if (!sourceUrl) {
          setError("No source image found for cropping.");
          return;
      }

      const sourceImage = new Image();
      sourceImage.src = sourceUrl;
      sourceImage.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        sourceImage.onload = resolve;
        sourceImage.onerror = reject;
      });
  
      const canvas = document.createElement('canvas');
      const scaleX = sourceImage.naturalWidth / image.width;
      const scaleY = sourceImage.naturalHeight / image.height;
  
      canvas.width = Math.floor(completedCrop.width * scaleX);
      canvas.height = Math.floor(completedCrop.height * scaleY);
  
      const ctx = canvas.getContext('2d');
      if (!ctx) {
          setError("Could not create canvas for cropping.");
          return;
      }
      
      ctx.drawImage(
          sourceImage,
          Math.floor(completedCrop.x * scaleX),
          Math.floor(completedCrop.y * scaleY),
          Math.floor(completedCrop.width * scaleX),
          Math.floor(completedCrop.height * scaleY),
          0, 0,
          canvas.width, canvas.height
      );
  
      const croppedDataUrl = canvas.toDataURL('image/png');
      const [, base64] = croppedDataUrl.split(',');
      
      setPreviewUrl(croppedDataUrl);
      setCorrectedImage(croppedDataUrl);
      setSelectedMedia(prev => prev ? { ...prev, base64, mimeType: 'image/png' } : null);
      setAdjustments(INITIAL_ADJUSTMENTS);
      setIsCropping(false);
  };

  return (
    <>
      <div className="space-y-8">
        {!previewUrl ? (
          <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Select Photo or Video to Start Editing</h2>
            <MediaUploader onMediaUpload={handleMediaUpload} previewUrl={previewUrl} mediaType={mediaType} label="Click to upload media" />
            <button 
              onClick={() => setIsGalleryOpen(true)} 
              className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-md transition-colors">
              <ImageIcon className="h-5 w-5" />
              <span>Select from Gallery (Photos)</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* --- Left Column: Preview --- */}
            <div className="lg:col-span-3">
              <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center sticky top-24">
                {isLoading ? <LoadingSpinner text="Analyzing and correcting..." /> : (
                  <>
                    {mediaType === 'image' && (
                       isCropping ? (
                            <ReactCrop
                                crop={crop}
                                onChange={c => setCrop(c)}
                                onComplete={c => setCompletedCrop(c)}
                            >
                                <img ref={imgRef} src={correctedImage || previewUrl} alt="Crop preview" style={filterStyle} className="max-w-full max-h-[60vh] object-contain" />
                            </ReactCrop>
                        ) : (
                            <img ref={imgRef} src={correctedImage || previewUrl} alt="Edited" style={filterStyle} className="w-full h-full object-contain" />
                        )
                    )}
                    {mediaType === 'video' && <video key={previewUrl} ref={videoRef} src={previewUrl} style={filterStyle} controls onLoadedMetadata={handleVideoLoad} onTimeUpdate={handleTimeUpdate} className="w-full h-full object-contain"></video>}
                  </>
                )}
              </div>
            </div>

            {/* --- Right Column: Controls --- */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-slate-800 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                      <p className="text-slate-400 text-sm">Editing:</p>
                      <p className="text-white font-medium truncate" title={selectedMedia?.file.name}>{selectedMedia?.file.name}</p>
                  </div>
                  <button onClick={resetState} className="ml-4 flex-shrink-0 text-slate-400 hover:text-red-500 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500" aria-label="Delete file and start over">
                      <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">Tools</h2>
                <div className="bg-slate-800 p-4 rounded-lg space-y-4">
                  {mediaType === 'image' && (
                    <div>
                      <button onClick={toggleCropping} className="w-full flex items-center justify-center gap-2 text-sm text-white bg-slate-700 hover:bg-slate-600 font-semibold py-2 px-3 rounded-md transition-colors">
                        <CropIcon className="h-4 w-4" />
                        <span>{isCropping ? 'Cancel Crop' : 'Crop Image'}</span>
                      </button>
                      {isCropping && (
                        <button onClick={applyCrop} disabled={!completedCrop || !completedCrop.width} className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 font-semibold py-2 px-3 rounded-md transition-colors">
                          Apply Crop
                        </button>
                      )}
                    </div>
                  )}
                   {mediaType === 'video' && videoDuration > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2"><ScissorsIcon className="h-4 w-4" />Trim Video</h3>
                      <div className="space-y-2">
                         <div>
                          <label className="text-xs text-slate-400 flex justify-between"><span>Start</span> <span>{formatTime(trim.start)}</span></label>
                          <input type="range" min="0" max={videoDuration} step="0.1" value={trim.start} onChange={(e) => handleTrimChange('start', +e.target.value)} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"/>
                        </div>
                         <div>
                          <label className="text-xs text-slate-400 flex justify-between"><span>End</span> <span>{formatTime(trim.end)}</span></label>
                          <input type="range" min="0" max={videoDuration} step="0.1" value={trim.end} onChange={(e) => handleTrimChange('end', +e.target.value)} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"/>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">Adjustments</h2>
                <div className="space-y-4 bg-slate-800 p-4 rounded-lg">
                  <Slider label="Brightness" value={adjustments.brightness} onChange={(e) => setAdjustments(p => ({ ...p, brightness: +e.target.value }))} />
                  <Slider label="Contrast" value={adjustments.contrast} onChange={(e) => setAdjustments(p => ({ ...p, contrast: +e.target.value }))} />
                  <Slider label="Saturation" value={adjustments.saturate} onChange={(e) => setAdjustments(p => ({ ...p, saturate: +e.target.value }))} />
                  <button onClick={() => setAdjustments(INITIAL_ADJUSTMENTS)} className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-semibold py-2 px-3 rounded-md transition-colors">
                    <ResetIcon className="h-4 w-4" />
                    <span>Reset Adjustments</span>
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">AI Enhancement <span className="text-sm font-normal text-slate-400">(Photos Only)</span></h2>
                 {mediaType === 'video' ? (
                  <div className="bg-slate-800 p-4 rounded-lg text-center">
                      <p className="text-slate-400">AI color correction is not available for videos.</p>
                  </div>
                 ) : (
                  <div className="bg-slate-800 p-4 rounded-lg space-y-4">
                      <div>
                          <h3 className="text-sm font-medium text-slate-300 mb-2">Water Conditions</h3>
                          <div className="flex flex-wrap gap-2">
                              {FILTERS.map((filter) => (
                                  <button key={filter} onClick={() => setSelectedFilter(filter)} className={filterButtonClasses(filter)}>
                                  {filter}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <button
                          onClick={handleCorrection}
                          disabled={!selectedMedia || isLoading}
                          className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                          >
                          {isLoading ? <LoadingSpinner /> : <SparklesIcon className="h-5 w-5" />}
                          <span>{isLoading ? 'Processing...' : 'Run AI Correction'}</span>
                      </button>
                  </div>
                 )}
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>
            
            <div className="pt-4 space-y-3">
                 <button 
                  onClick={handleSaveToGallery}
                  disabled={mediaType === 'video' || isSavingToGallery || saveSuccess}
                  className={`w-full inline-flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-lg transition-colors ${saveSuccess ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'} disabled:bg-slate-600 disabled:cursor-not-allowed text-white`}
                >
                    {isSavingToGallery ? <LoadingSpinner /> : <SaveIcon className="h-5 w-5" />}
                    <span>{isSavingToGallery ? 'Saving...' : saveSuccess ? 'Saved to Gallery!' : 'Save to Gallery'}</span>
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={mediaType === 'video'}
                  className="w-full inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                    <DownloadIcon className="h-5 w-5" />
                    <span>Download Edited Photo</span>
                </button>
                {mediaType === 'video' && <p className="text-slate-400 text-center text-sm mt-2">Saving or downloading edited videos is not yet supported.</p>}
            </div>

            </div>
          </div>
        )}
      </div>
      <GalleryPicker 
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onPhotoSelect={handlePhotoSelect}
      />
    </>
  );
};

export default Editor;