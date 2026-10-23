import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Maximize2, Minimize2, RotateCcw, Plus, Minus, Compass, AlertCircle, RefreshCw, Eye } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export interface BikeHotspot {
  id: string;
  num: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  specs: { label: string; value: string }[];
  worldAnchor: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  cameraPos: { x: number; y: number; z: number };
  modelRotation: { x: number; y: number };
}

const BIKE_HOTSPOTS: BikeHotspot[] = [
  {
    id: 'engine',
    num: '01',
    category: '01 / ENGINE',
    title: 'J-SERIES 349 CC',
    subtitle: 'AIR-OIL COOLED SOHC',
    description: 'Single-cylinder with primary counter-balancer shaft. Engineered for visceral low-end cadence and vibration-isolated cruising.',
    specs: [
      { label: 'DISPLACEMENT', value: '349 CC' },
      { label: 'MAX POWER', value: '20.2 BHP' },
      { label: 'PEAK TORQUE', value: '27 NM' },
      { label: 'BALANCER', value: 'Primary Shaft' },
    ],
    worldAnchor: { x: 0.12, y: 0.65, z: 0.05 },
    cameraTarget: { x: 0.10, y: 0.62, z: 0.0 },
    cameraPos: { x: 0.10, y: 0.68, z: 1.25 },
    modelRotation: { x: 0.0, y: 0.0 },
  },
  {
    id: 'exhaust',
    num: '02',
    category: '02 / EXHAUST',
    title: 'PEASHOOTER SILENCER',
    subtitle: 'TUNED BASS CADENCE',
    description: 'Hydroformed primary header runner and chrome peashooter silencer tuned for deep bass exhaust pulse with BS6 compliance.',
    specs: [
      { label: 'FINISH', value: 'Triple Chrome' },
      { label: 'EMISSION', value: 'BS6 Phase-2' },
      { label: 'TYPE', value: 'Peashooter' },
      { label: 'CATALYTIC', value: 'Integrated' },
    ],
    worldAnchor: { x: -0.35, y: 0.44, z: 0.18 },
    cameraTarget: { x: -0.25, y: 0.44, z: 0.0 },
    cameraPos: { x: -0.20, y: 0.52, z: 1.35 },
    modelRotation: { x: 0.02, y: -0.38 },
  },
  {
    id: 'headlight',
    num: '03',
    category: '03 / HEADLIGHT',
    title: 'CASQUETTE PILOT LAMP',
    subtitle: 'TIGER-EYE NACELLE',
    description: 'Signature cast aluminium nacelle integrating a powerful reflector and iconic twin LED tiger-eye pilot lights with 12V DC stator.',
    specs: [
      { label: 'HOUSING', value: 'Cast Nacelle' },
      { label: 'HALO LIGHTS', value: 'Twin LED Pilots' },
      { label: 'CIRCUIT', value: '12V Constant DC' },
      { label: 'BEAM', value: 'High/Low Halogen' },
    ],
    worldAnchor: { x: 0.58, y: 1.10, z: 0.0 },
    cameraTarget: { x: 0.50, y: 1.05, z: 0.0 },
    cameraPos: { x: 0.65, y: 1.15, z: 1.15 },
    modelRotation: { x: 0.04, y: 0.65 },
  },
  {
    id: 'tank',
    num: '04',
    category: '04 / TANK',
    title: 'TEARDROP RESERVOIR',
    subtitle: 'HAND-CRAFTED PINSTRIPES',
    description: 'Heavy-gauge stamped steel fuel tank finished in deep automotive gloss, hand-crafted with authentic Madras dual gold coachlines.',
    specs: [
      { label: 'CAPACITY', value: '13.0 Litres' },
      { label: 'MATERIAL', value: 'Deep-Drawn Steel' },
      { label: 'PINSTRIPES', value: 'Hand-Crafted Gold' },
      { label: 'BADGING', value: 'Die-Cast Crest' },
    ],
    worldAnchor: { x: 0.08, y: 1.02, z: 0.0 },
    cameraTarget: { x: 0.08, y: 0.98, z: 0.0 },
    cameraPos: { x: 0.15, y: 1.35, z: 1.20 },
    modelRotation: { x: -0.12, y: 0.22 },
  },
  {
    id: 'seat',
    num: '05',
    category: '05 / SEAT',
    title: 'SCULPTED SADDLE',
    subtitle: 'SPRUNG TOURING ERGONOMICS',
    description: 'Contoured dual-density foam single saddle supported on a sprung subframe for commanding upright posture and touring composure.',
    specs: [
      { label: 'SEAT HEIGHT', value: '805 MM' },
      { label: 'FOAM', value: 'Dual-Density' },
      { label: 'SUBFRAME', value: 'Sprung Steel' },
      { label: 'UPHOLSTERY', value: 'Weather-Shield' },
    ],
    worldAnchor: { x: -0.45, y: 0.86, z: 0.0 },
    cameraTarget: { x: -0.42, y: 0.84, z: 0.0 },
    cameraPos: { x: -0.45, y: 1.25, z: 1.20 },
    modelRotation: { x: -0.08, y: -0.42 },
  },
];


