export interface GroundingSource {
  web: {
    uri: string;
    title: string;
  };
}

export interface IdentificationResult {
  text: string;
  sources: GroundingSource[];
}

export interface DivePhoto {
  id: string;
  base64: string;
  mimeType: string;
  name: string;
}

export interface DiveLog {
  id: string;
  date: string;
  location: string;
  depth: string;
  bottomTime: string;
  waterTemp: string;
  startPressureGroup: string;
  endPressureGroup: string;
  startAir: string;
  endAir: string;
  notes: string;
  photos: DivePhoto[];
  weight: string;
  wetsuit: string;
  startTime: string;
  endTime: string;
  verifierName?: string;
  verifierNumber?: string;
  signature?: string;
}