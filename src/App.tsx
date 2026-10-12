/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Linkedin,
  Mail,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  ImageIcon,
  ArrowRight,
  GraduationCap,
  Users,
  Award,
  Layout,
  Sparkles,
  Instagram,
  Music,
  Calendar,
  Trash2,
  Download,
  LogOut,
  Lock,
  Menu,
  X,
  LayoutGrid,
  Table,
} from "lucide-react";
import Chart from "chart.js/auto";
import { EduOverview, SkillsInventory, TrainingSection } from "./components/Credentials";
import { db } from "./firebase";
import { collection, doc, setDoc, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";
import siteContent from "./content/site.json";
import { projects as projectsContent, awards as awardsContent, roles as rolesContent, profile as profileContent, credentials as credentialsContent, presentation } from "./content";

// Bilingual Language Dictionary
const translations = siteContent;

type ProjectGroup = "lean" | "scm" | "quality";

const localize = (value: any, lang: "en" | "id"): any =>
  Array.isArray(value)
    ? value.map((item) => localize(item, lang))
    : value && typeof value === "object" && "en" in value && "id" in value
      ? value[lang]
      : value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localize(item, lang)]))
        : value;

const projectGroups: { key: "all" | ProjectGroup; label: Record<"en" | "id", string> }[] = [
  { key: "all", label: presentation.projectGroupLabels.all },
  { key: "lean", label: presentation.projectGroupLabels.lean },
  { key: "scm", label: presentation.projectGroupLabels.scm },
  { key: "quality", label: presentation.projectGroupLabels.quality },
];

// Headline result restated from each project's own description.
type ProjectResult = {
  label: string;
  value?: string;
  before?: string;
  after?: string;
  ratio?: number;
  note?: string;
};

type FeaturedProject = {
  id: string;
  title: string;
  cat: string;
  desc: string;
  link: string;
  docLink?: string;
  linkLabel?: string;
  tags: string[];
  group: ProjectGroup;
  result: ProjectResult;
  image: string;
  gallery: string[];
};

function ProjectResultFigure({ result }: { result: ProjectResult }) {
  const ratio = "ratio" in result && Number.isFinite(result.ratio) ? result.ratio : 0;

  return (
    <figure className="summer-result">
      <figcaption>{result.label}</figcaption>
      {result.value ? (
        <p className="summer-result-value">{result.value}</p>
      ) : (
        <div className="summer-result-bars">
          <div className="summer-result-bar">
            <span className="summer-result-fill is-before" style={{ width: "70%" }} />
            <span>{result.before || "-"}</span>
          </div>
          <div className="summer-result-bar">
            <span
              className="summer-result-fill is-after"
              style={{ width: `${ratio * 70}%` }}
            />
            <span className="is-after">{result.after || "-"}</span>
          </div>
        </div>
      )}
      {result.note && <p className="summer-result-note">{result.note}</p>}
    </figure>
  );
}

function leadershipIcon(icon: string) {
  if (icon === "layout") return <Layout size={24} />;
  if (icon === "calendar") return <Calendar size={24} />;
  if (icon === "sparkles") return <Sparkles size={24} />;
  return <Users size={24} />;
}

function socialIcon(key: string) {
  if (key === "linkedin") return <Linkedin size={16} />;
  if (key === "instagram") return <Instagram size={16} />;
  if (key === "tiktok") return <Music size={16} />;
  return <Mail size={16} />;
}

