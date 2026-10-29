import { Injectable } from '@nestjs/common';

import { aiInternalAuthHeaders } from './ai-internal-auth';

const FREVIA_AI_URL = process.env.FREVIA_AI_URL ?? 'http://localhost:8000';
const ANALYZE_TIMEOUT_MS = 300_000;

export type AiCvSkill = {
  name: string;
  proficiencyLevel: number | null;
  confidence: number | null;
  evidence: string | null;
};

export type AiCvExperience = {
  title: string | null;
  company: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  confidence: number | null;
};

export type AiCvEducation = {
  degree: string | null;
  school: string | null;
  startYear: number | null;
  endYear: number | null;
  description: string | null;
  confidence: number | null;
};

export type AiCvProject = {
  name: string | null;
  technologies: string[];
  description: string | null;
  confidence: number | null;
};

export type AiCvSource = 'pdf_text' | 'pdf_ocr' | 'docx' | 'doc';

export type AiCvMeta = {
  source: AiCvSource;
  pages: number;
  chars: number;
  truncated: boolean;
  ocrUsed: boolean;
  model: string | null;
  durationMs: number | null;
  warnings: string[];
};

export type AiCvAnalysis = {
  skills: AiCvSkill[];
  experience: AiCvExperience[];
  education: AiCvEducation[];
  projects: AiCvProject[];
  summary: string | null;
  meta: AiCvMeta;
};

export type AiCvExtractedSkill = {
  name: string;
  proficiencyLevel: number | null;
};

const SOURCES: readonly AiCvSource[] = ['pdf_text', 'pdf_ocr', 'docx', 'doc'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const toNullableString = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toInteger = (value: unknown, min: number, max: number): number | null => {
  const parsed = toNumber(value);
  return parsed !== null &&
    Number.isInteger(parsed) &&
    parsed >= min &&
    parsed <= max
    ? parsed
    : null;
};

const toConfidence = (value: unknown): number | null => {
  const parsed = toNumber(value);
  if (parsed === null) return null;
  return Math.min(Math.max(parsed, 0), 1);
};

const toStringArray = (
  value: unknown,
  maxItems: number,
  maxLength: number,
): string[] => {
  const items: string[] = [];
  for (const item of toArray(value)) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    items.push(trimmed.slice(0, maxLength));
    if (items.length >= maxItems) break;
  }
  return items;
};

const normalizeSkill = (value: unknown): AiCvSkill | null => {
  if (!isRecord(value)) return null;
  const name = toNullableString(value.name, 100);
  if (!name) return null;
  return {
    name,
    proficiencyLevel: toInteger(value.proficiency_level, 1, 10),
    confidence: toConfidence(value.confidence),
    evidence: toNullableString(value.evidence, 200),
  };
};

const normalizeExperience = (value: unknown): AiCvExperience | null => {
  if (!isRecord(value)) return null;
  const item: AiCvExperience = {
    title: toNullableString(value.title, 150),
    company: toNullableString(value.company, 150),
    startDate: toNullableString(value.start_date, 10),
    endDate: toNullableString(value.end_date, 10),
    isCurrent: value.is_current === true,
    description: toNullableString(value.description, 1000),
    confidence: toConfidence(value.confidence),
  };
  const hasContent =
    item.title !== null ||
    item.company !== null ||
    item.startDate !== null ||
    item.endDate !== null ||
    item.description !== null;
  return hasContent ? item : null;
};

const normalizeEducation = (value: unknown): AiCvEducation | null => {
  if (!isRecord(value)) return null;
  const item: AiCvEducation = {
    degree: toNullableString(value.degree, 150),
    school: toNullableString(value.school, 150),
    startYear: toInteger(value.start_year, 1950, 2100),
    endYear: toInteger(value.end_year, 1950, 2100),
    description: toNullableString(value.description, 1000),
    confidence: toConfidence(value.confidence),
  };
  const hasContent =
    item.degree !== null ||
    item.school !== null ||
    item.startYear !== null ||
    item.endYear !== null ||
    item.description !== null;
  return hasContent ? item : null;
};

