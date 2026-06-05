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
  Phone,
  ChevronDown, 
  ChevronUp,
  ExternalLink, 
  Trophy, 
  GraduationCap, 
  Users,
  Award,
  BookOpen,
  TrendingDown,
  Layout,
  BarChart3,
  Sparkles,
  Instagram,
  Music,
  Code,
  Briefcase,
  Calendar,
  Trash2,
  Download,
  LogOut,
  Lock,
  Menu,
  X,
  LayoutGrid,
  Table
} from "lucide-react";
import Chart from "chart.js/auto";
import { db } from "./firebase";
import { collection, doc, setDoc, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";

// Bilingual Language Dictionary
interface TranslationSet {
  navAbout: string;
  navExperience: string;
  navProjects: string;
  navSkills: string;
  navEdu: string;
  navContact: string;

  roleTitle: string;
  badgeOpportunity: string;
  heroGreeting: string;
  heroSubText: string;
  ctaViewWork: string;
  ctaContact: string;
  
  aboutTitle: string;
  aboutSubtitle: string;
  aboutBio: string;
  aboutLabel1: string;
  aboutLabel2: string;
  aboutLabel3: string;
  
  stat1Val: string;
  stat1Lbl: string;
  stat2Val: string;
  stat2Lbl: string;
  stat3Val: string;
  stat3Lbl: string;

  proficienciesTitle: string;
  experienceTitle: string;
  experienceSubtitle: string;
  experienceContext: string;
  clickPromptExpand: string;
  clickPromptCollapse: string;
  experienceLinkedinCTA: string;
  industryTag: string;

  valeRole: string;
  valeDesc: string;
  valeSector: string;
  valeBullet1: string;
  valeBullet2: string;
  valeBullet3: string;
  valePeriod: string;
  valeLocation: string;

  triatraRole: string;
  triatraDesc: string;
  triatraSector: string;
  triatraBullet1: string;
  triatraBullet2: string;
  triatraBullet3: string;
  triatraPeriod: string;
  triatraLocation: string;

  projectsTitle: string;
  projectsSubtitle: string;
  projectsContext: string;
  viewDetails: string;

  skillsTitle: string;
  skillsSubtitle: string;
  skillsCategory1: string;
  skillsCategory2: string;
  skillsCategory3: string;
  chartHeading: string;
  chartFooter: string;

  achievementsTitle: string;
  achievementsSubtitle: string;
  achievementsContext: string;
  achie1Category: string;
  achie1Rank: string;
  achie1Sponsor: string;
  achie2Category: string;
  achie2Rank: string;
  achie2Sponsor: string;

  eduOrgTitle: string;
  eduOrgSubtitle: string;
  eduHeading: string;
  orgHeading: string;

  expectedGrad: string;
  labAssistant: string;
  tpsTraining: string;

  org1Title: string;
  org1Role: string;
  org1Date: string;
  org1Desc: string;

  org2Title: string;
  org2Role: string;
  org2Date: string;
  org2Desc: string;

  contactTitle: string;
  contactSubtitle: string;
  contactPrompt: string;
  footerTagline: string;
  backToTop: string;

  widgetTitle: string;
  widgetProcessName: string;
  widgetSubtitle: string;
  widgetTech: string;
  widgetStatus: string;
  competencyDesc: string;
  leaderNetworkLabel: string;

  axisData: string;
  axisScm: string;
  axisProcess: string;
  axisLean: string;
  axisReporting: string;
}

const translations: Record<"en" | "id", TranslationSet> = {
  en: {
    navAbout: "About",
    navExperience: "Experience",
    navProjects: "Projects",
    navSkills: "Competencies",
    navEdu: "Education & Leadership",
    navContact: "Let's Connect",

    roleTitle: "Industrial Engineer",
    badgeOpportunity: "Open to Opportunities",
    heroGreeting: "Diva Delvira.",
    heroSubText: "Industrial Engineering professional with hands-on logistics internship experience. Equipped to combine engineering discipline with data analytics to turn complex datasets into strategic operational insights.",
    ctaViewWork: "Explore Selected Portfolio",
    ctaContact: "Get in Touch",

    aboutTitle: "The Philosophy",
    aboutSubtitle: "Identity & Core Mission",
    aboutBio: "I am an Industrial Engineering professional dedicated to analyzing, designing, and optimizing complex operational systems. Utilizing applied data analytics, I focus on supply chain management (SCM) efficiency, eliminating process waste based on Lean methodologies, and formulating structured decisions driven by measurable performance metrics. Throughout my academic and internship journey, I have been trained to translate complex operational datasets into practical, tactical dashboard visualizations. I am deeply dedicated to delivering pragmatic solutions that bridge engineering discipline with the capabilities of modern analytical tools.",
    aboutLabel1: "INTELLIGENT OPERATION",
    aboutLabel2: "INDUSTRIAL ENGINEER | SCM SPECIALIST",
    aboutLabel3: "University Status",

    stat1Val: "100+",
    stat1Lbl: "Mentees & Students",
    stat2Val: "3.77",
    stat2Lbl: "Cumulative GPA / 4.00",
    stat3Val: "2+ Yr",
    stat3Lbl: "Analyze data",

    proficienciesTitle: "Key Strengths",
    experienceTitle: "Professional Experience",
    experienceSubtitle: "Industry Placements",
    experienceContext: "Detailed career timeline mapping analytical roles across Indonesian core industries.",
    clickPromptExpand: "Click card to expand achievements",
    clickPromptCollapse: "Click to collapse details",
    experienceLinkedinCTA: "Check Out my Linkedin Profile to Learn More About My Experience",
    industryTag: "Sector",

    valeRole: "Supply Chain Management Intern",
    valeDesc: "PT Vale Indonesia is a global nickel mining and smelting leader. By optimizing tracking transparency, I protected material availability across operations.",
    valeSector: "Nickel Mining & Processing",
    valeBullet1: "Developed an automated monitoring SCM dashboard using Advanced Excel and Power Query by integrating MRP, stock, PO, and vendor delivery timelines. This dropped SCM reporting cycles from 2 days to approximately 1 hour (96% efficiency).",
    valeBullet2: "Supported Inventory management reporting, tracking material criticality and escalating stock-out risks immediately to avoid mine site material disruption.",
    valeBullet3: "Conducted weekly status meetings and synchronized follow-up updates with Procurement and Logistics Traffic teams to guarantee on-time raw material arrival.",
    valePeriod: "Feb 2026 - Present",
    valeLocation: "East Luwu, South Sulawesi",

    triatraRole: "Warehouse & Distribution Intern",
    triatraDesc: "A member of Astra ecosystem and a subsidiary of United Tractors Pandu Engineering, dedicated to advancing businesses with heavy industry distribution.",
    triatraSector: "Heavy Equipment Distribution",
    triatraBullet1: "Analyzed 1 year+ multi-modal freight shipment history (air, land, sea freight) to identify Lead Time (LT) reduction opportunities and optimize dispatch routes.",
    triatraBullet2: "Conducted logistics vendor mapping and performed preliminary operational assessments to support major regional supply chain tender processes.",
    triatraBullet3: "Applied quality engineering structures, Root Cause Analysis (RCA), and vendor evaluation matrix criteria to optimize purchase pathways.",
    triatraPeriod: "Mar 2025 - Jun 2025",
    triatraLocation: "East Jakarta",

    projectsTitle: "Featured Case Studies",
    projectsSubtitle: "Operational Impact Realized",
    projectsContext: "Interactive case records linking directly to actual deliverables, verified files, and active presentation reels.",
    viewDetails: "View Reference Documentation",

    skillsTitle: "Core Competence Grid",
    skillsSubtitle: "Technical & Strategic Capabilities",
    skillsCategory1: "Enterprise Tools",
    skillsCategory2: "Supply Chain & Logistics Analysis",
    skillsCategory3: "Methodologies & Quality System",
    chartHeading: "Multi-Dimensional Skill Radar",
    chartFooter: "Competence values verified through academic milestones and active industrial internships.",

    achievementsTitle: "Honors & Achievements",
    achievementsSubtitle: "Performance Standards Recognized",
    achievementsContext: "Validated in National & Regional arenas",
    achie1Category: "National Competition — 2025",
    achie1Rank: "1st Place",
    achie1Sponsor: "Awarded by Markplus Institute in collaboration with PT Aneka Tambang (Antam).",
    achie2Category: "Regional Competition — 2025",
    achie2Rank: "2nd Place",
    achie2Sponsor: "Secured second place inside the South Sulawesi Regional competitive division.",

    eduOrgTitle: "Education & Leadership",
    eduOrgSubtitle: "Academic & Organizational Track",
    eduHeading: "Education",
    orgHeading: "Leadership & Community",

    expectedGrad: "Aug 2022 – Expected 2026",
    labAssistant: "Laboratory Assistant — Mentored 100+ first-year students in physics practicum, ensuring lab safety compliance & analytical precision.",
    tpsTraining: "Completed Intensive Toyota Production System (TPS) Training: JIT, Heijunka, Jidoka, Kaizen, and hands-on operational simulations.",

    org1Title: "HMTI FT-UH",
    org1Role: "Head of Entrepreneurship Division",
    org1Date: "Jul 2024 - Feb 2025",
    org1Desc: "Led end-to-end program structures to promote startup iterations, managing business development programs like INCREASE and START-UP.",
    org2Title: "ISLI CAMP",
    org2Role: "Event Organizing Committee",
    org2Date: "Aug 2024 - Oct 2024",
    org2Desc: "Member of the Event Organizing Committee for the Indonesia Supply Chain & Logistics Institute (ISLI) national training camp. Handled participant coordination, schedules, and event flows.",

    contactTitle: "Initiate Dialogue",
    contactSubtitle: "Opportunities & Inquiries",
    contactPrompt: "I am currently actively seeking career opportunities in operational roles where high-impact analytical capability is required.",
    footerTagline: "",
    backToTop: "UP",

    widgetTitle: "Decision Intelligence Engine",
    widgetProcessName: "STATISTICAL DEMAND FORECAST",
    widgetSubtitle: "94.2% Accuracy in Safety Stock optimization",
    widgetTech: "Python, SQL, & Power BI Pipeline",
    widgetStatus: "OPTIMIZED",
    competencyDesc: "Competence values verified through academic milestones and active industrial internships.",
    leaderNetworkLabel: "Leadership Network",

    axisData: "Data Analysis",
    axisScm: "Supply Chain Management",
    axisProcess: "Problem Solving",
    axisLean: "Continuous Improvement",
    axisReporting: "Reporting / BI"
  },
  id: {
    navAbout: "Tentang",
    navExperience: "Pengalaman",
    navProjects: "Proyek",
    navSkills: "Kompetensi",
    navEdu: "Edukasi & Kepemimpinan",
    navContact: "Hubungi Saya",

    roleTitle: "Teknik Industri",
    badgeOpportunity: "Terbuka untuk Peluang Kerja",
    heroGreeting: "Diva Delvira.",
    heroSubText: "Lulusan Teknik Industri yang memiliki pengalaman magang di bidang logistik. Mampu memadukan disiplin teknik dengan analisis data untuk menerjemahkan kumpulan data rumit menjadi wawasan operasional yang strategis.",
    ctaViewWork: "Telusuri Portofolio Pilihan",
    ctaContact: "Hubungi Saya",

    aboutTitle: "Filosofi Kerja",
    aboutSubtitle: "Identitas & Misi Utama",
    aboutBio: "Saya adalah seorang profesional Teknik Industri yang berdedikasi untuk menganalisis, merancang, dan mengoptimalkan sistem operasional yang kompleks. Menggunakan analisis data terapan, saya berfokus pada efisiensi manajemen rantai pasok (SCM), mengeliminasi waste proses berdasarkan metodologi Lean, dan merumuskan keputusan terstruktur yang didorong oleh metrik kinerja terukur. Sepanjang perjalanan akademis dan magang, saya telah terlatih untuk menerjemahkan kumpulan data operasional yang kompleks menjadi visualisasi dasbor taktis yang praktis. Saya berkomitmen penuh untuk memberikan solusi pragmatis yang menjembatani disiplin teknik dengan kemampuan alat analisis modern.",
    aboutLabel1: "OPERASI CERDAS",
    aboutLabel2: "Analis Rantai Pasok | SCM Specialist",
    aboutLabel3: "Status Universitas",

    stat1Val: "100+",
    stat1Lbl: "Mentees & Siswa",
    stat2Val: "3.77",
    stat2Lbl: "IPK Kumulatif / 4.00",
    stat3Val: "2+ Yr",
    stat3Lbl: "Analisis data",

    proficienciesTitle: "Kekuatan Utama",
    experienceTitle: "Pengalaman Profesional",
    experienceSubtitle: "Riwayat Penempatan Kerja",
    experienceContext: "Pemetaan garis waktu karier terperinci untuk peran analitis di berbagai industri utama Indonesia.",
    clickPromptExpand: "Klik kartu untuk melihat detail pencapaian",
    clickPromptCollapse: "Klik untuk menyembunyikan detail",
    experienceLinkedinCTA: "Kunjungi profil LinkedIn saya untuk mempelajari pengalaman saya lebih lanjut",
    industryTag: "Sektor",

    valeRole: "Magang Manajemen Rantai Pasok (SCM)",
    valeDesc: "PT Vale Indonesia adalah pemimpin global dalam pertambangan dan peleburan nikel. Dengan mengoptimalkan transparansi pelacakan, saya menjaga ketersediaan material di seluruh operasional.",
    valeSector: "Pertambangan & Pengolahan Nikel",
    valeBullet1: "Mengembangkan dasbor pemantauan otomatis SCM menggunakan Excel Lanjutan dan Power Query dengan mengintegrasikan MRP, tingkat stok, PO, dan lini masa pengiriman vendor. Hal ini memangkas siklus pelaporan SCM dari 2 hari menjadi sekitar 1 jam (efisiensi 96%).",
    valeBullet2: "Mendukung pelaporan manajemen inventaris, melacak kritisitas material, dan mengeskalasi risiko kekosongan stok secara instan untuk menghindari gangguan material di lokasi tambang.",
    valeBullet3: "Memimpin rapat status mingguan dan menyinkronkan pembaruan tindak lanjut dengan tim Pengadaan dan Lalu Lintas Logistik untuk menjamin kedatangan bahan baku tepat waktu.",
    valePeriod: "Feb 2026 - Sekarang",
    valeLocation: "Luwu Timur, Sulawesi Selatan",

    triatraRole: "Magang Pergudangan & Distribusi",
    triatraDesc: "Anggota dari ekosistem Astra dan anak perusahaan United Tractors Pandu Engineering, yang berdedikasi untuk memajukan bisnis melalui distribusi industri berat.",
    triatraSector: "Distribusi Alat Berat",
    triatraBullet1: "Menganalisis riwayat pengiriman kargo multi-moda selama lebih dari 1 tahun (udara, darat, laut) untuk mengidentifikasi peluang pemendekan Lead Time (LT) dan mengoptimalkan rute pengiriman.",
    triatraBullet2: "Melakukan pemetaan vendor logistik dan penilaian operasional awal untuk mendukung proses tender rantai pasok regional utama.",
    triatraBullet3: "Menerapkan struktur rekayasa kualitas, Root Cause Analysis (RCA), dan kriteria matriks evaluasi vendor untuk mengoptimalkan jalur pembelian rutin.",
    triatraPeriod: "Mar 2025 - Jun 2025",
    triatraLocation: "Jakarta Timur",

    projectsTitle: "Penyelesaian Kasus Pilihan",
    projectsSubtitle: "Dampak Operasional Nyata",
    projectsContext: "Catatan studi kasus interaktif yang terhubung langsung ke hasil kerja nyata, file terverifikasi, dan video presentasi aktif.",
    viewDetails: "Lihat Berkas Referensi",

    skillsTitle: "Grid Kompetensi Utama",
    skillsSubtitle: "Pengetahuan Teknis & Strategis",
    skillsCategory1: "Enterprise Tools",
    skillsCategory2: "Analisis Rantai Pasok & Logistik",
    skillsCategory3: "Metodologi & Sistem Kualitas",
    chartHeading: "Radar Keahlian Multi-Dimensi",
    chartFooter: "Nilai kompetensi yang divalidasi melalui pencapaian akademis dan magang industri aktif.",

    achievementsTitle: "Penghargaan & Prestasi",
    achievementsSubtitle: "Apresiasi Atas Standar Kinerja",
    achievementsContext: "Tervalidasi di Ajang Kompetisi Nasional & Regional",
    achie1Category: "Kompetisi Tingkat Nasional — 2025",
    achie1Rank: "Juara 1",
    achie1Sponsor: "Diberikan oleh Markplus Institute bekerja sama dengan PT Aneka Tambang (Antam).",
    achie2Category: "Kompetisi Tingkat Regional — 2025",
    achie2Rank: "Juara 2",
    achie2Sponsor: "Berhasil meraih posisi kedua dalam divisi kompetitif Regional Sulawesi Selatan.",

    eduOrgTitle: "Edukasi & Organisasi",
    eduOrgSubtitle: "Akademik & Pengalaman Memimpin",
    eduHeading: "Pendidikan",
    orgHeading: "Kepemimpinan & Komunitas",

    expectedGrad: "Agu 2022 – Angkatan 2026",
    labAssistant: "Asisten Laboratorium — Membimbing 100+ mahasiswa teknik dalam praktikum fisika dasar, mengawasi standar keselamatan dan presisi analisis dasar.",
    tpsTraining: "Selesai Mengikuti Pelatihan Intensif Toyota Production System (TPS): JIT, Heijunka, Jidoka, Kaizen, dan simulasi proses bisnis praktis.",

    org1Title: "HMTI FT-UH",
    org1Role: "Ketua Divisi Kewirausahaan",
    org1Date: "Jul 2024 - Feb 2025",
    org1Desc: "Memimpin struktur program ujung-ke-ujung untuk mempromosikan iterasi startup, mengelola program pengembangan bisnis mahasiswa seperti INCREASE dan START-UP.",
    org2Title: "ISLI CAMP",
    org2Role: "Panitia Pelaksana Acara",
    org2Date: "Agu 2024 - Okt 2024",
    org2Desc: "Bagian dari Divisi Acara untuk kamp pelatihan nasional Indonesia Supply Chain & Logistics Institute (ISLI). Berkontribusi dalam mengelola alur acara, koordinasi peserta, serta logistik kegiatan.",

    contactTitle: "Mulai Percakapan",
    contactSubtitle: "Peluang Kerja & Kolaborasi",
    contactPrompt: "Saat ini saya aktif mencari peluang karir di peran operasional yang membutuhkan kapabilitas analitis berdampak tinggi.",
    footerTagline: "",
    backToTop: "ATAS",

    widgetTitle: "Sistem Inteligensia Keputusan",
    widgetProcessName: "PERAMALAN PERMINTAAN STATISTIS",
    widgetSubtitle: "Akurasi 94.2% dalam optimasi stok pengaman",
    widgetTech: "Alur Data Python, SQL, & Power BI",
    widgetStatus: "TEROPTIMASI",
    competencyDesc: "Nilai kompetensi divalidasi melalui pencapaian akademis dan program magang industri.",
    leaderNetworkLabel: "Jejaring Kepemimpinan",

    axisData: "Analisis Data",
    axisScm: "Manajemen Rantai Pasok",
    axisProcess: "Pemecahan Masalah",
    axisLean: "Continuous Improvement",
    axisReporting: "Reporting / BI"
  }
};

export default function App() {
  const [lang, setLang] = useState<"en" | "id">(() => {
    const saved = localStorage.getItem("portfolio_lang");
    return (saved === "en" || saved === "id") ? saved : "en";
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
  const [expandVale, setExpandVale] = useState(false);
  const [expandTriatra, setExpandTriatra] = useState(false);
  const [activeProjectMetric, setActiveProjectMetric] = useState(0);
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

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
  const chartInstance = useRef<Chart | null>(null);

  const t = translations[lang];

  // Language persist
  useEffect(() => {
    localStorage.setItem("portfolio_lang", lang);
  }, [lang]);

  // Reset typing states on language change to prevent layout jumping bugs
  useEffect(() => {
    setTypingText("");
    setIsDeleting(false);
    setTypingIndex(0);
  }, [lang]);

  // Typing effect
  useEffect(() => {
    const titles = t.heroSubText ? [
      lang === "en" ? "Data-Driven Problem Solver" : "Pemecah Masalah Berbasis Data",
      lang === "en" ? "Process Improvement Enthusiast" : "Antusias Peningkatan Proses",
      lang === "en" ? "Supply Chain Management Enthusiast" : "Antusias Manajemen Rantai Pasok"
    ] : [];

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

      const sections = ["hero", "about", "experience", "projects", "skills", "edu", "contact"];
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
      { threshold: 0.1 }
    );

    document.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [lang]);

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
        isMobileScreen ? (lang === "en" ? "Problem Solving" : "Solusi Masalah") : t.axisProcess,
        isMobileScreen ? "Lean Systems" : t.axisLean,
        t.axisReporting
      ];

      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "radar",
          data: {
            labels: chartLabels,
            datasets: [
              {
                label: lang === "en" ? "Competency Score" : "Estimasi Skor Kompetensi",
                data: [92, 89, 95, 85, 85],
                backgroundColor: "rgba(201, 168, 76, 0.15)",
                borderColor: "rgba(201, 168, 76, 1)",
                pointBackgroundColor: "#0A1628",
                pointBorderColor: "#C9A84C",
                pointHoverBackgroundColor: "#C9A84C",
                pointHoverBorderColor: "#0A1628",
                borderWidth: 2,
                pointRadius: 4,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: isMobileScreen ? 14 : 6
            },
            scales: {
              r: {
                angleLines: {
                  color: "rgba(10, 22, 40, 0.1)"
                },
                grid: {
                  color: "rgba(10, 22, 40, 0.08)"
                },
                pointLabels: {
                  color: "#0A1628",
                  font: {
                    family: "Inter",
                    size: isMobileScreen ? 9 : 11,
                    weight: "normal"
                  }
                },
                ticks: {
                  display: false,
                  maxTicksLimit: 5
                },
                suggestedMin: 50,
                suggestedMax: 100
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: (context) => ` ${context.raw}%`
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [lang, t, windowWidth]);

  const toggleLang = () => setLang(prev => prev === "en" ? "id" : "en");

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
        message: contactMessage || ""
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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList: any[] = [];
      snapshot.forEach((docSnap) => {
        messagesList.push(docSnap.data());
      });
      // Sort messagesList chronologically descending (newest ID/timestamp first)
      messagesList.sort((a, b) => b.id.localeCompare(a.id));
      setCommsDb(messagesList);
    }, (error) => {
      console.error("Failed to fetch real-time updates from Firestore:", error);
    });

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
      setLoginError(lang === "en" ? "Invalid security credentials" : "Kredensial keamanan tidak valid");
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
    const confirmMsg = lang === "en"
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
    const rows = commsDb.map(m => [
      `"${m.id}"`,
      `"${m.timestamp}"`,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.contact.replace(/"/g, '""')}"`,
      `"${m.message.replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
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
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden selection:bg-brand-accent/20 selection:text-brand-primary">
      {/* Scroll Progress Bar */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* Primary Sticky Header */}
      <header className="fixed top-0 left-0 w-full z-40 px-2 py-2 sm:px-6 sm:py-6 md:px-12 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between lux-glass rounded-full px-2.5 py-1.5 sm:px-8 sm:py-4 pointer-events-auto">
          {/* Visual Logo / Overlapping Initials */}
          <button onClick={() => scrollToSection("hero")} className="flex items-center space-x-1.5 sm:space-x-4 group cursor-pointer text-left">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-serif font-bold text-sm sm:text-base transition-transform group-hover:scale-110 duration-300 shrink-0">
              <span className="absolute top-0 left-0 w-5.5 h-5.5 sm:w-7 sm:h-7 rounded bg-[#0A1628] text-white flex items-center justify-center border border-[#C9A84C]/30 z-10 shadow-sm leading-none pt-0.5">D</span>
              <span className="absolute bottom-0 right-0 w-5.5 h-5.5 sm:w-7 sm:h-7 rounded bg-[#C9A84C] text-[#0A1628] flex items-center justify-center border border-[#0A1628]/30 z-20 shadow-md leading-none pt-0.5 font-black">D</span>
            </div>
            <div>
              <span className="block font-serif text-xs min-[360px]:text-sm sm:text-base font-semibold text-brand-primary leading-tight">Diva Delvira</span>
              <span className="hidden sm:block text-[8px] font-mono tracking-widest text-[#C9A84C] uppercase">Personal Portfolio</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-10 pl-6">
            {[
              { id: "about", label: t.navAbout },
              { id: "experience", label: t.navExperience },
              { id: "projects", label: t.navProjects },
              { id: "skills", label: t.navSkills },
              { id: "edu", label: t.navEdu },
              { id: "contact", label: t.navContact }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`nav-link ${activeSection === item.id ? "nav-link-active text-[#0A1628]" : ""}`}
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
                    : "text-brand-primary opacity-60 hover:opacity-100"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("id")}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-mono tracking-wider transition-all duration-300 cursor-pointer ${
                  lang === "id" 
                    ? "bg-[#0A1628] text-white font-bold" 
                    : "text-brand-primary opacity-60 hover:opacity-100"
                }`}
              >
                ID
              </button>
            </div>

            <a 
              href="mailto:divakemur@gmail.com" 
              className="hidden sm:inline-flex px-6 py-2.5 bg-[#0A1628] text-white text-xs font-mono uppercase tracking-widest rounded-full hover:bg-[#C9A84C] transition-all duration-300 whitespace-nowrap shrink-0"
            >
              Mail
            </a>
            
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-1.5 sm:p-2.5 rounded-full bg-[#0A1628]/5 border border-brand-accent/20 text-[#0A1628] hover:bg-[#C9A84C]/10 transition-colors pointer-events-auto cursor-pointer shrink-0 animate-fade-in"
              aria-label="Toggle Menu"
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
            className="fixed top-[82px] left-3 right-3 z-40 lg:hidden rounded-2xl lux-glass p-5 border border-white/60 shadow-2xl flex flex-col space-y-5"
          >
            <nav className="flex flex-col space-y-3">
              {[
                { id: "about", label: t.navAbout },
                { id: "experience", label: t.navExperience },
                { id: "projects", label: t.navProjects },
                { id: "skills", label: t.navSkills },
                { id: "edu", label: t.navEdu },
                { id: "contact", label: t.navContact }
              ].map(item => (
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
                href="mailto:divakemur@gmail.com" 
                className="w-full py-3.5 bg-[#0A1628] text-white hover:bg-[#C9A84C] hover:text-[#0A1628] text-center font-mono text-xs uppercase tracking-widest rounded-2xl transition-all duration-300"
              >
                Email Diva Delvira
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SECTION 1: HERO --- */}
      <section id="hero" className="min-h-screen flex items-center pt-24 sm:pt-32 pb-12 sm:pb-16 md:pb-24 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          <div className="col-span-1 lg:col-span-8 space-y-6 sm:space-y-8 md:space-y-10">
            <div className="inline-flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-1.5 rounded-full bg-brand-soft/50 border border-brand-accent/20 text-[10px] font-mono uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#0A1628]">
              <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-ping" />
              <span>{t.badgeOpportunity}</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl min-[360px]:text-4xl sm:text-6xl lg:text-[7rem] font-serif leading-[0.95] tracking-tighter text-brand-primary">
                {t.heroGreeting}
              </h1>
              {/* Dynamic typing cursor element */}
              <div className="min-h-[3rem] sm:h-12 flex items-center">
                <p className="text-base sm:text-xl md:text-3xl font-serif italic text-[#C9A84C] font-light">
                  {typingText}<span className="inline-block w-[3px] h-6 bg-[#C9A84C] ml-1 animate-pulse" />
                </p>
              </div>
            </div>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 font-light max-w-2xl leading-relaxed text-justify">
              {t.heroSubText}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => scrollToSection("experience")}
                className="w-full sm:w-auto text-center px-4 min-[380px]:px-6 sm:px-10 py-3.5 sm:py-5 bg-[#0A1628] text-white text-xs font-mono uppercase tracking-[0.2em] rounded-full hover:bg-[#C9A84C] hover:text-[#0A1628] transition-all duration-500 shadow-xl shadow-brand-primary/10 cursor-pointer sm:whitespace-nowrap leading-relaxed"
              >
                {t.ctaViewWork}
              </button>
              <button 
                onClick={() => scrollToSection("contact")}
                className="w-full sm:w-auto text-center px-4 min-[380px]:px-6 sm:px-10 py-3.5 sm:py-5 border border-brand-primary/20 text-[#0A1628] text-xs font-mono uppercase tracking-[0.2em] rounded-full hover:border-[#0A1628] hover:bg-brand-primary/5 transition-all duration-500 cursor-pointer sm:whitespace-nowrap leading-relaxed"
              >
                {t.ctaContact}
              </button>
            </div>
          </div>

          {/* VERIFIED PROJECTS INSIGHT PANEL */}
          <div className="col-span-1 lg:col-span-4 space-y-8 mt-8 lg:mt-0 relative max-w-full overflow-hidden">
            <div className="absolute inset-0 bg-[#C9A84C]/5 blur-[80px] -z-10 rounded-full transform scale-100 sm:scale-150" />
            
            <div className="lux-glass rounded-[32px] p-4 min-[380px]:p-6 sm:p-8 border border-white/60 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-brand-primary/5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-semibold">
                  {lang === "en" ? "VERIFIED PROJECTS METRICS" : "METRIK PROYEK TERVERIFIKASI"}
                </span>
                <Sparkles size={16} className="text-[#C9A84C]" />
              </div>
              
              {/* Tab Selector Links */}
              <div className="grid grid-cols-4 gap-1.5 border-b border-brand-primary/5 pb-4">
                {[
                  { label: "P1", name: "SCM" },
                  { label: "P2", name: "MSA" },
                  { label: "P3", name: "TENDER" },
                  { label: "P4", name: "LEAN" }
                ].map((tab, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveProjectMetric(idx)}
                    className={`py-1.5 px-0.5 text-center rounded-lg text-[8px] min-[320px]:text-[9px] min-[360px]:text-[10px] font-mono tracking-wider transition-all duration-300 cursor-pointer ${
                      activeProjectMetric === idx 
                        ? "bg-[#0A1628] text-white font-bold animate-pulse" 
                        : "bg-brand-primary/5 text-brand-primary hover:bg-[#C9A84C]/10"
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Displayed Interactive Metric Content */}
              <div className="space-y-4 min-h-[140px] flex flex-col justify-between">
                {activeProjectMetric === 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-mono">
                      VALE — AUTOMATION DASHBOARD
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-4xl font-serif font-bold text-brand-primary">96%</span>
                      <span className="text-xs text-emerald-600 font-mono font-semibold">
                        {lang === "en" ? "Time Saved" : "Pangkas Waktu"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-brand-soft rounded-full overflow-hidden">
                      <div className="h-full bg-[#C9A84C] w-[96%]" />
                    </div>
                    <p className="text-xs text-gray-600 font-sans leading-relaxed text-justify mt-2 font-light">
                      {lang === "en" 
                        ? "Advanced Excel/Power Query dashboard reduced supply chain monitoring reporting from 2 days down to 1 hour."
                        : "Dasbor Excel/Power Query memangkas siklus pelaporan pengawasan SCM dari 2 hari menjadi 1 jam saja."}
                    </p>
                  </div>
                )}

                {activeProjectMetric === 1 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-mono">
                      {lang === "en" ? "JAPFA — MSA" : "JAPFA — MSA"}
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-serif font-bold text-brand-primary">2.91%</span>
                      <span className="text-xs text-emerald-600 font-mono font-semibold">%GRR</span>
                    </div>
                    <div className="h-1.5 bg-brand-soft rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary w-[91%]" />
                    </div>
                    <p className="text-xs text-gray-600 font-sans leading-relaxed text-justify mt-2 font-light">
                      {lang === "en" 
                        ? "Crossed Gage R&R ANOVA statistical tests validated extreme precision in raw material testing instruments."
                        : "Uji ANOVA Crossed Gage R&R memvalidasi presisi maksimal instrumen pengujian kadar air jagung bahan baku pakan."}
                    </p>
                  </div>
                )}

                {activeProjectMetric === 2 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-mono">
                      {lang === "en" ? "TRIATRA — VENDOR EVALUATION" : "TRIATRA — VENDOR EVALUATION"}
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-serif font-bold text-brand-primary">
                        {lang === "en" ? "Tender Preparation" : "Persiapan Tender"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-brand-soft rounded-full overflow-hidden">
                      <div className="h-full bg-[#C9A84C] w-[100%]" />
                    </div>
                    <p className="text-xs text-gray-600 font-sans leading-relaxed text-justify mt-2 font-light">
                      {lang === "en"
                        ? "Evaluating logistics vendors and structuring comprehensive scoring metrics to optimize new tender processes."
                        : "Mengevaluasi performa vendor logistik dan menyusun metrik penilaian komprehensif untuk mempermudah proses seleksi tender baru."}
                    </p>
                  </div>
                )}

                {activeProjectMetric === 3 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-mono">
                      {lang === "en" ? "CAPSTONE PROJECT — SMART FEED" : "CAPSTONE PROJECT — SMART FEED"}
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-serif font-bold text-brand-primary">Rp7.000 /100g</span>
                    </div>
                    <div className="h-1.5 bg-brand-soft rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary w-[85%]" />
                    </div>
                    <p className="text-xs text-gray-600 font-sans leading-relaxed text-justify mt-2 font-light">
                      {lang === "en"
                        ? "Utilized Lean Manufacturing and Production Planning to convert 'ampas tahu' into highly optimized affordable product feed."
                        : "Memaksimalkan Lean & Perencanaan Produksi mengubah ampas/limbah tahu menjadi pakan bernutrisi tinggi alternatif murah."}
                    </p>
                  </div>
                )}
                
                {/* Visual Label Indicator */}
                <div className="pt-2 border-t border-brand-primary/5 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                  <span>{lang === "en" ? "Primary Tools" : "Alat Kerja Utama"}</span>
                  <span className="text-[#C9A84C] font-semibold text-right">
                    {activeProjectMetric === 0 && "Excel, Power Query"}
                    {activeProjectMetric === 1 && "SPSS, Minitab"}
                    {activeProjectMetric === 2 && "Root Cause Analysis, Problem Solving"}
                    {activeProjectMetric === 3 && "Lean, Production"}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 2: ABOUT / PHILOSOPHY --- */}
      <section id="about" className="scroll-mt-24 sm:scroll-mt-32 py-12 sm:py-16 md:py-32 px-4 sm:px-8 md:px-12 bg-[#F3EFE6] border-y border-brand-accent/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 relative">
            
            {/* BIO CONTENT (Left Column) */}
            <div className="col-span-1 lg:col-span-8 space-y-8">
              <div className="reveal-on-scroll space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="h-px w-8 bg-[#C9A84C]" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C]">{t.aboutSubtitle}</span>
                </div>
                <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif text-brand-primary font-light italic">
                  {t.aboutTitle}
                </h2>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed font-light text-justify whitespace-pre-line">
                  {t.aboutBio}
                </p>

                {/* LANGUAGE SKILLS (Bar Chart visual) */}
                <div className="pt-8 border-t border-brand-primary/10 space-y-5">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full" />
                    <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C9A84C] font-bold">
                      {lang === "en" ? "Language Proficiency" : "Keahlian Bahasa"}
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Indonesian (Native) */}
                    <div className="p-4 bg-white/45 backdrop-blur-sm rounded-2xl border border-brand-soft space-y-3">
                      <div className="flex justify-between items-center text-xs font-mono text-brand-primary">
                        <span className="font-semibold">{lang === "en" ? "Indonesian" : "Bahasa Indonesia"}</span>
                        <span className="text-[#C9A84C] font-semibold">{lang === "en" ? "Native Speaker" : "Penutur Asli"}</span>
                      </div>
                      <div className="h-2 bg-brand-soft/60 rounded-full overflow-hidden">
                        <div className="h-full bg-[#C9A84C] w-full rounded-full" />
                      </div>
                    </div>

                    {/* English (B2 / Upper-Intermediate) */}
                    <div className="p-4 bg-white/45 backdrop-blur-sm rounded-2xl border border-brand-soft space-y-3">
                      <div className="flex justify-between items-center text-xs font-mono text-brand-primary">
                        <span className="font-semibold">{lang === "en" ? "English" : "Bahasa Inggris"}</span>
                        <span className="text-brand-primary font-semibold">B2 (Upper Intermediate)</span>
                      </div>
                      <div className="h-2 bg-brand-soft/60 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0A1628] w-[85%] rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* PERSISTENT STAT CARDS (Right Column) */}
            <div className="col-span-1 lg:col-span-4 grid grid-cols-1 min-[480px]:grid-cols-3 lg:grid-cols-1 gap-2.5 min-[380px]:gap-3 sm:gap-6 justify-center">
              <div className="p-2.5 min-[380px]:p-4 sm:p-6 bg-white border border-brand-soft/20 rounded-2xl shadow-sm space-y-1 sm:space-y-2 text-center lg:text-left hover:shadow-lg transition-all duration-300">
                <p className="text-xl sm:text-3xl font-serif font-bold text-[#0A1628]">{t.stat1Val}</p>
                <p className="text-[8px] min-[360px]:text-[10px] sm:text-xs font-semibold text-[#C9A84C] uppercase tracking-wider leading-snug">{t.stat1Lbl}</p>
              </div>
              <div className="p-2.5 min-[380px]:p-4 sm:p-6 bg-white border border-brand-soft/20 rounded-2xl shadow-sm space-y-1 sm:space-y-2 text-center lg:text-left hover:shadow-lg transition-all duration-300">
                <p className="text-xl sm:text-3xl font-serif font-bold text-[#0A1628]">{t.stat2Val}</p>
                <p className="text-[8px] min-[360px]:text-[10px] sm:text-xs font-semibold text-[#C9A84C] uppercase tracking-wider leading-snug">{t.stat2Lbl}</p>
              </div>
              <div className="p-2.5 min-[380px]:p-4 sm:p-6 bg-[#0A1628] border border-white/5 rounded-2xl shadow-md space-y-1 sm:space-y-2 text-center lg:text-left hover:shadow-xl transition-all duration-300 text-white">
                <p className="text-xl sm:text-3xl font-serif font-bold text-[#C9A84C]">{t.stat3Val}</p>
                <p className="text-[8px] min-[360px]:text-[10px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wider leading-snug">{t.stat3Lbl}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 3: WORK EXPERIENCE WITH COLLAPSIBLE CARDS --- */}
      <section id="experience" className="scroll-mt-24 sm:scroll-mt-32 py-12 sm:py-16 md:py-32 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="col-span-1 lg:col-span-4">
            <div className="lg:sticky lg:top-32 space-y-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C]">{t.experienceSubtitle}</span>
              <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif italic text-brand-primary font-light">
                {t.experienceTitle}
              </h2>
              <p className="text-gray-500 font-light leading-relaxed max-w-md text-left">
                {t.experienceContext}
              </p>
              <a 
                href="https://www.linkedin.com/in/diva-delvira-ba9874294/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 bg-[#0A1628] text-center rounded-2xl border border-[#C9A84C]/25 text-xs font-mono text-white hover:bg-[#C9A84C] hover:text-[#0A1628] transition-all duration-300 shadow-md cursor-pointer uppercase tracking-wider"
              >
                {t.experienceLinkedinCTA} →
              </a>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-8 space-y-12">
            
            {/* EXPERIENCE CARD 1: PT VALE INDONESIA */}
            <div 
              onClick={() => setExpandVale(!expandVale)}
              className="bg-white border border-brand-soft/40 p-4 min-[380px]:p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 group"
            >
              <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center pb-6 border-b border-brand-soft/50 mb-6">
                <div>
                  <span className="inline-block px-3 py-1 bg-brand-soft text-[9px] font-mono uppercase text-[#0A1628] rounded-full mb-2">
                    PT Vale Indonesia Tbk.
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-semibold text-brand-primary">{t.valeRole}</h3>
                </div>
                <div className="text-left md:text-right mt-4 md:mt-0 space-y-1">
                  <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">{t.valePeriod}</p>
                  <p className="text-[10px] text-[#C9A84C] uppercase tracking-tighter flex items-center md:justify-end">
                    <MapPin size={10} className="mr-1" /> {t.valeLocation}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed italic mb-4 max-w-3xl text-justify">
                {t.valeDesc}
              </p>
              <div className="flex items-center space-x-2 text-[10px] font-mono uppercase text-[#C9A84C] mb-6">
                <span>{t.industryTag}: {t.valeSector}</span>
              </div>

              {/* Expander Trigger */}
              <div className="flex justify-between items-center text-xs text-[#0A1628]/60 font-mono uppercase tracking-widest pt-2 border-t border-brand-soft/40">
                <span>{expandVale ? t.clickPromptCollapse : t.clickPromptExpand}</span>
                {expandVale ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {/* Collapsed Bullet Content */}
              <AnimatePresence>
                {expandVale && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mt-6"
                  >
                    <ul className="space-y-4 pt-4 border-t border-brand-soft/20 text-sm text-gray-600">
                      <li className="flex items-start text-justify">
                        <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full mt-2 mr-3 shrink-0" />
                        <span>{t.valeBullet1}</span>
                      </li>
                      <li className="flex items-start text-justify">
                        <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full mt-2 mr-3 shrink-0" />
                        <span>{t.valeBullet2}</span>
                      </li>
                      <li className="flex items-start text-justify">
                        <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full mt-2 mr-3 shrink-0" />
                        <span>{t.valeBullet3}</span>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* EXPERIENCE CARD 2: PT TRIATRA SINERGIA PRATAMA */}
            <div 
              onClick={() => setExpandTriatra(!expandTriatra)}
              className="bg-white border border-brand-soft/40 p-4 min-[380px]:p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 group"
            >
              <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center pb-6 border-b border-brand-soft/50 mb-6">
                <div>
                  <span className="inline-block px-3 py-1 bg-brand-soft text-[9px] font-mono uppercase text-[#0A1628] rounded-full mb-2">
                    PT Triatra Sinergia Pratama
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-semibold text-brand-primary">{t.triatraRole}</h3>
                </div>
                <div className="text-left md:text-right mt-4 md:mt-0 space-y-1">
                  <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">{t.triatraPeriod}</p>
                  <p className="text-[10px] text-[#C9A84C] uppercase tracking-tighter flex items-center md:justify-end">
                    <MapPin size={10} className="mr-1" /> {t.triatraLocation}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed italic mb-4 max-w-3xl text-justify">
                {t.triatraDesc}
              </p>
              <div className="flex items-center space-x-2 text-[10px] font-mono uppercase text-[#C9A84C] mb-6">
                <span>{t.industryTag}: {t.triatraSector}</span>
              </div>

              {/* Expander Trigger */}
              <div className="flex justify-between items-center text-xs text-[#0A1628]/60 font-mono uppercase tracking-widest pt-2 border-t border-brand-soft/40">
                <span>{expandTriatra ? t.clickPromptCollapse : t.clickPromptExpand}</span>
                {expandTriatra ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {/* Collapsed Bullet Content */}
              <AnimatePresence>
                {expandTriatra && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mt-6"
                  >
                    <ul className="space-y-4 pt-4 border-t border-brand-soft/20 text-sm text-gray-600">
                      <li className="flex items-start text-justify">
                        <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full mt-2 mr-3 shrink-0" />
                        <span>{t.triatraBullet1}</span>
                      </li>
                      <li className="flex items-start text-justify">
                        <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full mt-2 mr-3 shrink-0" />
                        <span>{t.triatraBullet2}</span>
                      </li>
                      <li className="flex items-start text-justify">
                        <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full mt-2 mr-3 shrink-0" />
                        <span>{t.triatraBullet3}</span>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 4: PROJECTS / CASE STUDIES --- */}
      <section id="projects" className="scroll-mt-24 sm:scroll-mt-32 py-16 md:py-32 px-4 sm:px-8 md:px-12 bg-white border-y border-brand-soft/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-20">
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#C9A84C]">{t.projectsSubtitle}</span>
              <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif italic text-brand-primary font-light">
                {t.projectsTitle}
              </h2>
            </div>
            <p className="text-gray-500 font-light max-w-md mt-4 md:mt-0 text-justify">
              {t.projectsContext}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
            {[
              {
                title: "Improvement Monitoring of Priority Materials",
                cat: "Excel & Power Query Integration",
                desc: lang === "en" 
                  ? "Faced with high rates of material stock-outs due to a lack of integrated inventory and procurement visibility across the supply chain, I developed a data-driven automated monitoring dashboard using Excel and Power Query to track inventory risks, order status, and vendor delivery performance in real time. This initiative successfully reduced operational monitoring time from 6–7 hours to less than 1 hour and facilitated more proactive and targeted decision-making."
                  : "Menghadapi tingginya tingkat stock-out material akibat kurangnya integrasi visibilitas inventaris dan pengadaan di seluruh rantai pasok, saya mengembangkan dasbor pemantauan otomatis berbasis data menggunakan Excel dan Power Query untuk melacak risiko inventaris, status pesanan, dan kinerja pengiriman vendor secara real-time. Inisiatif ini berhasil memangkas waktu pemantauan operasional dari 6–7 jam menjadi kurang dari 1 jam serta memfasilitasi pengambilan keputusan yang lebih proaktif dan terarah.",
                link: "https://drive.google.com/file/d/1lcocQxpyzs46adu8bAI8jhrZHWiOQf5G/view?usp=drive_link",
                tags: ["dashboard", "automation", "excel", "powerquery"]
              },
              {
                title: "Vendor Selection & Tender Preparation",
                cat: "Multi-Modal Freight Analytics",
                desc: lang === "en" 
                  ? "The company has several high-volume shipping routes that lack binding contracts, clear performance metrics, and SLA (Service Level Agreement) standards for forwarding vendors. I designed a comprehensive trial tender selection mechanism and vendor evaluation system using a QCD (Quality, Cost, Delivery) assessment matrix. This implementation resulted in a standardized monthly vendor performance monitoring system, complete with a penalty scheme based on a percentage of logistics costs to strictly minimize delivery delays."
                  : "Perusahaan memiliki beberapa rute pengiriman volume tinggi yang belum memiliki kontrak mengikat, metrik kinerja yang jelas, serta standar SLA untuk vendor forwarding. Saya merancang mekanisme seleksi tender uji coba komprehensif dan sistem evaluasi vendor menggunakan matriks penilaian QCD. Implementasi ini menghasilkan sistem pemantauan kinerja bulanan vendor yang terstandarisasi, lengkap dengan skema penalti berbasis persentase biaya logistik untuk meminimalkan keterlambatan pengiriman.",
                link: "https://drive.google.com/file/d/1kgZ0OOe5Ltb_9DJt55rY_HsGd6tW4kd1/view?usp=drive_link",
                tags: ["analytics", "routing", "vendormanagement", "logistics", "traffic"]
              },
              {
                title: "Measurement System Analysis (MSA)",
                cat: "Statistical Quality Engineering",
                desc: lang === "en"
                  ? "To determine the suitability of raw materials for animal feed, the company needs to evaluate the reliability of the Grain Moisture Tester (PM-410) used to control the moisture content of corn. I performed a Measurement System Analysis (MSA) using the Crossed Gage R&R (ANOVA) statistical test approach to analyze and separate the sources of variation between the measuring instrument, the operator, and the test samples. This analysis validated that the instrument has excellent precision with a %GRR value of 2.91%, proving conclusively that the variation in readings stems purely from differences in sample characteristics and is not due to human error or instrument inaccuracy."
                  : "Untuk menentukan kelayakan bahan baku pakan ternak, perusahaan perlu mengevaluasi keandalan Grain Moisture Tester (PM-410) yang digunakan untuk mengontrol kadar air jagung. Saya melakukan Analisis Sistem Pengukuran (MSA) menggunakan pendekatan uji statistik Crossed Gage R&R (ANOVA) untuk menganalisis dan memisahkan sumber variasi antara alat ukur, operator, dan sampel uji. Analisis ini memvalidasi bahwa instrumen memiliki presisi luar biasa dengan nilai %GRR sebesar 2,91%, membuktikan secara konklusif bahwa variasi pembacaan murni berasal dari perbedaan karakteristik sampel dan bukan karena kesalahan manusia atau ketidakakuratan instrumen.",
                link: "https://drive.google.com/file/d/1aK1MC8T_nsP4UtgSSnbw4AuBQmY3N0zr/view",
                tags: ["SPSS", "Minitab", "qualitycontrol"]
              },
              {
                title: "SMART FEED Capstone Project",
                cat: "Product Design & Lean Systems",
                desc: lang === "en"
                  ? "The high cost of commercial fish feed accounts for 60–70% of fish farmers’ operating expenses, while industrial waste such as tofu pulp has not yet been fully utilized. I integrated the principles of Production Planning and Lean Manufacturing to design and develop a high-nutrient, environmentally friendly alternative fish feed product made from tofu residue. This product successfully reduced production costs, allowing it to be sold at a very affordable price (Rp7,000 per 100 grams), and was empirically proven to maintain a positive growth trend in tilapia during a three-week monitoring period."
                  : "Tingginya biaya pakan ikan komersial menyumbang 60–70% dari pengeluaran operasional pembudidaya ikan, sementara limbah industri seperti ampas tahu belum dimanfaatkan secara optimal. Saya mengintegrasikan prinsip Perencanaan Produksi dan Lean Manufacturing untuk merancang dan mengembangkan produk pakan ikan alternatif bernutrisi tinggi dan ramah lingkungan dari ampas tahu. Produk ini sukses mengurangi biaya produksi, sehingga dapat dijual dengan harga terjangkau (Rp7.000 per 100 gram), dan terbukti secara empiris menjaga tren pertumbuhan positif pada ikan nila selama periode pemantauan tiga minggu.",
                link: "https://drive.google.com/file/d/1ljOZ9QJ38fZ05cG0M57KJ3gqG0auZWXy/view",
                tags: ["designproduct", "leanmanufacturing", "productionplanning"]
              }
            ].map((p, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -6 }}
                className="group flex flex-col justify-between bg-[#F8F6F1]/50 border border-brand-soft/50 rounded-3xl p-4 min-[380px]:p-6 sm:p-8 hover:shadow-xl hover:shadow-[#C9A84C]/5 transition-all duration-500 hover:border-brand-accent/40"
              >
                <div className="space-y-6">
                  <span className="inline-block text-[9px] font-mono uppercase tracking-[0.2em] text-[#C9A84C] bg-[#F3EFE6] px-3 py-1 rounded-full">
                    {p.cat}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif text-brand-primary group-hover:italic transition-all duration-300 leading-tight">
                    {p.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-light text-justify">
                    {p.desc}
                  </p>
                </div>
                
                <div className="pt-8 mt-8 border-t border-brand-soft/65 flex flex-col space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-mono text-gray-400">#{tag}</span>
                    ))}
                  </div>
                  <a 
                    href={p.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center space-x-2 text-[#0A1628] hover:text-[#C9A84C] font-mono text-xs uppercase tracking-wider transition-colors duration-300"
                  >
                    <span>{t.viewDetails}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 5: COMPETENCY MATRIX / RADAR CHART --- */}
      <section id="skills" className="scroll-mt-24 sm:scroll-mt-32 py-12 sm:py-16 md:py-32 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          <div className="col-span-1 lg:col-span-6 space-y-8 md:space-y-12">
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C]">{t.skillsSubtitle}</span>
              <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif italic text-brand-primary font-light">
                {t.skillsTitle}
              </h2>
            </div>

            {/* Competency Group 1: Tools */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase text-gray-400 tracking-widest">{t.skillsCategory1}</h4>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {["Power BI", "Microsoft Excel", "Minitab", "SPSS", "Canva", "SAP"].map(skill => (
                  <span key={skill} className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white border border-brand-soft/50 text-xs font-mono rounded-full text-brand-primary hover:border-brand-accent transition-colors duration-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Competency Group 2: SCM */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase text-gray-400 tracking-widest">{t.skillsCategory2}</h4>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {["Inventory Analysis", "Vendor Evaluation", "MRP Control", "Lead Time Optimization", "Forecast Modeling"].map(skill => (
                  <span key={skill} className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#0A1628] text-white text-xs font-mono rounded-full hover:bg-brand-accent transition-colors duration-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Competency Group 3: Methodologies */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase text-[#C9A84C] tracking-widest">{t.skillsCategory3}</h4>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {["Lean Manufacturing", "Measurement System Analysis", "Toyota Production System", "Kaizen / Continuous Improvement", "Just In Time (JIT)", "Root Cause Analysis (RCA)"].map(skill => (
                  <span key={skill} className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#F3EFE6] text-brand-primary border border-[#C9A84C]/20 text-xs font-mono rounded-full hover:border-[#C9A84C] transition-colors duration-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Core Radar Canvas */}
          <div className="col-span-1 lg:col-span-6 border border-brand-soft/40 bg-[#F3EFE6]/30 p-4 min-[380px]:p-6 sm:p-8 rounded-[36px] flex flex-col items-center mt-6 lg:mt-0 w-full overflow-x-hidden">
            <h4 className="text-sm font-mono uppercase text-[#C9A84C] tracking-[0.2em] mb-8 text-center">{t.chartHeading}</h4>
            <div className="w-full aspect-square relative max-w-[260px] min-[380px]:max-w-[310px] sm:max-w-[420px]">
              <canvas ref={chartRef} id="competencyChart" className="w-full h-full" style={{ width: "100%" }} />
            </div>
            <p className="text-[11px] text-gray-400 text-center font-mono mt-8 leading-relaxed max-w-sm">
              {t.chartFooter}
            </p>
          </div>

        </div>
      </section>

      {/* --- SECTION 6: TOURNAMENTS & RECOGNITIONS --- */}
      <section className="py-16 md:py-32 px-4 sm:px-8 md:px-12 bg-brand-primary text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20 space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-brand-soft">{t.achievementsSubtitle}</span>
            <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif italic font-light text-brand-soft">
              {t.achievementsTitle}
            </h2>
            <p className="text-xs text-white/50 font-mono tracking-widest uppercase">{t.achievementsContext}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
            {/* Cert Card 1 */}
            <div className="p-4 min-[380px]:p-6 sm:p-10 border border-white/10 rounded-[32px] bg-white/[0.02] flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8 items-start relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Trophy size={120} />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-brand-accent/20 text-brand-accent flex items-center justify-center shrink-0">
                <Award size={28} />
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-soft/60">{t.achie1Category}</span>
                <h3 className="text-2xl sm:text-3xl font-serif text-white">{t.achie1Rank}</h3>
                <p className="text-lg font-serif italic text-brand-soft">Content Marketing Competition 2025 — Manado</p>
                <div className="h-px bg-white/10" />
                <p className="text-sm text-white/60 font-light">{t.achie1Sponsor}</p>
              </div>
            </div>

            {/* Cert Card 2 */}
            <div className="p-4 min-[380px]:p-6 sm:p-10 border border-white/10 rounded-[32px] bg-white/[0.02] flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8 items-start relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Trophy size={120} />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-brand-accent/20 text-brand-accent flex items-center justify-center shrink-0">
                <Award size={28} />
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-soft/60">{t.achie2Category}</span>
                <h3 className="text-3xl font-serif text-white">{t.achie2Rank}</h3>
                <p className="text-lg font-serif italic text-brand-soft">Astra Motor Business Case Competition</p>
                <div className="h-px bg-white/10" />
                <p className="text-sm text-white/60 font-light">{t.achie2Sponsor}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 7: EDUCATION & ORGANIZATIONAL --- */}
      <section id="edu" className="scroll-mt-24 sm:scroll-mt-32 py-16 md:py-32 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 xl:gap-20">
          
          {/* Left: Edu info */}
          <div className="space-y-8 md:space-y-12">
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C]">{t.eduOrgSubtitle}</span>
              <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif italic text-brand-primary font-light">
                {t.eduHeading}
              </h2>
            </div>

            {/* Campus 1 */}
            <a 
              href="https://www.instagram.com/hasanuddin_univ/"
              target="_blank"
              rel="noopener noreferrer"
              className="group/edu p-4 min-[380px]:p-6 sm:p-8 bg-white border border-brand-soft rounded-[30px] flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-300 cursor-pointer relative"
            >
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-300 group-hover/edu:text-[#C9A84C] transition-colors duration-300">
                <ExternalLink size={14} />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center shrink-0">
                <GraduationCap size={24} />
              </div>
              <div className="space-y-3 w-full">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-semibold">UNHAS</span>
                <h4 className="text-2xl font-serif font-semibold text-brand-primary leading-tight">Universitas Hasanuddin</h4>
                <p className="text-sm italic font-serif text-[#C9A84C]">{lang === "en" ? "Bachelor of Industrial Engineering" : "S1 Teknik Industri"}</p>
                <p className="text-xs font-mono text-gray-500">{t.expectedGrad} · GPA 3.77 / 4.00</p>
                
                <div className="h-px bg-brand-soft/50 my-2 w-full" />
                
                <ul className="space-y-2 text-xs text-gray-500 leading-relaxed font-light text-justify">
                  <li>• {t.labAssistant}</li>
                  <li>• {t.tpsTraining}</li>
                </ul>
              </div>
            </a>
          </div>

          {/* Right: Org Info */}
          <div className="space-y-8 md:space-y-12">
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C]">{t.leaderNetworkLabel}</span>
              <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-serif italic text-brand-primary font-light">
                {t.orgHeading}
              </h2>
            </div>

            {/* Org position 1: HMTI FT-UH */}
            <a 
              href="https://www.instagram.com/p/DAjD8sDzF8M/"
              target="_blank"
              rel="noopener noreferrer"
              className="group/org1 p-4 min-[380px]:p-6 sm:p-8 bg-white border border-brand-soft rounded-[30px] flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-300 cursor-pointer relative"
            >
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-300 group-hover/org1:text-[#C9A84C] transition-colors duration-300">
                <ExternalLink size={14} />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
              <div className="space-y-2 w-full">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-semibold">HMTI FT-UH</span>
                <h4 className="text-lg sm:text-xl md:text-2xl font-serif font-semibold text-brand-primary leading-tight">{t.org1Role}</h4>
                <p className="text-xs font-mono text-gray-500">{t.org1Date}</p>
                <p className="text-sm text-gray-600 font-light leading-relaxed text-justify">
                  {t.org1Desc}
                </p>
              </div>
            </a>

            {/* Org position 2: ISLI CAMP */}
            <a 
              href="https://www.instagram.com/islicamp2024/"
              target="_blank"
              rel="noopener noreferrer"
              className="group/org2 p-4 min-[380px]:p-6 sm:p-8 bg-white border border-brand-soft rounded-[30px] flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-300 cursor-pointer relative"
            >
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-300 group-hover/org2:text-[#C9A84C] transition-colors duration-300">
                <ExternalLink size={14} />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center shrink-0">
                <Layout size={24} />
              </div>
              <div className="space-y-2 w-full">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-semibold">ISLI CAMP</span>
                <h4 className="text-lg sm:text-xl md:text-2xl font-serif font-semibold text-brand-primary leading-tight">{t.org2Role}</h4>
                <p className="text-xs font-mono text-gray-500">{t.org2Date}</p>
                <p className="text-sm text-gray-600 font-light leading-relaxed text-justify">
                  {t.org2Desc}
                </p>
              </div>
            </a>

            {/* Org position 3: Mechanical Retreat XXVII */}
            <a 
              href="https://www.instagram.com/reel/C4pPnOPP8sL/"
              target="_blank"
              rel="noopener noreferrer"
              className="group/org3 p-4 min-[380px]:p-6 sm:p-8 bg-white border border-brand-soft rounded-[30px] flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-300 cursor-pointer relative"
            >
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-300 group-hover/org3:text-[#C9A84C] transition-colors duration-300">
                <ExternalLink size={14} />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center shrink-0">
                <Calendar size={24} />
              </div>
              <div className="space-y-2 w-full">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-semibold">Mechanical Retreat XXVII</span>
                <h4 className="text-lg sm:text-xl md:text-2xl font-serif font-semibold text-brand-primary leading-tight">Event Coordinator</h4>
                <p className="text-xs font-mono text-gray-500">Feb 2024 - Mar 2024</p>
                <p className="text-sm text-gray-600 font-light leading-relaxed text-justify">
                  {lang === "en" 
                    ? "Led the planning of a fully coordinated and customizable event, and organized a two-day large-scale event for more than 200 active participants in Pinrang, South Sulawesi."
                    : "Memimpin perencanaan acara yang terkoordinasi sepenuhnya dan dapat disesuaikan, serta menyelenggarakan acara berskala besar selama dua hari untuk lebih dari 200 peserta aktif di Pinrang, Sulawesi Selatan."}
                </p>
              </div>
            </a>

            {/* Org position 4: KKN-T 114 Universitas Hasanuddin */}
            <a 
              href="https://www.instagram.com/p/DLksZsqyI4znzM4R4JTxUJaF6vOfrdSkSydC-00/"
              target="_blank"
              rel="noopener noreferrer"
              className="group/org4 p-4 min-[380px]:p-6 sm:p-8 bg-white border border-brand-soft rounded-[30px] flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-300 cursor-pointer relative"
            >
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-300 group-hover/org4:text-[#C9A84C] transition-colors duration-300">
                <ExternalLink size={14} />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center shrink-0">
                <Sparkles size={24} />
              </div>
              <div className="space-y-2 w-full">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-semibold">KKN-T 114 UNHAS</span>
                <h4 className="text-lg sm:text-xl md:text-2xl font-serif font-semibold text-brand-primary leading-tight">Team Secretary</h4>
                <p className="text-xs font-mono text-gray-500">Jul 2024 - Aug 2024</p>
                <p className="text-sm text-gray-600 font-light leading-relaxed text-justify">
                  {lang === "en"
                    ? "As Team Secretary, I led the administrative coordination and ensured transparent program reporting while actively driving community empowerment initiatives. Specifically, I initiated a 'Moringa-infused Chocolate' training program designed to provide healthy snacks for children and create sustainable economic opportunities for local mothers."
                    : "Sebagai Sekretaris Tim, saya memimpin koordinasi administratif dan memastikan pelaporan program yang transparan sambil aktif mendorong inisiatif pemberdayaan masyarakat. Secara khusus, saya memprakarsai program pelatihan 'Cokelat Kelor' yang dirancang untuk menyediakan camilan sehat bagi anak-anak dan menciptakan peluang ekonomi berkelanjutan bagi para ibu setempat."}
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

        {/* --- SECTION 8: CONTACT ME --- */}
      <section id="contact" className="scroll-mt-24 sm:scroll-mt-32 py-16 md:py-32 px-4 sm:px-8 md:px-12 bg-[#FBFBFA] border-t border-brand-soft/45 transition-colors duration-500 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(#C9A84C 1.2px, transparent 1.2px)", backgroundSize: "32px 32px" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#FBFBFA]/10 to-[#F3EFE6]/10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto space-y-12 md:space-y-20 relative z-10">
          
          <div className="text-center space-y-6">
            <div className="inline-flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A84C] font-semibold">{t.contactSubtitle}</span>
            </div>
            <h2 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-6xl font-serif italic text-brand-primary font-light">
              {t.contactTitle}
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto font-light leading-relaxed text-sm text-[#0A1628]/80 text-justify md:text-center px-2">
              {t.contactPrompt}
            </p>
          </div>

          {/* Centered Elegant Dialogue Form */}
          <div className="max-w-xl mx-auto w-full">
            <form onSubmit={handleContactSubmit} className="bg-white border border-brand-accent/25 rounded-[32px] p-4 min-[380px]:p-6 sm:p-8 md:p-12 shadow-xl shadow-brand-primary/5 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-brand-primary/5 mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] font-bold">
                  {lang === "en" ? "TRANSMIT MESSAGE" : "KIRIM PESANAN"}
                </span>
                <Sparkles size={14} className="text-[#C9A84C]" />
              </div>

              {/* YOUR IDENTITY */}
              <div className="space-y-2 text-left">
                <label className="block text-[10px] font-mono uppercase tracking-widest font-semibold text-brand-primary/60">
                  {lang === "en" ? "Name or Initial" : "Nama atau Inisial"}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder={lang === "en" ? "Type your name..." : "Tulis nama Anda..."}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-brand-soft rounded-xl font-mono text-sm text-[#0A1628] placeholder-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-all"
                />
              </div>

              {/* COMMS PROTOCOL */}
              <div className="space-y-2 text-left">
                <label className="block text-[10px] font-mono uppercase tracking-widest font-semibold text-brand-primary/60">
                  {lang === "en" ? "Contact Point / Email / Social" : "Kontak / Email / Media Sosial"}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., mail@example.com / @username"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-brand-soft rounded-xl font-mono text-sm text-[#0A1628] placeholder-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-all"
                />
              </div>

              {/* THE PAYLOAD */}
              <div className="space-y-2 text-left">
                <label className="block text-[10px] font-mono uppercase tracking-widest font-semibold text-brand-primary/60">
                  {lang === "en" ? "Message payload" : "Isi Pesan"}
                </label>
                <textarea 
                  required
                  rows={4}
                  placeholder={lang === "en" ? "Type your message details..." : "Tulis detail pesan Anda..."}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-brand-soft rounded-xl font-mono text-sm text-[#0A1628] placeholder-gray-400 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-all resize-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4.5 bg-[#0A1628] text-white font-mono text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:bg-[#C9A84C] hover:text-[#0A1628] transition-all duration-300 shadow-md flex items-center justify-center space-x-2 cursor-pointer mt-8"
              >
                <span>{lang === "en" ? "SEND MESSAGE" : "KIRIM PESANAN"}</span>
                <ExternalLink size={12} />
              </button>
            </form>
          </div>

          <div className="h-px bg-[#0A1628]/5 max-w-4xl mx-auto w-full" />

          {/* Social connections underneath the dialogue box */}
          <div className="space-y-8 w-full max-w-5xl mx-auto">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] text-center font-bold">
              {lang === "en" ? "OTHER CONNECTION CHANNELS" : "SALURAN HUBUNGAN LAINNYA"}
            </h3>
            
            <div className="grid grid-cols-1 min-[340px]:grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {[
                { href: "mailto:divakemur@gmail.com", label: "Email", icon: <Mail size={16} />, detail: "divakemur@gmail.com", target: "" },
                { href: "https://www.linkedin.com/in/diva-delvira-ba9874294/", label: "LinkedIn", icon: <Linkedin size={16} />, detail: "Diva Delvira", target: "_blank" },
                { href: "https://www.instagram.com/dvdlvra_?igsh=M3ZseTVkNGkzNnp6", label: "Instagram", icon: <Instagram size={16} />, detail: "dvdlvra_", target: "_blank" },
                { href: "https://www.tiktok.com/@itsdipyay?_r=1&_t=ZS-969Cy3BRtVn", label: "TikTok", icon: <Music size={16} />, detail: "@itsdipyay", target: "_blank" }
              ].map((chan, idx) => (
                <a 
                  key={idx}
                  href={chan.href}
                  target={chan.target}
                  rel={chan.target ? "noreferrer" : undefined}
                  className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border border-brand-soft bg-white text-brand-primary hover:border-[#C9A84C] hover:shadow-lg transition-all duration-300 text-center space-y-2 group group-hover:bg-brand-soft min-w-0"
                >
                  <div className="text-[#C9A84C] group-hover:scale-110 transition-transform duration-300">
                    {chan.icon}
                  </div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider font-bold truncate max-w-full">{chan.label}</span>
                  <span className="block text-[9px] text-gray-400 font-mono truncate max-w-full">{chan.detail}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Elegant Footer Details */}
          <div className="pt-12 mt-12 md:pt-24 md:mt-24 border-t border-[#0A1628]/10 w-full flex flex-col md:flex-row justify-between items-center text-[10px] font-mono uppercase tracking-[0.3em] text-[#0A1628] text-center md:text-left space-y-4 md:space-y-0 text-center">
            <button 
              onClick={() => {
                setLoginError("");
                setShowLoginModal(true);
              }}
              className="text-center md:text-left font-mono uppercase tracking-[0.3em] text-[#0A1628]/60 hover:text-[#C9A84C] transition-colors duration-300 focus:outline-none cursor-pointer"
            >
              © 2026 Diva Delvira. All rights reserved.
            </button>
            <p className="mt-2 md:mt-0 italic text-[#C9A84C]">{t.footerTagline}</p>
          </div>
        </div>
      </section>

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
            className={`fixed bottom-20 left-4 right-4 sm:left-auto sm:right-8 z-50 p-4 sm:p-5 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-mono uppercase tracking-widest border border-brand-accent/20 ${
              toastType === "success" 
                ? "bg-white text-emerald-600" 
                : "bg-white text-red-600"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${toastType === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
            <span>
              {toastType === "success" 
                ? (lang === "en" ? "Message sent successfully!" : "Pesan berhasil dikirim!")
                : (lang === "en" ? "Transmitting failed. Try again." : "Transmisi gagal. Coba lagi.")}
            </span>
            <button 
              onClick={() => setShowToast(false)} 
              className="ml-4 font-bold text-gray-400 hover:text-brand-primary"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ADMINISTRATIVE DATABASE SECURE LOGIN DIALOGUE --- */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 bg-brand-primary/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
                  <label className="block text-[10px] font-mono uppercase tracking-widest font-semibold text-brand-primary/60">
                    {lang === "en" ? "Operator Username" : "Username Operator"}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    className="w-full px-5 py-3 bg-white border border-brand-soft rounded-xl font-mono text-sm text-[#0A1628] focus:outline-none focus:border-[#C9A84C]"
                    placeholder="Username"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase tracking-widest font-semibold text-brand-primary/60">
                    {lang === "en" ? "Security Keyphrase" : "Kata Sandi Keamanan"}
                  </label>
                  <input 
                    type="password" 
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="w-full px-5 py-3 bg-white border border-brand-soft rounded-xl font-mono text-sm text-[#0A1628] focus:outline-none focus:border-[#C9A84C]"
                    placeholder="••••••••"
                  />
                </div>

                {loginError && (
                  <p className="text-red-600 font-mono text-xs leading-relaxed">
                    ⚠ {loginError}
                  </p>
                )}

                <button 
                  type="submit"
                  className="w-full py-4 bg-[#0A1628] hover:bg-[#C9A84C] text-white hover:text-[#0A1628] font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center"
                >
                  {lang === "en" ? "AUTHENTICATE" : "OTENTIKASI"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SECURE DATABASE INBOX MESSAGES DASHBOARD --- */}
      <AnimatePresence>
        {showSecretPanel && (
          <div className="fixed inset-0 bg-brand-primary/95 backdrop-blur-md z-50 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FBFBFA] border border-[#C9A84C]/45 rounded-[36px] max-w-5xl w-full p-8 md:p-12 shadow-2xl space-y-8 flex flex-col max-h-[90vh]"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-brand-primary/5 shrink-0">
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono tracking-widest text-[#C9A84C] font-bold uppercase font-semibold">SECURE COMMUNICATIONS HUB</span>
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
                        title={lang === "en" ? "Switch to Spreadsheet Mode" : "Ubah ke Mode Tabel Spreadsheet"}
                      >
                        <Table size={11} />
                        <span>{lang === "en" ? "Spreadsheet" : "Tabel"}</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 w-full lg:w-auto">
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
                    className="px-4 py-2.5 border border-[#C9A84C]/30 text-brand-primary hover:border-red-600 hover:text-red-750 text-[10px] font-mono uppercase tracking-wider rounded-xl transition-all duration-350 disabled:opacity-35 disabled:hover:border-[#C9A84C]/30 disabled:hover:text-brand-primary cursor-pointer"
                  >
                    {lang === "en" ? "Clear Database" : "Kosongkan Basis data"}
                  </button>
                  <button 
                    onClick={handleAdminLogout}
                    className="px-4 py-2.5 bg-[#C9A84C] text-[#0A1628] font-bold text-[10px] font-mono uppercase tracking-wider rounded-xl hover:bg-red-650 hover:text-white transition-all duration-300 cursor-pointer flex items-center space-x-2"
                  >
                    <LogOut size={14} />
                    <span>{lang === "en" ? "Exit" : "Keluar"}</span>
                  </button>
                </div>
              </div>

              {/* Message List area supporting both modes */}
              <div className="flex-grow overflow-y-auto pr-2" style={{ maxHeight: "calc(90vh - 280px)" }}>
                {commsDb.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <p className="font-serif italic text-lg text-gray-400">
                      {lang === "en" ? "No incoming communications archived." : "Tidak ada pesan komunikasi masuk yang diarsipkan."}
                    </p>
                    <p className="text-xs font-mono text-gray-400">
                      {lang === "en" ? "Online Cloud Database is operational. 0 records index." : "Sistem basis data online beroperasi. 0 rekaman terindeks."}
                    </p>
                  </div>
                ) : databaseViewMode === "spreadsheet" ? (
                  /* SPREADSHEET MODE TABLE DISPLAY */
                  <div className="border border-brand-soft rounded-2xl overflow-hidden bg-white shadow-sm text-left">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                          <tr className="bg-brand-primary text-[#C9A84C] border-b border-brand-soft uppercase tracking-wider text-[9px] sm:text-[10px]">
                            <th className="p-4 font-bold border-r border-[#C9A84C]/10 min-w-[130px]">{lang === "en" ? "Date" : "Tanggal"}</th>
                            <th className="p-4 font-bold border-r border-[#C9A84C]/10 min-w-[140px]">{lang === "en" ? "Name" : "Nama"}</th>
                            <th className="p-4 font-bold border-r border-[#C9A84C]/10 min-w-[180px]">{lang === "en" ? "Channel" : "Jalur / Kontak"}</th>
                            <th className="p-4 font-bold border-r border-[#C9A84C]/10 min-w-[300px]">{lang === "en" ? "Message" : "Isi Pesan"}</th>
                            <th className="p-4 font-bold text-center w-[80px]">{lang === "en" ? "Action" : "Aksi"}</th>
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
                                  className="p-2 text-gray-300 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer inline-flex items-center justify-center"
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
                          className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-650 hover:bg-red-50 rounded-xl transition-colors duration-200 cursor-pointer"
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
                            {lang === "en" ? "Channel" : "Jalur"}: <span className="text-brand-primary">{msg.contact}</span>
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
                <span>{commsDb.length} {lang === "en" ? "Record(s) Loaded" : "Rekaman Dimuat"}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
