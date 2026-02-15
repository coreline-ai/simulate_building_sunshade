'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  BuildingPosition,
  getDirectionName,
  INITIAL_BUILDINGS,
  SEASONS,
  SeasonKey,
} from '@/features/sun-simulation/model';
import {
  BuildingControlPanel,
  MouseControlHint,
  SimulationControlPanel,
  SunDirectionDial,
  SunInfoPanel,
} from '@/features/sun-simulation/components/panels';
import { getSkyColor, getSunPosition } from '@/features/sun-simulation/solar';

const disposeMaterial = (material: THREE.Material | THREE.Material[]) => {
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial);
    return;
  }
  const meshMaterial = material as THREE.Material & {
    map?: THREE.Texture | null;
    alphaMap?: THREE.Texture | null;
    aoMap?: THREE.Texture | null;
    bumpMap?: THREE.Texture | null;
    displacementMap?: THREE.Texture | null;
    emissiveMap?: THREE.Texture | null;
    envMap?: THREE.Texture | null;
    lightMap?: THREE.Texture | null;
    metalnessMap?: THREE.Texture | null;
    normalMap?: THREE.Texture | null;
    roughnessMap?: THREE.Texture | null;
    specularMap?: THREE.Texture | null;
  };
  const textureKeys = [
    'map',
    'alphaMap',
    'aoMap',
    'bumpMap',
    'displacementMap',
    'emissiveMap',
    'envMap',
    'lightMap',
    'metalnessMap',
    'normalMap',
    'roughnessMap',
    'specularMap',
  ] as const;
  textureKeys.forEach((key) => {
    meshMaterial[key]?.dispose();
  });
  material.dispose();
};

