import * as THREE from 'three';

interface SunPosition {
  x: number;
  y: number;
  z: number;
}

export const getSkyColor = (hour: number): THREE.Color => {
  if (hour >= 6 && hour < 8) {
    const t = (hour - 6) / 2;
    return new THREE.Color().lerpColors(
      new THREE.Color('#1a1a2e'),
      new THREE.Color('#ff7e5f'),
      t
    );
  }
  if (hour >= 8 && hour < 17) {
    return new THREE.Color('#87ceeb');
  }
  if (hour >= 17 && hour < 20) {
    const t = (hour - 17) / 3;
    return new THREE.Color().lerpColors(
      new THREE.Color('#87ceeb'),
      new THREE.Color('#ff6b35'),
      t
    );
  }
  return new THREE.Color('#1a1a2e');
};

export const getSunPosition = (
  hour: number,
  sunAngle: number,
  riseAngle: number
): SunPosition => {
  const dayLength = 12;
  const sunrise = 6;
  const sunset = 18;

  if (hour < sunrise || hour > sunset) {
    const nightProgress =
      hour < sunrise
        ? (hour + 24 - sunset) / (24 - dayLength)
        : (hour - sunset) / (24 - dayLength);
    const angle = Math.PI + nightProgress * Math.PI;
    const baseAngle = Math.PI / 2;
    const rad = ((riseAngle - 90) * Math.PI) / 180;
    const sunRad = angle + rad - baseAngle;
    return {
      x: Math.cos(sunRad) * 100,
      y: -20 - Math.abs(Math.sin(angle)) * 10,
      z: Math.sin(sunRad) * 100,
    };
  }

  const progress = (hour - sunrise) / dayLength;
  const maxHeight = Math.sin((sunAngle * Math.PI) / 180) * 80;
  const startRad = (riseAngle * Math.PI) / 180;
  const endRad = ((riseAngle + 180) * Math.PI) / 180;
  const currentRad = startRad + progress * (endRad - startRad);

  return {
    x: Math.cos(currentRad) * 100,
    y: Math.sin(progress * Math.PI) * maxHeight,
    z: Math.sin(currentRad) * 100,
  };
};
