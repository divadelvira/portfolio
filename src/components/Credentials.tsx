import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { ArrowRight, BadgeCheck, BarChart3, ImageIcon, Monitor, Truck, Users, Workflow } from "lucide-react";
import "./credentials.css";

type Lang = "en" | "id";
type Copy = Record<Lang, string>;
const copy = (en: string, id: string): Copy => ({ en, id });

// TODO(andre): fill in providers, dates, course details, bootcamp name and documentation photos (paths under public/training/, e.g. "/training/tps-1.jpg").
const training: {
  title: Copy;
  provider: Copy;
  date: Copy;
  summary: Copy;
  skills: string[];
  photos: string[];
}[] = [
  {
    title: copy("Slimstock training", "Pelatihan Slimstock"),
    provider: copy("Provider TBA", "Penyelenggara belum diisi"),
    date: copy("Date TBA", "Tanggal belum diisi"),
    summary: copy(
      "Course scope and learning outcomes TBA.",
      "Cakupan pelatihan dan hasil pembelajaran belum diisi.",
    ),
    skills: [],
    photos: [],
  },
  {
    title: copy("SAP S/4HANA training", "Pelatihan SAP S/4HANA"),
    provider: copy("Provider TBA", "Penyelenggara belum diisi"),
    date: copy("Date TBA", "Tanggal belum diisi"),
    summary: copy(
      "Covers the MM (Materials Management) module in SAP S/4HANA.",
      "Mencakup modul MM (Materials Management) di SAP S/4HANA.",
    ),
    skills: ["SAP S/4HANA", "MM (Materials Management)"],
    photos: [],
  },
  {
    title: copy(
      "Toyota Production System (TPS) training",
      "Pelatihan Toyota Production System (TPS)",
    ),
    provider: copy("Provider TBA", "Penyelenggara belum diisi"),
    date: copy("Date TBA", "Tanggal belum diisi"),
    summary: copy(
      "Intensive training in JIT, Heijunka, Jidoka and Kaizen, with hands-on operational simulations.",
      "Pelatihan intensif JIT, Heijunka, Jidoka dan Kaizen dengan simulasi operasional langsung.",
    ),
    skills: ["JIT", "Heijunka", "Jidoka", "Kaizen"],
    photos: [],
  },
  {
    title: copy("Bootcamp: name TBA", "Bootcamp: nama belum diisi"),
    provider: copy("Provider TBA", "Penyelenggara belum diisi"),
    date: copy("Date TBA", "Tanggal belum diisi"),
    summary: copy(
      "Topic, course scope and learning outcomes TBA.",
      "Topik, cakupan pelatihan dan hasil pembelajaran belum diisi.",
    ),
    skills: [],
    photos: [],
  },
];