const disposeScene = (scene: THREE.Scene) => {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      disposeMaterial(object.material);
    }
  });
  scene.clear();
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function SunSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sunRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const skyRef = useRef<THREE.Mesh | null>(null);
  const buildingMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const dialRef = useRef<HTMLDivElement>(null);
  
  const [time, setTime] = useState(12);
  const [season, setSeason] = useState<SeasonKey>('spring');
  const [isAnimating, setIsAnimating] = useState(false);
  const [buildings, setBuildings] = useState<BuildingPosition[]>(INITIAL_BUILDINGS);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [isDraggingBuilding, setIsDraggingBuilding] = useState(false);
  const [sunRiseAngle, setSunRiseAngle] = useState(90); // 해 뜨는 방위각 (0=북, 90=동, 180=남, 270=서)
  
  const animationRef = useRef<number | null>(null);
  const cameraAngleRef = useRef(Math.PI / 4);
  const cameraHeightRef = useRef(60);
  const cameraDistanceRef = useRef(120);
  const isDraggingCameraRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const isDraggingDialRef = useRef(false);

  const updateSunRiseAngleFromClientPoint = useCallback((clientX: number, clientY: number) => {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    const normalizedAngle = (90 - angle + 360) % 360;
    setSunRiseAngle(Math.round(normalizedAngle));
  }, []);

  // 건물 생성 함수
  const createBuilding = useCallback((building: BuildingPosition) => {
    const group = new THREE.Group();
    group.userData.buildingId = building.id;

    const { x, z, height, width, depth } = building;
    
    const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
    
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 256, 512);
    
    const windowRows = Math.floor(height / 4);
    const windowCols = Math.floor(width / 4);
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const wx = col * 20 + 10;
        const wy = row * 20 + 10;
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(wx, wy, 12, 15);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(wx, wy, 12, 15);
      }
    }
    
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(0, 200, 256, 30);
    ctx.fillRect(0, 350, 256, 30);

    const texture = new THREE.CanvasTexture(canvas);
    const buildingMaterial = new THREE.MeshLambertMaterial({ map: texture });
    const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    buildingMesh.position.y = height / 2;
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    group.add(buildingMesh);

    const roofGeometry = new THREE.BoxGeometry(width + 2, 3, depth + 2);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: '#555' });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = height + 1.5;
    roof.castShadow = true;
    group.add(roof);

    const baseGeometry = new THREE.BoxGeometry(width + 4, 3, depth + 4);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: '#333' });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1.5;
    base.receiveShadow = true;
    group.add(base);

    group.position.set(x, 0, z);
    return group;
  }, []);

  // 건물 위치 업데이트
  const updateBuildingPosition = useCallback((id: number, x: number, z: number) => {
    const mesh = buildingMeshesRef.current.get(id);
    if (mesh) {
      mesh.position.x = x;
      mesh.position.z = z;
    }
  }, []);

  // 3D 장면 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    const containerElement = containerRef.current;
    const buildingMeshes = buildingMeshesRef.current;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(80, 60, 80);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerElement.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 하늘
    const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: '#87ceeb',
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    skyRef.current = sky;

    // 지형
    const groundGeometry = new THREE.PlaneGeometry(300, 300);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: '#4a7c59' });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';
    scene.add(ground);

    // 잔디 텍스처
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 512;
    grassCanvas.height = 512;
    const grassCtx = grassCanvas.getContext('2d')!;
    grassCtx.fillStyle = '#4a7c59';
    grassCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 5000; i++) {
      grassCtx.fillStyle = Math.random() > 0.5 ? '#3d6b4a' : '#5a8c69';
      grassCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    const grassTexture = new THREE.CanvasTexture(grassCanvas);
    groundMaterial.map = grassTexture;
    groundMaterial.needsUpdate = true;

    // 방위 표시 (동서남북) - 고정 위치
    const createDirectionMarker = (text: string, angle: number, color: string) => {
      const distance = 140;
      const rad = (angle * Math.PI) / 180;
      
      const markerCanvas = document.createElement('canvas');
      markerCanvas.width = 64;
      markerCanvas.height = 64;
      const ctx = markerCanvas.getContext('2d')!;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 32, 32);
      
      const texture = new THREE.CanvasTexture(markerCanvas);
      const markerGeometry = new THREE.PlaneGeometry(10, 10);
      const markerMaterial = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        side: THREE.DoubleSide
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(Math.cos(rad) * distance, 0.5, Math.sin(rad) * distance);
      scene.add(marker);
      return marker;
    };

    createDirectionMarker('동', 90, '#FF6B6B');
    createDirectionMarker('서', 270, '#4ECDC4');
    createDirectionMarker('남', 180, '#45B7D1');
    createDirectionMarker('북', 0, '#96CEB4');

    // 연못
    const pondGeometry = new THREE.CircleGeometry(8, 32);
    const pondMaterial = new THREE.MeshLambertMaterial({ 
      color: '#4a90d9',
      transparent: true,
      opacity: 0.8
    });
    const pond = new THREE.Mesh(pondGeometry, pondMaterial);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(0, 0.1, 0);
    scene.add(pond);

    // 산책로
    const pathGeometry = new THREE.PlaneGeometry(3, 100);
    const pathMaterial = new THREE.MeshLambertMaterial({ color: '#c9b896' });
    const path1 = new THREE.Mesh(pathGeometry, pathMaterial);
    path1.rotation.x = -Math.PI / 2;
    path1.position.set(0, 0.05, 0);
    scene.add(path1);

    const path2 = new THREE.Mesh(pathGeometry, pathMaterial);
    path2.rotation.x = -Math.PI / 2;
    path2.rotation.z = Math.PI / 2;
    path2.position.set(0, 0.05, 0);
    scene.add(path2);

    // 초기 건물 배치
    INITIAL_BUILDINGS.forEach(building => {
      const buildingMesh = createBuilding(building);
      scene.add(buildingMesh);
      buildingMeshes.set(building.id, buildingMesh);
    });

    // 나무 배치
    const createTree = (x: number, z: number) => {
      const group = new THREE.Group();
      const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 3, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: '#8B4513' });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1.5;
      trunk.castShadow = true;
      group.add(trunk);

      const leavesGeometry = new THREE.SphereGeometry(2.5, 8, 8);
      const leavesMaterial = new THREE.MeshLambertMaterial({ color: '#228B22' });
      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.y = 4.5;
      leaves.castShadow = true;
      group.add(leaves);

      group.position.set(x, 0, z);
      return group;
    };

    const treePositions = [
      [-60, -40], [-55, 20], [-50, 50], [-70, 0],
      [60, -40], [55, 20], [50, 50], [70, 0],
      [-20, -60], [20, -60], [0, 60], [-40, 60], [40, 60],
    ];
    treePositions.forEach(([x, z]) => scene.add(createTree(x, z)));

    // 태양
    const sunGeometry = new THREE.SphereGeometry(8, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: '#FDB813' });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    sunRef.current = sun;

    // 태양 빛나는 효과
    const sunGlowGeometry = new THREE.SphereGeometry(12, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: '#FFE4B5',
      transparent: true,
      opacity: 0.3
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sun.add(sunGlow);

    // Directional Light
    const sunLight = new THREE.DirectionalLight('#ffffff', 1);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -150;
    sunLight.shadow.camera.right = 150;
    sunLight.shadow.camera.top = 150;
    sunLight.shadow.camera.bottom = -150;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Ambient Light
    const ambientLight = new THREE.AmbientLight('#404040', 0.3);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // 애니메이션 루프
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // 창 크기 변경
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      if (containerElement.contains(renderer.domElement)) {
        containerElement.removeChild(renderer.domElement);
      }
      disposeScene(scene);
      buildingMeshes.clear();
      sceneRef.current = null;
      cameraRef.current = null;
      sunRef.current = null;
      sunLightRef.current = null;
      ambientLightRef.current = null;
      skyRef.current = null;
      renderer.dispose();
      renderer.forceContextLoss();
      rendererRef.current = null;
    };
  }, [createBuilding]);

  // 건물 위치 변경 시 메시 업데이트
  useEffect(() => {
    buildings.forEach(building => {
      updateBuildingPosition(building.id, building.x, building.z);
    });
  }, [buildings, updateBuildingPosition]);

  // 시간, 계절, 방위각 변경 시 업데이트
  useEffect(() => {
    if (!sunRef.current || !sunLightRef.current || !skyRef.current || !ambientLightRef.current) return;

    const seasonConfig = SEASONS[season];
    const sunPos = getSunPosition(time, seasonConfig.sunAngle, sunRiseAngle);
    
    sunRef.current.position.set(sunPos.x, sunPos.y, sunPos.z);
    sunLightRef.current.position.set(sunPos.x, sunPos.y, sunPos.z);
    
    const skyColor = getSkyColor(time);
    (skyRef.current.material as THREE.MeshBasicMaterial).color.copy(skyColor);

    const isDaytime = time >= 6 && time <= 18;
    let lightIntensity = 0;
    if (isDaytime) {
      const dayProgress = Math.abs(time - 12) / 6;
      lightIntensity = 1 - dayProgress * 0.5;
    }
    
    sunLightRef.current.intensity = lightIntensity;
    sunLightRef.current.color.set(seasonConfig.sunColor);
    
    if (time < 6 || time > 18) {
      ambientLightRef.current.intensity = 0.15;
      ambientLightRef.current.color.set('#1a1a4e');
    } else {
      ambientLightRef.current.intensity = 0.35;
      ambientLightRef.current.color.set('#404040');
    }

    sunRef.current.visible = sunPos.y > -10;
  }, [time, season, sunRiseAngle]);

  // 자동 애니메이션
  useEffect(() => {
    if (isAnimating) {
      const interval = setInterval(() => {
        setTime(prev => {
          const newTime = prev + 0.1;
          return newTime >= 24 ? 0 : newTime;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isAnimating]);

  // 마우스 이벤트
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const renderer = rendererRef.current!;
    const camera = cameraRef.current!;

    const handleMouseDown = (e: MouseEvent) => {
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
      
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      const buildingMeshes = Array.from(buildingMeshesRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(
        buildingMeshes.flatMap(g => g.children),
        true
      );
      
      if (intersects.length > 0) {
        const buildingGroup = intersects[0].object.parent as THREE.Group;
        if (buildingGroup && buildingGroup.userData.buildingId) {
          setSelectedBuilding(buildingGroup.userData.buildingId);
          setIsDraggingBuilding(true);
          return;
        }
      }
      
      setSelectedBuilding(null);
      isDraggingCameraRef.current = true;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;

      if (isDraggingBuilding && selectedBuilding !== null) {
        mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        
        const intersectPoint = new THREE.Vector3();
        raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersectPoint);
        
        if (intersectPoint) {
          const newX = Math.max(-100, Math.min(100, intersectPoint.x));
          const newZ = Math.max(-100, Math.min(100, intersectPoint.z));
          
          setBuildings(prev => prev.map(b => 
            b.id === selectedBuilding 
              ? { ...b, x: Math.round(newX), z: Math.round(newZ) }
              : b
          ));
        }
      } else if (isDraggingCameraRef.current) {
        cameraAngleRef.current += deltaX * 0.005;
        cameraHeightRef.current = Math.max(20, Math.min(150, cameraHeightRef.current - deltaY * 0.5));
        
        camera.position.x = Math.cos(cameraAngleRef.current) * cameraDistanceRef.current;
        camera.position.y = cameraHeightRef.current;
        camera.position.z = Math.sin(cameraAngleRef.current) * cameraDistanceRef.current;
        camera.lookAt(0, 0, 0);
      }
      
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingCameraRef.current = false;
      setIsDraggingBuilding(false);
    };

    const handleWheel = (e: WheelEvent) => {
      cameraDistanceRef.current = Math.max(50, Math.min(250, cameraDistanceRef.current + e.deltaY * 0.1));
      camera.position.x = Math.cos(cameraAngleRef.current) * cameraDistanceRef.current;
      camera.position.y = cameraHeightRef.current;
      camera.position.z = Math.sin(cameraAngleRef.current) * cameraDistanceRef.current;
      camera.lookAt(0, 0, 0);
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel);

    return () => {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
    };
  }, [selectedBuilding, isDraggingBuilding]);

  // 다이얼 드래그 핸들러
  const handleDialStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingDialRef.current = true;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    updateSunRiseAngleFromClientPoint(clientX, clientY);
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (isDraggingDialRef.current) {
        let clientX: number, clientY: number;
        if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }
        updateSunRiseAngleFromClientPoint(clientX, clientY);
      }
    };
    
    const handleGlobalEnd = () => {
      isDraggingDialRef.current = false;
    };
    
    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalMove);
    window.addEventListener('touchend', handleGlobalEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [updateSunRiseAngleFromClientPoint]);

  const updateBuildingState = useCallback((id: number, update: (building: BuildingPosition) => BuildingPosition) => {
    setBuildings((prev) => prev.map((building) => (building.id === id ? update(building) : building)));
  }, []);

  const moveBuildingBy = useCallback((id: number, dx: number, dz: number) => {
    updateBuildingState(id, (building) => ({
      ...building,
      x: clamp(building.x + dx, -100, 100),
      z: clamp(building.z + dz, -100, 100),
    }));
  }, [updateBuildingState]);

  const setBuildingX = useCallback((id: number, x: number) => {
    updateBuildingState(id, (building) => ({ ...building, x: clamp(x, -100, 100) }));
  }, [updateBuildingState]);

  const setBuildingZ = useCallback((id: number, z: number) => {
    updateBuildingState(id, (building) => ({ ...building, z: clamp(z, -100, 100) }));
  }, [updateBuildingState]);

  const resetBuildings = useCallback(() => {
    setBuildings(INITIAL_BUILDINGS);
    setSelectedBuilding(null);
  }, []);

  const riseDirection = getDirectionName(sunRiseAngle);
  const setDirection = getDirectionName((sunRiseAngle + 180) % 360);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      <SunDirectionDial
        dialRef={dialRef}
        sunRiseAngle={sunRiseAngle}
        riseDirection={riseDirection}
        setDirection={setDirection}
        onDialStart={handleDialStart}
      />

      <SimulationControlPanel
        time={time}
        season={season}
        isAnimating={isAnimating}
        onTimeChange={setTime}
        onToggleAnimation={() => setIsAnimating((prev) => !prev)}
        onSeasonChange={setSeason}
      />

      <BuildingControlPanel
        buildings={buildings}
        selectedBuilding={selectedBuilding}
        onSelectBuilding={setSelectedBuilding}
        onMoveBuilding={moveBuildingBy}
        onSetBuildingX={setBuildingX}
        onSetBuildingZ={setBuildingZ}
        onResetBuildings={resetBuildings}
      />

      <SunInfoPanel time={time} season={season} />
      <MouseControlHint />
    </div>
  );
}
