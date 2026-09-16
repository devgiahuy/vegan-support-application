import { AiFlagRiskLevel } from '@prisma/client';
import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';

export const MODERATION_RULE_VERSION = 'moderation-rules-v1';

export interface RuleModerationInput {
  title: string;
  excerpt?: string | undefined;
  body: string;
  tags: string[];
}

export interface RuleModerationFlag {
  provider: 'RULE_ENGINE';
  model: 'deterministic-moderation';
  ruleVersion: typeof MODERATION_RULE_VERSION;
  reasonCodes: string[];
  riskScore: number;
  riskLevel: AiFlagRiskLevel;
}

const harmfulHealthPatterns = [
  'chua khoi ung thu',
  'bo insulin',
  'ngung thuoc',
  'uong bleach',
  'cure cancer',
  'stop medication',
];

const healthClaimPatterns = [
  'chua benh',
  'dieu tri benh',
  'thay the thuoc',
  'detox',
  'medical advice',
];

export class RuleModerationService {
  moderate(input: RuleModerationInput): RuleModerationFlag | null {
    const raw = [input.title, input.excerpt ?? '', input.body, ...input.tags].join(' ');
    const normalized = normalizeVietnameseText(raw);
    const reasonCodes: string[] = [];
    let riskScore = 0;

    if (harmfulHealthPatterns.some((pattern) => normalized.includes(pattern))) {
      reasonCodes.push('HARMFUL_HEALTH_CLAIM');
      riskScore = Math.max(riskScore, 0.98);
    }

    const urlCount = raw.match(/https?:\/\//giu)?.length ?? 0;
    const repeatedContact = /(\d[\s.-]?){10,}/u.test(raw);
    if (urlCount >= 4 || (urlCount >= 2 && repeatedContact)) {
      reasonCodes.push('SPAM_HIGH_CONFIDENCE');
      riskScore = Math.max(riskScore, 0.93);
    }

    if (healthClaimPatterns.some((pattern) => normalized.includes(pattern))) {
      reasonCodes.push('UNVERIFIED_HEALTH_CLAIM');
      riskScore = Math.max(riskScore, 0.62);
    }

    if (urlCount >= 2 && !reasonCodes.includes('SPAM_HIGH_CONFIDENCE')) {
      reasonCodes.push('PROMOTIONAL_SPAM_SIGNAL');
      riskScore = Math.max(riskScore, 0.35);
    }

    if (!reasonCodes.length) return null;
    const riskLevel =
      riskScore >= 0.9
        ? AiFlagRiskLevel.HIGH
        : riskScore >= 0.5
          ? AiFlagRiskLevel.MEDIUM
          : AiFlagRiskLevel.LOW;
    return {
      provider: 'RULE_ENGINE',
      model: 'deterministic-moderation',
      ruleVersion: MODERATION_RULE_VERSION,
      reasonCodes: [...new Set(reasonCodes)],
      riskScore,
      riskLevel,
    };
  }
}
