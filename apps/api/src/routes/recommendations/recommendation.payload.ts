import type { FreelancerDocument, JobDocument } from './recommendation.repo';

/**
 * Dựng payload CV/JD cho AI service (Hybrid Ranking §7). Dùng chung cho cả
 * luồng xếp hạng stateless (`recommendation.service`) và luồng index Chroma
 * (`recommendation-index.service`) để đảm bảo hai bên chấm cùng một cấu trúc.
 */
export function buildCvPayload(
  cv: FreelancerDocument,
): Record<string, unknown> {
  return {
    title: cv.title,
    summary: cv.bio,
    skills: cv.skills.map((skill) => ({
      name: skill.name,
      proficiency_level: skill.proficiencyLevel,
    })),
    experience: cv.experiences.map((experience) => ({
      title: experience.title,
      company: experience.company,
      description: experience.description,
      start_date: experience.startDate,
      end_date: experience.endDate,
      is_current: experience.isCurrent,
    })),
    education: cv.educations.map((education) => ({
      degree: education.degree,
      school: education.school,
    })),
  };
}

export function buildJobPayload(job: JobDocument): Record<string, unknown> {
  return {
    title: job.title,
    summary: job.description,
    required_skills: job.skills.map((name) => ({ name })),
    budget:
      job.budgetMin === null && job.budgetMax === null
        ? undefined
        : { min: job.budgetMin, max: job.budgetMax },
  };
}

export function buildCvText(cv: FreelancerDocument): string {
  const parts = [
    cv.title,
    cv.bio,
    cv.skills.map((skill) => skill.name).join(', '),
    cv.experiences
      .map((experience) =>
        [experience.title, experience.company, experience.description]
          .filter(Boolean)
          .join(' '),
      )
      .join('\n'),
    cv.legacyExperience.join('\n'),
  ];

  return (
    parts.filter((part) => Boolean(part && part.trim())).join('\n') || 'cv'
  );
}

export function buildJobText(job: JobDocument): string {
  return [job.title, job.description, job.skills.join(', ')]
    .filter((part) => Boolean(part && part.trim()))
    .join('\n');
}
