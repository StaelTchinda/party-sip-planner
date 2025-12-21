import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Parse a measurement string to extract numeric value and unit
interface ParsedMeasure {
  value: number;
  unit: string;
  original: string;
}

export function parseMeasure(measure: string | null): ParsedMeasure | null {
  if (!measure) return null;
  
  const trimmed = measure.trim();
  if (!trimmed) return null;
  
  // Try to match patterns like "1 oz", "2.5 oz", "1/2 oz", "1 1/2 oz", etc.
  // Match: optional whole number, optional fraction, unit
  const fractionMatch = trimmed.match(/^(\d+)?\s*(\d+\/\d+)?\s*(.+)$/);
  if (fractionMatch) {
    const whole = fractionMatch[1] ? parseFloat(fractionMatch[1]) : 0;
    const fraction = fractionMatch[2];
    const unit = fractionMatch[3].trim();
    
    let value = whole;
    if (fraction) {
      const [num, den] = fraction.split('/').map(Number);
      if (den && den !== 0) {
        value += num / den;
      }
    }
    
    return { value, unit, original: trimmed };
  }
  
  // Try to match decimal numbers
  const decimalMatch = trimmed.match(/^([\d.]+)\s*(.+)$/);
  if (decimalMatch) {
    const value = parseFloat(decimalMatch[1]);
    const unit = decimalMatch[2].trim();
    if (!isNaN(value)) {
      return { value, unit, original: trimmed };
    }
  }
  
  // If no numeric value found, return as-is with unit
  return { value: 0, unit: trimmed, original: trimmed };
}

// Aggregate measurements from multiple cocktails
export interface AggregatedMeasure {
  total: number;
  unit: string;
  count: number;
  hasMultipleUnits: boolean;
  display: string;
}

export function aggregateMeasures(measures: (string | null)[]): AggregatedMeasure | null {
  const validMeasures = measures.filter((m): m is string => m !== null && m.trim() !== '');
  if (validMeasures.length === 0) return null;
  
  const parsed = validMeasures.map(parseMeasure).filter((m): m is ParsedMeasure => m !== null);
  if (parsed.length === 0) return null;
  
  // Group by unit (case-insensitive)
  const unitGroups = new Map<string, { values: number[]; examples: string[] }>();
  
  for (const p of parsed) {
    const unitKey = p.unit.toLowerCase();
    if (!unitGroups.has(unitKey)) {
      unitGroups.set(unitKey, { values: [], examples: [] });
    }
    const group = unitGroups.get(unitKey)!;
    group.values.push(p.value);
    if (!group.examples.includes(p.original)) {
      group.examples.push(p.original);
    }
  }
  
  // If all measures have the same unit, sum them
  if (unitGroups.size === 1) {
    const [unitKey, group] = Array.from(unitGroups.entries())[0];
    const total = group.values.reduce((sum, v) => sum + v, 0);
    const unit = group.examples[0].replace(/^[\d.\s\/]+/i, '').trim() || unitKey;
    
    // Format the total nicely
    let display = '';
    if (total === 0) {
      display = group.examples[0]; // Use original if no numeric value
    } else if (total % 1 === 0) {
      display = `${total} ${unit}`;
    } else {
      // Convert to mixed fraction for common cases
      const whole = Math.floor(total);
      const fraction = total - whole;
      if (fraction === 0.5) {
        display = whole > 0 ? `${whole} 1/2 ${unit}` : `1/2 ${unit}`;
      } else if (fraction === 0.25) {
        display = whole > 0 ? `${whole} 1/4 ${unit}` : `1/4 ${unit}`;
      } else if (fraction === 0.75) {
        display = whole > 0 ? `${whole} 3/4 ${unit}` : `3/4 ${unit}`;
      } else {
        display = `${total.toFixed(2).replace(/\.?0+$/, '')} ${unit}`;
      }
    }
    
    return {
      total,
      unit,
      count: validMeasures.length,
      hasMultipleUnits: false,
      display,
    };
  }
  
  // Multiple units - show summary
  const unitList = Array.from(unitGroups.keys()).join(', ');
  return {
    total: 0,
    unit: unitList,
    count: validMeasures.length,
    hasMultipleUnits: true,
    display: `${validMeasures.length}× (${unitList})`,
  };
}
