import crypto from 'crypto';
import { Project, ProjectStatus, ScriptData, ApprovalRecord, PublicationRecord } from '../src/types';

export function computeScriptHash(script?: ScriptData | null): string {
  if (!script) return '';
  const normalized = {
    title: (script.title || '').trim(),
    hook: (script.hook || '').trim(),
    callToAction: (script.callToAction || '').trim(),
    scenes: (script.scenes || []).map((s) => ({
      sceneNumber: s.sceneNumber,
      narration: (s.narration || '').trim(),
      visualPrompt: (s.visualPrompt || '').trim(),
      durationSeconds: Number(s.durationSeconds) || 0,
      transition: (s.transition || '').trim(),
      soundCue: (s.soundCue || '').trim(),
    })),
  };
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

export const LEGAL_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  draft: ['ideation', 'research', 'scripting'],
  ideation: ['draft', 'research', 'scripting'],
  research: ['scripting', 'storyboarding'],
  scripting: ['storyboarding', 'review', 'research'],
  storyboarding: ['scripting', 'rendering', 'review'],
  rendering: ['review', 'storyboarding'],
  review: ['scripting', 'storyboarding', 'rendering'], // 'approved' can only be reached via dedicated approveProject
  approved: ['review', 'scripting'], // 'published' can only be reached via dedicated publishProject
  published: [], // terminal state unless explicitly un-published
};

export function validateStatusTransition(
  currentStatus: ProjectStatus,
  targetStatus: ProjectStatus
): { valid: boolean; reason?: string } {
  if (targetStatus === 'approved') {
    return {
      valid: false,
      reason: "Cannot set status to 'approved' via generic project update. Use the dedicated POST /api/projects/:id/approve endpoint.",
    };
  }

  if (targetStatus === 'published') {
    return {
      valid: false,
      reason: "Cannot set status to 'published' via generic project update. Use the dedicated POST /api/projects/:id/publish endpoint.",
    };
  }

  if (currentStatus === targetStatus) {
    return { valid: true };
  }

  const allowed = LEGAL_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      reason: `Illegal status transition from '${currentStatus}' to '${targetStatus}'. Allowed transitions: ${allowed.join(', ') || 'none'}.`,
    };
  }

  return { valid: true };
}

export const PROTECTED_FIELDS = [
  'ownerId',
  'status',
  'approvalRecord',
  'publicationRecord',
  'id',
  'createdAt',
  'currentScriptHash',
] as const;

export function sanitizeProjectUpdate(payload: Record<string, any>): {
  sanitized: Partial<Project>;
  attemptedProtectedFields: string[];
} {
  const sanitized: Record<string, any> = {};
  const attemptedProtectedFields: string[] = [];

  for (const [key, value] of Object.entries(payload)) {
    if ((PROTECTED_FIELDS as readonly string[]).includes(key)) {
      attemptedProtectedFields.push(key);
    } else {
      sanitized[key] = value;
    }
  }

  return { sanitized, attemptedProtectedFields };
}
