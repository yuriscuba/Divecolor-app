

import React, { useState, useCallback } from 'react';
import MediaUploader from './MediaUploader';
import LoadingSpinner from './LoadingSpinner';
import { fileToBase64 } from '../utils/fileUtils';
import { identifySpecies } from '../services/geminiService';
import { IdentificationResult } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

// Simple markdown to HTML renderer
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const htmlContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br />');

    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};


const SpeciesIdentifier: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleMediaUpload = (file: File, type: 'image' | 'video') => {
    setResult(null);
    setError(null);
    if (type !== 'image') {
        setError("Only image files are accepted for species identification.");
        setImageFile(null);
        setPreviewImage(null);
        return;
    }
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleIdentification = useCallback(async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { base64, mimeType } = await fileToBase64(imageFile);
      const identificationResult = await identifySpecies(base64, mimeType);
      setResult(identificationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">1. Upload a Photo</h2>
          <MediaUploader 
            onMediaUpload={handleMediaUpload} 
            previewUrl={previewImage} 
            mediaType="image"
            label="Upload photo of species"
            accept="image/*"
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">2. Identify Species</h2>
          <p className="text-slate-400">Our AI will analyze the photo and identify the marine species, providing details and sources from the web.</p>
          <button
            onClick={handleIdentification}
            disabled={!previewImage || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? <LoadingSpinner /> : <SparklesIcon className="h-5 w-5" />}
            <span>{isLoading ? 'Identifying...' : 'Identify with AI'}</span>
          </button>
           {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      </div>
      
      {isLoading && <div className="flex justify-center pt-8"><LoadingSpinner text="Searching the depths of the web..." /></div>}

      {result && (
        <div className="pt-8 border-t border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-4">Identification Result</h2>
            <div className="bg-slate-800 p-6 rounded-lg prose prose-invert prose-p:text-slate-300 prose-strong:text-white leading-relaxed">
                 <MarkdownRenderer content={result.text} />
            </div>

            {result.sources.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Sources</h3>
                    <ul className="space-y-2">
                        {result.sources.map((source, index) => (
                            <li key={index} className="bg-slate-800 p-3 rounded-lg hover:bg-slate-700 transition-colors">
                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 font-medium">
                                    {source.web.title || source.web.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default SpeciesIdentifier;
