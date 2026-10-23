/* ==========================================================================
   MAIN CONTROLLER: SECRET DEV STUDIO, INDEXED-DB VIDEO ENGINE & PORTFOLIO
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  lucide.createIcons();

  let projects = loadProjectsFromStorage();
  let cvData = loadCvFromStorage();
  let activeCategory = "All";
  let searchQuery = "";
  let activeBgIndex = 0;
  let isBlueprintMode = false;

  // Developer Mode State (Default FALSE so visitors never see admin buttons)
  let isDevUnlocked = sessionStorage.getItem("AETHER_DEV_UNLOCKED") === "true";

  // Check if URL has ?dev=2026 for instant owner access
  if (window.location.search.includes("dev=2026")) {
    isDevUnlocked = true;
    sessionStorage.setItem("AETHER_DEV_UNLOCKED", "true");
  }

  function applyDevModeVisibility() {
    document.querySelectorAll(".dev-only").forEach((el) => {
      if (isDevUnlocked) {
        el.classList.remove("hidden");
        if (el.id === "dev-admin-bar" || el.id === "section-cv-edit-btn" || el.tagName === "LABEL" || el.tagName === "DIV") {
          el.classList.add("flex");
        }
      } else {
        el.classList.add("hidden");
        el.classList.remove("flex");
      }
    });
  }

  // =========================================================================
  // 1. CINEMATIC PRELOADER
  // =========================================================================
  const preloader = document.getElementById("preloader");
  const preloaderPercent = document.getElementById("preloader-percent");
  const preloaderBar = document.getElementById("preloader-bar");
  const preloaderCircle = document.getElementById("preloader-circle");
  const preloaderPoly = document.getElementById("preloader-poly");
  const preloaderRect = document.getElementById("preloader-rect");

  let loadProgress = 0;
  const preloaderTimer = setInterval(() => {
    loadProgress += 5;
    if (loadProgress > 100) loadProgress = 100;

    preloaderPercent.textContent = String(loadProgress).padStart(2, "0") + "%";
    preloaderBar.style.width = `${loadProgress}%`;
    preloaderCircle.style.strokeDashoffset = 472 - (472 * loadProgress) / 100;
    preloaderPoly.style.strokeDashoffset = 400 - (400 * loadProgress) / 100;
    preloaderRect.style.strokeDashoffset = 240 - (240 * loadProgress) / 100;

    if (loadProgress >= 100) {
      clearInterval(preloaderTimer);
      setTimeout(() => {
        preloader.classList.add("opacity-0", "pointer-events-none");
      }, 200);
    }
  }, 40);

  // =========================================================================
  // 2. SECRET DEVELOPER UNLOCK SYSTEM (HIDDEN FROM VISITORS)
  // =========================================================================
  const devPinModal = document.getElementById("dev-pin-modal");
  const devPinInput = document.getElementById("dev-pin-input");
  const devPinError = document.getElementById("dev-pin-error");

  function openDevPinPrompt() {
    if (isDevUnlocked) {
      // Already unlocked: open Background Video Manager directly
      openBgManagerModal();
      return;
    }
    devPinError.classList.add("hidden");
    devPinInput.value = "";
    devPinModal.classList.remove("hidden");
    devPinModal.classList.add("flex");
    setTimeout(() => devPinInput.focus(), 50);
  }

  // Triple-Click on Brand Logo or Footer Copyright opens Secret PIN Modal
  let clickCount = 0;
  let clickTimer = null;
  function handleSecretTripleClick() {
    clickCount++;
    clearTimeout(clickTimer);
    if (clickCount >= 3) {
      clickCount = 0;
      openDevPinPrompt();
    } else {
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 600);
    }
  }

  document.getElementById("brand-logo-trigger").addEventListener("click", handleSecretTripleClick);
  document.getElementById("footer-secret-trigger").addEventListener("click", handleSecretTripleClick);

  document.getElementById("close-pin-modal").addEventListener("click", () => {
    devPinModal.classList.add("hidden");
    devPinModal.classList.remove("flex");
  });

  document.getElementById("dev-pin-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (devPinInput.value.trim() === SECRET_DEV_PIN) {
      isDevUnlocked = true;
      sessionStorage.setItem("AETHER_DEV_UNLOCKED", "true");
      devPinModal.classList.add("hidden");
      devPinModal.classList.remove("flex");
      applyDevModeVisibility();
      renderLargeScalePortfolio();
      triggerParticleBurst(window.innerWidth / 2, window.innerHeight - 80);
    } else {
      devPinError.classList.remove("hidden");
    }
  });

  document.getElementById("lock-dev-mode-btn").addEventListener("click", () => {
    isDevUnlocked = false;
    sessionStorage.removeItem("AETHER_DEV_UNLOCKED");
    applyDevModeVisibility();
    renderLargeScalePortfolio();
  });

  // =========================================================================
  // 3. CUSTOM MAGNETIC CURSOR
  // =========================================================================
  const cursorDot = document.getElementById("cursor-dot");
  const cursorRing = document.getElementById("cursor-ring");
  const cursorLabel = document.getElementById("cursor-label");
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  });

  function animateCursor() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  function bindCursorTargets() {
    document.querySelectorAll("a, button, input, select, textarea, .horizontal-media-track").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursorRing.classList.add("w-14", "h-14", "border-cyanAI", "bg-cyanAI/10");
        const label = el.getAttribute("data-cursor");
        if (label) {
          cursorLabel.textContent = label;
          cursorLabel.classList.remove("opacity-0");
        }
      });
      el.addEventListener("mouseleave", () => {
        cursorRing.classList.remove("w-14", "h-14", "border-cyanAI", "bg-cyanAI/10");
        cursorLabel.classList.add("opacity-0");
      });
    });
  }

  // =========================================================================
  // 4. SCROLL-SYNCED MULTI-VIDEO BACKGROUND ENGINE + IN-BROWSER UPLOADER
  // =========================================================================
  const bgVideoLayersContainer = document.getElementById("bg-video-layers");
  const bgReelDotsContainer = document.getElementById("bg-reel-dots");
  const heroReelButtonsContainer = document.getElementById("hero-reel-buttons");
  const hudActiveReel = document.getElementById("hud-active-reel");

  let bgLayerElements = [];

  async function resolveBackgroundVideoSrc(reel) {
    // First check if Developer uploaded a custom video or URL in IndexedDB
    const savedUrl = await getVideoUrlFromDB(reel.id);
    if (savedUrl) return savedUrl;
    return encodeMediaPath(reel.file);
  }

  async function initBackgroundVideos() {
    bgVideoLayersContainer.innerHTML = "";
    bgReelDotsContainer.innerHTML = "";
    heroReelButtonsContainer.innerHTML = "";
    bgLayerElements = [];

    for (let idx = 0; idx < BACKGROUND_VIDEOS.length; idx++) {
      const reel = BACKGROUND_VIDEOS[idx];
      const resolvedSrc = await resolveBackgroundVideoSrc(reel);

      const layer = document.createElement("div");
      layer.className = `bg-video-layer ${idx === activeBgIndex ? "active" : ""}`;

      const video = document.createElement("video");
      video.src = resolvedSrc;
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.poster = createProceduralFallbackImage(reel.label, reel.sectionName);

      video.addEventListener("canplay", () => {
        video.muted = true;
        if (idx === activeBgIndex) {
          video.play().catch(() => {});
        }
      });

      layer.appendChild(video);
      bgVideoLayersContainer.appendChild(layer);
      bgLayerElements.push({ layer, video, reel });

      // Top HUD Dot Button
      const dotBtn = document.createElement("button");
      dotBtn.type = "button";
      dotBtn.title = reel.label;
      dotBtn.className = `bg-dot-btn h-2 rounded-full transition-all ${
        idx === activeBgIndex ? "w-6 bg-amberArch" : "w-2 bg-white/25 hover:bg-white/60"
      }`;
      dotBtn.addEventListener("click", () => switchBackgroundVideo(idx));
      bgReelDotsContainer.appendChild(dotBtn);

      // Hero Switcher Button
      const heroBtn = document.createElement("button");
      heroBtn.type = "button";
      heroBtn.className = `hero-reel-btn px-3 py-2 rounded-xl font-mono text-[11px] border text-left transition-all ${
        idx === activeBgIndex
          ? "border-amberArch bg-amberArch/20 text-amberArch font-bold"
          : "border-white/10 bg-white/5 text-textMuted hover:text-white"
      }`;
      heroBtn.innerHTML = `
        <div class="truncate">${reel.shortLabel}</div>
        <div class="text-[9px] opacity-70 truncate">${reel.sectionName}</div>
      `;
      heroBtn.addEventListener("click", () => switchBackgroundVideo(idx));
      heroReelButtonsContainer.appendChild(heroBtn);
    }
  }

  function switchBackgroundVideo(newIndex) {
    if (newIndex < 0 || newIndex >= bgLayerElements.length) return;
    activeBgIndex = newIndex;

    bgLayerElements.forEach((item, idx) => {
      if (idx === newIndex) {
        item.layer.classList.add("active");
        item.video.muted = true;
        item.video.play().catch(() => {});
      } else {
        item.layer.classList.remove("active");
      }
    });

    if (hudActiveReel && BACKGROUND_VIDEOS[newIndex]) {
      hudActiveReel.textContent = `BG_REEL_0${newIndex + 1} // ${BACKGROUND_VIDEOS[newIndex].label}`;
    }

    document.querySelectorAll(".bg-dot-btn").forEach((dot, idx) => {
      dot.className = `bg-dot-btn h-2 rounded-full transition-all ${
        idx === newIndex ? "w-6 bg-amberArch" : "w-2 bg-white/25 hover:bg-white/60"
      }`;
    });

    document.querySelectorAll(".hero-reel-btn").forEach((btn, idx) => {
      btn.className = `hero-reel-btn px-3 py-2 rounded-xl font-mono text-[11px] border text-left transition-all ${
        idx === newIndex
          ? "border-amberArch bg-amberArch/20 text-amberArch font-bold"
          : "border-white/10 bg-white/5 text-textMuted hover:text-white"
      }`;
    });
  }

  // Developer-Only Background Video Manager Modal
  const bgManagerModal = document.getElementById("bg-manager-modal");
  const bgSlotsContainer = document.getElementById("bg-video-slots-container");
  const bgSaveStatus = document.getElementById("bg-save-status");

  function openBgManagerModal() {
    bgSaveStatus.textContent = "";
    bgSlotsContainer.innerHTML = "";

    BACKGROUND_VIDEOS.forEach((reel, idx) => {
      const slotCard = document.createElement("div");
      slotCard.className = "p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3";
      slotCard.innerHTML = `
        <div class="flex items-center justify-between font-mono text-xs">
          <span class="text-amberArch font-bold">${reel.label}</span>
          <span class="text-[10px] text-cyanAI">${reel.sectionName}</span>
        </div>

        <label class="border border-dashed border-white/20 hover:border-amberArch rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer bg-black/50 transition-all">
          <span class="font-mono text-xs text-white font-semibold">+ Upload Local .MP4 Video</span>
          <span class="font-mono text-[10px] text-textMuted mt-0.5" id="slot-status-${idx}">Select video from your computer</span>
          <input type="file" accept="video/*" data-slot-idx="${idx}" class="bg-slot-file-input hidden" />
        </label>

        <div class="flex items-center gap-2">
          <input
            type="text"
            placeholder="Or paste direct .mp4 URL..."
            id="slot-url-${idx}"
            class="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 font-mono text-xs text-white"
          />
          <button type="button" data-url-idx="${idx}" class="save-slot-url-btn px-3 py-1.5 rounded-lg bg-white/10 hover:bg-cyanAI hover:text-black font-mono text-xs shrink-0 transition-all">
            Set URL
          </button>
        </div>
      `;
      bgSlotsContainer.appendChild(slotCard);
    });

    // Bind File Upload per Background Slot
    bgSlotsContainer.querySelectorAll(".bg-slot-file-input").forEach((input) => {
      input.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const idx = Number(input.getAttribute("data-slot-idx"));
        const reel = BACKGROUND_VIDEOS[idx];
        const statusEl = document.getElementById(`slot-status-${idx}`);
        statusEl.textContent = `Saving ${file.name}...`;

        await saveVideoToDB(reel.id, file);
        statusEl.textContent = `✓ Saved: ${file.name} (Muted)`;
        statusEl.className = "font-mono text-[10px] text-emerald-400 mt-0.5";
        bgSaveStatus.textContent = `✓ Background Reel 0${idx + 1} updated & saved in browser!`;

        await initBackgroundVideos();
        await renderLargeScalePortfolio();
        switchBackgroundVideo(idx);
      });
    });

    // Bind Direct URL per Background Slot
    bgSlotsContainer.querySelectorAll(".save-slot-url-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const idx = Number(btn.getAttribute("data-url-idx"));
        const urlInput = document.getElementById(`slot-url-${idx}`);
        const val = urlInput.value.trim();
        if (!val) return;
        const reel = BACKGROUND_VIDEOS[idx];
        await saveVideoToDB(reel.id, val);
        bgSaveStatus.textContent = `✓ Background Reel 0${idx + 1} URL saved!`;
        await initBackgroundVideos();
        await renderLargeScalePortfolio();
        switchBackgroundVideo(idx);
      });
    });

    bgManagerModal.classList.remove("hidden");
    bgManagerModal.classList.add("flex");
  }

  document.getElementById("open-bg-manager-btn").addEventListener("click", openBgManagerModal);
  document.getElementById("showcase-bg-btn").addEventListener("click", openBgManagerModal);
  document.getElementById("close-bg-manager-btn").addEventListener("click", () => {
    bgManagerModal.classList.add("hidden");
    bgManagerModal.classList.remove("flex");
  });
  document.getElementById("done-bg-manager-btn").addEventListener("click", () => {
    bgManagerModal.classList.add("hidden");
    bgManagerModal.classList.remove("flex");
  });

  // Smooth Scroll Listener to Crossfade Background Videos
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    const docHeight = Math.max(1, document.body.scrollHeight - window.innerHeight);
    const scrollPercent = Math.min(100, Math.max(0, Math.round((scrollY / docHeight) * 100)));

    const scrollDepthEl = document.getElementById("hud-scroll-depth");
    if (scrollDepthEl) {
      scrollDepthEl.textContent = `SCROLL_DEPTH: ${String(scrollPercent).padStart(2, "0")}%`;
    }

    // Divide total scroll smoothly across the 4 Background Videos
    const totalReels = BACKGROUND_VIDEOS.length;
    const targetReel = Math.min(
      totalReels - 1,
      Math.max(0, Math.floor((scrollPercent / 100) * totalReels))
    );

    if (targetReel !== activeBgIndex) {
      switchBackgroundVideo(targetReel);
    }
  });

  // Subtle Ambient Floating Dust Canvas
  const dustCanvas = document.getElementById("ambient-dust-canvas");
  const dCtx = dustCanvas.getContext("2d");
  dustCanvas.width = window.innerWidth;
  dustCanvas.height = window.innerHeight;

  const dustParticles = Array.from({ length: 55 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: 1 + Math.random() * 1.8,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -0.2 - Math.random() * 0.4,
    color: Math.random() > 0.5 ? "#00F0FF" : "#F59E0B"
  }));

  function animateDust() {
    dCtx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);
    dustParticles.forEach((p) => {
      p.x += p.vx + (mouseX / window.innerWidth - 0.5) * 0.4;
      p.y += p.vy;
      if (p.y < 0) p.y = dustCanvas.height;
      if (p.x < 0) p.x = dustCanvas.width;
      if (p.x > dustCanvas.width) p.x = 0;

      dCtx.fillStyle = p.color;
      dCtx.globalAlpha = 0.45;
      dCtx.beginPath();
      dCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      dCtx.fill();
    });
    requestAnimationFrame(animateDust);
  }
  animateDust();

  // =========================================================================
  // 5. LARGE-SCALE PAGE-WISE PORTFOLIO (LEFT-RIGHT VIDEO + PHOTO SCROLLER)
  // =========================================================================
  const largeProjectsContainer = document.getElementById("large-projects-List");
  const projectCountBadge = document.getElementById("project-count-badge");
  const pageJumper = document.getElementById("project-page-jumper");

  function getFilteredProjects() {
    return projects.filter((p) => {
      const matchesCat = activeCategory === "All" || p.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }

  async function renderLargeScalePortfolio() {
    const filtered = getFilteredProjects();
    projectCountBadge.textContent = `(${String(filtered.length).padStart(2, "0")})`;
    largeProjectsContainer.innerHTML = "";
    pageJumper.innerHTML = "";

    if (filtered.length === 0) {
      largeProjectsContainer.innerHTML = `
        <div class="glass-panel rounded-3xl p-12 text-center border border-white/10">
          <p class="font-mono text-sm text-textMuted">NO PROJECTS MATCH FILTER.</p>
        </div>
      `;
      return;
    }

    for (let idx = 0; idx < filtered.length; idx++) {
      const proj = filtered[idx];
      const pageNum = String(idx + 1).padStart(2, "0");
      const totalNum = String(filtered.length).padStart(2, "0");

      // Resolve project video from IndexedDB if uploaded
      let resolvedVideoSrc = encodeMediaPath(proj.video);
      if (proj.videoKey) {
        const dbVid = await getVideoUrlFromDB(proj.videoKey);
        if (dbVid) resolvedVideoSrc = dbVid;
      }

      // Quick Page Jump Pill
      const jumpBtn = document.createElement("a");
      jumpBtn.href = `#project-page-${proj.id}`;
      jumpBtn.className =
        "px-3.5 py-1.5 rounded-xl glass-panel border border-white/10 hover:border-amberArch text-textMuted hover:text-amberArch shrink-0 transition-all";
      jumpBtn.textContent = `PAGE ${pageNum} // ${proj.title.slice(0, 22)}...`;
      pageJumper.appendChild(jumpBtn);

      const sectionEl = document.createElement("article");
      sectionEl.id = `project-page-${proj.id}`;
      sectionEl.className =
        "glass-panel rounded-[2rem] p-6 sm:p-10 border border-white/15 shadow-2xl space-y-8 relative overflow-hidden";

      const imagesList =
        Array.isArray(proj.images) && proj.images.length > 0
          ? proj.images
          : ["Gemini_Generated_Image_tdd8iutdd8iutdd8.jpg"];

      sectionEl.innerHTML = `
        <!-- Top Page Header Bar -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-3 font-mono text-xs">
              <span class="px-3 py-1 rounded-full bg-amberArch text-black font-bold">
                PROJECT PAGE ${pageNum} / ${totalNum}
              </span>
              <span class="px-3 py-1 rounded-full bg-cyanAI/15 text-cyanAI border border-cyanAI/30">
                ${proj.category}
              </span>
              <span class="text-textMuted">${proj.metrics}</span>
            </div>
            <h3 class="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">${proj.title}</h3>
            <p class="text-textMuted text-sm sm:text-base max-w-3xl">${proj.subtitle}</p>
          </div>

          <!-- Left / Right Horizontal Scroll Controls -->
          <div class="flex items-center gap-2 self-start lg:self-center shrink-0">
            <span class="font-mono text-[11px] text-cyanAI mr-2 hidden sm:inline">
              ← SCROLL LEFT / RIGHT (${1 + imagesList.length} SLIDES) →
            </span>
            <button type="button" class="scroll-left-btn w-11 h-11 rounded-xl glass-panel border border-white/15 hover:border-amberArch flex items-center justify-center text-white" title="Scroll Left">
              <i data-lucide="chevron-left" class="w-5 h-5"></i>
            </button>
            <button type="button" class="scroll-right-btn w-11 h-11 rounded-xl glass-panel border border-white/15 hover:border-cyanAI flex items-center justify-center text-white" title="Scroll Right">
              <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
          </div>
        </div>

        <!-- HORIZONTAL LEFT-RIGHT MEDIA SCROLLER -->
        <div class="horizontal-media-track" data-cursor="SCROLL_LR">
          
          <!-- SLIDE 01: PROJECT 3D VIDEO (MUTED) -->
          <div class="horizontal-media-slide relative aspect-video rounded-2xl overflow-hidden bg-black border border-amberArch/40 group">
            <video
              src="${resolvedVideoSrc}"
              muted
              loop
              playsinline
              autoplay
              class="media-slide-item w-full h-full object-cover"
            ></video>
            <div class="absolute top-4 left-4 flex items-center gap-2">
              <span class="px-3 py-1 rounded-lg bg-black/80 border border-amberArch/50 font-mono text-[11px] text-amberArch flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-amberArch animate-ping"></span>
                SLIDE 01 // 3D RENDER VIDEO (MUTED)
              </span>
            </div>
            <button type="button" class="expand-video-btn absolute bottom-4 right-4 px-3.5 py-2 rounded-xl bg-black/80 hover:bg-amberArch hover:text-black border border-white/20 font-mono text-xs text-white transition-all">
              Fullscreen Video ⤢
            </button>
          </div>

          <!-- SLIDES 02+: HIGH-RES PROJECT PICTURES -->
          ${imagesList
            .map(
              (imgUrl, imgIdx) => `
            <div class="horizontal-media-slide relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 group">
              <img
                src="${encodeMediaPath(imgUrl)}"
                alt="${proj.title} - Render${imgIdx + 1}"
                class="media-slide-item project-slide-img w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div class="absolute top-4 left-4">
                <span class="px-3 py-1 rounded-lg bg-black/80 border border-cyanAI/40 font-mono text-[11px] text-cyanAI">
                  SLIDE 0${imgIdx + 2} // HIGH-RES RENDER STILL
                </span>
              </div>
              <button type="button" data-img="${encodeMediaPath(imgUrl)}" class="expand-img-btn absolute bottom-4 right-4 px-3.5 py-2 rounded-xl bg-black/80 hover:bg-cyanAI hover:text-black border border-white/20 font-mono text-xs text-white transition-all">
                Inspect 8K Still ⤢
              </button>
            </div>
          `
            )
            .join("")}
        </div>

        <!-- Bottom Project Specs & Tags Footer -->
        <div class="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
          <div class="flex flex-wrap items-center gap-2">
            ${proj.tags
              .map(
                (tag) =>
                  `<span class="px-3 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-xs text-textPrimary">${tag}</span>`
              )
              .join("")}
          </div>

          <div class="flex items-center gap-3">
            ${
              proj.demoUrl && proj.demoUrl !== "#portfolio-pages"
                ? `<a href="${proj.demoUrl}" target="_blank" rel="noopener" class="px-4 py-2 rounded-xl bg-cyanAI text-black font-mono font-bold text-xs uppercase">Open Live Project ↗</a>`
                : ""
            }
            <!-- Remove Button ONLY visible in Developer Mode -->
            <button type="button" class="delete-proj-btn ${
              isDevUnlocked ? "" : "hidden"
            } px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-red-400/40 font-mono text-[11px] text-red-300 transition-all">
              Delete Project (Dev)
            </button>
          </div>
        </div>
      `;

      const vidEl = sectionEl.querySelector("video");
      if (vidEl) {
        vidEl.muted = true;
        vidEl.poster = createProceduralFallbackImage(proj.title, proj.category);
        vidEl.play().catch(() => {});
      }

      sectionEl.querySelectorAll(".project-slide-img").forEach((imgEl, i) => {
        imgEl.addEventListener("error", () => {
          imgEl.src = createProceduralFallbackImage(`${proj.title} #${i + 1}`, proj.category);
        });
      });

      const track = sectionEl.querySelector(".horizontal-media-track");
      sectionEl.querySelector(".scroll-left-btn").addEventListener("click", () => {
        track.scrollBy({ left: -track.clientWidth * 0.75, behavior: "smooth" });
      });
      sectionEl.querySelector(".scroll-right-btn").addEventListener("click", () => {
        track.scrollBy({ left: track.clientWidth * 0.75, behavior: "smooth" });
      });

      // Mouse Drag-to-Scroll on Horizontal Track
      let isDown = false;
      let startX = 0;
      let scrollLeftStart = 0;
      track.addEventListener("mousedown", (e) => {
        isDown = true;
        startX = e.pageX - track.offsetLeft;
        scrollLeftStart = track.scrollLeft;
      });
      track.addEventListener("mouseleave", () => (isDown = false));
      track.addEventListener("mouseup", () => (isDown = false));
      track.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 1.6;
        track.scrollLeft = scrollLeftStart - walk;
      });

      sectionEl.querySelector(".expand-video-btn").addEventListener("click", () => {
        openLightbox("video", resolvedVideoSrc);
      });
      sectionEl.querySelectorAll(".expand-img-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          openLightbox("image", btn.getAttribute("data-img"));
        });
      });

      const delBtn = sectionEl.querySelector(".delete-proj-btn");
      if (delBtn) {
        delBtn.addEventListener("click", () => {
          if (projects.length <= 1) {
            alert("At least 1 showcase project must remain.");
            return;
          }
          projects = projects.filter((item) => item.id !== proj.id);
          saveProjectsToStorage(projects);
          renderLargeScalePortfolio();
        });
      }

      largeProjectsContainer.appendChild(sectionEl);
    }

    lucide.createIcons();
    bindCursorTargets();
  }

  // Lightbox Modal
  const lightboxModal = document.getElementById("lightbox-modal");
  const lightboxContent = document.getElementById("lightbox-content");

  function openLightbox(type, src) {
    lightboxContent.innerHTML = "";
    if (type === "video") {
      const v = document.createElement("video");
      v.src = src;
      v.muted = true;
      v.loop = true;
      v.autoplay = true;
      v.controls = true;
      v.className = "max-h-[84vh] w-auto rounded-2xl border border-amberArch/50 shadow-2xl";
      lightboxContent.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = src;
      img.className = "max-h-[84vh] w-auto rounded-2xl border border-cyanAI/50 shadow-2xl object-contain";
      lightboxContent.appendChild(img);
    }
    lightboxModal.classList.remove("hidden");
    lightboxModal.classList.add("flex");
  }

  document.getElementById("close-lightbox-btn").addEventListener("click", () => {
    lightboxModal.classList.add("hidden");
    lightboxModal.classList.remove("flex");
    lightboxContent.innerHTML = "";
  });

  // Category Filter & Search
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => {
        b.className =
          "filter-btn px-4 py-2.5 rounded-xl font-mono text-xs border border-white/10 glass-panel text-textMuted hover:text-white transition-all";
      });
      btn.className =
        "filter-btn active px-4 py-2.5 rounded-xl font-mono text-xs border border-amberArch bg-amberArch/20 text-amberArch transition-all";
      activeCategory = btn.getAttribute("data-category");
      renderLargeScalePortfolio();
    });
  });

  document.getElementById("project-search").addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderLargeScalePortfolio();
  });

  // =========================================================================
  // 6. INTERACTIVE DIGITAL CV & PROFILE SECTION
  // =========================================================================
  function renderCvSection() {
    const profileImg = document.getElementById("cv-profile-img");
    profileImg.src = encodeMediaPath(cvData.profileImage);
    profileImg.onerror = () => {
      profileImg.src = createProceduralFallbackImage(cvData.name, "ARCHITECT PROFILE");
    };

    document.getElementById("cv-badge").textContent = cvData.badge;
    document.getElementById("cv-name").textContent = cvData.name;
    document.getElementById("cv-role").textContent = cvData.role;
    document.getElementById("cv-bio").textContent = cvData.bio;
    document.getElementById("cv-location").textContent = cvData.location;
    document.getElementById("cv-specialty").textContent = cvData.specialty;
    document.getElementById("cv-email").textContent = cvData.email;

    document.getElementById("cv-skills-pills").innerHTML = (cvData.skills || [])
      .map(
        (s) =>
          `<span class="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] text-amberArch">${s}</span>`
      )
      .join("");

    document.getElementById("cv-experience-list").innerHTML = (cvData.experience || [])
      .map(
        (exp) => `
        <div class="relative">
          <span class="w-3 h-3 rounded-full bg-amberArch absolute -left-[27px] top-1.5"></span>
          <span class="font-mono text-[11px] text-cyanAI">${exp.period}</span>
          <h5 class="text-lg font-bold text-white mt-0.5">${exp.role}</h5>
          <div class="font-mono text-xs text-amberArch mb-1">${exp.company}</div>
          <p class="text-textMuted text-xs sm:text-sm leading-relaxed">${exp.desc}</p>
        </div>
      `
      )
      .join("");

    document.getElementById("cv-education-list").innerHTML = (cvData.education || [])
      .map(
        (edu) => `
        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span class="font-mono text-[10px] text-cyanAI uppercase">${edu.year}</span>
          <h5 class="font-bold text-base text-white">${edu.title}</h5>
          <p class="font-mono text-xs text-textMuted">${edu.institute}</p>
        </div>
      `
      )
      .join("");
  }

  document.getElementById("quick-profile-photo-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      cvData.profileImage = ev.target.result;
      saveCvToStorage(cvData);
      renderCvSection();
      triggerParticleBurst(window.innerWidth * 0.3, window.innerHeight * 0.5);
    };
    reader.readAsDataURL(file);
  });

  const cvEditorModal = document.getElementById("cv-editor-modal");
  function openCvEditor() {
    document.getElementById("edit-cv-name").value = cvData.name;
    document.getElementById("edit-cv-role").value = cvData.role;
    document.getElementById("edit-cv-bio").value = cvData.bio;
    document.getElementById("edit-cv-location").value = cvData.location;
    document.getElementById("edit-cv-email").value = cvData.email;
    cvEditorModal.classList.remove("hidden");
    cvEditorModal.classList.add("flex");
  }

  document.getElementById("open-cv-editor-btn").addEventListener("click", openCvEditor);
  document.getElementById("section-cv-edit-btn").addEventListener("click", openCvEditor);

  document.getElementById("close-cv-editor-btn").addEventListener("click", () => {
    cvEditorModal.classList.add("hidden");
    cvEditorModal.classList.remove("flex");
  });

  document.getElementById("cv-editor-form").addEventListener("submit", (e) => {
    e.preventDefault();
    cvData.name = document.getElementById("edit-cv-name").value.trim() || cvData.name;
    cvData.role = document.getElementById("edit-cv-role").value.trim() || cvData.role;
    cvData.bio = document.getElementById("edit-cv-bio").value.trim() || cvData.bio;
    cvData.location = document.getElementById("edit-cv-location").value.trim() || cvData.location;
    cvData.email = document.getElementById("edit-cv-email").value.trim() || cvData.email;
    saveCvToStorage(cvData);
    renderCvSection();
    cvEditorModal.classList.add("hidden");
    cvEditorModal.classList.remove("flex");
    triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2);
  });

  // =========================================================================
  // 7. UPGRADED "+ UPLOAD PROJECT" STUDIO CMS (SAVES VIDEO TO INDEXED-DB)
  // =========================================================================
  const cmsBackdrop = document.getElementById("cms-drawer-backdrop");
  let selectedProjectVideoFile = null;
  let uploadedImagesDataUrls = [];

  function toggleCmsDrawer(open) {
    cmsBackdrop.classList.toggle("hidden", !open);
  }

  document.getElementById("open-cms-btn").addEventListener("click", () => toggleCmsDrawer(true));
  document.getElementById("showcase-add-btn").addEventListener("click", () => toggleCmsDrawer(true));
  document.getElementById("close-cms-btn").addEventListener("click", () => toggleCmsDrawer(false));

  document.getElementById("cms-video-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedProjectVideoFile = file;
    document.getElementById("cms-video-url").value = file.name;
    document.getElementById("cms-video-file-label").textContent = `✓ Video Ready: ${file.name}`;
  });

  document.getElementById("cms-images-files").addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    uploadedImagesDataUrls = [];
    document.getElementById("cms-images-file-label").textContent = `✓ ${files.length} Picture(s) Ready`;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        uploadedImagesDataUrls.push(ev.target.result);
      };
      reader.readAsDataURL(file);
    });
  });

  document.getElementById("add-project-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("cms-title").value.trim();
    const subtitle = document.getElementById("cms-subtitle").value.trim();
    const category = document.getElementById("cms-category").value;
    const metrics = document.getElementById("cms-metric").value.trim();
    const rawVideoUrl = document.getElementById("cms-video-url").value.trim();
    const rawImagesUrls = document
      .getElementById("cms-images-urls")
      .value.split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const projId = "proj-" + Date.now();
    let videoKey = null;

    if (selectedProjectVideoFile) {
      videoKey = `vid-${projId}`;
      await saveVideoToDB(videoKey, selectedProjectVideoFile);
    }

    const finalImages =
      uploadedImagesDataUrls.length > 0
        ? uploadedImagesDataUrls
        : rawImagesUrls.length > 0
        ? rawImagesUrls
        : [createProceduralFallbackImage(title, category)];

    const tags = document
      .getElementById("cms-tags")
      .value.split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const newProject = {
      id: projId,
      title,
      subtitle,
      category,
      metrics,
      videoKey,
      video: rawVideoUrl || BACKGROUND_VIDEOS[0].file,
      images: finalImages,
      tags: tags.length ? tags : ["Blender", "Unreal Engine 5"],
      demoUrl: document.getElementById("cms-demo").value.trim() || "#portfolio-pages"
    };

    projects.unshift(newProject);
    saveProjectsToStorage(projects);
    await renderLargeScalePortfolio();

    selectedProjectVideoFile = null;
    uploadedImagesDataUrls = [];
    e.target.reset();
    toggleCmsDrawer(false);
    triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2);
  });

  // Export & Import JSON
  document.getElementById("export-json-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "projectsData.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("import-json-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (Array.isArray(imported)) {
          projects = imported;
          saveProjectsToStorage(projects);
          await renderLargeScalePortfolio();
          triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 3);
        }
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("footer-reset-data").addEventListener("click", async () => {
    localStorage.removeItem(STORAGE_KEY_PROJECTS);
    localStorage.removeItem(STORAGE_KEY_CV);
    projects = loadProjectsFromStorage();
    cvData = loadCvFromStorage();
    await renderLargeScalePortfolio();
    renderCvSection();
  });

  // =========================================================================
  // 8. RENDER / BLUEPRINT X-RAY MODE TOGGLE
  // =========================================================================
  const navModeToggle = document.getElementById("nav-mode-toggle");
  const modeToggleText = document.getElementById("mode-toggle-text");
  const modeIndicatorDot = document.getElementById("mode-indicator-dot");
  const hudModeReadout = document.getElementById("hud-mode-readout");

  function toggleBlueprintMode() {
    isBlueprintMode = !isBlueprintMode;
    document.body.classList.toggle("blueprint-mode", isBlueprintMode);
    if (isBlueprintMode) {
      modeToggleText.textContent = "BLUEPRINT MODE";
      modeToggleText.className = "hidden sm:inline text-cyanAI font-medium";
      modeIndicatorDot.className = "w-2 h-2 rounded-full bg-cyanAI animate-ping";
      hudModeReadout.textContent = "MODE: CAD_BLUEPRINT_XRAY";
    } else {
      modeToggleText.textContent = "RENDER MODE";
      modeToggleText.className = "hidden sm:inline text-amberArch font-medium";
      modeIndicatorDot.className = "w-2 h-2 rounded-full bg-amberArch";
      hudModeReadout.textContent = "MODE: PHOTOREAL_RENDER";
    }
  }
  navModeToggle.addEventListener("click", toggleBlueprintMode);

  // =========================================================================
  // 9. CLEAN CONTACT PORTAL (ZERO RATES)
  // =========================================================================
  document.querySelectorAll(".collab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".collab-btn").forEach((b) => {
        b.className = "collab-btn p-4 rounded-2xl border border-white/10 bg-white/5 text-left transition-all";
      });
      btn.className = "collab-btn active p-4 rounded-2xl border border-amberArch bg-amberArch/15 text-left transition-all";
    });
  });

  document.getElementById("contact-form").addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById("contact-feedback").textContent =
      "// MESSAGE TRANSMITTED SUCCESSFULLY. I WILL GET BACK TO YOU SHORTLY.";
    triggerParticleBurst(window.innerWidth / 2, window.innerHeight * 0.75);
    e.target.reset();
  });

  // =========================================================================
  // 10. CELEBRATORY PARTICLE BURST ENGINE
  // =========================================================================
  const burstCanvas = document.getElementById("burst-canvas");
  const bCtx = burstCanvas.getContext("2d");
  burstCanvas.width = window.innerWidth;
  burstCanvas.height = window.innerHeight;
  let burstParticles = [];

  function triggerParticleBurst(x, y) {
    for (let i = 0; i < 70; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      burstParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2 + Math.random() * 3,
        color: i % 2 === 0 ? "#00F0FF" : "#F59E0B",
        alpha: 1
      });
    }
  }

  function animateBurst() {
    if (burstParticles.length > 0) {
      bCtx.clearRect(0, 0, burstCanvas.width, burstCanvas.height);
      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const p = burstParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) {
          burstParticles.splice(i, 1);
          continue;
        }
        bCtx.save();
        bCtx.globalAlpha = p.alpha;
        bCtx.fillStyle = p.color;
        bCtx.beginPath();
        bCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        bCtx.fill();
        bCtx.restore();
      }
    }
    requestAnimationFrame(animateBurst);
  }
  animateBurst();

  // =========================================================================
  // 11. AI ARCHITECT ASSISTANT & KEYBOARD SHORTCUTS
  // =========================================================================
  const aiBackdrop = document.getElementById("ai-palette-backdrop");
  const aiChatLog = document.getElementById("ai-chat-log");
  const aiChatInput = document.getElementById("ai-chat-input");

  function toggleAiPalette(open) {
    aiBackdrop.classList.toggle("hidden", !open);
    aiBackdrop.classList.toggle("flex", open);
    if (open) aiChatInput.focus();
  }

  document.getElementById("open-ai-btn").addEventListener("click", () => toggleAiPalette(true));
  document.getElementById("close-ai-btn").addEventListener("click", () => toggleAiPalette(false));

  function handleAiCmd(cmd) {
    const uDiv = document.createElement("div");
    uDiv.className = "p-2.5 rounded-xl bg-white/5 border border-white/10 text-right";
    uDiv.textContent = `> ${cmd}`;
    aiChatLog.appendChild(uDiv);

    const low = cmd.toLowerCase();
    let reply = "Navigating portfolio...";

    if (low === "admin" || low === "dev" || low === "2026") {
      toggleAiPalette(false);
      openDevPinPrompt();
      return;
    } else if (low.includes("blender") || low.includes("unreal") || low.includes("project")) {
      reply = "Scrolling to Large-Scale 3D & Web Projects...";
      setTimeout(() => {
        toggleAiPalette(false);
        document.getElementById("portfolio-pages").scrollIntoView({ behavior: "smooth" });
      }, 450);
    } else if (low.includes("cv") || low.includes("profile")) {
      reply = "Opening Architect & Developer CV section...";
      setTimeout(() => {
        toggleAiPalette(false);
        document.getElementById("cv-section").scrollIntoView({ behavior: "smooth" });
      }, 450);
    } else if (low.includes("blueprint")) {
      toggleBlueprintMode();
      reply = "Toggled Blueprint / Render visual mode.";
    }

    const bDiv = document.createElement("div");
    bDiv.className = "p-3 rounded-xl bg-cyanAI/10 border border-cyanAI/30 text-cyanAI";
    bDiv.innerHTML = `<strong>[AETHER]:</strong> ${reply}`;
    aiChatLog.appendChild(bDiv);
    aiChatLog.scrollTop = aiChatLog.scrollHeight;
  }

  document.querySelectorAll(".ai-chip").forEach((chip) => {
    chip.addEventListener("click", () => handleAiCmd(chip.getAttribute("data-ai-cmd")));
  });

  document.getElementById("ai-chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const val = aiChatInput.value.trim();
    if (!val) return;
    aiChatInput.value = "";
    handleAiCmd(val);
  });

  // Global Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    // Cmd/Ctrl + K -> AI Assistant
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      toggleAiPalette(aiBackdrop.classList.contains("hidden"));
    }
    // Shift + A or Ctrl + Shift + L -> Secret Developer Mode Unlock
    if (
      (e.shiftKey && e.key.toLowerCase() === "a") ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l")
    ) {
      const tag = document.activeElement ? document.activeElement.tagName : "";
      if (!["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
        e.preventDefault();
        openDevPinPrompt();
      }
    }
    if (e.key === "Escape") {
      toggleAiPalette(false);
      toggleCmsDrawer(false);
      lightboxModal.classList.add("hidden");
      cvEditorModal.classList.add("hidden");
      devPinModal.classList.add("hidden");
      bgManagerModal.classList.add("hidden");
    }
  });

  window.addEventListener("resize", () => {
    dustCanvas.width = window.innerWidth;
    dustCanvas.height = window.innerHeight;
    burstCanvas.width = window.innerWidth;
    burstCanvas.height = window.innerHeight;
  });

  // Boot Everything
  applyDevModeVisibility();
  await initBackgroundVideos();
  await renderLargeScalePortfolio();
  renderCvSection();
});
