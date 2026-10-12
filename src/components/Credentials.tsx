import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { ArrowRight, BadgeCheck, BarChart3, ImageIcon, Monitor, Truck, Users, Workflow } from "lucide-react";
import { credentials, profile } from "../content";
import "./credentials.css";

type Lang = "en" | "id";
type Copy = Record<Lang, string>;
type Education = {
  academicAreas: Copy;
  activities: Copy[];
  thesis: Record<"title" | "abstract" | "method" | "result", Copy>;
};
const { training, skillGroups, education, ui } = credentials;
const profileEducation = profile.education;

const groupIcons = [Monitor, BarChart3, Truck, Workflow, Users];
const evidenceKinds: Record<string, Copy> = {
  project: ui.projectKind,
  work: ui.workKind,
  training: ui.trainingKind,
  campus: ui.campusKind,
  award: ui.awardKind,
  tool: ui.toolKind,
};
const fallbackKind = ui.fallbackKind;

export function SkillsInventory({ lang }: { lang: "en" | "id" }) {
  const [filter, setFilter] = useState(-1);
  const cards = skillGroups.flatMap((group, g) =>
    filter === -1 || filter === g ? group.items.map((item) => ({ g, ...item })) : [],
  );
  return (
    <div className="credentials-inventory">
      <div className="credentials-inventory-head">
        <div>
          <h3>{ui.skillsHeading[lang]}</h3>
          <p className="credentials-muted">
            {ui.skillsSubtitle[lang]}
          </p>
        </div>
        <div
          className="credentials-skill-filter"
          role="group"
          aria-label={ui.skillFilterLabel[lang]}
        >
          {[ui.allFilter, ...skillGroups.map((group) => group.title)].map((label, i) => (
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
          const Icon = groupIcons[g] ?? BadgeCheck;
          const styleGroup = groupIcons.length === 0 ? 0 : g % groupIcons.length;
          return (
            <li key={`${skill.en}-${evidence.en}`} className={`credentials-skill-card is-g${styleGroup}`}>
              <div className="credentials-skill-meta">
                <span>
                  <Icon size={14} aria-hidden="true" />
                  {skillGroups[g].title[lang]}
                </span>
                <em>{(evidenceKinds[kind] ?? fallbackKind)[lang]}</em>
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
            <div className="credentials-docs">
              {entry.photos.length > 0
                ? entry.photos.map((src, i) => (
                    <img key={src} src={src} loading="lazy" alt={`${entry.title[lang]} ${i + 1}`} />
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
    ["abstract", ui.thesisAbstract],
    ["method", ui.thesisMethod],
    ["result", ui.thesisResult],
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
      <p>{education.academicAreas[lang]}</p>
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
