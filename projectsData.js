/* ==========================================================================
   1. BUILT-IN INDEXED-DB ENGINE FOR LARGE 3D VIDEO FILES (.MP4 / .WEBM)
   ========================================================================== */

const IDB_NAME = "AETHER_3D_VIDEO_DB";
const IDB_STORE = "videos";
const SECRET_DEV_PIN = "2026"; // Aap apna secret PIN yahan badal sakte hain

function openVideoDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveVideoToDB(key, fileOrBlob) {
  try {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(fileOrBlob, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("IndexedDB save warning:", err);
    return false;
  }
}

async function getVideoUrlFromDB(key) {
  try {
    const db = await openVideoDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => {
        if (req.result instanceof Blob) {
          resolve(URL.createObjectURL(req.result));
        } else if (typeof req.result === "string" && req.result) {
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

function encodeMediaPath(path) {
  if (!path) return "";
  if (path.startsWith("data:") || path.startsWith("blob:") || path.startsWith("http")) {
    return path;
  }
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/* ==========================================================================
   2. SCROLL-SYNCED BACKGROUND VIDEO REELS CONFIG
   ========================================================================== */

const BACKGROUND_VIDEOS = [
  {
    id: "bg-reel-0",
    label: "01. LUXURY VILLA EXTERIOR",
    shortLabel: "01. Villa Exterior",
    sectionName: "HERO SHOWREEL",
    file: "Exterior Villa Design  #d5render #architecture #archviz  #design #shorts #shortvideo #render #reel.mp4",
    fallbackImage: "Gemini_Generated_Image_tdd8iutdd8iutdd8.jpg"
  },
  {
    id: "bg-reel-1",
    label: "02. PROCEDURAL KITCHEN ASSEMBLY",
    shortLabel: "02. Kitchen 3D",
    sectionName: "PORTFOLIO ARCHIVE",
    file: "This Empty Kitchen Transforms Into PURE LUXURY! 🤯 #shorts.mp4",
    fallbackImage: "Gemini_Generated_Image_tdd8iutdd8iutdd898798.jpg"
  },
  {
    id: "bg-reel-2",
    label: "03. BESPOKE INTERIOR DETAILS",
    shortLabel: "03. Luxury Interior",
    sectionName: "ARCHITECT CV & SKILLS",
    file: "This Luxury Interior Isn’t Real… Look Closer! 🤯 #shorts.mp4",
    fallbackImage: "65465.jpg"
  },
  {
    id: "bg-reel-3",
    label: "04. RENARTE LUXURY SHOWROOM",
    shortLabel: "04. Showroom 3D",
    sectionName: "COLLABORATION PORTAL",
    file: "Watch This Luxury Showroom Come to Life! #shorts.mp4",
    fallbackImage: "Gemini_Generated_Image_tdd8iutdd8iutdd8oioi.jpg"
  }
];

/* ==========================================================================
   3. LARGE-SCALE PAGE-WISE PROJECTS
   ========================================================================== */

const INITIAL_PROJECTS_DATA = [
  {
    id: "proj-villa-d5",
    title: "Obsidian Modern Luxury Villa & Rain Driveway",
    subtitle:
      "Photorealistic exterior architectural visualization featuring cantilevered concrete slabs, warm interior glass lighting, wet asphalt reflections, and custom luxury car assets.",
    category: "Interior & Exterior Arch",
    metrics: "D5 Render + Blender | 4K 60FPS",
    videoKey: "bg-reel-0",
    video: "Exterior Villa Design  #d5render #architecture #archviz  #design #shorts #shortvideo #render #reel.mp4",
    images: [
      "Gemini_Generated_Image_tdd8iutdd8iutdd8.jpg",
      "Gemini_Generated_Image_tdd8iutdd8iutdd898798.jpg",
      "65465.jpg"
    ],
    tags: ["Blender", "D5 Render", "Unreal Engine 5", "ArchViz", "Exterior Lighting"],
    demoUrl: "#portfolio-pages"
  },
  {
    id: "proj-kitchen-transform",
    title: "Procedural Marble Kitchen Transformation",
    subtitle:
      "Step-by-step 3D interior assembly animation showcasing marble tile dynamics, modular cabinetry rigging, island counter drop-in, and warm architectural cove lighting.",
    category: "Blender & Unreal 3D",
    metrics: "Blender Geometry Nodes + UE5 | 4K",
    videoKey: "bg-reel-1",
    video: "This Empty Kitchen Transforms Into PURE LUXURY! 🤯 #shorts.mp4",
    images: [
      "Gemini_Generated_Image_tdd8iutdd8iutdd898798.jpg",
      "Gemini_Generated_Image_tdd8iutdd8iutdd8.jpg",
      "Gemini_Generated_Image_tdd8iutdd8oioi.jpg"
    ],
    tags: ["Blender 4.x", "Geometry Nodes", "Unreal Engine 5", "PBR Materials", "Interior Arch"],
    demoUrl: "#portfolio-pages"
  },
  {
    id: "proj-renarte-showroom",
    title: "RENARTE // Luxury Commercial Showroom 3D",
    subtitle:
      "High-ceiling commercial retail showroom time-lapse build with bookmatched travertine marble flooring, custom arched textile shelving, and suspended bronze ring chandeliers.",
    category: "Interior & Exterior Arch",
    metrics: "Unreal Engine 5 Lumen | Raytraced",
    videoKey: "bg-reel-3",
    video: "Watch This Luxury Showroom Come to Life! #shorts.mp4",
    images: [
      "Gemini_Generated_Image_tdd8iutdd8iutdd8oioi.jpg",
      "Gemini_Generated_Image_tdd8iutdd8iutdd8.jpg",
      "65465.jpg"
    ],
    tags: ["Unreal Engine 5", "Blender", "Commercial Interior", "Raytracing", "3D Animation"],
    demoUrl: "#portfolio-pages"
  },
  {
    id: "proj-micro-interior-web",
    title: "Tactile Luxury Interior & Spatial Web Platform",
    subtitle:
      "Close-up photoreal shader study of bouclé fabric, walnut wood grain, and backlit calligraphy paired with a full-stack interactive 3D web viewer.",
    category: "Full-Stack Websites",
    metrics: "Three.js + Next.js + Blender | 120FPS",
    videoKey: "bg-reel-2",
    video: "This Luxury Interior Isn’t Real… Look Closer! 🤯 #shorts.mp4",
    images: [
      "65465.jpg",
      "Gemini_Generated_Image_tdd8iutdd8iutdd898798.jpg",
      "Gemini_Generated_Image_tdd8iutdd8oioi.jpg"
    ],
    tags: ["Next.js", "Three.js", "WebGL", "Blender Shaders", "Full-Stack Web"],
    demoUrl: "#portfolio-pages"
  }
];

/* ==========================================================================
   4. PERSONAL CV & PROFILE DATA
   ========================================================================== */

const DEFAULT_CV_DATA = {
  name: "YOUR NAME HERE",
  role: "3D Architectural Visualizer (Blender / UE5) & Full-Stack Web Developer",
  badge: "AVAILABLE FOR PROJECTS",
  profileImage: "Gemini_Generated_Image_tdd8iutdd8iutdd898798.jpg",
  bio: "Passionate 3D Architectural Visualizer & Full-Stack Web Developer specializing in photorealistic exterior/interior animations in Blender, Unreal Engine 5, and D5 Render alongside interactive modern web platforms.",
  location: "Pakistan // Remote Worldwide",
  specialty: "Blender, Unreal Engine 5 & Web Dev",
  email: "contact@yourportfolio.com",
  skills: [
    "Blender 3D",
    "Unreal Engine 5",
    "D5 Render",
    "Interior & Exterior ArchViz",
    "3D Animation",
    "HTML/CSS/JS",
    "React & Next.js",
    "Three.js / WebGL"
  ],
  experience: [
    {
      period: "2024 — PRESENT",
      role: "Lead 3D Visualizer & Full-Stack Web Developer",
      company: "Independent Studio / Freelance",
      desc: "Creating photorealistic exterior villas, procedural kitchen/showroom assembly animations in Blender & Unreal Engine 5, and building high-end interactive web portfolios."
    },
    {
      period: "2022 — 2024",
      role: "3D Architectural Artist & Frontend Engineer",
      company: "Digital Architecture & Web Lab",
      desc: "Developed real-time 3D architectural walkthroughs, custom PBR material libraries, and responsive modern web applications."
    }
  ],
  education: [
    {
      year: "DEGREE / DIPLOMA",
      title: "Computer Science / Architecture & 3D Design",
      institute: "Your University / Institute Name"
    },
    {
      year: "CERTIFICATION",
      title: "Advanced Blender, Unreal Engine 5 & Full-Stack Web Mastery",
      institute: "Professional Studio Specialization"
    }
  ]
};

const STORAGE_KEY_PROJECTS = "AETHER_PORTFOLIO_PROJECTS_V3";
const STORAGE_KEY_CV = "AETHER_PORTFOLIO_CV_V3";

function loadProjectsFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Projects storage fallback:", err);
  }
  localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(INITIAL_PROJECTS_DATA));
  return [...INITIAL_PROJECTS_DATA];
}

function saveProjectsToStorage(projects) {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  } catch (err) {
    console.warn("Projects save error:", err);
  }
}

function loadCvFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CV);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.warn("CV storage fallback:", err);
  }
  return { ...DEFAULT_CV_DATA };
}

