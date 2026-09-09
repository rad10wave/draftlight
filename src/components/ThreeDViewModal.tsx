import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  X,
  Camera,
  Layers,
  Sun,
  Eye,
  RotateCcw,
  Maximize2,
  Box,
  Compass,
  Download,
} from 'lucide-react';
import { DesignTab } from '../types';
import { calculateSolarPosition } from '../utils/solarCalculator';
import { getWallLength, getWallVectors } from '../utils/wallOpenings';

interface ThreeDViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: DesignTab;
}

export const ThreeDViewModal: React.FC<ThreeDViewModalProps> = ({
  isOpen,
  onClose,
  activeTab,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraMode, setCameraMode] = useState<'ortho' | 'perspective'>('ortho');
  const [wallHeight, setWallHeight] = useState<number>(activeTab.storyLevel?.wallHeight || 2.8);
  const [showRoofCut, setShowRoofCut] = useState<boolean>(true);
  const [showSunLight, setShowSunLight] = useState<boolean>(true);
  const [isRotating, setIsRotating] = useState<boolean>(false);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const orthoCamRef = useRef<THREE.OrthographicCamera | null>(null);
  const perspCamRef = useRef<THREE.PerspectiveCamera | null>(null);
  const activeCameraRef = useRef<THREE.Camera | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Orbit navigation state
  const orbitRef = useRef({
    radius: 35,
    theta: Math.PI / 4, // 45 deg azimuth
    phi: Math.PI / 3, // 60 deg elevation
    target: new THREE.Vector3(0, 0, 0),
    isPointerDown: false,
    pointerStartX: 0,
    pointerStartY: 0,
    button: 0,
  });

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // warm neutral slate-100
    sceneRef.current = scene;

    // 2. Cameras
    const aspect = width / height;
    const frustumSize = 24;
    const orthoCam = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    orthoCamRef.current = orthoCam;

    const perspCam = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    perspCamRef.current = perspCam;

    activeCameraRef.current = cameraMode === 'ortho' ? orthoCam : perspCam;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 150;
    const d = 25;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    // Solar angle positioning
    const solarPos = calculateSolarPosition(
      activeTab.solarSettings || {
        northAngle: 0,
        latitude: 40.7,
        season: 'summer',
        timeOfDay: 14.0,
        showCompass: true,
        showShadows: true,
      }
    );

    const sunRad = ((solarPos.azimuth - 90) * Math.PI) / 180;
    const altRad = (Math.max(15, solarPos.altitude) * Math.PI) / 180;
    const sunDist = 40;
    dirLight.position.set(
      Math.cos(altRad) * Math.cos(sunRad) * sunDist,
      Math.sin(altRad) * sunDist,
      Math.cos(altRad) * Math.sin(sunRad) * sunDist
    );
    scene.add(dirLight);

    // 5. Compute Model Center to center the floor plan around (0,0,0)
    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;

    activeTab.walls.forEach((w) => {
      minX = Math.min(minX, w.x1, w.x2);
      maxX = Math.max(maxX, w.x1, w.x2);
      minZ = Math.min(minZ, w.y1, w.y2);
      maxZ = Math.max(maxZ, w.y1, w.y2);
    });
    activeTab.rooms.forEach((r) => {
      minX = Math.min(minX, r.x, r.x + r.width);
      maxX = Math.max(maxX, r.x, r.x + r.width);
      minZ = Math.min(minZ, r.y, r.y + r.depth);
      maxZ = Math.max(maxZ, r.y, r.y + r.depth);
    });

    if (!isFinite(minX)) {
      minX = 0;
      maxX = 10;
      minZ = 0;
      maxZ = 10;
    }

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    orbitRef.current.target.set(0, wallHeight / 2, 0);

    // 6. Ground & Foundation Slab
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.9,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.05;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Subtle drafting grid
    const grid = new THREE.GridHelper(50, 50, 0x94a3b8, 0xcbd5e1);
    grid.position.y = -0.04;
    scene.add(grid);

    // 7. Room Floor Slabs
    activeTab.rooms.forEach((room) => {
      const rw = room.width;
      const rd = room.depth;
      const rx = room.x + rw / 2 - centerX;
      const rz = room.y + rd / 2 - centerZ;

      const floorGeo = new THREE.BoxGeometry(rw, 0.08, rd);
      const floorMat = new THREE.MeshStandardMaterial({
        color: room.color?.includes('rgba') ? 0xf8fafc : 0xffffff,
        roughness: 0.6,
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.set(rx, 0.04, rz);
      floorMesh.receiveShadow = true;
      scene.add(floorMesh);
    });

    // 8. Extruded Walls with Openings
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.05,
    });
    const wallCapMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155, // slate-700 architectural wall cap
      roughness: 0.3,
    });

    activeTab.walls.forEach((wall) => {
      const length = getWallLength(wall);
      if (length < 0.05) return;

      const { ux, uy, length: wLen } = getWallVectors(wall);
      const angle = Math.atan2(uy, ux);
      const thickness = wall.thickness || 0.15;

      // Check if wall has openings
      const openings = wall.openings || [];

      if (openings.length === 0) {
        // Solid wall extrusion
        const wallGeo = new THREE.BoxGeometry(length, wallHeight, thickness);
        const wallMesh = new THREE.Mesh(wallGeo, [
          wallMaterial,
          wallMaterial,
          wallCapMaterial,
          wallMaterial,
          wallMaterial,
          wallMaterial,
        ]);
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;

        // Position: midpoint of wall
        const midX = (wall.x1 + wall.x2) / 2 - centerX;
        const midZ = (wall.y1 + wall.y2) / 2 - centerZ;

        wallMesh.position.set(midX, wallHeight / 2, midZ);
        wallMesh.rotation.y = -angle;
        scene.add(wallMesh);
      } else {
        // Segmented wall with openings
        // Create base intervals along the wall
        const cuts = openings.map((op) => ({
          type: op.type,
          start: Math.max(0, op.distanceAlongWall - op.width / 2),
          end: Math.min(length, op.distanceAlongWall + op.width / 2),
          width: op.width,
          height: op.height || (op.type === 'window' ? 1.2 : 2.1),
          sillHeight: op.sillHeight || (op.type === 'window' ? 0.9 : 0),
        }));

        cuts.sort((a, b) => a.start - b.start);

        let cur = 0;
        const wallOriginX = wall.x1 - centerX;
        const wallOriginZ = wall.y1 - centerZ;

        cuts.forEach((cut) => {
          // Solid segment before opening
          if (cut.start > cur + 0.02) {
            const segLen = cut.start - cur;
            const segMid = cur + segLen / 2;
            const geo = new THREE.BoxGeometry(segLen, wallHeight, thickness);
            const m = new THREE.Mesh(geo, wallMaterial);
            m.castShadow = true;
            m.receiveShadow = true;
            m.position.set(
              wallOriginX + segMid * ux,
              wallHeight / 2,
              wallOriginZ + segMid * uy
            );
            m.rotation.y = -angle;
            scene.add(m);
          }

          // Opening cutout: if window, build sill wall beneath it & lintel above
          if (cut.type === 'window' && cut.sillHeight > 0.05) {
            const sillGeo = new THREE.BoxGeometry(cut.width, cut.sillHeight, thickness);
            const sillMesh = new THREE.Mesh(sillGeo, wallMaterial);
            sillMesh.castShadow = true;
            sillMesh.receiveShadow = true;
            const cutMid = (cut.start + cut.end) / 2;
            sillMesh.position.set(
              wallOriginX + cutMid * ux,
              cut.sillHeight / 2,
              wallOriginZ + cutMid * uy
            );
            sillMesh.rotation.y = -angle;
            scene.add(sillMesh);
          }

          // Lintel above opening
          const openingTop = cut.sillHeight + cut.height;
          if (openingTop < wallHeight - 0.05) {
            const lintelHeight = wallHeight - openingTop;
            const lintelGeo = new THREE.BoxGeometry(cut.width, lintelHeight, thickness);
            const lintelMesh = new THREE.Mesh(lintelGeo, wallMaterial);
            lintelMesh.castShadow = true;
            lintelMesh.receiveShadow = true;
            const cutMid = (cut.start + cut.end) / 2;
            lintelMesh.position.set(
              wallOriginX + cutMid * ux,
              openingTop + lintelHeight / 2,
              wallOriginZ + cutMid * uy
            );
            lintelMesh.rotation.y = -angle;
            scene.add(lintelMesh);
          }

          cur = cut.end;
        });

        // Final segment after last cut
        if (cur < length - 0.02) {
          const segLen = length - cur;
          const segMid = cur + segLen / 2;
          const geo = new THREE.BoxGeometry(segLen, wallHeight, thickness);
          const m = new THREE.Mesh(geo, wallMaterial);
          m.castShadow = true;
          m.receiveShadow = true;
          m.position.set(
            wallOriginX + segMid * ux,
            wallHeight / 2,
            wallOriginZ + segMid * uy
          );
          m.rotation.y = -angle;
          scene.add(m);
        }
      }
    });

    // 9. 3D Furniture Blocks
    const furnMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // slate-500
      roughness: 0.5,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // warm amber/wood
      roughness: 0.6,
    });
    const bedMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // blue
      roughness: 0.8,
    });

    activeTab.furniture.forEach((furn) => {
      const fw = furn.width;
      const fd = furn.depth;
      const fh = furn.height || 0.75;
      const fx = furn.x - centerX;
      const fz = furn.y - centerZ;

      let chosenMat = furnMat;
      if (furn.category === 'bedroom') chosenMat = bedMat;
      else if (furn.category === 'living') chosenMat = woodMat;

      const fGeo = new THREE.BoxGeometry(fw, fh, fd);
      const fMesh = new THREE.Mesh(fGeo, chosenMat);
      fMesh.position.set(fx, fh / 2 + 0.05, fz);
      fMesh.rotation.y = (-furn.rotation * Math.PI) / 180;
      fMesh.castShadow = true;
      fMesh.receiveShadow = true;
      scene.add(fMesh);
    });

    // Update Camera position
    const updateCamera = () => {
      const { radius, theta, phi, target } = orbitRef.current;
      const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      const y = target.y + radius * Math.cos(phi);
      const z = target.z + radius * Math.sin(phi) * Math.cos(theta);

      if (orthoCamRef.current) {
        orthoCamRef.current.position.set(x, y, z);
        orthoCamRef.current.lookAt(target);
      }
      if (perspCamRef.current) {
        perspCamRef.current.position.set(x, y, z);
        perspCamRef.current.lookAt(target);
      }
    };

    updateCamera();

    // Render loop
    const animate = () => {
      if (isRotating) {
        orbitRef.current.theta += 0.005;
        updateCamera();
      }
      const cam = cameraMode === 'ortho' ? orthoCamRef.current : perspCamRef.current;
      if (rendererRef.current && sceneRef.current && cam) {
        rendererRef.current.render(sceneRef.current, cam);
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Mouse & Touch Controls
    const dom = containerRef.current;

    const onPointerDown = (e: PointerEvent) => {
      orbitRef.current.isPointerDown = true;
      orbitRef.current.pointerStartX = e.clientX;
      orbitRef.current.pointerStartY = e.clientY;
      orbitRef.current.button = e.button;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!orbitRef.current.isPointerDown) return;
      const dx = e.clientX - orbitRef.current.pointerStartX;
      const dy = e.clientY - orbitRef.current.pointerStartY;
      orbitRef.current.pointerStartX = e.clientX;
      orbitRef.current.pointerStartY = e.clientY;

      if (orbitRef.current.button === 2 || e.shiftKey) {
        // Pan
        const panSpeed = 0.03;
        orbitRef.current.target.x -= dx * panSpeed;
        orbitRef.current.target.z += dy * panSpeed;
      } else {
        // Orbit
        const rotSpeed = 0.008;
        orbitRef.current.theta -= dx * rotSpeed;
        orbitRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitRef.current.phi - dy * rotSpeed));
      }
      updateCamera();
    };

    const onPointerUp = () => {
      orbitRef.current.isPointerDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      orbitRef.current.radius = Math.max(5, Math.min(100, orbitRef.current.radius * zoomFactor));
      if (orthoCamRef.current) {
        orthoCamRef.current.zoom = Math.max(0.2, Math.min(5, orthoCamRef.current.zoom / zoomFactor));
        orthoCamRef.current.updateProjectionMatrix();
      }
      updateCamera();
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      const asp = w / h;

      if (orthoCamRef.current) {
        orthoCamRef.current.left = (-frustumSize * asp) / 2;
        orthoCamRef.current.right = (frustumSize * asp) / 2;
        orthoCamRef.current.top = frustumSize / 2;
        orthoCamRef.current.bottom = -frustumSize / 2;
        orthoCamRef.current.updateProjectionMatrix();
      }
      if (perspCamRef.current) {
        perspCamRef.current.aspect = asp;
        perspCamRef.current.updateProjectionMatrix();
      }
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [isOpen, cameraMode, wallHeight, showSunLight, isRotating, activeTab]);

  const setViewPreset = (theta: number, phi: number) => {
    orbitRef.current.theta = theta;
    orbitRef.current.phi = phi;
    const { radius, target } = orbitRef.current;
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);

    if (orthoCamRef.current) {
      orthoCamRef.current.position.set(x, y, z);
      orthoCamRef.current.lookAt(target);
    }
    if (perspCamRef.current) {
      perspCamRef.current.position.set(x, y, z);
      perspCamRef.current.lookAt(target);
    }
  };

  const handleCaptureSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${activeTab.name.toLowerCase().replace(/\s+/g, '_')}_3d_axonometric.png`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div
      id="draftlight-3d-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-lg">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                3D Architectural Model Preview
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time 3D extrusion with door/window cuts, furniture blocks & solar shadows
              </p>
            </div>
          </div>

          {/* Quick Presets & Toggles */}
          <div className="flex items-center gap-2">
            {/* Camera Projection Toggle */}
            <div className="bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg flex items-center text-xs">
              <button
                id="btn-cam-ortho"
                onClick={() => setCameraMode('ortho')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  cameraMode === 'ortho'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Axonometric (Ortho)
              </button>
              <button
                id="btn-cam-persp"
                onClick={() => setCameraMode('perspective')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  cameraMode === 'perspective'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Perspective
              </button>
            </div>

            {/* Turntable rotation */}
            <button
              id="btn-turntable"
              onClick={() => setIsRotating(!isRotating)}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 ${
                isRotating
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Auto-rotate model turntable"
            >
              <RotateCcw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Turntable</span>
            </button>

            {/* Snapshot */}
            <button
              id="btn-snapshot"
              onClick={handleCaptureSnapshot}
              className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium hover:bg-slate-800 dark:hover:bg-white flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Snapshot</span>
            </button>

            <button
              id="btn-close-3d"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D Canvas Viewport */}
        <div className="relative flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden select-none">
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Floating Camera Presets Bar */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[11px] font-medium text-slate-400 px-2">Preset:</span>
            <button
              onClick={() => setViewPreset(Math.PI / 4, Math.PI / 3)}
              className="px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300"
            >
              Isometric SW
            </button>
            <button
              onClick={() => setViewPreset(-Math.PI / 4, Math.PI / 3)}
              className="px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300"
            >
              Isometric SE
            </button>
            <button
              onClick={() => setViewPreset((3 * Math.PI) / 4, Math.PI / 3)}
              className="px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300"
            >
              Isometric NW
            </button>
            <button
              onClick={() => setViewPreset(0, 0.01)}
              className="px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300"
            >
              Top-Down
            </button>
          </div>

          {/* Floating Controls Bar (Bottom) */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Wall Height:</span>
                <input
                  type="range"
                  min="2.0"
                  max="4.0"
                  step="0.1"
                  value={wallHeight}
                  onChange={(e) => setWallHeight(parseFloat(e.target.value))}
                  className="w-24 accent-indigo-600"
                />
                <span className="font-mono font-medium">{wallHeight.toFixed(1)}m</span>
              </div>
            </div>

            <div className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
              Drag to Orbit • Right-Click / Shift+Drag to Pan • Scroll to Zoom
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