export default function App() {
  const [lang, setLang] = useState<"en" | "id">(() => {
    const saved = localStorage.getItem("portfolio_lang");
    return saved === "en" || saved === "id" ? saved : "en";
  });

  useEffect(() => {
    document.body.classList.remove("dark");
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("portfolio_theme");
  }, []);

  const [activeSection, setActiveSection] = useState("hero");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedExperience, setExpandedExperience] = useState<Record<string, boolean>>({});
  const [evidence, setEvidence] = useState<{
    title: string;
    photos: string[];
    index: number;
  } | null>(null);
  const evidenceTrigger = useRef<HTMLButtonElement | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [logoMissing, setLogoMissing] = useState(false);
  const [eduOpen, setEduOpen] = useState(false);
  const openEvidence = (
    title: string,
    photos: string[],
    index: number,
    trigger: HTMLButtonElement,
  ) => {
    evidenceTrigger.current = trigger;
    setEvidence({ title, photos, index });
  };
  const stepEvidence = (direction: number) => {
    setEvidence((current) =>
      current && current.photos.length > 1
        ? {
            ...current,
            index: (current.index + direction + current.photos.length) % current.photos.length,
          }
        : current,
    );
  };
  const [activeProjectMetric, setActiveProjectMetric] = useState(0);
  const [projectFilter, setProjectFilter] = useState<"all" | ProjectGroup>("all");
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingText, setTypingText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // New Client-Side Storage & Modal States
  const [contactName, setContactName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const [commsDb, setCommsDb] = useState<any[]>([]);
  const [databaseViewMode, setDatabaseViewMode] = useState<"cards" | "spreadsheet">("cards");

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSecretPanel, setShowSecretPanel] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Toast / Popup triggers
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Track window width for real-time responsiveness
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-hide toast notification after 5 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);
  const [shelfEdge, setShelfEdge] = useState({ start: true, end: false });
  const updateShelfEdge = () => {
    const el = shelfRef.current;
    if (!el) return;
    setShelfEdge({
      start: el.scrollLeft <= 8,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  };
  useEffect(() => {
    updateShelfEdge();
    window.addEventListener("resize", updateShelfEdge);
    return () => window.removeEventListener("resize", updateShelfEdge);
  }, [projectFilter, lang]);
  const chartInstance = useRef<Chart | null>(null);

  const t = translations[lang];
  const profile = profileContent;
  const experienceItems = profile.experience.items;
  const education = profile.education;
  const metricIndex = Math.min(activeProjectMetric, Math.max(0, presentation.heroMetrics.length - 1));
  const activeMetric = presentation.heroMetrics[metricIndex];
  const leadership = profile.leadership.items;

  // Language persist
  useEffect(() => {
    localStorage.setItem("portfolio_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Reset typing states on language change to prevent layout jumping bugs
  useEffect(() => {
    setTypingText("");
    setIsDeleting(false);
    setTypingIndex(0);
  }, [lang]);

  const typingTitles = rolesContent.items.length ? rolesContent.items.map((role) => role[lang]) : [""];
  const typingLongest = typingTitles.reduce((a, b) => (b.length > a.length ? b : a));

  // Typing effect
  useEffect(() => {
    const titles = typingTitles;

    let timer: NodeJS.Timeout;
    const currentFull = titles[typingIndex];

    const type = () => {
      if (!isDeleting) {
        setTypingText(currentFull.substring(0, typingText.length + 1));
        if (typingText === currentFull) {
          timer = setTimeout(() => setIsDeleting(true), 1500);
        } else {
          timer = setTimeout(type, 80);
        }
      } else {
        setTypingText(currentFull.substring(0, typingText.length - 1));
        if (typingText === "") {
          setIsDeleting(false);
          setTypingIndex((prev) => (prev + 1) % titles.length);
        } else {
          timer = setTimeout(type, 40);
        }
      }
    };

    timer = setTimeout(type, 100);
    return () => clearTimeout(timer);
  }, [typingText, isDeleting, typingIndex, lang]);

  // Scroll handler for navigation highlighting + back to top
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }

      setShowBackToTop(window.scrollY > 300);

      const sections = [
        "hero",
        "about",
        "experience",
        "projects",
        "skills",
        "edu",
        "training",
        "contact",
      ];
      let current = "hero";
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for scroll triggers
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".summer-section").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Render Skill Radar Chart using Chart.js on competency tab / language change
  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      const isMobileScreen = windowWidth < 640;

      const chartLabels = [
        t.axisData,
        isMobileScreen ? "SCM" : t.axisScm,
        isMobileScreen ? (t.mobileAxisProcess) : t.axisProcess,
        t.axisLean,
        t.axisReporting,
      ];

      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "radar",
          data: {
            labels: chartLabels,
            datasets: [
              {
                label: t.competencyScore,
                data: [presentation.radar.data, presentation.radar.scm, presentation.radar.process, presentation.radar.lean, presentation.radar.reporting],
                backgroundColor: "rgba(75, 139, 128, 0.16)",
                borderColor: "#4b8b80",
                pointBackgroundColor: "#ffffff",
                pointBorderColor: "#4b8b80",
                pointHoverBackgroundColor: "#c44832",
                pointHoverBorderColor: "#ffffff",
                borderWidth: 2,
                pointRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: 20,
            },
            scales: {
              r: {
                angleLines: {
                  color: "rgba(10, 22, 40, 0.1)",
                },
                grid: {
                  color: "rgba(10, 22, 40, 0.08)",
                },
                pointLabels: {
                  callback: (label: string) =>
                    label.length > 16
                      ? label.split(" ").reduce<string[]>((lines, word) => {
                          const last = lines.length - 1;
                          if (last >= 0 && `${lines[last]} ${word}`.length <= 16)
                            lines[last] += ` ${word}`;
                          else lines.push(word);
                          return lines;
                        }, [])
                      : label,
                  color: "#0A1628",
                  font: {
                    family: "Nunito Sans",
                    size: isMobileScreen ? 9 : 11,
                    weight: "normal",
                  },
                },
                ticks: {
                  display: false,
                  maxTicksLimit: 5,
                },
                suggestedMin: 50,
                suggestedMax: 100,
              },
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: (context) => ` ${context.raw}%`,
                },
              },
            },
          },
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [lang, t, windowWidth]);

  // Custom contact submission to online Firebase Firestore
  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Check network connectivity status
    if (!navigator.onLine) {
      setToastType("error");
      setShowToast(true);
      return;
    }

    try {
      // Build saved entry
      const entryId = "msg_" + Date.now();
      const newEntry = {
        id: entryId,
        timestamp: new Date().toLocaleString(),
        name: contactName || "N/A",
        contact: contactInfo || "N/A",
        message: contactMessage || "",
      };

      // Set document in Firestore
      await setDoc(doc(db, "contacts", entryId), newEntry);

      // Show success popup!
      setToastType("success");
      setShowToast(true);

      // Clear the Form inputs
      setContactName("");
      setContactInfo("");
      setContactMessage("");
    } catch (err) {
      console.error("Firestore submission error:", err);
      setToastType("error");
      setShowToast(true);
    }
  };

  // Listen to Firestore real-time updates when logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    const q = collection(db, "contacts");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesList: any[] = [];
        snapshot.forEach((docSnap) => {
          messagesList.push(docSnap.data());
        });
        // Sort messagesList chronologically descending (newest ID/timestamp first)
        messagesList.sort((a, b) => b.id.localeCompare(a.id));
        setCommsDb(messagesList);
      },
      (error) => {
        console.error("Failed to fetch real-time updates from Firestore:", error);
      },
    );

    return () => unsubscribe();
  }, [isLoggedIn]);

  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    if (adminUser === "divadelvira" && adminPass === "diva2812") {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      setShowSecretPanel(true);
      setLoginError("");
    } else {
      setLoginError(
        lang === "en" ? "Invalid security credentials" : "Kredensial keamanan tidak valid",
      );
    }
  };

  const handleAdminLogout = () => {
    setIsLoggedIn(false);
    setShowSecretPanel(false);
    setAdminUser("");
    setAdminPass("");
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, "contacts", id));
    } catch (err) {
      console.error("Failed to delete document from Firestore:", err);
    }
  };

  const handleClearAllMessages = async () => {
    const confirmMsg =
      lang === "en"
        ? "Delete all entries from the online database permanently (this is irreversible)?"
        : "Hapus semua entri dari database online secara permanen (tindakan ini tidak dapat dibatalkan)?";

    if (window.confirm(confirmMsg)) {
      try {
        const querySnapshot = await getDocs(collection(db, "contacts"));
        for (const docSnap of querySnapshot.docs) {
          await deleteDoc(doc(db, "contacts", docSnap.id));
        }
      } catch (err) {
        console.error("Failed to clear database in Firestore:", err);
      }
    }
  };

  const handleDownloadCsv = () => {
    if (commsDb.length === 0) return;
    const headers = ["ID", "Timestamp", "Name", "Contact", "Message"];
    const rows = commsDb.map((m) => [
      `"${m.id}"`,
      `"${m.timestamp}"`,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.contact.replace(/"/g, '""')}"`,
      `"${m.message.replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `comms_hub_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    }
  };

  const featuredProjects = projectsContent.items.map((project) => Object.fromEntries(
    Object.entries(project).map(([key, value]) => [key, key === "id" ? value : localize(value, lang)]),
  )) as FeaturedProject[];
  // Drop award photos in public/honors/, then add paths to photos. Empty arrays show a placeholder.
  const awards = awardsContent.items.map((award) => Object.fromEntries(
    Object.entries(award).map(([key, value]) => [key, key === "id" ? value : localize(value, lang)]),
  ));
  const visibleProjects = featuredProjects.filter(
    (p) => projectFilter === "all" || p.group === projectFilter,
  );
  const emptyProject: FeaturedProject = {
    id: "empty-project",
    title: t.emptyProjectsTitle,
    cat: "",
    desc: "",
    link: "",
    tags: [],
    group: "lean",
    result: { label: t.projectResultLabel, value: "—" },
    image: "",
    gallery: [],
  };
  const stageProject =
    visibleProjects.find((p) => p.id === activeProject) ?? visibleProjects[0] ?? emptyProject;
  const stageProjectTone = Math.max(0, featuredProjects.indexOf(stageProject)) % 4;

  return (
    <div className="summer-portfolio relative min-h-screen w-full selection:bg-brand-accent/20 selection:text-brand-primary">
      <a href="#main-content" className="skip-link">
        {t.skipToContent}
      </a>
      {/* Scroll Progress Bar */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* Primary Sticky Header */}
      <header className="summer-header">
        <div className="summer-header-inner">
          {/* Visual Logo / Overlapping Initials */}
          <button
            onClick={() => scrollToSection("hero")}
            className="flex items-center space-x-1.5 sm:space-x-4 group cursor-pointer text-left"
          >
            <span className="summer-monogram" aria-hidden="true">
              {profile.monogram}
            </span>
            <div>
              <span className="block text-sm font-bold text-brand-primary leading-tight">
                {profile.name}
              </span>
              <span className="hidden sm:block text-xs text-brand-primary/70">{t.roleTitle}</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav
            aria-label={t.mainNavigation}
            className="hidden lg:flex items-center gap-6"
          >
            {[
              { id: "about", label: t.navAbout },
              { id: "experience", label: t.navExperience },
              { id: "projects", label: t.navProjects },
              { id: "skills", label: t.navSkills },
              { id: "edu", label: t.navEdu },
              { id: "training", label: t.navTraining },
              { id: "contact", label: t.navContact },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                aria-current={activeSection === item.id ? "location" : undefined}
                className={`nav-link ${activeSection === item.id ? "nav-link-active" : ""}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Action Area: Lang Switcher & CTA */}
          <div className="flex items-center space-x-1.5 sm:space-x-4">
            <div className="flex items-center space-x-1 bg-[#0A1628]/5 p-1 rounded-full border border-brand-accent/20">
              <button
                onClick={() => setLang("en")}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-mono tracking-wider transition-all duration-300 cursor-pointer ${
                  lang === "en"
                    ? "bg-[#0A1628] text-white font-bold"
                    : "text-brand-primary hover:bg-brand-soft"
                }`}
              >
                {t.languageEnglishButton}
              </button>
              <button
                onClick={() => setLang("id")}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-mono tracking-wider transition-all duration-300 cursor-pointer ${
                  lang === "id"
                    ? "bg-[#0A1628] text-white font-bold"
                    : "text-brand-primary hover:bg-brand-soft"
                }`}
              >
                {t.languageIndonesianButton}
              </button>
            </div>

            <a href={`mailto:${profile.email}`} className="summer-mail hidden sm:inline-flex">
              {t.mail}
            </a>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-1.5 sm:p-2.5 rounded-full bg-[#0A1628]/5 border border-brand-accent/20 text-[#0A1628] hover:bg-[#C9A84C]/10 transition-colors pointer-events-auto cursor-pointer shrink-0 animate-fade-in"
              aria-label={t.toggleMenu}
              aria-expanded={showMobileMenu}
              aria-controls="mobile-navigation"
            >
              {showMobileMenu ? <X size={14} /> : <Menu size={14} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            id="mobile-navigation"
            className="summer-mobile-menu fixed left-3 right-3 z-40 lg:hidden p-5 flex flex-col space-y-5"
          >
            <nav className="flex flex-col space-y-3">
              {[
                { id: "about", label: t.navAbout },
                { id: "experience", label: t.navExperience },
                { id: "projects", label: t.navProjects },
                { id: "skills", label: t.navSkills },
                { id: "edu", label: t.navEdu },
                { id: "training", label: t.navTraining },
                { id: "contact", label: t.navContact },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    scrollToSection(item.id);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-left font-sans text-sm font-medium tracking-wide transition-all ${
                    activeSection === item.id
                      ? "bg-[#0A1628] text-white pl-6"
                      : "text-[#0A1628] hover:bg-[#C9A84C]/10 hover:pl-6"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="h-px bg-brand-primary/5 w-full" />
            <div className="flex flex-col gap-3 w-full">
              <a
                href={`mailto:${profile.email}`}
                className="w-full py-3.5 bg-[#0A1628] text-white hover:bg-[#C9A84C] hover:text-[#0A1628] text-center font-mono text-xs uppercase tracking-widest rounded-2xl transition-all duration-300"
              >
                {t.emailLabel} {profile.name}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content">
        {/* --- SECTION 1: HERO --- */}
        <section id="hero" className="summer-hero">
          <div className="summer-hero-inner">
            <div className="summer-hero-copy">
              <h1>{profile.name}.</h1>
              <p className="summer-role">{t.roleTitle}</p>
              <div className="summer-typing">
                {/* Invisible longest phrase reserves the wrapped height so nothing jumps or clips. */}
                <p aria-hidden="true" className="summer-typing-ghost">
                  {typingLongest}
                  <span className="typing-cursor" />
                </p>
                <p>
                  {typingText}
                  <span className="typing-cursor" aria-hidden="true" />
                </p>
              </div>
              <p className="summer-introduction text-justify">{t.heroSubText}</p>
              <div className="summer-hero-actions">
                <button onClick={() => scrollToSection("experience")} className="summer-primary">
                  {t.ctaViewWork} <ExternalLink size={17} aria-hidden="true" />
                </button>
                <button onClick={() => scrollToSection("contact")} className="summer-secondary">
                  {t.ctaContact} <Mail size={17} aria-hidden="true" />
                </button>
              </div>
              <p className="summer-availability">
                <span aria-hidden="true" />
                {t.badgeOpportunity}
              </p>
            </div>

            <div className="summer-hero-visual">
              <img
                className="summer-illustration"
                src={profile.heroImage}
                width="1500"
                height="1275"
                alt={profile.heroImageAlt[lang]}
                fetchPriority="high"
              />
              <div className="summer-metrics">
                <div className="flex justify-between items-center pb-4 border-b border-brand-primary/5">
                  <span className="summer-metrics-title">
                    {t.verifiedProjectMetrics}
                  </span>
                  <Sparkles size={16} className="text-[#C9A84C]" />
                </div>

                {/* Tab Selector Links */}
                <div
                  className="summer-metric-tabs"
                  role="group"
                  aria-label={t.projectMetrics}
                >
                  {presentation.heroMetrics.map((tab, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveProjectMetric(idx)}
                      aria-pressed={metricIndex === idx}
                      className={metricIndex === idx ? "is-selected" : ""}
                    >
                      {tab.name[lang]}
                    </button>
                  ))}
                </div>

                {/* Displayed Interactive Metric Content */}
                <div className="summer-metric-result space-y-4" aria-live="polite">
                  {activeMetric && (
                    <>
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-mono">{activeMetric.heading[lang]}</p>
                        <div className="flex items-baseline space-x-2">
                          <span className={`font-serif font-bold text-brand-primary ${metricIndex === 0 ? "text-4xl" : metricIndex === 2 ? "text-2xl" : "text-3xl"}`}>
                            {activeMetric.value[lang]}
                          </span>
                          {activeMetric.caption[lang] && (
                            <span className="text-xs text-emerald-600 font-mono font-semibold">{activeMetric.caption[lang]}</span>
                          )}
                        </div>
                        <div className="h-1.5 bg-brand-soft rounded-full overflow-hidden">
                          <div className={`h-full ${metricIndex === 1 ? "bg-brand-primary" : "bg-[#C9A84C]"}`} style={{ width: `${activeMetric.progress}%` }} />
                        </div>
                        <p className="text-xs text-gray-600 font-sans leading-relaxed text-justify mt-2 font-light">{activeMetric.description[lang]}</p>
                      </div>
                      <div className="pt-2 border-t border-brand-primary/5 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                        <span>{t.primaryTools}</span>
                        <span className="text-[#C9A84C] font-semibold text-right">{activeMetric.tools[lang]}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: ABOUT / PHILOSOPHY --- */}
        <section id="about" className="summer-section summer-about">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 relative">
              {/* BIO CONTENT (Left Column) */}
              <div className="col-span-1 lg:col-span-8 space-y-8">
                <div className="summer-bio space-y-6">
                  <div className="summer-heading">
                    <div className="flex items-center space-x-3">
                      <div className="h-px w-8 bg-[#C9A84C]" />
                      <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C]">
                        {t.aboutSubtitle}
                      </span>
                    </div>
                    <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif text-brand-primary font-light italic">
                      {t.aboutTitle}
                    </h2>
                  </div>
                  <div className="summer-profile-bio">
                    {/* Drop the owner's portrait at public/profile.jpg. */}
                    <div className="summer-profile-photo">
                      {profileMissing ? (
                        <div className="summer-project-photo-placeholder">
                          <ImageIcon size={28} aria-hidden="true" />
                          <span>{t.profilePhoto}</span>
                        </div>
                      ) : (
                        <img
                          src={profile.profileImage}
                          alt={profile.profileAlt[lang]}
                          loading="lazy"
                          onError={() => setProfileMissing(true)}
                        />
                      )}
                    </div>
                    <p className="text-base md:text-lg text-gray-700 leading-relaxed font-light text-justify whitespace-pre-line">
                      {t.aboutBio}
                    </p>
                  </div>

                  {/* LANGUAGE SKILLS (Bar Chart visual) */}
                  <div className="pt-8 border-t border-brand-primary/10 space-y-5">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full" />
                      <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C9A84C] font-bold">
                        {t.languageProficiency}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Indonesian (Native) */}
                      <div className="p-4 bg-white/45 backdrop-blur-sm rounded-2xl border border-brand-soft space-y-3">
                        <div className="flex justify-between items-center text-xs font-mono text-brand-primary">
                          <span className="font-semibold">
                            {t.indonesian}
                          </span>
                          <span className="text-[#C9A84C] font-semibold">
                            {t.nativeSpeaker}
                          </span>
                        </div>
                        <div className="h-2 bg-brand-soft/60 rounded-full overflow-hidden">
                          <div className="h-full bg-[#C9A84C] rounded-full" style={{ width: `${presentation.languageProgress.indonesian}%` }} />
                        </div>
                      </div>

                      {/* English (B2 / Upper-Intermediate) */}
                      <div className="p-4 bg-white/45 backdrop-blur-sm rounded-2xl border border-brand-soft space-y-3">
                        <div className="flex justify-between items-center text-xs font-mono text-brand-primary">
                          <span className="font-semibold">
                            {t.english}
                          </span>
                          <span className="text-brand-primary font-semibold">
                            {t.englishLevel}
                          </span>
                        </div>
                        <div className="h-2 bg-brand-soft/60 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0A1628] rounded-full" style={{ width: `${presentation.languageProgress.english}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PERSISTENT STAT CARDS (Right Column) */}
              <div className="summer-stats col-span-1 lg:col-span-4 grid grid-cols-1 min-[480px]:grid-cols-3 lg:grid-cols-1 gap-2.5 min-[380px]:gap-3 sm:gap-6 justify-center">
                <div className="p-2.5 min-[380px]:p-4 sm:p-6 bg-white border border-brand-soft/20 rounded-2xl shadow-sm flex flex-col justify-center gap-1 sm:gap-2 text-center lg:text-left hover:shadow-lg transition-all duration-300">
                  <p className="text-xl sm:text-3xl font-serif font-bold text-[#0A1628]">
                    {t.stat1Val}
                  </p>
                  <p className="text-[8px] min-[360px]:text-[10px] sm:text-xs font-semibold text-[#C9A84C] uppercase tracking-wider leading-snug">
                    {t.stat1Lbl}
                  </p>
                </div>
                <div className="p-2.5 min-[380px]:p-4 sm:p-6 bg-white border border-brand-soft/20 rounded-2xl shadow-sm flex flex-col justify-center gap-1 sm:gap-2 text-center lg:text-left hover:shadow-lg transition-all duration-300">
                  <p className="text-xl sm:text-3xl font-serif font-bold text-[#0A1628]">
                    {education.gpa.split(" / ")[0]}
                  </p>
                  <p className="text-[8px] min-[360px]:text-[10px] sm:text-xs font-semibold text-[#C9A84C] uppercase tracking-wider leading-snug">
                    {t.stat2Lbl}
                  </p>
                </div>
                <div className="p-2.5 min-[380px]:p-4 sm:p-6 bg-[#0A1628] border border-white/5 rounded-2xl shadow-md flex flex-col justify-center gap-1 sm:gap-2 text-center lg:text-left hover:shadow-xl transition-all duration-300 text-white">
                  <p className="text-xl sm:text-3xl font-serif font-bold text-[#C9A84C]">
                    {t.stat3Val}
                  </p>
                  <p className="text-[8px] min-[360px]:text-[10px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wider leading-snug">
                    {t.stat3Lbl}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 3: WORK EXPERIENCE WITH COLLAPSIBLE CARDS --- */}
        <section id="experience" className="summer-section summer-experience">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
              <div className="col-span-1 lg:col-span-5">
                <div className="summer-heading lg:sticky lg:top-32 space-y-6">
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C]">
                    {t.experienceSubtitle}
                  </span>
                  <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif italic text-brand-primary font-light">
                    {t.experienceTitle}
                  </h2>
                  <p className="text-gray-500 font-light leading-relaxed max-w-md text-justify">
                    {t.experienceContext}
                  </p>
                  <a
                    href={profile.socials.find((item) => item.key === "linkedin")?.href ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-5 bg-[#0A1628] text-center rounded-2xl border border-[#C9A84C]/25 text-xs font-mono text-white hover:bg-[#C9A84C] hover:text-[#0A1628] transition-all duration-300 shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    {t.experienceLinkedinCTA} →
                  </a>
                </div>
              </div>

              <div className="col-span-1 lg:col-span-7 space-y-6">
                {experienceItems.map((experience, index) => {
                  const experienceKey = experience.key || String(index);
                  const expanded = expandedExperience[experienceKey] ?? false;
                  const toggleExpanded = () =>
                    setExpandedExperience((current) => ({
                      ...current,
                      [experienceKey]: !expanded,
                    }));

                  return (
                    <div
                      key={experienceKey}
                      role="button"
                      tabIndex={0}
                      aria-expanded={expanded}
                      onClick={toggleExpanded}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleExpanded();
                        }
                      }}
                      className="summer-experience-record group"
                    >
                      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center pb-6 border-b border-brand-soft/50 mb-6">
                        <div>
                          <span className="inline-block px-3 py-1 bg-brand-soft text-[9px] font-mono uppercase text-[#0A1628] rounded-full mb-2">
                            {experience.company}
                          </span>
                          <h3 className="text-xl sm:text-2xl font-serif font-semibold text-brand-primary">
                            {experience.role[lang]}
                          </h3>
                        </div>
                        <div className="text-left md:text-right mt-4 md:mt-0 space-y-1">
                          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                            {experience.period[lang]}
                          </p>
                          <p className="text-[10px] text-[#C9A84C] uppercase tracking-tighter flex items-center md:justify-end">
                            <MapPin size={10} className="mr-1" /> {experience.location[lang]}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed italic mb-4 max-w-3xl text-justify">
                        {experience.description[lang]}
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] font-mono uppercase text-[#C9A84C] mb-6">
                        <span>
                          {t.industryTag}: {experience.sector[lang]}
                        </span>
                      </div>

                      {/* Expander Trigger */}
                      <div className="flex justify-between items-center text-xs text-[#0A1628]/60 font-mono uppercase tracking-widest pt-2 border-t border-brand-soft/40">
                        <span>{expanded ? t.clickPromptCollapse : t.clickPromptExpand}</span>
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>

                      {/* Collapsed Bullet Content */}
                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden mt-6"
                          >
                            <ul className="space-y-4 pt-4 border-t border-brand-soft/20 text-sm text-gray-600">
                              {experience.bullets[lang].map((bullet) => (
                                <li key={bullet} className="flex items-start text-justify">
                                  <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full mt-2 mr-3 shrink-0" />
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 4: PROJECTS / CASE STUDIES --- */}
        <section id="projects" className="summer-section summer-projects">
          <div className="max-w-7xl mx-auto">
            <div className="summer-project-heading">
              <div className="summer-heading">
                <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#C9A84C]">
                  {t.projectsSubtitle}
                </span>
                <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif italic text-brand-primary font-light">
                  {t.projectsTitle}
                </h2>
              </div>
              <div className="summer-project-intro">
                <p className="text-gray-500 font-light text-justify">{t.projectsContext}</p>
                <div
                  className="summer-project-filter"
                  role="group"
                  aria-label={t.filterCaseStudies}
                >
                  {projectGroups.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      aria-pressed={projectFilter === g.key}
                      onClick={() => setProjectFilter(g.key)}
                    >
                      {g.label[lang]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="summer-project-shelf-wrap">
              <button
                type="button"
                className="summer-shelf-arrow is-left"
                aria-label={t.firstProject}
                disabled={shelfEdge.start}
                onClick={() => shelfRef.current?.scrollTo({ left: 0, behavior: "smooth" })}
              >
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="summer-shelf-arrow is-right"
                aria-label={t.lastProject}
                disabled={shelfEdge.end}
                onClick={() =>
                  shelfRef.current?.scrollTo({
                    left: shelfRef.current.scrollWidth,
                    behavior: "smooth",
                  })
                }
              >
                <ChevronRight size={20} aria-hidden="true" />
              </button>
              <div
                ref={shelfRef}
                onScroll={updateShelfEdge}
                className="summer-project-shelf"
                tabIndex={0}
                role="region"
                aria-label={t.projectCards}
              >
                {visibleProjects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`summer-project-card tone-${featuredProjects.indexOf(p) % 4}`}
                    aria-pressed={p === stageProject}
                    aria-controls="project-stage"
                    onClick={() => setActiveProject(p.id)}
                  >
                    <ProjectResultFigure result={p.result} />
                    <span className="summer-project-card-title">{p.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <article
              key={stageProject.title}
              id="project-stage"
              className={`summer-project-stage tone-${stageProjectTone}`}
            >
              <div className="summer-project-media">
                {stageProject.image ? (
                  <img src={stageProject.image} alt={stageProject.title} loading="lazy" />
                ) : (
                  <div className="summer-project-photo-placeholder">
                    <ImageIcon size={28} aria-hidden="true" />
                    <span>{t.projectPhoto}</span>
                  </div>
                )}
                <div className="summer-evidence">
                  <h4>{t.evidenceHeading}</h4>
                  <div className="summer-evidence-strip">
                    {stageProject.gallery.length
                      ? stageProject.gallery.map((photo, index) => (
                          <button
                            key={`${photo}-${index}`}
                            type="button"
                            aria-haspopup="dialog"
                            aria-label={`${t.openEvidencePhoto} ${index + 1}: ${stageProject.title}`}
                            onClick={(event) =>
                              openEvidence(
                                stageProject.title,
                                stageProject.gallery,
                                index,
                                event.currentTarget,
                              )
                            }
                          >
                            <img
                              src={photo}
                              alt={`${stageProject.title}, ${t.evidenceAlt} ${index + 1}`}
                              loading="lazy"
                            />
                          </button>
                        ))
                      : [1, 2, 3].map((tile) => (
                          <div key={tile} className="summer-project-photo-placeholder">
                            <ImageIcon size={20} aria-hidden="true" />
                            <span>
                              {t.photoLabel} {tile}
                            </span>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
              <div className="summer-project-story">
                <header>
                  <h3>{stageProject.title}</h3>
                  <p className="summer-project-cat">{stageProject.cat}</p>
                </header>
                <p className="summer-project-desc text-justify">{stageProject.desc}</p>
                <div className="summer-project-foot">
                  <ul className="summer-project-tags">
                    {stageProject.tags.map((tag) => (
                      <li key={tag}>#{tag}</li>
                    ))}
                  </ul>
                  {stageProject.link && (
                    <a
                      href={stageProject.link}
                      target="_blank"
                      rel="noreferrer"
                      className="summer-project-link"
                    >
                      <span>{stageProject.linkLabel ?? t.viewDetails}</span>
                      <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  )}
                  {stageProject.docLink && (
                    <a
                      href={stageProject.docLink}
                      target="_blank"
                      rel="noreferrer"
                      className="summer-project-link"
                    >
                      <span>{t.viewDocumentation}</span>
                      <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* --- SECTION 5: COMPETENCY MATRIX / RADAR CHART --- */}
        <section id="skills" className="summer-section summer-skills">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              <div className="col-span-1 lg:col-span-6 space-y-6">
                <div className="summer-heading">
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C]">
                    {t.skillsSubtitle}
                  </span>
                  <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif italic text-brand-primary font-light">
                    {t.skillsTitle}
                  </h2>
                </div>

                {/* Competency Group 1: Tools */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono uppercase text-gray-400 tracking-widest">
                    {t.skillsCategory1}
                  </h4>
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {credentialsContent.skillHighlights.tools.map((skill) => (
                        <span
                          key={`${skill.en}-${skill.id}`}
                          className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white border border-brand-soft/50 text-xs font-mono rounded-full text-brand-primary hover:border-brand-accent transition-colors duration-300"
                        >
                          {skill[lang]}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                {/* Competency Group 2: SCM */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono uppercase text-gray-400 tracking-widest">
                    {t.skillsCategory2}
                  </h4>
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {credentialsContent.skillHighlights.supplyChain.map((skill) => (
                      <span
                        key={`${skill.en}-${skill.id}`}
                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#0A1628] text-white text-xs font-mono rounded-full hover:bg-brand-accent transition-colors duration-300"
                      >
                        {skill[lang]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Competency Group 3: Methodologies */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono uppercase text-[#C9A84C] tracking-widest">
                    {t.skillsCategory3}
                  </h4>
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {credentialsContent.skillHighlights.methodologies.map((skill) => (
                      <span
                        key={`${skill.en}-${skill.id}`}
                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#F3EFE6] text-brand-primary border border-[#C9A84C]/20 text-xs font-mono rounded-full hover:border-[#C9A84C] transition-colors duration-300"
                      >
                        {skill[lang]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Core Radar Canvas */}
              <div className="summer-radar col-span-1 lg:col-span-6 flex flex-col items-center mt-6 lg:mt-0 w-full">
                <h4 className="text-sm font-mono uppercase text-[#C9A84C] tracking-[0.2em] mb-8 text-center">
                  {t.chartHeading}
                </h4>
                <div className="w-full aspect-square relative max-w-[260px] min-[380px]:max-w-[310px] sm:max-w-[420px]">
                  <canvas
                    ref={chartRef}
                    id="competencyChart"
                    className="w-full h-full"
                    role="img"
                    aria-label={`${t.axisData}: ${presentation.radar.data}%; ${t.axisScm}: ${presentation.radar.scm}%; ${t.axisProcess}: ${presentation.radar.process}%; ${t.axisLean}: ${presentation.radar.lean}%; ${t.axisReporting}: ${presentation.radar.reporting}%`}
                  />
                </div>
                <p className="text-[11px] text-gray-400 text-justify font-mono mt-8 leading-relaxed max-w-sm">
                  {t.chartFooter}
                </p>
              </div>
            </div>
            <SkillsInventory lang={lang} />
          </div>
        </section>

        {/* --- SECTION 6: TOURNAMENTS & RECOGNITIONS --- */}
        <section className="summer-section summer-honors">
          <div className="max-w-7xl mx-auto">
            <div className="summer-heading max-w-3xl mb-8 md:mb-10">
              <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-brand-soft">
                {t.achievementsSubtitle}
              </span>
              <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif italic font-light text-brand-soft">
                {t.achievementsTitle}
              </h2>
              <p className="text-xs text-white/50 font-mono tracking-widest uppercase">
                {t.achievementsContext}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {awards.map((award) => (
                <button
                  key={award.id}
                  type="button"
                  className="summer-award-card"
                  aria-haspopup="dialog"
                  onClick={(event) => {
                    openEvidence(
                      `${award.rank}: ${award.title}`,
                      award.photos,
                      0,
                      event.currentTarget,
                    );
                  }}
                >
                  <Award size={28} aria-hidden="true" />
                  <span className="summer-award-copy">
                    <span className="text-xs">{award.category}</span>
                    <span className="summer-award-rank">{award.rank}</span>
                    <span className="text-lg font-bold">{award.title}</span>
                    <span className="text-sm">{award.sponsor}</span>
                    <span className="summer-project-link">
                      {t.viewAwardPhoto}{" "}
                      <ImageIcon size={16} aria-hidden="true" />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION 7: EDUCATION & ORGANIZATIONAL --- */}
        <section id="edu" className="summer-section summer-education">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-10">
              {/* Top: Edu info */}
              <div className="flex flex-col gap-3">
                <div className="summer-heading">
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C]">
                    {t.eduOrgSubtitle}
                  </span>
                  <h2 className="flex items-center gap-3 text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif italic text-brand-primary font-light">
                    <span className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center shrink-0">
                      <GraduationCap size={26} aria-hidden="true" />
                    </span>
                    {t.eduHeading}
                  </h2>
                </div>

                {/* Campus 1 */}
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => setEduOpen(true)}
                  className="group/edu text-left w-full p-4 min-[380px]:p-6 sm:p-6 bg-white border border-brand-soft rounded-[30px] flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-300 cursor-pointer relative"
                >
                  <div className="space-y-1.5 w-full min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-semibold">
                      {education.shortName}
                    </span>
                    <h4 className="text-2xl font-serif font-semibold text-brand-primary leading-tight">
                      {education.institution}
                    </h4>
                    <p className="text-sm italic font-serif text-[#C9A84C]">
                      {education.degree[lang]}
                    </p>
                    <p className="text-xs font-mono text-gray-500">
                      {education.period[lang]} · {t.educationGpaLabel} {education.gpa}
                    </p>

                    <div className="h-px bg-brand-soft/50 my-1 w-full" />

                    <ul className="space-y-1 text-xs text-gray-500 leading-relaxed font-light text-justify">
                      {education.focus[lang].map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                    <span className="summer-project-link pt-1">
                      {t.studyOverviewLink}{" "}
                      <ArrowRight size={14} aria-hidden="true" />
                    </span>
                  </div>
                  {/* Source: commons.wikimedia.org/wiki/File:Logo-Resmi-Unhas-1.png */}
                  <div
                    className={`summer-edu-logo order-first sm:order-none${logoMissing ? "" : " has-image"}`}
                  >
                    {logoMissing ? (
                      <>
                        <ImageIcon size={22} aria-hidden="true" />
                        <span>{t.logoPlaceholder}</span>
                      </>
                    ) : (
                      <img
                        src={education.logo}
                        alt={education.logoAlt}
                        loading="lazy"
                        onError={() => setLogoMissing(true)}
                      />
                    )}
                  </div>
                </button>
              </div>

              {/* Bottom: Org Info, 2x2 */}
              <div className="flex flex-col gap-3">
                <div className="summer-heading">
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C]">
                    {t.leaderNetworkLabel}
                  </span>
                  <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif italic text-brand-primary font-light">
                    {t.orgHeading}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                  {leadership.map((item) => (
                    <a
                      key={item.key}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-4 min-[380px]:p-6 sm:p-6 bg-white border border-brand-soft rounded-[30px] flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-300 cursor-pointer relative"
                    >
                      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-300 group-hover:text-[#C9A84C] transition-colors duration-300">
                        <ExternalLink size={14} />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center shrink-0">
                        {leadershipIcon(item.icon)}
                      </div>
                      <div className="space-y-1 w-full">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-semibold">
                          {item.title}
                        </span>
                        <h4 className="text-lg sm:text-xl md:text-2xl font-serif font-semibold text-brand-primary leading-tight">
                          {item.role[lang]}
                        </h4>
                        <p className="text-xs font-mono text-gray-500">{item.date[lang]}</p>
                        <p className="text-sm text-gray-600 font-light leading-relaxed text-justify">
                          {item.description[lang]}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <TrainingSection lang={lang} />
        <EduOverview lang={lang} open={eduOpen} onClose={() => setEduOpen(false)} />

        {/* --- SECTION 8: CONTACT ME --- */}
        <section id="contact" className="summer-section summer-contact">
          <div className="max-w-7xl mx-auto space-y-8 md:space-y-10 relative z-10">
            <div className="summer-heading summer-contact-heading">
              <div className="inline-flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C] font-semibold">
                  {t.contactSubtitle}
                </span>
              </div>
              <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-6xl font-serif italic text-brand-primary font-light">
                {t.contactTitle}
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto font-light leading-relaxed text-sm text-[#0A1628]/80 text-justify px-2">
                {t.contactPrompt}
              </p>
            </div>

            {/* Centered Elegant Dialogue Form */}
            <div className="max-w-xl mx-auto w-full">
              <form onSubmit={handleContactSubmit} className="summer-contact-form space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-brand-primary/5 mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                    {t.transmitMessage}
                  </span>
                  <Sparkles size={14} className="text-[#C9A84C]" />
                </div>

                {/* YOUR IDENTITY */}
                <div className="space-y-2 text-left">
                  <label
                    htmlFor="contact-name"
                    className="block text-[10px] font-mono uppercase tracking-widest font-semibold text-brand-primary/60"
                  >
                    {t.nameLabel}
                  </label>
                  <input
                    id="contact-name"
                    aria-label={t.nameLabel}
                    autoComplete="name"
                    type="text"
                    required
                    placeholder={t.namePlaceholder}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-5 py-4 bg-white border border-brand-soft rounded-xl font-mono text-sm text-[#0A1628] placeholder-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-all"
                  />
                </div>

                {/* COMMS PROTOCOL */}
                <div className="space-y-2 text-left">
                  <label
                    htmlFor="contact-info"
                    className="block text-[10px] font-mono uppercase tracking-widest font-semibold text-brand-primary/60"
                  >
                    {t.contactPointLabel}
                  </label>
                  <input
                    type="text"
                    required
                    id="contact-info"
                    aria-label={
                      t.contactPointLabel
                    }
                    placeholder={t.contactPointPlaceholder}
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full px-5 py-4 bg-white border border-brand-soft rounded-xl font-mono text-sm text-[#0A1628] placeholder-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-all"
                  />
                </div>

                {/* THE PAYLOAD */}
                <div className="space-y-2 text-left">
                  <label
                    htmlFor="contact-message"
                    className="block text-[10px] font-mono uppercase tracking-widest font-semibold text-brand-primary/60"
                  >
                    {t.messagePayloadLabel}
                  </label>
                  <textarea
                    id="contact-message"
                    aria-label={t.messagePayloadLabel}
                    required
                    rows={4}
                    placeholder={
                      t.messagePlaceholder
                    }
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-5 py-4 bg-white border border-brand-soft rounded-xl font-mono text-sm text-[#0A1628] placeholder-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4.5 bg-[#0A1628] text-white font-mono text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:bg-[#C9A84C] hover:text-[#0A1628] transition-all duration-300 shadow-md flex items-center justify-center space-x-2 cursor-pointer mt-8"
                >
                  <span>{t.sendMessage}</span>
                  <ExternalLink size={12} />
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="summer-footer">
        <div className="max-w-7xl mx-auto">
          {/* Social connections */}
          <div className="space-y-8 w-full max-w-5xl mx-auto">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] text-center font-bold">
              {profile.socialHeading[lang]}
            </h3>

            <div className="grid grid-cols-1 min-[340px]:grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {profile.socials.map((chan) => (
                <a
                  key={chan.key}
                  href={chan.href}
                  target={chan.target}
                  rel={chan.target ? "noreferrer" : undefined}
                  className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border border-brand-soft bg-white text-brand-primary hover:border-[#C9A84C] hover:shadow-lg transition-all duration-300 text-center space-y-2 group group-hover:bg-brand-soft min-w-0"
                >
                  <div className="text-[#C9A84C] group-hover:scale-110 transition-transform duration-300">
                    {socialIcon(chan.key)}
                  </div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider font-bold truncate max-w-full">
                    {chan.label}
                  </span>
                  <span className="block text-[9px] text-gray-400 font-mono truncate max-w-full">
                    {chan.detail}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Elegant Footer Details */}
          <div className="pt-8 mt-8 md:pt-12 md:mt-12 border-t border-[#0A1628]/10 w-full flex flex-col md:flex-row justify-between items-center text-[10px] font-mono uppercase tracking-[0.3em] text-[#0A1628] text-center md:text-left space-y-4 md:space-y-0 text-center">
            <button
              onClick={() => {
                setLoginError("");
                setShowLoginModal(true);
              }}
              className="text-center md:text-left font-mono uppercase tracking-[0.3em] text-[#0A1628]/60 hover:text-[#C9A84C] transition-colors duration-300 cursor-pointer"
            >
              © {presentation.copyrightYear} {profile.name}. {t.rightsReserved}
            </button>
            {t.footerTagline && (
              <p className="mt-2 md:mt-0 italic text-[#C9A84C]">{t.footerTagline}</p>
            )}
          </div>
        </div>
      </footer>

      {evidence !== null && (
        <dialog
          className="summer-award-dialog"
          aria-labelledby="evidence-photo-title"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              stepEvidence(event.key === "ArrowLeft" ? -1 : 1);
            }
          }}
          ref={(dialog) => {
            if (dialog && !dialog.open) dialog.showModal();
          }}
          onClose={() => {
            setEvidence(null);
            evidenceTrigger.current?.focus();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              const rect = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
              )
                event.currentTarget.close();
            }
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 id="evidence-photo-title" className="text-xl font-bold">
              {evidence.title}
            </h2>
            <button
              type="button"
              className="summer-award-close"
              onClick={(event) => event.currentTarget.closest("dialog")?.close()}
            >
              <X size={18} aria-hidden="true" /> {t.close}
            </button>
          </div>
          {evidence.photos.length ? (
            <figure>
              <img
                src={evidence.photos[evidence.index]}
                alt={`${evidence.title}, ${t.photo} ${evidence.index + 1}`}
              />
              <figcaption className="summer-evidence-controls">
                <button
                  type="button"
                  className="summer-award-close"
                  disabled={evidence.photos.length < 2}
                  aria-label={t.previousPhoto}
                  onClick={() => stepEvidence(-1)}
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <span aria-live="polite">
                  {evidence.index + 1} / {evidence.photos.length}
                </span>
                <button
                  type="button"
                  className="summer-award-close"
                  disabled={evidence.photos.length < 2}
                  aria-label={t.nextPhoto}
                  onClick={() => stepEvidence(1)}
                >
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              </figcaption>
            </figure>
          ) : (
            <div className="summer-project-photo-placeholder">
              <ImageIcon size={40} aria-hidden="true" />
              <p>
                {t.awardPhotoPlaceholder}
              </p>
            </div>
          )}
        </dialog>
      )}

      {/* Floating back to top button */}
      {showBackToTop && (
        <button
          onClick={() => scrollToSection("hero")}
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-12 h-12 rounded-full lux-glass flex items-center justify-center text-xs font-mono font-bold tracking-widest z-50 text-brand-primary hover:bg-[#0A1628] hover:text-white transition-all cursor-pointer shadow-lg"
        >
          {t.backToTop}
        </button>
      )}

      {/* Dynamic Toast Notifications */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            role="status"
            className={`fixed bottom-20 left-4 right-4 sm:left-auto sm:right-8 z-50 p-4 sm:p-5 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-mono uppercase tracking-widest border border-brand-accent/20 ${
              toastType === "success" ? "bg-white text-emerald-600" : "bg-white text-red-600"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${toastType === "success" ? "bg-emerald-500" : "bg-red-500"}`}
            />
            <span>
              {toastType === "success"
                ? t.messageSent
                : t.messageFailed}
            </span>
            <button
              onClick={() => setShowToast(false)}
              aria-label={t.dismissNotification}
              className="ml-4 font-bold text-gray-400 hover:text-brand-primary"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ADMINISTRATIVE DATABASE SECURE LOGIN DIALOGUE --- */}
      <AnimatePresence>
        {showLoginModal && (
          <dialog
            aria-label={lang === "en" ? "Administrator login" : "Login administrator"}
            ref={(dialog) => {
              if (dialog && !dialog.open) dialog.showModal();
            }}
            onCancel={() => setShowLoginModal(false)}
            className="summer-dialog fixed inset-0 bg-brand-primary/85 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F8F7F4] border border-[#C9A84C]/45 rounded-[32px] p-8 max-w-md w-full shadow-2xl space-y-6 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-brand-primary">
                  <Lock size={18} className="text-[#C9A84C]" />
                  <span className="font-mono text-xs uppercase tracking-widest font-bold">
                    {lang === "en" ? "Secure Database Login" : "Login Basis Data Aman"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="font-mono text-xs font-bold text-gray-400 hover:text-brand-primary cursor-pointer"
                >
                  ESC
                </button>
              </div>

              <div className="h-px bg-brand-primary/5" />

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="admin-user"
                    className="block text-[10px] font-mono uppercase tracking-widest font-semibold text-brand-primary/60"
                  >
                    {lang === "en" ? "Operator Username" : "Username Operator"}
                  </label>
                  <input
                    id="admin-user"
                    autoComplete="username"
                    type="text"
                    required
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    className="w-full px-5 py-3 bg-white border border-brand-soft rounded-xl font-mono text-sm text-[#0A1628] focus:outline-none focus:border-[#C9A84C]"
                    placeholder="Username"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="admin-pass"
                    className="block text-[10px] font-mono uppercase tracking-widest font-semibold text-brand-primary/60"
                  >
                    {lang === "en" ? "Security Keyphrase" : "Kata Sandi Keamanan"}
                  </label>
                  <input
                    id="admin-pass"
                    autoComplete="current-password"
                    type="password"
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="w-full px-5 py-3 bg-white border border-brand-soft rounded-xl font-mono text-sm text-[#0A1628] focus:outline-none focus:border-[#C9A84C]"
                    placeholder="••••••••"
                  />
                </div>

                {loginError && (
                  <p className="text-red-600 font-mono text-xs leading-relaxed">{loginError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-[#0A1628] hover:bg-[#C9A84C] text-white hover:text-[#0A1628] font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center"
                >
                  {lang === "en" ? "AUTHENTICATE" : "OTENTIKASI"}
                </button>
              </form>
            </motion.div>
          </dialog>
        )}
      </AnimatePresence>

      {/* --- SECURE DATABASE INBOX MESSAGES DASHBOARD --- */}
      <AnimatePresence>
        {showSecretPanel && (
          <dialog
            aria-label={lang === "en" ? "Administrator inbox" : "Kotak masuk administrator"}
            ref={(dialog) => {
              if (dialog && !dialog.open) dialog.showModal();
            }}
            onCancel={(event) => {
              event.preventDefault();
              handleAdminLogout();
            }}
            className="summer-dialog fixed inset-0 bg-brand-primary/95 z-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="summer-inbox bg-[#FBFBFA] max-w-5xl w-full space-y-8 flex flex-col max-h-[90vh]"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-brand-primary/5 shrink-0">
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono tracking-widest text-[#C9A84C] font-bold uppercase font-semibold">
                      SECURE COMMUNICATIONS HUB
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <h2 className="text-3xl font-serif text-brand-primary font-normal">
                      {lang === "en" ? "Administrator Inbox" : "Kotak Masuk Administrator"}
                    </h2>

                    {/* View Mode Toggle */}
                    <div className="flex border border-brand-soft rounded-full p-0.5 bg-[#0A1628]/5 shrink-0 select-none">
                      <button
                        onClick={() => setDatabaseViewMode("cards")}
                        className={`px-3 py-1 rounded-full text-[9px] font-mono tracking-wider transition-all duration-300 cursor-pointer flex items-center space-x-1 ${
                          databaseViewMode === "cards"
                            ? "bg-brand-primary text-white font-bold"
                            : "text-brand-primary/60 hover:text-brand-primary"
                        }`}
                        title={lang === "en" ? "Switch to Cards Mode" : "Ubah ke Mode Kartu"}
                      >
                        <LayoutGrid size={11} />
                        <span>{lang === "en" ? "Cards" : "Kartu"}</span>
                      </button>
                      <button
                        onClick={() => setDatabaseViewMode("spreadsheet")}
                        className={`px-3 py-1 rounded-full text-[9px] font-mono tracking-wider transition-all duration-300 cursor-pointer flex items-center space-x-1 ${
                          databaseViewMode === "spreadsheet"
                            ? "bg-brand-primary text-white font-bold"
                            : "text-brand-primary/60 hover:text-brand-primary"
                        }`}
                        title={
                          lang === "en"
                            ? "Switch to Spreadsheet Mode"
                            : "Ubah ke Mode Tabel Spreadsheet"
                        }
                      >
                        <Table size={11} />
                        <span>{lang === "en" ? "Spreadsheet" : "Tabel"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="summer-inbox-actions flex items-center w-full lg:w-auto">
                  <button
                    onClick={handleDownloadCsv}
                    disabled={commsDb.length === 0}
                    className="px-4 py-2.5 bg-brand-primary border border-brand-primary text-white text-[10px] font-mono uppercase tracking-wider rounded-xl hover:bg-[#C9A84C] hover:text-[#0A1628] disabled:opacity-35 disabled:hover:bg-brand-primary disabled:hover:text-white transition-all duration-350 cursor-pointer flex items-center space-x-2"
                  >
                    <Download size={14} />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={handleClearAllMessages}
                    disabled={commsDb.length === 0}
                    className="px-4 py-2.5 border border-brand-soft text-brand-primary hover:border-red-600 hover:text-red-700 text-xs font-mono rounded-xl transition-colors disabled:opacity-35 cursor-pointer"
                  >
                    {lang === "en" ? "Clear Database" : "Kosongkan Basis data"}
                  </button>
                  <button
                    onClick={handleAdminLogout}
                    className="px-4 py-2.5 bg-brand-accent text-white font-bold text-xs font-mono rounded-xl hover:bg-red-700 transition-colors cursor-pointer flex items-center space-x-2"
                  >
                    <LogOut size={14} />
                    <span>{lang === "en" ? "Exit" : "Keluar"}</span>
                  </button>
                </div>
              </div>

              {/* Message List area supporting both modes */}
              <div
                className="flex-grow overflow-y-auto pr-2"
                style={{ maxHeight: "calc(90vh - 280px)" }}
              >
                {commsDb.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <p className="font-serif italic text-lg text-gray-400">
                      {lang === "en"
                        ? "No incoming communications archived."
                        : "Tidak ada pesan komunikasi masuk yang diarsipkan."}
                    </p>
                    <p className="text-xs font-mono text-gray-400">
                      {lang === "en"
                        ? "Online Cloud Database is operational. 0 records index."
                        : "Sistem basis data online beroperasi. 0 rekaman terindeks."}
                    </p>
                  </div>
                ) : databaseViewMode === "spreadsheet" ? (
                  /* SPREADSHEET MODE TABLE DISPLAY */
                  <div className="border border-brand-soft rounded-2xl overflow-hidden bg-white shadow-sm text-left">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                          <tr className="bg-brand-primary text-[#C9A84C] border-b border-brand-soft uppercase tracking-wider text-[9px] sm:text-[10px]">
                            <th className="p-4 font-bold border-r border-[#C9A84C]/10 min-w-[130px]">
                              {lang === "en" ? "Date" : "Tanggal"}
                            </th>
                            <th className="p-4 font-bold border-r border-[#C9A84C]/10 min-w-[140px]">
                              {lang === "en" ? "Name" : "Nama"}
                            </th>
                            <th className="p-4 font-bold border-r border-[#C9A84C]/10 min-w-[180px]">
                              {lang === "en" ? "Channel" : "Jalur / Kontak"}
                            </th>
                            <th className="p-4 font-bold border-r border-[#C9A84C]/10 min-w-[300px]">
                              {lang === "en" ? "Message" : "Isi Pesan"}
                            </th>
                            <th className="p-4 font-bold text-center w-[80px]">
                              {lang === "en" ? "Action" : "Aksi"}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-soft">
                          {commsDb.map((msg, idx) => (
                            <tr
                              key={msg.id}
                              className={`hover:bg-[#F3EFE6]/40 transition-colors ${
                                idx % 2 === 0 ? "bg-white" : "bg-[#FBFBFA]"
                              }`}
                            >
                              <td className="p-4 border-r border-brand-soft/60 align-top text-gray-500 whitespace-nowrap">
                                {msg.timestamp}
                              </td>
                              <td className="p-4 border-r border-brand-soft/60 align-top text-brand-primary font-bold">
                                {msg.name}
                              </td>
                              <td className="p-4 border-r border-brand-soft/60 align-top text-[#C9A84C] font-semibold break-all max-w-[180px]">
                                {msg.contact}
                              </td>
                              <td className="p-4 border-r border-brand-soft/60 align-top text-sm font-sans text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {msg.message}
                              </td>
                              <td className="p-4 align-top text-center">
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="p-2 text-brand-primary hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center"
                                  title="Delete record"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* CLASSIC CARDS MODE DISPLAY */
                  <div className="space-y-6">
                    {commsDb.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-6 bg-white border border-brand-soft rounded-2xl relative shadow-sm hover:shadow-md transition-all duration-300 text-left"
                      >
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="absolute top-6 right-6 p-2 text-brand-primary hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row justify-start sm:items-center gap-2 sm:gap-4">
                            <span className="text-[10px] font-mono uppercase tracking-wider bg-brand-soft px-3 py-1 rounded-full text-brand-primary font-bold">
                              {msg.name}
                            </span>
                            <span className="text-[9px] font-mono text-gray-400">
                              {msg.timestamp}
                            </span>
                          </div>

                          <p className="text-[11px] font-mono text-[#C9A84C] font-semibold">
                            {lang === "en" ? "Channel" : "Jalur"}:{" "}
                            <span className="text-brand-primary">{msg.contact}</span>
                          </p>

                          <p className="text-sm text-gray-700 leading-relaxed font-light text-justify bg-[#FBFBFA] p-4 rounded-xl border border-brand-soft/40 whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status footer line */}
              <div className="pt-6 border-t border-brand-primary/5 flex justify-between items-center text-[10px] font-mono text-gray-400 shrink-0">
                <span>{lang === "en" ? "DB_POOL: ACTIVE" : "STATUS_DATABASE: AKTIF"}</span>
                <span>
                  {commsDb.length} {lang === "en" ? "Record(s) Loaded" : "Rekaman Dimuat"}
                </span>
              </div>
            </motion.div>
          </dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