function saveCvToStorage(cvData) {
  try {
    localStorage.setItem(STORAGE_KEY_CV, JSON.stringify(cvData));
  } catch (err) {
    console.warn("CV save error:", err);
  }
}

function createProceduralFallbackImage(title, subtitle) {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 1280, 720);
  grad.addColorStop(0, "#070709");
  grad.addColorStop(0.5, "#111827");
  grad.addColorStop(1, "#070709");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);

  ctx.strokeStyle = "rgba(0, 240, 255, 0.14)";
  ctx.lineWidth = 1;
  for (let x = 0; x < 1280; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 720);
    ctx.stroke();
  }
  for (let y = 0; y < 720; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 2;
  ctx.strokeRect(120, 100, 1040, 520);

  ctx.fillStyle = "#00F0FF";
  ctx.font = "bold 20px 'JetBrains Mono', monospace";
  ctx.fillText(`// ${subtitle || "3D ARCHITECTURAL RENDER"}`, 160, 170);

  ctx.fillStyle = "#F8FAFC";
  ctx.font = "bold 42px 'Space Grotesk', sans-serif";
  ctx.fillText((title || "Project Render").slice(0, 38), 160, 360);

  ctx.fillStyle = "#F59E0B";
  ctx.font = "18px 'JetBrains Mono', monospace";
  ctx.fillText("BLENDER • UNREAL ENGINE 5 • INTERACTIVE PORTFOLIO", 160, 550);

  return canvas.toDataURL("image/png");
}