// Shared module-level GLTF model promise cache — prevents downloading 25.5MB multiple times
let cachedGltfPromise: Promise<any> | null = null;

/**
 * Bike3DExperience — Clean, Rebuilt Interactive 3D Experience
 */
export default function Bike3DExperience() {
  const [activeIdx, setActiveIdx] = useState<number | null>(0);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Defer heavy Three.js canvas & 25.5MB GLTF loading until section approaches or user interacts
  const [shouldInit3D, setShouldInit3D] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      return hash === '#bike-3d' || hash === '#3d-experience' || window.scrollY > 250;
    }
    return false;
  });

  const isMountedRef = useRef<boolean>(true);

  // DOM Refs
  const sectionRef = useRef<HTMLElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const detailsPanelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Activate 3D engine only as section approaches viewport or on navigation to 3D section
  useEffect(() => {
    if (shouldInit3D) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldInit3D(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px 0px 0px', threshold: 0.02 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const onUserNav = () => {
      const hash = window.location.hash;
      if (hash === '#bike-3d' || hash === '#3d-experience' || window.scrollY > 80) {
        setShouldInit3D(true);
      }
    };

    const onScrollThreshold = () => {
      if (window.scrollY > 80) {
        setShouldInit3D(true);
        window.removeEventListener('scroll', onScrollThreshold);
      }
    };

    window.addEventListener('scroll', onScrollThreshold, { passive: true });
    window.addEventListener('hashchange', onUserNav);
    const onInitCustom = () => setShouldInit3D(true);
    window.addEventListener('init-bike-3d', onInitCustom);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScrollThreshold);
      window.removeEventListener('hashchange', onUserNav);
      window.removeEventListener('init-bike-3d', onInitCustom);
    };
  }, [shouldInit3D]);

  // Three.js State Ref
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    modelGroup: THREE.Group | null;
    animFrameId: number | null;
    defaultCamPos: THREE.Vector3;
    defaultTarget: THREE.Vector3;
    currentCamPos: THREE.Vector3;
    targetCamPos: THREE.Vector3;
    currentLookAt: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    // Interaction Physics
    isDragging: boolean;
    prevPointerPos: { x: number; y: number };
    rotVelocity: { x: number; y: number };
    rotationTarget: { x: number; y: number };
    lastInteractTime: number;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    modelGroup: null,
    animFrameId: null,
    defaultCamPos: new THREE.Vector3(2.25, 1.12, 2.25),
    defaultTarget: new THREE.Vector3(0, 0.74, 0),
    currentCamPos: new THREE.Vector3(2.25, 1.12, 2.25),
    targetCamPos: new THREE.Vector3(2.25, 1.12, 2.25),
    currentLookAt: new THREE.Vector3(0, 0.74, 0),
    targetLookAt: new THREE.Vector3(0, 0.74, 0),
    isDragging: false,
    prevPointerPos: { x: 0, y: 0 },
    rotVelocity: { x: 0, y: 0 },
    rotationTarget: { x: 0, y: 0.35 },
    lastInteractTime: Date.now(),
  });

  const activeComp = BIKE_HOTSPOTS[activeIdx ?? 0];

  /**
   * Initialize Three.js Scene, Studio Lighting & GLTF Model Loader
   */
  useEffect(() => {
    isMountedRef.current = true;
    if (!shouldInit3D) return;

    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 580;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF4F0E8);

    // 2. Camera: 36° FOV for crisp framing
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.copy(threeRef.current.defaultCamPos);
    camera.lookAt(threeRef.current.defaultTarget);

    // 3. Renderer with ACES Filmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Model Pivot Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // 5. Cinematic Daylight Studio Lighting Setup
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(4.5, 5.5, 4.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x78a9e8, 2.6);
    rimLight.position.set(-4.5, 3.8, -4.0);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xf4f0e8, 1.8);
    fillLight.position.set(-3.5, 2.5, 3.5);
    scene.add(fillLight);

    const topLight = new THREE.DirectionalLight(0xfffbf4, 1.6);
    topLight.position.set(0, 6, 0);
    scene.add(topLight);

    const hemiLight = new THREE.HemisphereLight(0xfffbf4, 0xd0d8e2, 1.1);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xfff8ee, 1.0);
    scene.add(ambientLight);

    // 6. Ground Radial Contact Shadow Disc
    const shadowGeo = new THREE.PlaneGeometry(3.6, 2.0);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (shadowCtx) {
      shadowCtx.clearRect(0, 0, 512, 512);
      const grad = shadowCtx.createRadialGradient(256, 256, 15, 256, 256, 240);
      grad.addColorStop(0, 'rgba(23, 40, 61, 0.45)');
      grad.addColorStop(0.35, 'rgba(23, 40, 61, 0.25)');
      grad.addColorStop(0.7, 'rgba(23, 40, 61, 0.08)');
      grad.addColorStop(1, 'rgba(23, 40, 61, 0)');
      shadowCtx.fillStyle = grad;
      shadowCtx.fillRect(0, 0, 512, 512);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.003;
    scene.add(shadowMesh);

    // Store Three.js instances
    threeRef.current.renderer = renderer;
    threeRef.current.scene = scene;
    threeRef.current.camera = camera;
    threeRef.current.modelGroup = modelGroup;

    // 7. Load GLTF Model
    const loader = new GLTFLoader();
    const primaryModelUrl = '/royal_enfield.glb';

    const handleModelLoaded = (gltf: any) => {
      const root = gltf.scene;

      // Remove cyclorama / backdrop meshes
      const nodesToRemove: THREE.Object3D[] = [];
      root.traverse((node: THREE.Object3D) => {
        const nameLower = (node.name || '').toLowerCase();
        if (
          nameLower.includes('cyclorama') ||
          nameLower.includes('cube.129') ||
          nameLower.includes('studio')
        ) {
          nodesToRemove.push(node);
        }
      });
      nodesToRemove.forEach((node) => {
        if (node.parent) {
          node.parent.remove(node);
        }
      });

      // Calculate initial motorcycle-only bounding box
      const initialBox = new THREE.Box3().setFromObject(root);
      const initialCenter = initialBox.getCenter(new THREE.Vector3());
      const initialSize = initialBox.getSize(new THREE.Vector3());

      // Center horizontally on (0,0) and ground tires on Y = 0
      root.position.x = -initialCenter.x;
      root.position.y = -initialBox.min.y;
      root.position.z = -initialCenter.z;

      // Scale model so length is normalized to 2.4 units
      const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z);
      const scaleFactor = 2.4 / (maxDim || 1);
      modelGroup.scale.setScalar(scaleFactor);

      // Shadow and material updates
      root.traverse((node: THREE.Object3D) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.frustumCulled = true;
          mesh.visible = true;

          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((mat: any) => {
              mat.visible = true;
              if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                const stdMat = mat as THREE.MeshStandardMaterial;
                stdMat.envMapIntensity = 1.35;
                stdMat.needsUpdate = true;
              }
            });
          }
        }
      });

      modelGroup.add(root);
      modelGroup.updateMatrixWorld(true);

      // Recompute normalized bounding box to calculate automatic camera framing
      const normBox = new THREE.Box3().setFromObject(modelGroup);
      const normCenter = normBox.getCenter(new THREE.Vector3());
      const normSize = normBox.getSize(new THREE.Vector3());

      // Auto-calculate camera distance based on bounding box dimensions and FOV
      const radius = normSize.length() * 0.5;
      const fovRad = (camera.fov * Math.PI) / 180;
      let camDist = radius / Math.sin(fovRad / 2);
      camDist *= 0.71; // increases visible motorcycle size by ~13-15% while keeping centered and fully framed

      const defaultCam = new THREE.Vector3(
        camDist * 0.72,
        normCenter.y + 0.26,
        camDist * 0.72
      );
      const defaultTgt = new THREE.Vector3(0, normCenter.y, 0);

      threeRef.current.defaultCamPos.copy(defaultCam);
      threeRef.current.defaultTarget.copy(defaultTgt);
      threeRef.current.targetCamPos.copy(defaultCam);
      threeRef.current.targetLookAt.copy(defaultTgt);
      threeRef.current.currentCamPos.copy(defaultCam);
      threeRef.current.currentLookAt.copy(defaultTgt);

      camera.position.copy(defaultCam);
      camera.lookAt(defaultTgt);

      if (isMountedRef.current) {
        setIsLoading(false);
        setLoadError(null);
      }

      if (renderer && scene && camera) {
        try {
          renderer.compile(scene, camera);
        } catch {}
      }
    };

    // Load model using cached promise to prevent duplicate 25.5MB downloads
    if (!cachedGltfPromise) {
      const loader = new GLTFLoader();
      cachedGltfPromise = new Promise((resolve, reject) => {
        loader.load(
          primaryModelUrl,
          (gltf: any) => resolve(gltf),
          (xhr: any) => {
            if (xhr.total > 0 && isMountedRef.current) {
              setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          (err: any) => {
            cachedGltfPromise = null; // Clear to allow retry on error
            reject(err);
          }
        );
      });
    }

    cachedGltfPromise
      .then((gltf: any) => {
        if (!isMountedRef.current) return;
        // Clone scene hierarchy so each renderer instance gets its own active scene graph
        const modelInstance = {
          ...gltf,
          scene: gltf.scene.clone(true)
        };
        handleModelLoaded(modelInstance);
      })
      .catch((err: any) => {
        if (!isMountedRef.current) return;
        console.error('Failed to load Royal Enfield GLTF model:', err);
        setIsLoading(false);
        setLoadError('UNABLE TO LOAD 3D MODEL. Please verify file availability in public directory.');
      });

    // 8. Animation & Render Loop with Visibility Observation
    let lastTime = performance.now();
    const tempVec = new THREE.Vector3();
    let isSectionVisible = false;
    let isTabVisible = !document.hidden;

    const animate = () => {
      threeRef.current.animFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      lastTime = now;

      const state = threeRef.current;

      // Apply rotation velocity damping / inertia
      if (!state.isDragging) {
        state.rotVelocity.x *= 0.92;
        state.rotVelocity.y *= 0.92;

        state.rotationTarget.y += state.rotVelocity.x;
        state.rotationTarget.x += state.rotVelocity.y;

        state.rotationTarget.x = Math.max(-0.25, Math.min(0.40, state.rotationTarget.x));

        // Idle subtle movement after 2s of inactivity
        const timeSinceInteract = (Date.now() - state.lastInteractTime) / 1000;
        if (timeSinceInteract > 2.0) {
          const idleTime = (Date.now() - state.lastInteractTime - 2000) / 1000;
          const idleSway = Math.sin(idleTime * 0.6) * 0.0012;
          state.rotationTarget.y += idleSway;

          if (state.modelGroup) {
            state.modelGroup.position.y = Math.sin(idleTime * 1.2) * 0.012;
          }
        }
      }

      // Smoothly apply rotation target to modelGroup
      if (state.modelGroup) {
        state.modelGroup.rotation.y = THREE.MathUtils.lerp(state.modelGroup.rotation.y, state.rotationTarget.y, 0.08);
        state.modelGroup.rotation.x = THREE.MathUtils.lerp(state.modelGroup.rotation.x, state.rotationTarget.x, 0.08);
      }

      // Smooth camera position and lookAt interpolation
      state.currentCamPos.lerp(state.targetCamPos, 0.06);
      state.currentLookAt.lerp(state.targetLookAt, 0.06);

      if (state.camera) {
        state.camera.position.copy(state.currentCamPos);
        state.camera.lookAt(state.currentLookAt);
      }

      if (state.renderer && state.scene && state.camera) {
        state.renderer.render(state.scene, state.camera);

        // Hardware-accelerated direct DOM projection (ZERO React re-renders)
        if (container && state.modelGroup) {
          const rect = container.getBoundingClientRect();
          BIKE_HOTSPOTS.forEach((h, idx) => {
            const pinEl = pinRefs.current[idx];
            if (!pinEl) return;
            tempVec.set(h.worldAnchor.x, h.worldAnchor.y, h.worldAnchor.z);
            tempVec.applyEuler(state.modelGroup!.rotation);
            tempVec.add(state.modelGroup!.position);
            tempVec.project(state.camera!);

            const isBehind = tempVec.z > 1;
            const sx = ((tempVec.x + 1) * 0.5) * rect.width;
            const sy = ((-tempVec.y + 1) * 0.5) * rect.height;
            const isVisible = !isBehind && sx >= 20 && sx <= rect.width - 20 && sy >= 20 && sy <= rect.height - 20;

            if (isVisible) {
              pinEl.style.display = 'block';
              pinEl.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -50%)`;
            } else {
              pinEl.style.display = 'none';
            }
          });
        }
      }
    };

    const stopLoop = () => {
      if (threeRef.current.animFrameId) {
        cancelAnimationFrame(threeRef.current.animFrameId);
        threeRef.current.animFrameId = null;
      }
    };

    const startLoop = () => {
      if (!threeRef.current.animFrameId && isSectionVisible && isTabVisible) {
        threeRef.current.animFrameId = requestAnimationFrame(animate);
      }
    };

    // Pause rendering when section is off-screen to preserve battery, CPU and GPU
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isSectionVisible = entry.isIntersecting;
        if (isSectionVisible) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      intersectionObserver.observe(sectionRef.current);
    }

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        startLoop();
      } else {
        stopLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      isMountedRef.current = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      intersectionObserver.disconnect();
      stopLoop();

      // Deep GPU resource and WebGL context disposal
      scene.traverse((node: any) => {
        if (node.isMesh) {
          node.geometry?.dispose();
          if (node.material) {
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach((m: any) => {
              Object.keys(m).forEach((prop) => {
                if (m[prop] && typeof m[prop].dispose === 'function') {
                  m[prop].dispose();
                }
              });
              m.dispose();
            });
          }
        }
      });
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();

      renderer.dispose();
      renderer.forceContextLoss();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [shouldInit3D]);

  /**
   * Pointer & Drag Interaction Handlers
   */
  const handlePointerDown = (e: React.PointerEvent) => {
    const state = threeRef.current;
    state.isDragging = true;
    state.prevPointerPos = { x: e.clientX, y: e.clientY };
    state.lastInteractTime = Date.now();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = threeRef.current;
    if (!state.isDragging) return;

    const dx = e.clientX - state.prevPointerPos.x;
    const dy = e.clientY - state.prevPointerPos.y;

    state.prevPointerPos = { x: e.clientX, y: e.clientY };
    state.lastInteractTime = Date.now();

    state.rotVelocity.x = dx * 0.005;
    state.rotVelocity.y = dy * 0.005;

    state.rotationTarget.y += dx * 0.005;
    state.rotationTarget.x += dy * 0.005;
    state.rotationTarget.x = Math.max(-0.25, Math.min(0.40, state.rotationTarget.x));
  };

  const handlePointerUp = () => {
    threeRef.current.isDragging = false;
    threeRef.current.lastInteractTime = Date.now();
  };

  /**
   * Wheel Zoom Handler
   */
  const handleWheel = (e: React.WheelEvent) => {
    const state = threeRef.current;
    state.lastInteractTime = Date.now();

    const zoomDelta = e.deltaY * 0.002;
    const dir = state.targetCamPos.clone().sub(state.targetLookAt).normalize();
    const curDist = state.targetCamPos.distanceTo(state.targetLookAt);
    const newDist = Math.max(1.4, Math.min(4.8, curDist + zoomDelta));

    state.targetCamPos.copy(state.targetLookAt).addScaledVector(dir, newDist);
  };

  /**
   * Zoom Controls (+ / -)
   */
  const handleZoom = (direction: 'in' | 'out') => {
    const state = threeRef.current;
    state.lastInteractTime = Date.now();
    const delta = direction === 'in' ? -0.45 : 0.45;
    const dir = state.targetCamPos.clone().sub(state.targetLookAt).normalize();
    const curDist = state.targetCamPos.distanceTo(state.targetLookAt);
    const newDist = Math.max(1.4, Math.min(4.8, curDist + delta));
    state.targetCamPos.copy(state.targetLookAt).addScaledVector(dir, newDist);
  };

  /**
   * Hotspot Component Selection & Camera Pivot
   */
  const selectHotspot = useCallback((index: number) => {
    setActiveIdx(index);
    const comp = BIKE_HOTSPOTS[index];
    const state = threeRef.current;
    state.lastInteractTime = Date.now();

    // Smooth camera transition to target & position
    state.targetCamPos.set(comp.cameraPos.x, comp.cameraPos.y, comp.cameraPos.z);
    state.targetLookAt.set(comp.cameraTarget.x, comp.cameraTarget.y, comp.cameraTarget.z);
    
    // Smooth model orientation to feature the component
    state.rotationTarget = { x: comp.modelRotation.x, y: comp.modelRotation.y };
    state.rotVelocity = { x: 0, y: 0 };

    if (detailsPanelRef.current) {
      gsap.fromTo(
        detailsPanelRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, []);

  /**
   * Reset Camera & Orientation to Full Overview
   */
  const resetCamera = useCallback(() => {
    setActiveIdx(null);
    const state = threeRef.current;
    state.lastInteractTime = Date.now();
    state.targetCamPos.copy(state.defaultCamPos);
    state.targetLookAt.copy(state.defaultTarget);
    state.rotationTarget = { x: 0, y: 0.35 };
    state.rotVelocity = { x: 0, y: 0 };
  }, []);

  /**
   * Keyboard Shortcuts (Arrow Keys, +, -, 0, R, ESC)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = threeRef.current;
      if (e.key === 'ArrowLeft') {
        state.rotationTarget.y -= 0.15;
        state.lastInteractTime = Date.now();
      } else if (e.key === 'ArrowRight') {
        state.rotationTarget.y += 0.15;
        state.lastInteractTime = Date.now();
      } else if (e.key === 'ArrowUp') {
        state.rotationTarget.x = Math.max(-0.25, state.rotationTarget.x - 0.1);
        state.lastInteractTime = Date.now();
      } else if (e.key === 'ArrowDown') {
        state.rotationTarget.x = Math.min(0.40, state.rotationTarget.x + 0.1);
        state.lastInteractTime = Date.now();
      } else if (e.key === '+' || e.key === '=') {
        handleZoom('in');
      } else if (e.key === '-' || e.key === '_') {
        handleZoom('out');
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
        resetCamera();
      } else if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, resetCamera]);

  /**
   * GSAP ScrollTrigger Entrance Animation
   */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });

      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
      )
        .fromTo(
          canvasContainerRef.current,
          { opacity: 0, scale: 0.90 },
          { opacity: 1, scale: 1, duration: 0.85, ease: 'power2.out' },
          '-=0.35'
        );

      if (detailsPanelRef.current) {
        tl.fromTo(
          detailsPanelRef.current,
          { opacity: 0, x: 20 },
          { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' },
          '-=0.45'
        );
      }

      tl.fromTo(
        controlsRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.35'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="bike-3d"
      aria-label="Interactive 3D Motorcycle Detail Experience"
      className={`bike3d-section ${isFocusMode ? 'focus-mode' : ''}`}
    >
      {/* Anchor alias for #3d-experience navigation */}
      <div id="3d-experience" className="absolute top-0 left-0" aria-hidden="true" />
      {/* Subtle Ambient Grain Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat',
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* 1. Main Centered Section Container */}
      <div className="bike3d-container">
        
        {/* ============================================================== */}
        {/* 2. HEADER ROW: HEADING (LEFT) & ACTION CONTROLS (RIGHT) */}
        {/* ============================================================== */}
        <div
          ref={headerRef}
          className={`bike3d-header-row ${isFocusMode ? 'opacity-40 hover:opacity-100' : ''}`}
        >
          {/* Left: Eyebrow, 3D Chiselled Red & Gold Heading, Sub-heading, and Description */}
          <div className="bike3d-header-left max-w-xl">
            {/* Eyebrow with gold accent line */}
            <div className="flex items-center gap-3 mb-2.5">
              <span
                className="text-[11px] sm:text-[12px] tracking-[0.28em] text-[#C58A28] uppercase font-bold"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                3D EXPERIENCE —
              </span>
              <span className="w-8 sm:w-16 h-[1px] bg-gradient-to-r from-[#C58A28] to-transparent" />
            </div>

            {/* Main Chiselled 3D Red-and-Gold Title matching Hero section */}
            <h2
              id="bike3d-main-title"
              className="my-0 w-full"
              aria-label="UP CLOSE."
            >
              <span className="sr-only">UP CLOSE.</span>
              <svg
                viewBox="0 0 460 76"
                className="w-full max-w-[340px] sm:max-w-[420px] h-auto overflow-visible select-none"
                style={{
                  filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.22))',
                }}
              >
                <defs>
                  {/* Rich 3D Metallic Ruby/Crimson Body Gradient */}
                  <linearGradient id="upclose-logo-red" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FF7A6C" />
                    <stop offset="18%" stopColor="#FF4A40" />
                    <stop offset="38%" stopColor="#E30100" />
                    <stop offset="70%" stopColor="#A80000" />
                    <stop offset="100%" stopColor="#4A0000" />
                  </linearGradient>

                  {/* Polished Gold Bevel / Trim Gradient */}
                  <linearGradient id="upclose-logo-gold" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFF4BC" />
                    <stop offset="35%" stopColor="#FCCA02" />
                    <stop offset="70%" stopColor="#D49A00" />
                    <stop offset="100%" stopColor="#7A5200" />
                  </linearGradient>
                </defs>

                {/* 3D Extrusion Shadow Layer */}
                <text
                  x="2"
                  y="60"
                  fontFamily="'Cinzel', 'Playfair Display', serif"
                  fontSize="62"
                  fontWeight="900"
                  letterSpacing="4"
                  fill="#1F0202"
                  stroke="#593B00"
                  strokeWidth="2.8"
                  paintOrder="stroke fill"
                  opacity="0.92"
                >
                  UP CLOSE.
                </text>

                {/* Main Chiselled Front Face Layer */}
                <text
                  x="0"
                  y="56"
                  fontFamily="'Cinzel', 'Playfair Display', serif"
                  fontSize="62"
                  fontWeight="900"
                  letterSpacing="4"
                  fill="url(#upclose-logo-red)"
                  stroke="url(#upclose-logo-gold)"
                  strokeWidth="2.2"
                  paintOrder="stroke fill"
                >
                  UP CLOSE.
                </text>
              </svg>
            </h2>

            {/* Tagline: EXPLORE EVERY DETAIL */}
            <p
              className="text-[14px] tracking-[0.26em] text-[#C58A28] uppercase font-bold mt-3 mb-3"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              EXPLORE EVERY DETAIL
            </p>

            {/* Description */}
            <p
              className="text-[14px] text-[#536174] max-w-xl m-0 leading-[1.6] font-normal"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Interact with the bike in 3D and explore each component designed with purpose, performance and pure passion.
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. MAIN VIEWER LAYOUT: BALANCED TWO-COLUMN GRID */}
        {/* ============================================================== */}
        <div className="bike3d-grid">
          
          {/* Left Column: Shared Responsive Container for Controls & Viewer */}
          <div className="bike3d-viewer-column">
            {/* Integrated Action Controls Bar — Exact Width Matching Viewer */}
            <div
              className="bike3d-control-bar bike3d-header-actions"
              role="toolbar"
              aria-label="3D Viewer Controls"
            >
              {/* Full Bike Overview Button */}
              <button
                id="btn-full-view"
                type="button"
                onClick={resetCamera}
                className={`w-full flex items-center justify-center gap-1.5 sm:gap-2.5 py-1.5 sm:py-2 px-1 sm:px-3 rounded-full text-[11px] sm:text-[13px] md:text-[14px] font-bold tracking-wider uppercase transition-all cursor-pointer select-none whitespace-nowrap overflow-hidden ${
                  activeIdx === null
                    ? 'bg-gradient-to-r from-[#D4A64A] via-[#E8BE65] to-[#C58A28] text-[#17283D] shadow-[0_2px_10px_rgba(197,138,40,0.45)] border border-[#FFF4BC]'
                    : 'text-[#536174] hover:text-[#D71920] hover:bg-black/[0.04]'
                }`}
                title="Full Motorcycle Overview (0 / R)"
              >
                <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">FULL VIEW</span>
              </button>

              {/* Reset Orientation Button */}
              <button
                id="btn-reset-cam"
                type="button"
                onClick={resetCamera}
                className="w-full flex items-center justify-center gap-1.5 sm:gap-2.5 py-1.5 sm:py-2 px-1 sm:px-3 rounded-full text-[#536174] hover:text-[#D71920] hover:bg-black/[0.04] text-[11px] sm:text-[13px] md:text-[14px] font-bold tracking-wider uppercase transition-all cursor-pointer select-none whitespace-nowrap overflow-hidden"
                title="Reset 3D camera orientation (R)"
              >
                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">RESET</span>
              </button>

              {/* Focus / Fullscreen Mode */}
              <button
                id="btn-toggle-focus"
                type="button"
                onClick={() => setIsFocusMode(!isFocusMode)}
                className="w-full flex items-center justify-center gap-1.5 sm:gap-2.5 py-1.5 sm:py-2 px-1 sm:px-3 rounded-full text-[#536174] hover:text-[#D71920] hover:bg-black/[0.04] text-[11px] sm:text-[13px] md:text-[14px] font-bold tracking-wider uppercase transition-all cursor-pointer select-none whitespace-nowrap overflow-hidden"
                title="Toggle Fullscreen Focus Mode (ESC)"
              >
                {isFocusMode ? (
                  <Minimize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                ) : (
                  <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                )}
                <span className="truncate">{isFocusMode ? 'EXIT' : 'FOCUS'}</span>
              </button>
            </div>

            {/* 3D Three.js Canvas & Hotspots Viewer */}
            <div className="bike3d-viewer">
            {/* Loading Indicator */}
            {isLoading && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#F4F0E8]/95 backdrop-blur-md">
                <div className="w-12 h-12 rounded-full border-2 border-[#315F9C]/30 border-t-[#315F9C] animate-spin mb-4" />
                <p
                  className="text-xs tracking-[0.25em] text-[#315F9C] uppercase font-semibold"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  LOADING MACHINE {loadProgress > 0 ? `${loadProgress}%` : ''}
                </p>
              </div>
            )}

            {/* Error Fallback */}
            {loadError && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#F4F0E8]/95 backdrop-blur-md p-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                <p
                  className="text-sm tracking-wider text-red-500 uppercase font-semibold mb-3"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  {loadError}
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-3 px-4 py-2 mt-3 rounded-full bg-[#17283D] hover:bg-[#315F9C] text-xs uppercase tracking-wider text-white cursor-pointer font-semibold shadow-sm"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Application</span>
                </button>
              </div>
            )}

            {/* Three.js Canvas Container */}
            <div
              ref={canvasContainerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onDoubleClick={resetCamera}
              onWheel={handleWheel}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
              style={{ touchAction: 'none' }}
            />

            {/* 3D Hotspot Interactive Pins over the Motorcycle */}
            {!isLoading && !loadError && (
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                {BIKE_HOTSPOTS.map((pin, idx) => {
                  const isSelected = activeIdx === idx;
                  return (
                    <div
                      key={pin.id}
                      ref={(el) => {
                        pinRefs.current[idx] = el;
                      }}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        display: 'none',
                        fontFamily: "'Rajdhani', sans-serif",
                      }}
                      className="pointer-events-auto group will-change-transform"
                    >
                      <button
                        id={`hotspot-pin-${pin.id}`}
                        type="button"
                        onClick={() => selectHotspot(idx)}
                        className="relative flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-transform duration-300 hover:scale-125 focus:outline-none"
                        aria-label={`View ${pin.title}`}
                      >
                        {/* Pulse Ring */}
                        <span
                          className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
                            isSelected
                              ? 'bg-[#D4A64A]/50 animate-ping'
                              : 'bg-[#D71920]/25 group-hover:bg-[#C58A28]/35'
                          }`}
                        />
                        {/* Core Badge */}
                        <span
                          className={`relative flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-black tracking-tight transition-all duration-300 border ${
                            isSelected
                              ? 'bg-gradient-to-b from-[#FFF4BC] via-[#D4A64A] to-[#A87B20] text-[#1F0202] border-[#FFF4BC] shadow-[0_0_20px_rgba(212,166,74,0.95)] scale-110'
                              : 'bg-gradient-to-b from-[#D71920] to-[#8B0000] text-white border-[#F3D58A]/60 shadow-[0_3px_12px_rgba(139,0,0,0.55)] group-hover:border-[#F3D58A] group-hover:scale-105'
                          }`}
                        >
                          {pin.num}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Interactive Cue Hint */}
            <div
              className="absolute bottom-4 left-6 pointer-events-none select-none flex items-center gap-3 text-[11px] tracking-[0.18em] text-[#536174] uppercase z-20 font-semibold"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              <Compass className="w-3.5 h-3.5 text-[#C58A28]" />
              <span>DRAG TO ROTATE • WHEEL / PINCH TO ZOOM • DOUBLE CLICK TO RESET</span>
            </div>

            {/* Zoom Buttons (+ / -) */}
            <div className="absolute right-4 bottom-4 flex flex-col gap-2.5 z-20">
              <button
                id="btn-zoom-in"
                type="button"
                onClick={() => handleZoom('in')}
                className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white border border-[rgba(23,40,61,0.16)] hover:border-[#C58A28] flex items-center justify-center text-[#17283D] hover:text-[#D71920] transition-all cursor-pointer backdrop-blur-sm shadow-sm"
                title="Zoom In (+)"
                aria-label="Zoom in"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                id="btn-zoom-out"
                type="button"
                onClick={() => handleZoom('out')}
                className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white border border-[rgba(23,40,61,0.16)] hover:border-[#C58A28] flex items-center justify-center text-[#17283D] hover:text-[#D71920] transition-all cursor-pointer backdrop-blur-sm shadow-sm"
                title="Zoom Out (-)"
                aria-label="Zoom out"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
          </div>

          {/* 4. Right Column: Dedicated Specification Panel */}
          {!isFocusMode && (
            <div
              ref={detailsPanelRef}
              id="bike-3d-spec-panel"
              className="bike3d-spec-panel"
              aria-label="Motorcycle specifications and component detail"
            >
              {/* Tier 1: Category Tag & Component Number */}
              <div className="bike3d-spec-header">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#C58A28] shadow-[0_0_8px_rgba(197,138,40,0.6)]" />
                  <span className="text-[14px] tracking-[0.25em] text-[#C58A28] uppercase font-bold">
                    {activeComp.category}
                  </span>
                </div>
                <span className="text-[14px] tracking-wider text-[#78818D] font-semibold">
                  {activeComp.num} / 05
                </span>
              </div>

              {/* Tier 2: Title & Technical Subtitle */}
              <div className="bike3d-spec-title-group">
                <h3
                  className="text-2xl sm:text-[28px] md:text-[30px] font-bold uppercase mb-1.5 leading-tight heading-chiselled-card"
                  style={{
                    fontFamily: "'Cinzel', 'Playfair Display', serif",
                    letterSpacing: '0.04em',
                    color: '#E30100',
                    background: 'linear-gradient(180deg, #FF7A6C 0%, #FF4A40 18%, #E30100 38%, #A80000 70%, #4A0000 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    WebkitTextStroke: '0.85px #D49A00',
                    paintOrder: 'stroke fill',
                    filter: 'drop-shadow(0 1.5px 0px #593B00) drop-shadow(0 2px 1px #1F0202) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35))'
                  }}
                >
                  {activeComp.title}
                </h3>
                <p
                  className="text-[12px] sm:text-[13px] font-bold tracking-[0.2em] text-[#D71920] uppercase m-0"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  {activeComp.subtitle}
                </p>
              </div>

              {/* Tier 3: Body Description */}
              <p className="bike3d-spec-desc">
                {activeComp.description}
              </p>

              {/* Tier 4: Specifications Grid */}
              <div className="bike3d-spec-grid">
                {activeComp.specs.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-center p-2.5 sm:p-3 rounded-lg bg-white/85 border border-[rgba(23,40,61,0.12)] shadow-sm hover:border-[#D71920]/30 transition-colors"
                  >
                    <span className="text-[11px] sm:text-[12px] tracking-[0.16em] text-[#78818D] uppercase font-semibold mb-1">
                      {s.label}
                    </span>
                    <span className="text-[13px] sm:text-[14px] font-bold text-[#17283D] tracking-wide leading-snug">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tier 5: Interactive Component Focus Instruction */}
              <div className="bike3d-spec-footer">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C58A28] shrink-0" />
                <span className="text-[11px] sm:text-[12px] tracking-[0.14em] text-[#536174] uppercase font-semibold leading-relaxed">
                  CLICK ANY NUMBERED HOTSPOT PIN FOR DIRECT COMPONENT FOCUS
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 5. BOTTOM BAR: COMPONENT HOTSPOT SELECTOR BUTTONS */}
        {/* ============================================================== */}
        <div
          ref={controlsRef}
          className="bike3d-controls-row"
        >
          {/* Component Selection Pills */}
          <div className="flex flex-wrap items-center gap-3">
            {BIKE_HOTSPOTS.map((comp, idx) => {
               const isSelected = activeIdx === idx;
               return (
                 <button
                   id={`hotspot-btn-${comp.id}`}
                   key={comp.id}
                   type="button"
                   onClick={() => selectHotspot(idx)}
                   className={`flex items-center gap-3 px-4 py-1.5 rounded-full text-[14px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                     isSelected
                       ? 'bg-gradient-to-r from-[#D4A64A] via-[#E8BE65] to-[#C58A28] text-[#17283D] border border-[#FFF4BC] shadow-[0_4px_16px_rgba(197,138,40,0.45)]'
                       : 'bg-white/85 text-[#536174] hover:text-[#17283D] hover:bg-white border border-[rgba(23,40,61,0.14)] shadow-sm hover:border-[#D71920]/40'
                   }`}
                   aria-label={`Focus ${comp.title}`}
                 >
                   <span className={isSelected ? 'text-[#8B0000]' : 'text-[#D71920]'}>
                     {comp.num}
                   </span>
                   <span>{comp.id.toUpperCase()}</span>
                 </button>
               );
             })}
          </div>

          {/* Progress / Component Count */}
          <div className="flex items-center gap-3 text-[14px] tracking-widest text-[#C58A28] font-semibold">
            <span>01</span>
            <div className="flex items-center gap-1.5">
              {BIKE_HOTSPOTS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    activeIdx === idx ? 'w-8 bg-[#C58A28]' : 'w-2 bg-[rgba(23,40,61,0.18)]'
                  }`}
                />
              ))}
            </div>
            <span className="text-[#78818D]">05</span>
          </div>
        </div>

      </div>
    </section>
  );
}
