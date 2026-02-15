export const SEASONS = {
  spring: { name: '봄', baseDate: '춘분 (3월 21일)', sunAngle: 50, sunColor: '#FFF5E0' },
  summer: { name: '여름', baseDate: '하지 (6월 21일)', sunAngle: 65, sunColor: '#FFFFCC' },
  autumn: { name: '가을', baseDate: '추분 (9월 23일)', sunAngle: 50, sunColor: '#FFD699' },
  winter: { name: '겨울', baseDate: '동지 (12월 22일)', sunAngle: 28, sunColor: '#E6F0FF' },
} as const;

export type SeasonKey = keyof typeof SEASONS;

export interface BuildingPosition {
  id: number;
  name: string;
  x: number;
  z: number;
  height: number;
  width: number;
  depth: number;
}

export const INITIAL_BUILDINGS: BuildingPosition[] = [
  { id: 1, name: '101동', x: -25, z: -20, height: 45, width: 12, depth: 25 },
  { id: 2, name: '102동', x: 25, z: -20, height: 45, width: 12, depth: 25 },
  { id: 3, name: '103동', x: 0, z: 25, height: 45, width: 12, depth: 25 },
];

export const getDirectionName = (angle: number): string => {
  const normalized = ((angle % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return '북';
  if (normalized >= 22.5 && normalized < 67.5) return '북동';
  if (normalized >= 67.5 && normalized < 112.5) return '동';
  if (normalized >= 112.5 && normalized < 157.5) return '남동';
  if (normalized >= 157.5 && normalized < 202.5) return '남';
  if (normalized >= 202.5 && normalized < 247.5) return '남서';
  if (normalized >= 247.5 && normalized < 292.5) return '서';
  return '북서';
};
