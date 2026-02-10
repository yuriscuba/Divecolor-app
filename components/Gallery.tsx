import React, { useState, useEffect, useCallback } from 'react';
import { DivePhoto } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { PlusIcon } from './icons/PlusIcon';
import { CameraIcon } from './icons/CameraIcon';
import LoadingSpinner from './LoadingSpinner';
import { getAllPhotos, addGalleryPhotos } from '../utils/dbService';

const Gallery: React.FC = () => {
  const [allPhotos, setAllPhotos] = useState<DivePhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadPhotos = async () => {
      setIsLoading(true);
      try {
        const photos = await getAllPhotos();
        setAllPhotos(photos);
      } catch (error) {
        console.error("Failed to load photos from IndexedDB", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPhotos();
  }, []);

  const handlePhotoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // FIX: Add explicit File type for the 'file' parameter to resolve type inference issue.
      const newPhotosPromises = Array.from(files).map(async (file: File, index) => {
        const { base64, mimeType } = await fileToBase64(file);
        return { id: `${Date.now()}-${index}-${file.name}`, base64, mimeType, name: file.name };
      });

      const newPhotos = await Promise.all(newPhotosPromises);

      await addGalleryPhotos(newPhotos);

      setAllPhotos(prev => [...newPhotos, ...prev].sort((a,b) => parseInt(b.id.split('-')[0]) - parseInt(a.id.split('-')[0])));
    } catch (error) {
      console.error("Failed to upload photos", error);
    } finally {
      setIsUploading(false);
    }
  }, []);

  if (isLoading) {
    return <div className="flex justify-center pt-8"><LoadingSpinner text="Loading gallery..." /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">My Photo Gallery</h2>
        <div>
          <label htmlFor="gallery-upload" className="inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors cursor-pointer">
            {isUploading ? <LoadingSpinner /> : <PlusIcon className="h-5 w-5" />}
            <span>{isUploading ? 'Uploading...' : 'Add Photos'}</span>
          </label>
          <input
            id="gallery-upload"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
            disabled={isUploading}
          />
        </div>
      </div>

      {allPhotos.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-lg">
          <CameraIcon className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-2 text-lg font-semibold text-white">Your Gallery is Empty</h3>
          <p className="mt-1 text-sm text-slate-400">Add photos from your dive logs or upload them directly here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {allPhotos.map(photo => (
            <div key={photo.id} className="aspect-square bg-slate-800 rounded-lg overflow-hidden group relative">
              <img
                src={`data:${photo.mimeType};base64,${photo.base64}`}
                alt={photo.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-xs text-white truncate font-medium" title={photo.name}>{photo.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;