const skillGroups: { title: Copy; items: [Copy, Copy, string][] }[] = [
  {
    title: copy("Enterprise Tools", "Perangkat Enterprise"),
    items: [
      [
        copy("Microsoft Excel & Power Query", "Microsoft Excel & Power Query"),
        copy("Priority Materials dashboard", "Dasbor Material Prioritas"),
        "project",
      ],
      [
        copy("SAP S/4HANA", "SAP S/4HANA"),
        copy(
          "SAP S/4HANA training: MM (Materials Management) module",
          "Pelatihan SAP S/4HANA: modul MM (Materials Management)",
        ),
        "training",
      ],
      [
        copy("Canva", "Canva"),
        copy("Listed in the existing tools inventory", "Tercantum dalam daftar perangkat saat ini"),
        "tool",
      ],
    ],
  },
  {
    title: copy("Data & Analytics", "Data & Analitik"),
    items: [
      [
        copy("SPSS & Minitab", "SPSS & Minitab"),
        copy("Measurement System Analysis (MSA)", "Analisis Sistem Pengukuran (MSA)"),
        "project",
      ],
      [
        copy("Python & statistical validation", "Python & validasi statistik"),
        copy("Internal Service Quality Analysis", "Analisis Kualitas Layanan Internal"),
        "project",
      ],
      [
        copy("Power BI & SQL", "Power BI & SQL"),
        copy(
          "Demand forecast pipeline shown in portfolio",
          "Alur peramalan permintaan dalam portofolio",
        ),
        "project",
      ],
      [
        copy("Forecast modeling", "Pemodelan peramalan"),
        copy(
          "Demand forecast / safety stock widget",
          "Widget peramalan permintaan / stok pengaman",
        ),
        "project",
      ],
      [
        copy("Dashboard automation & reporting", "Otomasi dasbor & pelaporan"),
        copy("PT Vale Indonesia: material monitoring", "PT Vale Indonesia: pemantauan material"),
        "work",
      ],
    ],
  },
  {
    title: copy("Supply Chain & Logistics", "Rantai Pasok & Logistik"),
    items: [
      [
        copy("Inventory analysis & MRP control", "Analisis inventaris & pengendalian MRP"),
        copy(
          "PT Vale Indonesia: inventory and procurement",
          "PT Vale Indonesia: inventaris dan pengadaan",
        ),
        "work",
      ],
      [
        copy("Vendor evaluation, QCD & SLA", "Evaluasi vendor, QCD & SLA"),
        copy("Vendor Selection & Tender Preparation", "Seleksi Vendor & Persiapan Tender"),
        "project",
      ],
      [
        copy("Freight, routing & fleet analysis", "Analisis pengiriman, rute & armada"),
        copy("PT Triatra: warehouse and distribution", "PT Triatra: pergudangan dan distribusi"),
        "work",
      ],
      [
        copy("Warehousing & dock scheduling", "Pergudangan & penjadwalan dock"),
        copy(
          "Warehouse Appointment Scheduling System (WASS)",
          "Sistem Penjadwalan Janji Temu Gudang (WASS)",
        ),
        "project",
      ],
      [
        copy("Production planning & product design", "Perencanaan produksi & desain produk"),
        copy("SMART FEED capstone", "Proyek akhir SMART FEED"),
        "project",
      ],
    ],
  },
  {
    title: copy("Methodologies & Quality", "Metodologi & Kualitas"),
    items: [
      [
        copy("Lean Manufacturing & TPS", "Lean Manufacturing & TPS"),
        copy(
          "TPS training and manufacturing laboratory",
          "Pelatihan TPS dan laboratorium manufaktur",
        ),
        "training",
      ],
      [
        copy("JIT, Heijunka, Jidoka & Kaizen", "JIT, Heijunka, Jidoka & Kaizen"),
        copy("TPS operational simulations", "Simulasi operasional TPS"),
        "training",
      ],
      [
        copy(
          "PDCA, process mapping & root cause analysis",
          "PDCA, pemetaan proses & analisis akar masalah",
        ),
        copy("Tuyere Material Delivery Kaizen project", "Proyek Kaizen Pengiriman Material Tuyere"),
        "project",
      ],
      [
        copy("Lead time optimization", "Optimasi waktu tunggu"),
        copy("Tuyere Material Delivery Kaizen project", "Proyek Kaizen Pengiriman Material Tuyere"),
        "project",
      ],
      [
        copy("MSA, Crossed Gage R&R & ANOVA", "MSA, Crossed Gage R&R & ANOVA"),
        copy("Measurement System Analysis project", "Proyek Analisis Sistem Pengukuran"),
        "project",
      ],
      [
        copy(
          "SERVQUAL & Importance-Performance Analysis",
          "SERVQUAL & Importance-Performance Analysis",
        ),
        copy("Internal Service Quality Analysis", "Analisis Kualitas Layanan Internal"),
        "project",
      ],
      [
        copy(
          "Design Thinking, RAD & usability testing",
          "Design Thinking, RAD & pengujian kegunaan",
        ),
        copy("WASS: prototypes, Black Box tests and SUS", "WASS: prototipe, uji Black Box dan SUS"),
        "project",
      ],
    ],
  },
  {
    title: copy("Soft Skills", "Keterampilan Interpersonal"),
    items: [
      [
        copy("Leadership & entrepreneurship", "Kepemimpinan & kewirausahaan"),
        copy("HMTI FT-UH: INCREASE and START-UP", "HMTI FT-UH: INCREASE dan START-UP"),
        "campus",
      ],
      [
        copy("Coordination & teamwork", "Koordinasi & kerja sama tim"),
        copy("ISLI CAMP event committee; procurement teams", "Panitia ISLI CAMP; tim pengadaan"),
        "campus",
      ],
      [
        copy("Mentoring & facilitation", "Pendampingan & fasilitasi"),
        copy(
          "Physics and manufacturing laboratory assistant",
          "Asisten laboratorium fisika dan manufaktur",
        ),
        "campus",
      ],
      [
        copy("Communication & business problem solving", "Komunikasi & pemecahan masalah bisnis"),
        copy(
          "Content Marketing and Astra Motor Business Case competitions",
          "Kompetisi Content Marketing dan Astra Motor Business Case",
        ),
        "award",
      ],
    ],
  },
];

