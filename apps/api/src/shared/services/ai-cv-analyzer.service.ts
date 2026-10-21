import { Injectable } from '@nestjs/common';

const FREVIA_AI_URL = process.env.FREVIA_AI_URL ?? 'http://localhost:8000';
const ANALYZE_TIMEOUT_MS = 300_000;

export type AiCvExtractedSkill = {
  name: string;
  proficiencyLevel: number | null;
};

@Injectable()
export class AiCvAnalyzerService {
  /**
   * Send a CV file to the frevia-ai service and return the extracted skills.
   *
   * The upstream endpoint (POST /api/v1/ai/analyze-cv) parses the PDF/DOCX,
   * runs the local Qwen model through Ollama and returns a structured
   * CVAnalysisResponse payload.
   */
  async extractSkills(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<AiCvExtractedSkill[]> {
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
        body: form,
        signal: AbortSignal.timeout(ANALYZE_TIMEOUT_MS),
      });
    } catch {
      throw new Error('AI CV analysis service is unreachable.');
    }

    if (!response.ok) {
      throw new Error(`AI CV analysis service failed (${response.status}).`);
    }

    let payload: { skills?: unknown[] };
    try {
      payload = (await response.json()) as { skills?: unknown[] };
    } catch {
      throw new Error('AI CV analysis service returned an invalid response.');
    }

    if (!Array.isArray(payload.skills)) {
      return [];
    }

    const skills: AiCvExtractedSkill[] = [];
    for (const item of payload.skills) {
      if (!item || typeof item !== 'object') continue;
      const { name, proficiency_level: rawLevel } = item as {
        name?: unknown;
        proficiency_level?: unknown;
      };
      if (typeof name !== 'string' || !name.trim()) continue;
      const parsedLevel = Number(rawLevel);
      const proficiencyLevel =
        Number.isInteger(parsedLevel) && parsedLevel >= 1 && parsedLevel <= 10
          ? parsedLevel
          : null;
      skills.push({
        name: name.trim().slice(0, 100),
        proficiencyLevel,
      });
    }

    return skills;
  }
}