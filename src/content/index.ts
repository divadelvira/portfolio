import hero from "./hero.json";
import about from "./about.json";
import experience from "./experience.json";
import projects from "./projects.json";
import skills from "./skills.json";
import awards from "./awards.json";
import education from "./education.json";
import training from "./training.json";
import contact from "./contact.json";
import credentialsUi from "./credentials-ui.json";
import site from "./site.json";
import metadata from "./metadata.json";
import presentationSettings from "./presentation.json";

// Assemble the existing consumer shapes while keeping each editable value in one section file.
export const profile = {
  name: hero.name, monogram: hero.monogram, heroImage: hero.heroImage, heroImageAlt: hero.heroImageAlt,
  profileImage: about.profileImage, profileAlt: about.profileAlt,
  experience, education: education.profile, leadership: education.leadership,
  email: contact.email, socialHeading: contact.socialHeading, socials: contact.socials,
};
export const credentials = {
  training: training.training, skillGroups: skills.skillGroups, education: education.education,
  ui: credentialsUi, skillHighlights: skills.skillHighlights,
};
export const presentation = {
  heroMetrics: hero.metrics, projectGroupLabels: skills.projectGroupLabels,
  languageProgress: skills.languageProgress, radar: skills.radar,
  copyrightYear: presentationSettings.copyrightYear,
};
export const roles = { items: hero.roles };
export { projects, awards, site, metadata };
