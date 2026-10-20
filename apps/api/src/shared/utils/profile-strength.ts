type FreelancerStrengthInput = {
  displayName?: string | null;
  bio?: string | null;
  title?: string | null;
  education?: string[] | null;
  certifications?: string[] | null;
  skillCount: number;
  portfolioCount: number;
};

type ClientStrengthInput = {
  displayName?: string | null;
  bio?: string | null;
  companyName?: string | null;
  companyDescription?: string | null;
  website?: string | null;
};

type ExpertStrengthInput = {
  displayName?: string | null;
  bio?: string | null;
  title?: string | null;
  expertise?: string[] | null;
  yearsOfExperience?: number | null;
  education?: string[] | null;
  certifications?: string[] | null;
  website?: string | null;
};

const hasText = (value?: string | null) => Boolean(value?.trim());

export function calculateFreelancerProfileStrength(
  input: FreelancerStrengthInput,
) {
  const completed = [
    hasText(input.displayName),
    hasText(input.bio),
    hasText(input.title),
    Boolean(input.education?.length),
    Boolean(input.certifications?.length),
    input.skillCount > 0,
    input.portfolioCount > 0,
  ].filter(Boolean).length;

  return Math.round((completed / 7) * 100);
}

export function calculateClientProfileStrength(input: ClientStrengthInput) {
  const completed = [
    hasText(input.displayName),
    hasText(input.bio),
    hasText(input.companyName),
    hasText(input.companyDescription),
    hasText(input.website),
  ].filter(Boolean).length;

  return Math.round((completed / 5) * 100);
}

export function calculateExpertProfileStrength(input: ExpertStrengthInput) {
  const completed = [
    hasText(input.displayName),
    hasText(input.bio),
    hasText(input.title),
    Boolean(input.expertise?.length),
    input.yearsOfExperience !== null && input.yearsOfExperience !== undefined,
    Boolean(input.education?.length),
    Boolean(input.certifications?.length),
    hasText(input.website),
  ].filter(Boolean).length;
  return Math.round((completed / 8) * 100);
}
