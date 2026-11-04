import { Injectable, Logger } from '@nestjs/common';

export interface ModerationRequest {
  text: string;
  context?: string;
}

export interface ModerationResult {
  decision: 'BLOCK' | 'REVIEW' | 'ALLOW';
  score: number;
  categories: string[];
  matches?: unknown[];
  risk?: string;
  recommendation?: string;
}

export interface ModerationResponse {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  score: number;
  categories: string[];
  matches?: unknown[];
  risk?: string;
  recommendation?: string;
  message?: string;
  language?: string;
}

@Injectable()
export class AIModerationService {
  private readonly logger = new Logger(AIModerationService.name);
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl =
      process.env.AI_MODERATION_URL || 'http://localhost:8001/api/v1';
    this.timeout = parseInt(process.env.AI_MODERATION_TIMEOUT || '30000', 10);
  }

  /**
   * Moderate text content (post or comment)
   * Returns moderation decision with score and categories
   */
  async moderateContent(
    request: ModerationRequest,
  ): Promise<ModerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(
          `AI Moderation service responded with status ${response.status}`,
        );
      }

      const result: ModerationResult = await response.json();

      // Map decision to status
      return this.mapDecisionToStatus(result);
    } catch (error) {
      this.logger.error('AI Moderation service error', error);

      // Fallback: approve content if service fails
      return {
        status: 'APPROVED',
        score: 0,
        categories: [],
        risk: 'SERVICE_UNAVAILABLE',
        recommendation: 'Approved due to service unavailability',
      };
    }
  }

  /**
   * Batch moderate multiple contents
   */
  async moderateBatch(
    requests: ModerationRequest[],
  ): Promise<ModerationResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/moderate/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: requests }),
        signal: AbortSignal.timeout(this.timeout * 2),
      });

      if (!response.ok) {
        throw new Error(
          `AI Moderation service responded with status ${response.status}`,
        );
      }

      const results: ModerationResult[] = await response.json();

      return results.map((result) => this.mapDecisionToStatus(result));
    } catch (error) {
      this.logger.error('AI Moderation batch service error', error);

      // Fallback: approve all content if service fails
      return requests.map(() => ({
        status: 'APPROVED' as const,
        score: 0,
        categories: [],
        risk: 'SERVICE_UNAVAILABLE',
        recommendation: 'Approved due to service unavailability',
      }));
    }
  }

  /**
   * Map AI decision to forum moderation status
   * BLOCK -> REJECTED
   * REVIEW -> PENDING (requires manual review)
   * ALLOW -> APPROVED
   */
  private mapDecisionToStatus(result: ModerationResult): ModerationResponse {
    const decisionMap: Record<
      ModerationResult['decision'],
      'PENDING' | 'APPROVED' | 'REJECTED'
    > = {
      BLOCK: 'REJECTED',
      REVIEW: 'PENDING',
      ALLOW: 'APPROVED',
    };

    return {
      status: decisionMap[result.decision],
      score: result.score,
      categories: result.categories,
      matches: result.matches,
      risk: result.risk,
      recommendation: result.recommendation,
      message: (result as any).message,
      language: (result as any).language,
    };
  }

  /**
   * Check if moderation service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
