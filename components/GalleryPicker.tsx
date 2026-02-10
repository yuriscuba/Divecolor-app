import React, { useState, useEffect } from 'react';
import { DivePhoto } from '../types';
import { getAllPhotos } from '../utils/dbService';
import LoadingSpinner from './LoadingSpinner';
import { XIcon } from './icons/XIcon';

interface GalleryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelect: (photo: DivePhoto) => void;
}

const GalleryPicker: React.FC<GalleryPickerProps> = ({ isOpen, onClose, onPhotoSelect }) => {
  const [photos, setPhotos] = useState<DivePhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadPhotos = async () => {
        setIsLoading(true);
        try {
          const allPhotos = await getAllPhotos();
          setPhotos(allPhotos);
        } catch (error) {
          console.error("Failed to load gallery photos for picker", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadPhotos();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-xl font-semibold text-white">Select a Photo from Your Gallery</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner text="Loading photos..." />
            </div>
          ) : photos.length === 0 ? (
            <p className="text-center text-slate-400 py-16">Your gallery is empty.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos.map(photo => (
                <button
                  key={photo.id} 
                  className="aspect-square bg-slate-700 rounded-md overflow-hidden group focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  onClick={() => onPhotoSelect(photo)}
                  aria-label={`Select photo ${photo.name}`}
                >
                  <img
                    src={`data:${photo.mimeType};base64,${photo.base64}`}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryPicker;
