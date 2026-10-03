// IKAZE DIGITAL — atmospheric cloud scene (Three.js)
// Loads lazily, respects reduced-motion, pauses when tab hidden,
// scales particle count by device, disposes GPU resources on unload.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('atmosphere');

// ---- Capability & preference guards ----
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = matchMedia('(max-width: 720px)').matches;
const supportsWebGL = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
})();

if (!canvas || prefersReduced || !supportsWebGL) {
  // Silently skip — CSS gradient background already provides the atmosphere.
} else {
  init();
}

function init() {
  // ---- Renderer ----
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isSmall,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  // ---- Scene & camera ----
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x061423, 0.012);

  const camera = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight, 0.1, 200
  );
  camera.position.set(0, 0, 12);

  // ---- Lights ----
  const ambient = new THREE.AmbientLight(0x88bbff, 0.55);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xaee4ff, 1.1);
  key.position.set(6, 8, 4);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x20603d, 0.7);
  rim.position.set(-8, -2, -6);
  scene.add(rim);

  // ---- Cloud layers (sprite-based soft particles) ----
  // We create a soft radial texture procedurally — no external image needed.
  function makeSoftTexture(size = 256) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0.0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35,'rgba(220,235,255,0.55)');
    g.addColorStop(0.75,'rgba(180,210,255,0.12)');
    g.addColorStop(1.0, 'rgba(160,200,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const cloudTex = makeSoftTexture();

  const layers = [];
  const LAYER_COUNT = isSmall ? 3 : 5;
  const PARTICLES_PER_LAYER = isSmall ? 22 : 48;

  for (let l = 0; l < LAYER_COUNT; l++) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLES_PER_LAYER * 3);
    const scales    = new Float32Array(PARTICLES_PER_LAYER);

    for (let i = 0; i < PARTICLES_PER_LAYER; i++) {
      // Spread clouds in a wide ring around the camera
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 16;
      positions[i*3+0] = Math.cos(angle) * radius;
      positions[i*3+1] = (Math.random() - 0.5) * 8 - l * 2.0;
      positions[i*3+2] = Math.sin(angle) * radius - l * 2.5;
      scales[i] = 4 + Math.random() * 6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale',    new THREE.BufferAttribute(scales, 1));

    // PointsMaterial doesn't support per-point scale, so we use a custom shader.
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: cloudTex },
        uOpacity: { value: 0.14 + l * 0.03 },
        uColor: { value: new THREE.Color(0x9ecbff) },
      },
      vertexShader: /* glsl */`
        attribute float scale;
        varying float vDepth;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = scale * (300.0 / -mv.z);
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */`
        uniform sampler2D uTex;
        uniform float uOpacity;
        uniform vec3 uColor;
        varying float vDepth;
        void main() {
          vec4 t = texture2D(uTex, gl_PointCoord);
          float alpha = t.a * uOpacity;
          // fade far clouds
          alpha *= smoothstep(60.0, 15.0, vDepth);
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.userData = { baseY: points.position.y, layer: l };
    scene.add(points);
    layers.push(points);
  }

  // ---- Digital nodes / connected points (Africa network motif) ----
  const nodeCount = isSmall ? 24 : 60;
  const nodeGeo = new THREE.BufferGeometry();
  const nodePos = new Float32Array(nodeCount * 3);
  for (let i = 0; i < nodeCount; i++) {
    // Distribute on a sphere shell
    const r = 9 + Math.random() * 3;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    nodePos[i*3+0] = r * Math.sin(p) * Math.cos(t);
    nodePos[i*3+1] = r * Math.sin(p) * Math.sin(t) * 0.6;
    nodePos[i*3+2] = r * Math.cos(p);
  }
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));

  const nodeMat = new THREE.PointsMaterial({
    color: 0x00a1de,
    size: 0.09,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const nodes = new THREE.Points(nodeGeo, nodeMat);
  scene.add(nodes);

  // ---- Scroll-driven camera ----
  const target = { y: 0, z: 12 };
  let scrollProgress = 0;

  const updateScroll = () => {
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    scrollProgress = Math.min(1, Math.max(0, window.scrollY / max));

    // Camera moves down & forward as user scrolls — cinematic
    target.y = -scrollProgress * 6;
    target.z = 12 - scrollProgress * 4;
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  // ---- Resize ----
  const onResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  window.addEventListener('resize', onResize);

  // ---- Visibility pause (save battery/CPU) ----
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) loop();
  });

  // ---- Render loop ----
  const clock = new THREE.Clock();
  let rafId = 0;

  function loop() {
    if (!running) return;
    rafId = requestAnimationFrame(loop);

    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    // Smooth camera toward target
    camera.position.y += (target.y - camera.position.y) * 0.05;
    camera.position.z += (target.z - camera.position.z) * 0.05;
    camera.position.x = Math.sin(t * 0.08) * 0.6;

    // Slow cloud drift + gentle vertical float per layer
    for (const p of layers) {
      p.rotation.y += dt * 0.015 * (p.userData.layer + 1);
      p.position.y  = Math.sin(t * 0.2 + p.userData.layer) * 0.4;
    }

    // Nodes rotate slowly
    nodes.rotation.y += dt * 0.05;

    camera.lookAt(0, camera.position.y * 0.6, 0);

    renderer.render(scene, camera);
  }
  loop();

  // Reveal canvas once first frame is drawn
  requestAnimationFrame(() => canvas.classList.add('is-ready'));

  // ---- Cleanup on unload (dispose GPU resources) ----
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(rafId);
    layers.forEach((p) => {
      p.geometry.dispose();
      p.material.dispose();
    });
    nodeGeo.dispose();
    nodeMat.dispose();
    cloudTex.dispose();
    renderer.dispose();
  });
}
