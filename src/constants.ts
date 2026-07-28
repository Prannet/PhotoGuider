import type { SessionType } from './types';

export interface CategoryDef {
  key: string;
  label: string;
  required: boolean;
  allowNotes: boolean;
}

export const VEHICLE_CATEGORIES: CategoryDef[] = [
  { key: 'front', label: 'Front', required: true, allowNotes: false },
  { key: 'leftSide', label: "Driver's Side", required: true, allowNotes: false },
  { key: 'rightSide', label: 'Passenger Side', required: true, allowNotes: false },
  { key: 'back', label: 'Back', required: true, allowNotes: false },
  { key: 'tire', label: 'Tire', required: true, allowNotes: false },
  { key: 'interior', label: 'Interior', required: true, allowNotes: false },
  { key: 'speedometer', label: 'Speedometer', required: true, allowNotes: false },
  { key: 'damages', label: 'Damages', required: false, allowNotes: true },
  { key: 'additional', label: 'Additional', required: false, allowNotes: true },
];

export const OTHER_ITEM_CATEGORIES: CategoryDef[] = [
  { key: 'front', label: 'Front', required: true, allowNotes: false },
  { key: 'leftSide', label: 'Left Side', required: true, allowNotes: false },
  { key: 'rightSide', label: 'Right Side', required: true, allowNotes: false },
  { key: 'back', label: 'Back', required: true, allowNotes: false },
  { key: 'detail', label: 'Detail/Close-up', required: true, allowNotes: false },
  { key: 'damages', label: 'Damages', required: false, allowNotes: true },
  { key: 'additional', label: 'Additional', required: false, allowNotes: true },
];

export function categoriesFor(sessionType: SessionType): CategoryDef[] {
  return sessionType === 'vehicle' ? VEHICLE_CATEGORIES : OTHER_ITEM_CATEGORIES;
}