const groupIcons = [Monitor, BarChart3, Truck, Workflow, Users];
const evidenceKinds: Record<string, Copy> = {
  project: copy("Project", "Proyek"),
  work: copy("Work", "Kerja"),
  training: copy("Training", "Pelatihan"),
  campus: copy("Campus", "Kampus"),
  award: copy("Competition", "Kompetisi"),
  tool: copy("Toolkit", "Perangkat"),
};

export function SkillsInventory({ lang }: { lang: "en" | "id" }) {
  const [filter, setFilter] = useState(-1);
  const cards = skillGroups.flatMap((group, g) =>
    filter === -1 || filter === g
      ? group.items.map(([skill, evidence, kind]) => ({ g, skill, evidence, kind }))
      : [],
  );
  return (
    <div className="credentials-inventory">
      <div className="credentials-inventory-head">
        <div>
          <h3>{lang === "en" ? "Skills in practice" : "Keterampilan dalam praktik"}</h3>
          <p className="credentials-muted">
            {lang === "en"
              ? "Every skill is tied to where it was used or proven."
              : "Setiap keterampilan disertai tempat ia digunakan atau dibuktikan."}
          </p>
        </div>
        <div
          className="credentials-skill-filter"
          role="group"
          aria-label={lang === "en" ? "Filter skills" : "Saring keterampilan"}
        >
          {[copy("All", "Semua"), ...skillGroups.map((group) => group.title)].map((label, i) => (
            <button
              key={label.en}
              type="button"
              aria-pressed={filter === i - 1}
              onClick={() => setFilter(i - 1)}
            >
              {label[lang]}
            </button>
          ))}
        </div>
      </div>
      <ul className="credentials-skill-cards">
        {cards.map(({ g, skill, evidence, kind }) => {
          const Icon = groupIcons[g];
          return (
            <li key={skill.en} className={`credentials-skill-card is-g${g}`}>
              <div className="credentials-skill-meta">
                <span>
                  <Icon size={14} aria-hidden="true" />
                  {skillGroups[g].title[lang]}
                </span>
                <em>{evidenceKinds[kind][lang]}</em>
              </div>
              <strong>{skill[lang]}</strong>
              <span className="credentials-skill-evidence">
                <BadgeCheck size={14} aria-hidden="true" />
                {evidence[lang]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function useNativeDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    const trigger = document.activeElement;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [open]);
  return ref;
}

function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
  if (event.target !== event.currentTarget) return;
  const rect = event.currentTarget.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    event.currentTarget.close();
}

export function TrainingSection({ lang }: { lang: "en" | "id" }) {
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useNativeDialog(selected !== null);
  const heading = useId();
  const entry = selected === null ? null : training[selected];
  return (
    <section id="training" className="summer-section credentials-training active">
      <div className="credentials-container">
        <div className="summer-heading">
          <h2>{lang === "en" ? "Training & Certification" : "Pelatihan & Sertifikasi"}</h2>
          <p>
            {lang === "en"
              ? "Tap a training to see its overview and documentation."
              : "Ketuk pelatihan untuk melihat ringkasan dan dokumentasinya."}
          </p>
        </div>
        <div className="credentials-training-list">
          {training.map((item, index) => (
            <button
              key={item.title.en}
              type="button"
              aria-haspopup="dialog"
              className="credentials-training-card"
              onClick={() => setSelected(index)}
            >
              <span>
                <span className="credentials-training-title">{item.title[lang]}</span>
                <span className="credentials-muted">
                  {item.provider[lang]} · {item.date[lang]}
                </span>
              </span>
              <span>
                <span className="credentials-training-summary">{item.summary[lang]}</span>
                {item.skills.length > 0 && (
                  <span className="credentials-tags">
                    {item.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </span>
                )}
                <span className="credentials-training-more">
                  {lang === "en" ? "Overview & documentation" : "Ringkasan & dokumentasi"}
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <dialog
        ref={dialog}
        className="credentials-dialog"
        aria-labelledby={heading}
        onClick={closeOnBackdrop}
        onClose={() => setSelected(null)}
      >
        <div className="credentials-dialog-header">
          <h2 id={heading}>{entry?.title[lang]}</h2>
          <button autoFocus className="credentials-button" onClick={() => dialog.current?.close()}>
            {lang === "en" ? "Close" : "Tutup"}
          </button>
        </div>
        {entry && (
          <>
            <p className="credentials-muted">
              {entry.provider[lang]} · {entry.date[lang]}
            </p>
            <h3>{lang === "en" ? "Overview" : "Ringkasan"}</h3>
            <p>{entry.summary[lang]}</p>
            {entry.skills.length > 0 && (
              <ul className="credentials-tags">
                {entry.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            )}
            <h3>{lang === "en" ? "Documentation" : "Dokumentasi"}</h3>
            <div className="credentials-docs">
              {entry.photos.length > 0
                ? entry.photos.map((src, i) => (
                    <img key={src} src={src} loading="lazy" alt={`${entry.title[lang]} ${i + 1}`} />
                  ))
                : [0, 1, 2].map((i) => (
                    <div key={i} className="credentials-doc-placeholder">
                      <ImageIcon size={20} aria-hidden="true" />
                      <span>{lang === "en" ? "Photo coming soon" : "Foto segera hadir"}</span>
                    </div>
                  ))}
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}

export function EduOverview({
  lang,
  open,
  onClose,
}: {
  lang: "en" | "id";
  open: boolean;
  onClose: () => void;
}) {
  const dialog = useNativeDialog(open);
  const heading = useId();
  return (
    <dialog
      ref={dialog}
      className="credentials-dialog"
      aria-labelledby={heading}
      onClick={closeOnBackdrop}
      onClose={onClose}
    >
      <div className="credentials-dialog-header">
        <h2 id={heading}>{lang === "en" ? "Education overview" : "Ringkasan pendidikan"}</h2>
        <button autoFocus className="credentials-button" onClick={() => dialog.current?.close()}>
          {lang === "en" ? "Close" : "Tutup"}
        </button>
      </div>
      <p className="credentials-degree">Universitas Hasanuddin (UNHAS)</p>
      <p>
        {lang === "en"
          ? "Industrial Engineering · GPA 3.78 / 4.00"
          : "Teknik Industri · IPK 3,78 / 4,00"}
      </p>
      <h3>{lang === "en" ? "Key academic areas" : "Bidang akademik utama"}</h3>
      <p>
        {lang === "en"
          ? "Lean Manufacturing, Quality Engineering and Supply Chain Management."
          : "Lean Manufacturing, Rekayasa Kualitas dan Manajemen Rantai Pasok."}
      </p>
      <h3>{lang === "en" ? "Activities & organizations" : "Kegiatan & organisasi"}</h3>
      <ul className="credentials-activities">
        <li>
          {lang === "en"
            ? "HMTI FT-UH: Head of Entrepreneurship Division, July 2024 to February 2025. Led INCREASE and START-UP business development programs."
            : "HMTI FT-UH: Ketua Divisi Kewirausahaan, Juli 2024 hingga Februari 2025. Memimpin program pengembangan bisnis INCREASE dan START-UP."}
        </li>
        <li>
          {lang === "en"
            ? "ISLI CAMP: Event Organizing Committee, August to October 2024. Coordinated participants, schedules and event flow."
            : "ISLI CAMP: Panitia Pelaksana Acara, Agustus hingga Oktober 2024. Mengoordinasikan peserta, jadwal dan alur acara."}
        </li>
        <li>
          {lang === "en"
            ? "Manufacturing Systems Laboratory Assistant and TPS module coordinator: practicum coordination and Lean learning materials."
            : "Asisten Laboratorium Sistem Manufaktur dan PIC modul TPS: koordinasi praktikum dan materi pembelajaran Lean."}
        </li>
        <li>
          {lang === "en"
            ? "Basic Physics Laboratory Assistant: mentored 100+ engineering students with an emphasis on safety and analytical precision."
            : "Asisten Laboratorium Fisika Dasar: membimbing lebih dari 100 mahasiswa teknik dengan fokus pada keselamatan dan ketelitian analisis."}
        </li>
      </ul>
      <h3>{lang === "en" ? "Undergraduate thesis (TA)" : "Tugas Akhir (TA)"}</h3>
      {/* TODO(andre): fill in verified thesis title, abstract, method and result. */}
      <dl className="credentials-thesis">
        {[
          copy("Title", "Judul"),
          copy("Abstract", "Abstrak"),
          copy("Method", "Metode"),
          copy("Result", "Hasil"),
        ].map((label) => (
          <div key={label.en}>
            <dt>{label[lang]}</dt>
            <dd>
              {lang === "en"
                ? "TBA: verified thesis information not yet provided."
                : "Belum diisi: informasi tugas akhir terverifikasi belum tersedia."}
            </dd>
          </div>
        ))}
      </dl>
    </dialog>
  );
}
