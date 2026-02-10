
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DiveLog, DivePhoto } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { getEndPressureGroup, getNewStartPressureGroup } from '../utils/diveTable';
import * as units from '../utils/unitConverter';
import LoadingSpinner from './LoadingSpinner';
import { CameraIcon } from './icons/CameraIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { DepthIcon } from './icons/DepthIcon';
import { TimeIcon } from './icons/TimeIcon';
import { TankIcon } from './icons/TankIcon';
import { BookIcon } from './icons/BookIcon';
import SignaturePad, { SignaturePadRef } from './SignaturePad';
import { SignatureIcon } from './icons/SignatureIcon';
import { getDiveLogs, saveDiveLog } from '../utils/dbService';

const newLogTemplate: Omit<DiveLog, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  location: '',
  depth: '',
  bottomTime: '',
  waterTemp: '',
  startPressureGroup: '',
  endPressureGroup: '',
  startAir: '',
  endAir: '',
  notes: '',
  photos: [],
  weight: '',
  wetsuit: '',
  startTime: '',
  endTime: '',
  verifierName: '',
  verifierNumber: '',
};

const Logbook: React.FC = () => {
  const [logs, setLogs] = useState<DiveLog[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [formData, setFormData] = useState<Omit<DiveLog, 'id'>>(newLogTemplate);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const signaturePadRef = useRef<SignaturePadRef>(null);

  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      try {
        const savedLogs = await getDiveLogs();
        setLogs(savedLogs);
      } catch (error) {
        console.error("Failed to load dive logs from IndexedDB", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLogs();
  }, []);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs]);

  const groupedLogs = useMemo(() => {
    const acc: Record<string, DiveLog[]> = {};
    for (const log of sortedLogs) {
      const date = new Date(log.date).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(log);
    }
    return acc;
  }, [sortedLogs]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotoFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const photoPromises = photoFiles.map(async (file, index) => {
      const { base64, mimeType } = await fileToBase64(file);
      return { id: `${Date.now()}-${index}-${file.name}`, base64, mimeType, name: file.name };
    });

    const photos: DivePhoto[] = await Promise.all(photoPromises);
    const signature = signaturePadRef.current?.getSignature();

    const newLog: DiveLog = {
      id: Date.now().toString(),
      ...formData,
      photos,
      signature: signature ?? undefined,
    };

    try {
      await saveDiveLog(newLog);
      setLogs(prev => [newLog, ...prev]);
      setView('list');
      setFormData(newLogTemplate);
      setPhotoFiles([]);
      signaturePadRef.current?.clear();
    } catch (error) {
        console.error("Failed to save dive log:", error);
    } finally {
        setIsSaving(false);
    }
  };

  const calculatorData = useMemo(() => {
    const { date, startTime, depth, bottomTime } = formData;
    const depthNum = parseInt(depth, 10);
    const bottomTimeNum = parseInt(bottomTime, 10);

    if (!date) return { status: "Enter a date to begin." };

    const divesOnSameDay = logs
      .filter(log => new Date(log.date).toDateString() === new Date(date).toDateString())
      .sort((a, b) => new Date(`${b.date}T${b.endTime || '00:00'}`).getTime() - new Date(`${a.date}T${a.endTime || '00:00'}`).getTime());
    
    const previousDive = divesOnSameDay[0];
    
    let startPG = 'A';
    let surfaceInterval = null;
    let endPG = null;

    if (previousDive && previousDive.endTime && startTime) {
      const prevDiveEnd = new Date(`${previousDive.date}T${previousDive.endTime}`).getTime();
      const currentDiveStart = new Date(`${date}T${startTime}`).getTime();
      
      if (currentDiveStart > prevDiveEnd) {
        surfaceInterval = Math.round((currentDiveStart - prevDiveEnd) / (1000 * 60));
        startPG = getNewStartPressureGroup(previousDive.endPressureGroup, surfaceInterval);
      }
    }

    if (!isNaN(depthNum) && !isNaN(bottomTimeNum) && depthNum > 0 && bottomTimeNum > 0) {
      endPG = getEndPressureGroup(depthNum, bottomTimeNum, startPG);
    }
    
    return { previousDive, surfaceInterval, startPG, endPG };

  }, [formData, logs]);

  const applyCalculatorValues = () => {
    if (calculatorData.startPG && calculatorData.endPG) {
        setFormData(prev => ({
            ...prev,
            startPressureGroup: calculatorData.startPG,
            endPressureGroup: calculatorData.endPG!,
        }));
        setShowCalculator(false);
    }
  };

  const InputField: React.FC<{ name: keyof Omit<DiveLog, 'id' | 'photos' | 'notes' | 'signature'>, label: string, type?: string, placeholder?: string }> = 
    ({name, label, type = "text", placeholder}) => {
    return (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={String(formData[name])}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        />
    </div>
  )};

  const UnitInputField: React.FC<{
    name: 'depth' | 'waterTemp' | 'weight' | 'startAir' | 'endAir';
    label: string;
    metricUnit: string;
    imperialUnit: string;
    toImperial: (val: number) => number;
    fromImperial: (val: number) => number;
    placeholder?: string;
  }> = ({ name, label, metricUnit, imperialUnit, toImperial, fromImperial, placeholder }) => {

    const dynamicPlaceholder = useMemo(() => {
        if (!placeholder) return undefined;
        const metricPlaceholderNum = parseFloat(placeholder);
        if (isNaN(metricPlaceholderNum)) return placeholder;
        return unitSystem === 'imperial'
            ? String(Math.round(toImperial(metricPlaceholderNum)))
            : placeholder;
    }, [placeholder, toImperial, unitSystem]);

    const displayValue = useMemo(() => {
        const metricValueStr = formData[name];
        if (metricValueStr === '' || metricValueStr === null) return '';

        const metricValue = parseFloat(metricValueStr);
        if (isNaN(metricValue)) return metricValueStr;

        if (unitSystem === 'imperial') {
            const imperialVal = toImperial(metricValue);
            return String(Math.round(imperialVal * 10) / 10);
        }
        return String(metricValue);
    }, [formData, name, unitSystem, toImperial]);
    
    const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const currentDisplayValue = e.target.value;

        if (currentDisplayValue === '') {
            setFormData(prev => ({ ...prev, [name]: '' }));
            return;
        }

        // Allow typing a decimal point
        if (currentDisplayValue.endsWith('.')) {
            setFormData(prev => ({...prev, [name]: fromImperial(parseFloat(currentDisplayValue)).toString() }));
            return;
        }

        const numericValue = parseFloat(currentDisplayValue);
        if (isNaN(numericValue)) {
            return;
        }
        
        const metricValue = unitSystem === 'imperial' ? fromImperial(numericValue) : numericValue;
        setFormData(prev => ({ ...prev, [name]: String(metricValue) }));
    };

    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    inputMode="decimal"
                    id={name}
                    name={name}
                    value={displayValue}
                    onChange={handleUnitChange}
                    placeholder={dynamicPlaceholder}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 pr-16"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-sm pointer-events-none">
                    {unitSystem === 'metric' ? metricUnit : imperialUnit}
                </span>
            </div>
        </div>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center pt-8"><LoadingSpinner text="Loading dive logs..." /></div>;
  }
  
  if (view === 'form') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Log a New Dive</h2>
            <button onClick={() => setView('list')} className="text-cyan-400 hover:text-cyan-300 font-semibold">
                &larr; Back to Logs
            </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField name="date" label="Date" type="date" />
                <div className="md:col-span-2"><InputField name="location" label="Location / Dive Site" placeholder="e.g., Blue Corner, Palau" /></div>
                <InputField name="startTime" label="Start Time" type="time" />
                <InputField name="endTime" label="End Time" type="time" />
                <UnitInputField name="depth" label="Max Depth" placeholder="25" metricUnit="meters" imperialUnit="feet" toImperial={units.metersToFeet} fromImperial={units.feetToMeters} />
                <InputField name="bottomTime" label="Bottom Time" type="number" placeholder="45" />
                <UnitInputField name="waterTemp" label="Water Temp" placeholder="28" metricUnit="°C" imperialUnit="°F" toImperial={units.celsiusToFahrenheit} fromImperial={units.fahrenheitToCelsius} />
                <InputField name="wetsuit" label="Wetsuit" placeholder="e.g., 5mm Full" />
                <UnitInputField name="weight" label="Weight" placeholder="6" metricUnit="kg" imperialUnit="lbs" toImperial={units.kgToLbs} fromImperial={units.lbsToKg} />
                <UnitInputField name="startAir" label="Start Air" placeholder="200" metricUnit="bar" imperialUnit="psi" toImperial={units.barToPsi} fromImperial={units.psiToBar} />
                <UnitInputField name="endAir" label="End Air" placeholder="50" metricUnit="bar" imperialUnit="psi" toImperial={units.barToPsi} fromImperial={units.psiToBar} />
                <div className="md:col-span-1"><InputField name="startPressureGroup" label="Start Pressure Group" placeholder="A" /></div>
                <div className="md:col-span-1"><InputField name="endPressureGroup" label="End Pressure Group" placeholder="F" /></div>
                <div className="flex items-end">
                  <button type="button" onClick={() => setShowCalculator(!showCalculator)} className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-3 rounded-md transition-colors w-full justify-center h-10">
                    <CalculatorIcon className="h-5 w-5" />
                    <span>Calculator</span>
                  </button>
                </div>
            </div>

            {showCalculator && (
                <div className="bg-slate-900 p-4 rounded-lg mt-4 space-y-3 border border-slate-700">
                    <h4 className="text-lg font-semibold text-cyan-400">Pressure Group Calculator</h4>
                    {calculatorData.previousDive ? (
                        <div className="text-sm">
                            <p>Repetitive dive detected. Previous dive at <strong className="text-white">{calculatorData.previousDive.location}</strong> ended at <strong className="text-white">{calculatorData.previousDive.endTime}</strong> with PG <strong className="text-white">{calculatorData.previousDive.endPressureGroup}</strong>.</p>
                            {calculatorData.surfaceInterval !== null ? (
                                <p>Calculated Surface Interval: <strong className="text-white">{calculatorData.surfaceInterval} minutes</strong>.</p>
                            ) : (
                                <p className="text-amber-400">Enter a "Start Time" for this dive to calculate surface interval.</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm">First dive of the day.</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-center">
                        <div className="bg-slate-800 p-3 rounded flex-1">
                            <p className="text-sm text-slate-400">Calculated Start PG</p>
                            <p className="text-2xl font-bold text-white">{calculatorData.startPG || '...'}</p>
                        </div>
                         <div className="bg-slate-800 p-3 rounded flex-1">
                            <p className="text-sm text-slate-400">Calculated End PG</p>
                            <p className="text-2xl font-bold text-white">{calculatorData.endPG || '...'}</p>
                        </div>
                    </div>
                     {!calculatorData.endPG && <p className="text-sm text-amber-400 text-center">Enter this dive's Max Depth and Bottom Time to calculate End PG.</p>}
                     <div className="text-center">
                        <button type="button" onClick={applyCalculatorValues} disabled={!calculatorData.endPG} className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                            Apply to Log
                        </button>
                    </div>
                </div>
            )}

             <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">Dive Notes</label>
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Saw a manta ray, strong current..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                ></textarea>
            </div>
             <div>
                <label htmlFor="photos" className="block text-sm font-medium text-slate-300 mb-1">Photos</label>
                <input
                    type="file"
                    id="photos"
                    name="photos"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
                />
            </div>
            {photoFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photoFiles.map((file, index) => (
                        <img key={index} src={URL.createObjectURL(file)} alt={file.name} className="rounded-lg object-cover aspect-square" />
                    ))}
                </div>
            )}

            <div className="md:col-span-full border-t border-slate-700 pt-6 mt-2">
                <h3 className="text-lg font-semibold text-white mb-4">Dive Verification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><InputField name="verifierName" label="Verifier's Name (Buddy/Instructor)" placeholder="e.g., Jane Doe" /></div>
                    <div><InputField name="verifierNumber" label="Verifier's Number/ID" placeholder="e.g., PADI #12345" /></div>
                    <div className="md:col-span-full">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Signature</label>
                        <SignaturePad ref={signaturePadRef} />
                        <button type="button" onClick={() => signaturePadRef.current?.clear()} className="text-sm text-cyan-400 hover:text-cyan-300 mt-2">
                            Clear Signature
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-right pt-4">
                 <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                    {isSaving ? <LoadingSpinner /> : <PlusIcon className="h-5 w-5" />}
                    <span>{isSaving ? 'Saving...' : 'Save Dive'}</span>
                </button>
            </div>
        </form>
      </div>
    );
  }

  const unitButtonClasses = (system: 'metric' | 'imperial') => 
    `px-3 py-1 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 ${
      unitSystem === system
        ? 'bg-cyan-600 text-white'
        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    }`;

  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-white">My Dive Logs</h2>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
                    <button onClick={() => setUnitSystem('metric')} className={unitButtonClasses('metric')}>Metric</button>
                    <button onClick={() => setUnitSystem('imperial')} className={unitButtonClasses('imperial')}>Imperial</button>
                </div>
                <button onClick={() => setView('form')}  className="inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <PlusIcon className="h-5 w-5" />
                    <span>Log New Dive</span>
                </button>
            </div>
        </div>

        {logs.length === 0 ? (
            <div className="text-center py-16 bg-slate-800 rounded-lg">
                <CameraIcon className="mx-auto h-12 w-12 text-slate-500" />
                <h3 className="mt-2 text-lg font-semibold text-white">No Dives Logged Yet</h3>
                <p className="mt-1 text-sm text-slate-400">Click 'Log New Dive' to add your first entry.</p>
            </div>
        ) : (
            <div className="space-y-8">
                {Object.entries(groupedLogs).map(([date, divesForDate]: [string, DiveLog[]]) => (
                    <div key={date}>
                        <h3 className="text-lg font-semibold text-cyan-400 border-b-2 border-slate-700 pb-2 mb-4">{date}</h3>
                        <div className="space-y-4">
                            {divesForDate.map(log => {
                                const startAirNum = parseFloat(log.startAir);
                                const endAirNum = parseFloat(log.endAir);
                                const airUsed = !isNaN(startAirNum) && !isNaN(endAirNum) ? startAirNum - endAirNum : NaN;
                                
                                const depthNum = parseFloat(log.depth);
                                const tempNum = parseFloat(log.waterTemp);
                                const weightNum = parseFloat(log.weight);

                                const displayDepth = isNaN(depthNum) ? 'N/A' : (unitSystem === 'imperial' ? `${Math.round(units.metersToFeet(depthNum))}ft` : `${depthNum}m`);
                                const displayTemp = isNaN(tempNum) ? 'N/A' : (unitSystem === 'imperial' ? `${Math.round(units.celsiusToFahrenheit(tempNum))}°F` : `${tempNum}°C`);
                                const displayWeight = isNaN(weightNum) ? 'N/A' : (unitSystem === 'imperial' ? `${Math.round(units.kgToLbs(weightNum))}lbs` : `${weightNum}kg`);
                                const displayAirUsed = isNaN(airUsed) ? 'N/A' : (unitSystem === 'imperial' ? `${Math.round(units.barToPsi(airUsed))}psi` : `${airUsed} bar`);

                                return (
                                <div key={log.id} className="bg-slate-800 rounded-lg p-4 md:p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <BookIcon className="h-6 w-6 text-cyan-400 flex-shrink-0" />
                                        <h4 className="text-xl font-bold text-white">{log.location}</h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-slate-300 mb-4">
                                        <div className="flex items-center gap-2">
                                            <DepthIcon className="h-5 w-5 text-slate-400" />
                                            <span>{displayDepth} Max Depth</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TimeIcon className="h-5 w-5 text-slate-400" />
                                            <span>{log.bottomTime} min Bottom Time</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TankIcon className="h-5 w-5 text-slate-400" />
                                            <span>{displayAirUsed} Air Used</span>
                                        </div>
                                        <span><strong>PG:</strong> {log.startPressureGroup} &rarr; {log.endPressureGroup}</span>
                                        <span><strong>Temp:</strong> {displayTemp}</span>
                                        <span><strong>Weight:</strong> {displayWeight}</span>
                                    </div>

                                    {log.notes && <p className="text-slate-400 italic mb-4">"{log.notes}"</p>}
                                    {log.photos.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                                            {log.photos.map((photo, index) => (
                                                <img 
                                                  key={index}
                                                  src={`data:${photo.mimeType};base64,${photo.base64}`} 
                                                  alt={photo.name}
                                                  className="rounded-md object-cover aspect-square w-full h-full" 
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {log.signature && (
                                        <div className="mt-4 pt-4 border-t border-slate-700">
                                            <div className="flex items-center gap-2 mb-2">
                                                <SignatureIcon className="h-5 w-5 text-slate-400" />
                                                <h5 className="font-semibold text-slate-300">Dive Verified By: {log.verifierName || 'N/A'} {log.verifierNumber && `(${log.verifierNumber})`}</h5>
                                            </div>
                                            <div className="bg-slate-900/50 p-2 rounded-lg inline-block">
                                                <img src={log.signature} alt="Verifier Signature" className="h-20 w-auto invert brightness-200" />
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )})}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default Logbook;
