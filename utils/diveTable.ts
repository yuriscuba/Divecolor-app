// A simplified, representative model of a dive table for demonstration purposes.
// This is NOT for actual dive planning.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Calculates a pressure group based on depth, bottom time, and a starting pressure group.
 * This simulates adding residual nitrogen time to the actual bottom time.
 * @param depth Depth in meters.
 * @param bottomTime Bottom time in minutes.
 * @param startPG The starting pressure group.
 * @returns The resulting end pressure group as a capital letter.
 */
export const getEndPressureGroup = (depth: number, bottomTime: number, startPG: string): string => {
  // Simulate residual nitrogen by giving a time penalty for higher starting PGs
  const residualNitrogenTime = ALPHABET.indexOf(startPG);
  const totalTime = bottomTime + residualNitrogenTime;

  // Simple formula to simulate a table lookup.
  // Deeper dives and longer times result in a higher pressure group.
  const depthFactor = Math.floor(Math.max(0, depth - 10) / 4);
  const timeFactor = Math.floor(totalTime / 10);
  
  const finalIndex = Math.min(ALPHABET.length - 1, depthFactor + timeFactor);
  return ALPHABET[finalIndex];
};

/**
 * Calculates the new starting pressure group after a surface interval.
 * @param endPG The pressure group from the end of the last dive.
 * @param surfaceIntervalMinutes The time spent at the surface in minutes.
 * @returns The new starting pressure group as a capital letter.
 */
export const getNewStartPressureGroup = (endPG: string, surfaceIntervalMinutes: number): string => {
  const startIndex = ALPHABET.indexOf(endPG);
  if (startIndex === -1) return 'A';

  // Simple formula to simulate off-gassing.
  // Every 45 minutes on the surface, you go down one pressure group.
  const credit = Math.floor(surfaceIntervalMinutes / 45);
  
  const finalIndex = Math.max(0, startIndex - credit);
  return ALPHABET[finalIndex];
};
