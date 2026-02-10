
// Helper to round to one decimal place for display
const format = (num: number): number => Math.round(num * 10) / 10;

// Depth
export const metersToFeet = (meters: number): number => meters * 3.28084;
export const feetToMeters = (feet: number): number => feet / 3.28084;

// Temperature
export const celsiusToFahrenheit = (celsius: number): number => (celsius * 9 / 5) + 32;
export const fahrenheitToCelsius = (fahrenheit: number): number => (fahrenheit - 32) * 5 / 9;

// Weight
export const kgToLbs = (kg: number): number => kg * 2.20462;
export const lbsToKg = (lbs: number): number => lbs / 2.20462;

// Pressure
export const barToPsi = (bar: number): number => bar * 14.5038;
export const psiToBar = (psi: number): number => psi / 14.5038;