const normalizeProject = (value: unknown): AiCvProject | null => {
  if (!isRecord(value)) return null;
  const item: AiCvProject = {
    name: toNullableString(value.name, 150),
    technologies: toStringArray(value.technologies, 30, 60),
    description: toNullableString(value.description, 1000),
    confidence: toConfidence(value.confidence),
  };
  const hasContent =
    item.name !== null ||
    item.technologies.length > 0 ||
    item.description !== null;
  return hasContent ? item : null;
};

const normalizeSource = (value: unknown): AiCvSource => {
  return typeof value === 'string' && (SOURCES as string[]).includes(value)
    ? (value as AiCvSource)
    : 'pdf_text';
};

const normalizeMeta = (value: unknown): AiCvMeta => {
  const meta = isRecord(value) ? value : {};
  return {
    source: normalizeSource(meta.source),
    pages: toInteger(meta.pages, 0, 10_000) ?? 0,
    chars: toInteger(meta.chars, 0, 10_000_000) ?? 0,
    truncated: meta.truncated === true,
    ocrUsed: meta.ocr_used === true,
    model: toNullableString(meta.model, 100),
    durationMs: toInteger(meta.duration_ms, 0, 86_400_000),
    warnings: toStringArray(meta.warnings, 50, 200),
  };
};

@Injectable()
export class AiCvAnalyzerService {
  /**
   * Send a CV file to the frevia-ai service and return the full structured
   * analysis (skills / experience / education / projects / summary + meta).
   *
   * The upstream endpoint (POST /api/v1/ai/analyze-cv) parses the PDF/DOCX,
   * runs the local Qwen model through Ollama and returns a CVAnalysisResponse.
   */
  async analyze(fileBuffer: Buffer, fileName: string): Promise<AiCvAnalysis> {
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' }),
      fileName || 'cv.pdf',
    );

    let response: Response;
    try {
      response = await fetch(`${FREVIA_AI_URL}/api/v1/ai/analyze-cv`, {
        method: 'POST',
        headers: aiInternalAuthHeaders(),
        body: form,
        signal: AbortSignal.timeout(ANALYZE_TIMEOUT_MS),
      });
    } catch {
      throw new Error('AI CV analysis service is unreachable.');
    }

    if (!response.ok) {
      throw new Error(`AI CV analysis service failed (${response.status}).`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error('AI CV analysis service returned an invalid response.');
    }

    return this.normalize(payload);
  }

  /**
   * Backward-compatible helper: only the extracted skills.
   * Prefer {@link analyze} for the full payload.
   */
  async extractSkills(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<AiCvExtractedSkill[]> {
    const analysis = await this.analyze(fileBuffer, fileName);
    return analysis.skills.map((skill) => ({
      name: skill.name,
      proficiencyLevel: skill.proficiencyLevel,
    }));
  }

  private normalize(payload: unknown): AiCvAnalysis {
    const record = isRecord(payload) ? payload : {};

    const skills: AiCvSkill[] = [];
    for (const item of toArray(record.skills)) {
      const skill = normalizeSkill(item);
      if (skill) skills.push(skill);
      if (skills.length >= 50) break;
    }

    const experience: AiCvExperience[] = [];
    for (const item of toArray(record.experience)) {
      const entry = normalizeExperience(item);
      if (entry) experience.push(entry);
      if (experience.length >= 20) break;
    }

    const education: AiCvEducation[] = [];
    for (const item of toArray(record.education)) {
      const entry = normalizeEducation(item);
      if (entry) education.push(entry);
      if (education.length >= 10) break;
    }

    const projects: AiCvProject[] = [];
    for (const item of toArray(record.projects)) {
      const entry = normalizeProject(item);
      if (entry) projects.push(entry);
      if (projects.length >= 20) break;
    }

    return {
      skills,
      experience,
      education,
      projects,
      summary: toNullableString(record.summary, 1500),
      meta: normalizeMeta(record.meta),
    };
  }
}
