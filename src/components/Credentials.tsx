import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { ArrowRight, BadgeCheck, BarChart3, ImageIcon, Monitor, FileText, Truck, Users, Workflow, Wrench } from "lucide-react";
import { credentials, profile } from "../content";
import "./credentials.css";

type Lang = "en" | "id";
type Copy = Record<Lang, string>;
type Education = {
  academicAreas: Record<Lang, string[]>;
  activities: Copy[];
  thesis: Record<"title" | "overview", Copy>;
};
const { training, skillGroups, education, ui } = credentials;
const profileEducation = profile.education;

const groupIcons: Record<string, typeof Monitor> = {
  scm: Truck,
  data: BarChart3,
  process: Workflow,
  systems: Monitor,
  tools: Wrench,
  leadership: Users,
};

export function SkillsInventory({ lang }: { lang: "en" | "id" }) {
  // -1 shows every group; otherwise the index of the selected group.
  const [active, setActive] = useState(-1);
  const railRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  const updateEdge = () => {
    const rail = railRef.current;
    if (!rail) return;
    setEdge({
      start: rail.scrollLeft <= 4,
      end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4,
    });
  };
  useEffect(() => {
    updateEdge();
    window.addEventListener("resize", updateEdge);
    return () => window.removeEventListener("resize", updateEdge);
  }, [lang]);
  const cards = skillGroups.flatMap((group, g) =>
    active === -1 || active === g ? group.items.map((item) => ({ g, ...item })) : [],
  );
  const total = skillGroups.reduce((sum, group) => sum + group.items.length, 0);
  const tabs = [
    { label: ui.allFilter, count: total, index: -1 },
    ...skillGroups.map((group, g) => ({ label: group.title, count: group.items.length, index: g })),
  ];
  return (
    <div className="credentials-inventory">
      <div className="credentials-inventory-head">
        <div>
          <h3>{ui.skillsHeading[lang]}</h3>
          <p className="credentials-muted">
            {ui.skillsSubtitle[lang]}
          </p>
        </div>
      </div>
      <div
        ref={railRef}
        onScroll={updateEdge}
        className={`credentials-skill-filter${edge.start ? "" : " fade-start"}${edge.end ? "" : " fade-end"}`}
        role="group"
        aria-label={ui.skillFilterLabel[lang]}
      >
        {tabs.map(({ label, count, index }) => (
          <button
            key={label.en}
            type="button"
            aria-pressed={active === index}
            className={index === -1 ? "is-all" : `is-g${index % 6}`}
            onClick={(event) => {
              setActive(index);
              event.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
            }}
          >
            {label[lang]}
            <span aria-hidden="true">{count}</span>
          </button>
        ))}
      </div>
      <ul key={active} className="credentials-skill-cards">
        {cards.map(({ g, skill, description, evidence, tools }) => {
          const Icon = groupIcons[skillGroups[g].key] ?? BadgeCheck;
          return (
            <li key={`${g}-${skill.en}`} className={`credentials-skill-card is-g${g % 6}`}>
              {active === -1 && (
                <span className="credentials-skill-group">{skillGroups[g].title[lang]}</span>
              )}
              <div className="credentials-skill-title">
                <Icon size={16} aria-hidden="true" />
                <strong>{skill[lang]}</strong>
              </div>
              <p className="credentials-skill-desc">{description[lang]}</p>
              {tools.length > 0 && (
                <ul className="credentials-tags">
                  {tools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
              )}
              <p className="credentials-skill-evidence">
                <BadgeCheck size={14} aria-hidden="true" />
                <span>
                  <em>{ui.evidenceLabel[lang]}</em>
                  {evidence[lang]}
                </span>
              </p>
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
  const [selected, setSelected] = useState<string | null>(null);
  const dialog = useNativeDialog(selected !== null);
  const heading = useId();
  const entry = training.find((item) => item.id === selected) ?? null;
  return (
    <section id="training" className="summer-section credentials-training active">
      <div className="credentials-container">
        <div className="summer-heading">
          <h2>{ui.trainingHeading[lang]}</h2>
          <p>
            {ui.trainingIntro[lang]}
          </p>
        </div>
        <div className="credentials-training-list">
          {training.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-haspopup="dialog"
              className="credentials-training-card"
              onClick={() => setSelected(item.id)}
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
                  {ui.trainingOverviewDocumentation[lang]}
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
            {ui.close[lang]}
          </button>
        </div>
        {entry && (
          <>
            <p className="credentials-muted">
              {entry.provider[lang]} · {entry.date[lang]}
            </p>
            {entry.credentialId && (
              <p className="credentials-muted credentials-credential">
                {ui.credentialId[lang]}: <code>{entry.credentialId}</code>
              </p>
            )}
            <h3>{ui.overview[lang]}</h3>
            <p>{entry.summary[lang]}</p>
            {entry.skills.length > 0 && (
              <ul className="credentials-tags">
                {entry.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            )}
            <h3>{ui.documentation[lang]}</h3>
            {entry.document && (
              <a className="credentials-doc-link" href={entry.document} target="_blank" rel="noreferrer">
                <FileText size={16} aria-hidden="true" />
                {ui.viewCertificate[lang]}
              </a>
            )}
            <div
              className={`credentials-docs${entry.photos.length === 1 ? " is-single" : entry.photos.length % 2 === 0 && entry.photos.length < 6 ? " is-pair" : ""}`}
            >
              {entry.photos.length > 0
                ? entry.photos.map((src, i) => (
                    <a key={src} href={src} target="_blank" rel="noreferrer" title={ui.openFullSize[lang]}>
                      <img src={src} loading="lazy" alt={`${entry.title[lang]} ${i + 1}`} />
                    </a>
                  ))
                : [0, 1, 2].map((i) => (
                    <div key={i} className="credentials-doc-placeholder">
                      <ImageIcon size={20} aria-hidden="true" />
                      <span>{ui.photoComingSoon[lang]}</span>
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
  const thesisLabels: [keyof Education["thesis"], Copy][] = [
    ["title", ui.thesisTitle],
    ["overview", ui.thesisOverview],
  ];
  const degree = profileEducation.degree[lang].replace(/^(Bachelor of |S1 )/, "");
  const gpa = lang === "id" ? profileEducation.gpa.replace(/\./g, ",") : profileEducation.gpa;
  return (
    <dialog
      ref={dialog}
      className="credentials-dialog"
      aria-labelledby={heading}
      onClick={closeOnBackdrop}
      onClose={onClose}
    >
      <div className="credentials-dialog-header">
        <h2 id={heading}>{ui.educationOverview[lang]}</h2>
        <button autoFocus className="credentials-button" onClick={() => dialog.current?.close()}>
          {ui.close[lang]}
        </button>
      </div>
      <p className="credentials-degree">
        {profileEducation.institution} ({profileEducation.shortName})
      </p>
      <p>
        {degree} · {ui.gpa[lang]} {gpa}
      </p>
      <h3>{ui.keyAcademicAreas[lang]}</h3>
      <ul className="credentials-tags">
        {education.academicAreas[lang].map((area) => (
          <li key={area}>{area}</li>
        ))}
      </ul>
      <h3>{ui.activitiesOrganizations[lang]}</h3>
      <ul className="credentials-activities">
        {education.activities.map((activity) => (
          <li key={activity.en}>{activity[lang]}</li>
        ))}
      </ul>
      <h3>{ui.undergraduateThesis[lang]}</h3>
      <dl className="credentials-thesis">
        {thesisLabels.map(([field, label]) => (
          <div key={field}>
            <dt>{label[lang]}</dt>
            <dd>{education.thesis[field][lang]}</dd>
          </div>
        ))}
      </dl>
    </dialog>
  );
}
