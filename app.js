/**
 * app.js
 * Master Application Controller:
 * 1. Three.js Parametric 3D Hero Scene with Neural Particles & Mouse Parallax
 * 2. Real-time Architectural HUD Telemetry (FPS, Camera Coordinates, Render Engine)
 * 3. Render ↔ Blueprint CAD Wireframe Mode Switcher
 * 4. Dual Showcase Views: Bento Grid (with 3D Magnetic Tilt & Spotlight) & 3D Spatial Corridor
 * 5. Studio CMS System (Shift + A) with Style-Locked AI Prompt Generator
 * 6. AI Architect Command Palette (Cmd/Ctrl + K)
 * 7. Interactive Commission Estimator
 * 8. Custom Magnetic Cursor
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. GLOBAL STATE & REFERENCES ---
  const state = {
    blueprintMode: false,
    activeCategory: 'all',
    activeView: 'bento', // 'bento' | 'corridor'
    corridorZ: 0,
    mouseX: 0,
    mouseY: 0,
    targetCamX: 0,
    targetCamY: 1.2,
    fps: 60,
    lastFrameTime: performance.now(),
    frameCount: 0
  };

  // DOM Elements
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  const preloader = document.getElementById('preloader');
  const preloaderCount = document.getElementById('preloaderCount');
  const hudCamPos = document.getElementById('hudCamPos');
  const hudFps = document.getElementById('hudFps');
  const hudDrawCalls = document.getElementById('hudDrawCalls');
  const btnModeToggle = document.getElementById('btnModeToggle');
  const modeToggleLabel = document.getElementById('modeToggleLabel');
  
  // Showcase DOM
  const bentoContainer = document.getElementById('bentoContainer');
  const corridorContainer = document.getElementById('corridorContainer');
  const corridorTrack = document.getElementById('corridorTrack');
  const btnViewBento = document.getElementById('btnViewBento');
  const btnViewCorridor = document.getElementById('btnViewCorridor');
  const categoryFilters = document.getElementById('categoryFilters');

  // Studio CMS DOM
  const studioDrawer = document.getElementById('studioDrawer');
  const studioBackdrop = document.getElementById('studioBackdrop');
  const btnOpenStudio = document.getElementById('btnOpenStudio');
  const btnCloseStudio = document.getElementById('btnCloseStudio');
  const formAddProject = document.getElementById('formAddProject');
  const btnGeneratePrompt = document.getElementById('btnGeneratePrompt');
  const btnExportJSON = document.getElementById('btnExportJSON');
  const btnImportJSON = document.getElementById('btnImportJSON');
  const jsonFileInput = document.getElementById('jsonFileInput');

  // AI Command Terminal DOM
  const commandModal = document.getElementById('commandModal');
  const btnOpenTerminal = document.getElementById('btnOpenTerminal');
  const btnHeroTerminal = document.getElementById('btnHeroTerminal');
  const commandInput = document.getElementById('commandInput');
  const paletteResponse = document.getElementById('paletteResponse');

  // Project Modal DOM
  const projectModal = document.getElementById('projectModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const modalImage = document.getElementById('modalImage');
  const modalCategory = document.getElementById('modalCategory');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalTags = document.getElementById('modalTags');
  const modalMetrics = document.getElementById('modalMetrics');
  const modalDemoLink = document.getElementById('modalDemoLink');
  const modalCodeLink = document.getElementById('modalCodeLink');

  // Commission Portal DOM
  const timelineSlider = document.getElementById('timelineSlider');
  const sliderValueLabel = document.getElementById('sliderValueLabel');
  const estimatePriceVal = document.getElementById('estimatePriceVal');
  const summaryTimeline = document.getElementById('summaryTimeline');
  const serviceCards = document.querySelectorAll('.service-card');
  const btnSubmitCommission = document.getElementById('btnSubmitCommission');

  // --- 2. CINEMATIC PRELOADER ANIMATION ---
  function initPreloader() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 4;
      if (progress > 100) progress = 100;
      preloaderCount.textContent = (progress < 10 ? '0' : '') + progress + '%';
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          gsap.to(preloader, {
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => {
              preloader.style.display = 'none';
              animateHeroEntrance();
            }
          });
        }, 200);
      }
    }, 40);
  }

  function animateHeroEntrance() {
    gsap.from('.hero-tag', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' });
    gsap.from('.hero-title', { y: 30, opacity: 0, duration: 1, delay: 0.1, ease: 'power3.out' });
    gsap.from('.hero-desc', { y: 20, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' });
    gsap.from('.hero-ctas', { y: 20, opacity: 0, duration: 0.8, delay: 0.3, ease: 'power3.out' });
    gsap.from('.hero-visual-card', { scale: 0.9, opacity: 0, duration: 1.2, delay: 0.2, ease: 'power3.out' });
  }

  // --- 3. CUSTOM MAGNETIC CURSOR ---
  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;
  let ringX = cursorX;
  let ringY = cursorY;

  window.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    cursorDot.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    state.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function renderCursor() {
    ringX += (cursorX - ringX) * 0.15;
    ringY += (cursorY - ringY) * 0.15;
    cursorRing.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  function attachMagneticEvents() {
    document.querySelectorAll('.magnetic, a, button, input, select, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('hovered'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovered'));
    });
  }
  attachMagneticEvents();

  // --- 4. THREE.JS 3D HERO STAGE ---
  let scene, camera, renderer, architecturalKnot, particleSystem;
  let knotMaterialStandard, knotMaterialWireframe;
  let lightAmber, lightCyan;

  function initThreeHero() {
    const canvas = document.getElementById('hero-canvas');
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070709, 0.04);

    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 5.0);

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Parametric Torus Knot (Architectural Moebius Lattice)
    const geometry = new THREE.TorusKnotGeometry(1.4, 0.38, 160, 32, 2, 3);

    // Standard Render Material (Dark obsidian glass with metallic sheen)
    knotMaterialStandard = new THREE.MeshStandardMaterial({
      color: 0x0f141d,
      roughness: 0.15,
      metalness: 0.85,
      envMapIntensity: 1.5,
      wireframe: false
    });

    // Blueprint Material (Cyan glowing CAD wireframe)
    knotMaterialWireframe = new THREE.MeshBasicMaterial({
      color: 0x00F0FF,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });

    architecturalKnot = new THREE.Mesh(geometry, knotMaterialStandard);
    architecturalKnot.position.set(1.4, 0, 0); // Position slightly to the right
    scene.add(architecturalKnot);

    // Orbiting AI Neural Particle Constellation
    const particleCount = 1000;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorCyan = new THREE.Color(0x00F0FF);
    const colorGold = new THREE.Color(0xF59E0B);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.4 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      positions[i * 3] = radius * Math.cos(theta) * Math.cos(phi) + 1.4;
      positions[i * 3 + 1] = radius * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const mixedColor = Math.random() > 0.4 ? colorCyan : colorGold;
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    lightAmber = new THREE.PointLight(0xF59E0B, 3.2, 50);
    lightAmber.position.set(-3, 3, 4);
    scene.add(lightAmber);

    lightCyan = new THREE.PointLight(0x00F0FF, 3.8, 50);
    lightCyan.position.set(4, -2, 3);
    scene.add(lightCyan);

    window.addEventListener('resize', onThreeResize);
    requestAnimationFrame(threeRenderLoop);
  }

  function onThreeResize() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || !renderer || !camera) return;
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function threeRenderLoop(now) {
    requestAnimationFrame(threeRenderLoop);

    // FPS Telemetry
    state.frameCount++;
    if (now - state.lastFrameTime >= 1000) {
      state.fps = state.frameCount;
      hudFps.textContent = state.fps;
      state.frameCount = 0;
      state.lastFrameTime = now;
    }

    // Auto-rotate 3D geometry
    if (architecturalKnot) {
      architecturalKnot.rotation.x += 0.003;
      architecturalKnot.rotation.y += 0.005;
    }

    if (particleSystem) {
      particleSystem.rotation.y -= 0.002;
      particleSystem.rotation.x += 0.001;
    }

    // Smooth Camera Mouse Parallax
    const targetX = state.mouseX * 0.8;
    const targetY = 1.2 + state.mouseY * 0.5;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.lookAt(1.0, 0, 0);

    // Update Live HUD Telemetry Coordinates
    hudCamPos.textContent = `[X: ${camera.position.x.toFixed(1)}, Y: ${camera.position.y.toFixed(1)}, Z: ${camera.position.z.toFixed(1)}]`;

    renderer.render(scene, camera);
  }

  // --- 5. RENDER MODE ↔ BLUEPRINT CAD WIREFRAME TOGGLE ---
  function toggleBlueprintMode() {
    state.blueprintMode = !state.blueprintMode;
    document.body.classList.toggle('blueprint-mode', state.blueprintMode);

    if (state.blueprintMode) {
      modeToggleLabel.textContent = 'RENDER MODE';
      if (architecturalKnot) architecturalKnot.material = knotMaterialWireframe;
      if (lightCyan) lightCyan.intensity = 5.0;
    } else {
      modeToggleLabel.textContent = 'BLUEPRINT MODE';
      if (architecturalKnot) architecturalKnot.material = knotMaterialStandard;
      if (lightCyan) lightCyan.intensity = 3.8;
    }
  }

  btnModeToggle.addEventListener('click', toggleBlueprintMode);

  // --- 6. PROJECTS SHOWCASE ENGINE ---
  function renderProjects() {
    const projects = window.ProjectsCMS.loadProjects();
    const filtered = state.activeCategory === 'all' 
      ? projects 
      : projects.filter(p => p.category.toLowerCase() === state.activeCategory.toLowerCase());

    // Render Bento Grid
    bentoContainer.innerHTML = '';
    filtered.forEach((p, idx) => {
      const isFeatured = idx === 0 && state.activeCategory === 'all';
      const card = document.createElement('div');
      card.className = `bento-card magnetic-card ${isFeatured ? 'featured-card' : ''}`;
      card.dataset.id = p.id;

      const tagsHtml = (p.tags || []).map(t => `<span class="tech-tag">${t}</span>`).join('');
      const metricText = p.metrics?.primary || (typeof p.metrics === 'string' ? p.metrics : 'Polygon Count: 2.1M');

      card.innerHTML = `
        <div class="card-spotlight"></div>
        <div class="card-media">
          <span class="card-category-tag">${p.category}</span>
          <img src="${p.image}" alt="${p.title}" class="project-img">
        </div>
        <div class="card-content">
          <div class="card-header-info">
            <div class="card-sub">${p.subtitle || ''}</div>
            <h3 class="card-title">${p.title}</h3>
            <p class="card-desc">${p.description ? p.description.slice(0, 140) + '...' : ''}</p>
          </div>
          <div class="card-tags">${tagsHtml}</div>
          <div class="card-footer">
            <div class="card-metric"><i class="fa-solid fa-chart-simple"></i> ${metricText}</div>
            <button class="card-btn-inspect magnetic">Inspect Architecture <i class="fa-solid fa-arrow-right"></i></button>
          </div>
        </div>
      `;

      card.addEventListener('click', () => openProjectModal(p));
      bentoContainer.appendChild(card);
    });

    // Render 3D Spatial Corridor View
    corridorTrack.innerHTML = '';
    projects.forEach((p, idx) => {
      const zOffset = -idx * 500;
      const monolith = document.createElement('div');
      monolith.className = 'corridor-monolith magnetic';
      monolith.style.transform = `translateZ(${zOffset}px) rotateY(${idx % 2 === 0 ? '-12deg' : '12deg'})`;
      monolith.dataset.z = zOffset;

      monolith.innerHTML = `
        <img src="${p.image}" alt="${p.title}">
        <div class="corridor-info">
          <span class="card-category-tag" style="position:static;display:inline-block;margin-bottom:8px;">${p.category}</span>
          <h3 class="card-title" style="font-size:1.2rem;">${p.title}</h3>
          <p class="card-sub" style="margin-top:6px;">${p.subtitle || ''}</p>
        </div>
      `;

      monolith.addEventListener('click', () => {
        openProjectModal(p);
      });

      corridorTrack.appendChild(monolith);
    });

    initCardTiltAndSpotlight();
    attachMagneticEvents();
  }

  // 3D Magnetic Tilt and Spotlight calculation
  function initCardTiltAndSpotlight() {
    document.querySelectorAll('.magnetic-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Spotlight CSS Variables
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        // Magnetic Tilt
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -7;
        const rotateY = ((x - centerX) / centerX) * 7;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }

  // View Switcher (Bento vs Corridor)
  btnViewBento.addEventListener('click', () => {
    state.activeView = 'bento';
    btnViewBento.classList.add('active');
    btnViewCorridor.classList.remove('active');
    bentoContainer.style.display = 'grid';
    corridorContainer.classList.remove('active');
  });

  btnViewCorridor.addEventListener('click', () => {
    state.activeView = 'corridor';
    btnViewCorridor.classList.add('active');
    btnViewBento.classList.remove('active');
    bentoContainer.style.display = 'none';
    corridorContainer.classList.add('active');
  });

  // 3D Corridor Fly-Through Scroll Handler
  corridorContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.corridorZ += e.deltaY * 0.8;
    const maxZ = (window.ProjectsCMS.loadProjects().length - 1) * 500;
    state.corridorZ = Math.max(0, Math.min(state.corridorZ, maxZ));
    corridorTrack.style.transform = `translateZ(${state.corridorZ}px)`;
  }, { passive: false });

  // Category Filter Pills
  categoryFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeCategory = btn.dataset.cat;
    renderProjects();
  });

  // --- 7. PROJECT DETAIL MODAL ---
  function openProjectModal(project) {
    modalImage.src = project.image;
    modalCategory.textContent = `// ${project.category.toUpperCase()}`;
    modalTitle.textContent = project.title;
    modalDesc.textContent = project.description || project.subtitle;

    modalTags.innerHTML = (project.tags || []).map(t => `<span class="tech-tag" style="color:var(--accent-cyan);">${t}</span>`).join('');
    modalMetrics.innerHTML = `<i class="fa-solid fa-microchip"></i> ${project.metrics?.primary || (typeof project.metrics === 'string' ? project.metrics : 'Polygon Count: 2.4M')}`;

    modalDemoLink.href = project.demoUrl || '#';
    modalCodeLink.href = project.codeUrl || '#';

    projectModal.classList.add('open');
  }

  function closeProjectModal() {
    projectModal.classList.remove('open');
  }

  btnCloseModal.addEventListener('click', closeProjectModal);
  projectModal.addEventListener('click', (e) => {
    if (e.target === projectModal) closeProjectModal();
  });

  // --- 8. STUDIO CMS DRAWER (Shift + A) ---
  function openStudio() {
    studioDrawer.classList.add('open');
    studioBackdrop.classList.add('open');
  }

  function closeStudio() {
    studioDrawer.classList.remove('open');
    studioBackdrop.classList.remove('open');
  }

  btnOpenStudio.addEventListener('click', openStudio);
  btnCloseStudio.addEventListener('click', closeStudio);
  studioBackdrop.addEventListener('click', closeStudio);

  // Shortcut Shift + A
  window.addEventListener('keydown', (e) => {
    if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      studioDrawer.classList.contains('open') ? closeStudio() : openStudio();
    }
  });

  // AI Style-Locked Prompt Generator Button
  btnGeneratePrompt.addEventListener('click', () => {
    const title = document.getElementById('projTitle').value || 'Kinetic Parametric Structure';
    const styleSuffix = '8k Octane Render, Unreal Engine 5 style, floating in a dark obsidian studio void (#070709), glowing electric cyan (#00F0FF) holographic wireframe overlays and warm amber gold (#F59E0B) architectural rim lighting, glassmorphism, cinematic volumetric fog, ultra-sharp architectural & futuristic UI details, 16:9 aspect ratio.';
    const generatedPrompt = `${title}, ${styleSuffix}`;

    navigator.clipboard.writeText(generatedPrompt);
    const originalText = btnGeneratePrompt.innerHTML;
    btnGeneratePrompt.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copied Style-Locked Prompt to Clipboard!</span>';
    setTimeout(() => {
      btnGeneratePrompt.innerHTML = originalText;
    }, 2400);
  });

  // Add Project Form Submission
  formAddProject.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('projTitle').value.trim();
    const subtitle = document.getElementById('projSubtitle').value.trim();
    const category = document.getElementById('projCategory').value;
    const image = document.getElementById('projImage').value.trim();
    const tags = document.getElementById('projTags').value.split(',').map(s => s.trim()).filter(Boolean);
    const metric = document.getElementById('projMetric').value.trim() || 'Custom Metric';
    const desc = document.getElementById('projDesc').value.trim();

    const newProject = {
      title,
      subtitle,
      category,
      image,
      tags,
      metrics: { primary: metric },
      description: desc,
      demoUrl: '#',
      codeUrl: '#'
    };

    window.ProjectsCMS.addProject(newProject);
    renderProjects();
    closeStudio();
    formAddProject.reset();

    // Celebration burst animation
    gsap.fromTo('body', { backgroundColor: '#0f2430' }, { backgroundColor: '#070709', duration: 0.8 });
  });

  // Export / Import JSON
  btnExportJSON.addEventListener('click', () => window.ProjectsCMS.exportProjectsAsJSON());
  btnImportJSON.addEventListener('click', () => jsonFileInput.click());

  jsonFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = window.ProjectsCMS.importProjectsFromJSON(event.target.result);
      if (res.success) {
        alert(`Successfully imported ${res.count} projects.`);
        renderProjects();
      } else {
        alert(`Failed to import JSON: ${res.error}`);
      }
    };
    reader.readAsText(file);
  });

  // --- 9. AI ARCHITECT COMMAND PALETTE (Cmd/Ctrl + K) ---
  function openCommandPalette() {
    commandModal.classList.add('open');
    commandInput.value = '';
    paletteResponse.style.display = 'none';
    setTimeout(() => commandInput.focus(), 100);
  }

  function closeCommandPalette() {
    commandModal.classList.remove('open');
  }

  btnOpenTerminal.addEventListener('click', openCommandPalette);
  btnHeroTerminal.addEventListener('click', openCommandPalette);

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      commandModal.classList.contains('open') ? closeCommandPalette() : openCommandPalette();
    }
    if (e.key === 'Escape') {
      closeCommandPalette();
      closeProjectModal();
      closeStudio();
    }
  });

  commandModal.addEventListener('click', (e) => {
    if (e.target === commandModal) closeCommandPalette();
  });

  // Execute AI Commands
  function executeCommand(cmd) {
    const q = cmd.toLowerCase().trim();
    paletteResponse.style.display = 'block';

    if (q.includes('arch') || q.includes('villa') || q.includes('physical')) {
      paletteResponse.innerHTML = `<strong>[AI AGENT]:</strong> Filtering 3D Architecture spatial artifacts and navigating to Selected Works...`;
      setTimeout(() => {
        state.activeCategory = '3D Architecture';
        document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.cat === '3D Architecture');
        });
        renderProjects();
        closeCommandPalette();
        document.getElementById('showcase').scrollIntoView({ behavior: 'smooth' });
      }, 700);
    } else if (q.includes('blueprint') || q.includes('wireframe') || q.includes('cad')) {
      paletteResponse.innerHTML = `<strong>[AI AGENT]:</strong> Morphing WebGL viewport and styles into CAD Wireframe / Blueprint mode...`;
      setTimeout(() => {
        toggleBlueprintMode();
        closeCommandPalette();
      }, 600);
    } else if (q.includes('add') || q.includes('studio') || q.includes('cms')) {
      paletteResponse.innerHTML = `<strong>[AI AGENT]:</strong> Initializing Studio CMS slide-over panel...`;
      setTimeout(() => {
        closeCommandPalette();
        openStudio();
      }, 500);
    } else if (q.includes('skill') || q.includes('matrix') || q.includes('stack')) {
      paletteResponse.innerHTML = `<strong>[AI AGENT]:</strong> Teleporting to Dual-Discipline Cognitive Matrix...`;
      setTimeout(() => {
        closeCommandPalette();
        document.getElementById('matrix').scrollIntoView({ behavior: 'smooth' });
      }, 600);
    } else {
      paletteResponse.innerHTML = `<strong>[AI AGENT]:</strong> Query received: "<em>${cmd}</em>". I am the embedded Spatial Intelligence Agent trained on Rhino 8 computational Grasshopper definitions, GLSL fragment shaders, and Next.js 15 full-stack architectures. You can ask me to filter projects or toggle blueprint mode.`;
    }
  }

  commandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && commandInput.value.trim()) {
      executeCommand(commandInput.value.trim());
    }
  });

  document.querySelectorAll('.palette-item').forEach(item => {
    item.addEventListener('click', () => {
      const cmd = item.dataset.cmd;
      if (cmd === 'show-arch') executeCommand('show architecture');
      if (cmd === 'blueprint') executeCommand('blueprint');
      if (cmd === 'add-proj') executeCommand('add project');
      if (cmd === 'skills') executeCommand('skills');
    });
  });

  // --- 10. INTERACTIVE COMMISSION ESTIMATOR ---
  function updateCommissionEstimate() {
    let basePrice = 0;
    serviceCards.forEach(c => {
      if (c.classList.contains('selected')) {
        basePrice += parseInt(c.dataset.base || '5000', 10);
      }
    });

    const weeks = parseInt(timelineSlider.value, 10);
    sliderValueLabel.textContent = `${weeks} Weeks (${weeks <= 3 ? 'Sprint' : weeks <= 8 ? 'Standard' : 'Flagship'})`;
    summaryTimeline.textContent = `${weeks} WEEKS`;

    // Timeline multiplier: rush projects incur slight acceleration premium
    const multiplier = weeks <= 3 ? 1.35 : weeks <= 6 ? 1.0 : 0.85;
    const finalPrice = Math.round(basePrice * multiplier);
    estimatePriceVal.textContent = `$${finalPrice.toLocaleString()}`;
  }

  serviceCards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      updateCommissionEstimate();
    });
  });

  timelineSlider.addEventListener('input', updateCommissionEstimate);

  btnSubmitCommission.addEventListener('click', () => {
    const name = document.getElementById('inputClientName').value.trim();
    const email = document.getElementById('inputClientEmail').value.trim();
    if (!name || !email) {
      alert('Please enter your Name and official Contact Email to transmit inquiry.');
      return;
    }

    btnSubmitCommission.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Transmission Verified &bull; Standing By</span>';
    btnSubmitCommission.style.background = 'linear-gradient(135deg, #00F0FF, #0284c7)';
    btnSubmitCommission.style.color = '#070709';

    setTimeout(() => {
      btnSubmitCommission.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Transmit Project Brief</span>';
      btnSubmitCommission.style.background = '';
      btnSubmitCommission.style.color = '';
    }, 4000);
  });

  // --- 11. SKILL MATRIX INTERSECTION OBSERVER ---
  const matrixSection = document.getElementById('matrix');
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.skill-fill').forEach(fill => {
          fill.style.width = fill.dataset.progress;
        });
      }
    });
  }, { threshold: 0.2 });

  if (matrixSection) skillObserver.observe(matrixSection);

  // --- INITIALIZE ALL SUBSYSTEMS ---
  initPreloader();
  initThreeHero();
  renderProjects();
  updateCommissionEstimate();

  // Listen to projectsUpdated custom event
  window.addEventListener('projectsUpdated', renderProjects);
});

