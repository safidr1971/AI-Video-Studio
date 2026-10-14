import { getAdminFirestore, isFirebaseAdminConfigured, hasRealFirestoreCredentials } from './firebaseAdmin.ts';
import type { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { Project, StoryCategory, AuditEvent, ProjectStats, FactualClaim, ScriptData, ProjectStatus } from '../src/types';
import { computeScriptHash, sanitizeProjectUpdate, validateStatusTransition, recalculateEvidenceStage } from './workflow.ts';
import fs from 'fs';
import path from 'path';

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class FirestoreConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirestoreConfigError';
  }
}

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
  }
}

export class ConcurrencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrencyConflictError';
  }
}

export function translateFirestoreError(err: any): Error {
  if (
    err instanceof ForbiddenError ||
    err instanceof NotFoundError ||
    err instanceof ValidationError ||
    err instanceof NotImplementedError ||
    err instanceof ConcurrencyConflictError ||
    err instanceof FirestoreConfigError
  ) {
    return err;
  }
  const msg = err?.message || '';
  if (msg.includes('Could not load the default credentials') || err?.code === 7 || err?.code === 'permission-denied') {
    return new FirestoreConfigError(
      'Google Cloud Firestore credentials are not configured on this host. Please configure Firebase credentials.'
    );
  }
  if (err?.code === 9 || err?.code === 'failed-precondition') {
    return new Error(`Firestore Precondition / Composite Index Notice: ${msg}`);
  }
  if (err?.code === 14 || err?.code === 'unavailable') {
    return new Error('Firestore service is temporarily unavailable. Please retry the operation.');
  }
  return err;
}

export function validateClaimEvidence(claim: Partial<FactualClaim>): void {
  if (claim.status === 'Supported') {
    if (!claim.evidence || typeof claim.evidence !== 'string' || claim.evidence.trim().length < 10) {
      throw new ValidationError(
        'Supported claims require verifiable evidence description (minimum 10 characters).'
      );
    }
    const lowerEv = claim.evidence.trim().toLowerCase();
    const invalidPlaceholders = ['n/a', 'none', 'todo', 'test', 'placeholder', 'asdf', 'unknown', 'tbd', 'fake'];
    if (invalidPlaceholders.includes(lowerEv)) {
      throw new ValidationError(
        'Placeholder or generic evidence is not acceptable for Supported claims.'
      );
    }
    if (!Array.isArray(claim.sourceReferences) || claim.sourceReferences.length === 0) {
      throw new ValidationError(
        'Supported claims require at least one traceable source reference citation or URL.'
      );
    }
    const validSources = claim.sourceReferences.filter(
      (s) => typeof s === 'string' && s.trim().length >= 4 && !invalidPlaceholders.includes(s.trim().toLowerCase())
    );
    if (validSources.length === 0) {
      throw new ValidationError(
        'Source references must contain traceable citations or URLs.'
      );
    }
    if (!claim.confidenceAssessment || claim.confidenceAssessment === 'Pending' || claim.confidenceAssessment === 'Low') {
      throw new ValidationError(
        'Supported claims must have evaluated confidence assessment (High or Medium).'
      );
    }
  }
}

const INITIAL_CATEGORIES: StoryCategory[] = [
  {
    id: 'scary-stories',
    name: 'Scary Stories',
    description: 'Eerie folklore, creepy urban legends, psychological horror, and unexplained encounters.',
    icon: 'Ghost',
    color: '#8b5cf6',
    projectCount: 0,
    enabled: true,
  },
  {
    id: 'historical-figures',
    name: 'Historical Figures',
    description: 'Intriguing biographies, hidden motivations, and turning points in the lives of historical leaders.',
    icon: 'Crown',
    color: '#f59e0b',
    projectCount: 0,
    enabled: true,
  },
  {
    id: 'greek-mythology',
    name: 'Greek Mythology',
    description: 'Epic tales of the Olympian gods, heroes, tragic hubris, monsters, and divine vengeance.',
    icon: 'Zap',
    color: '#3b82f6',
    projectCount: 0,
    enabled: true,
  },
  {
    id: 'historical-events',
    name: 'Historical Events',
    description: 'Cataclysmic battles, scientific breakthroughs, espionage, and moments that altered world history.',
    icon: 'Landmark',
    color: '#10b981',
    projectCount: 0,
    enabled: true,
  },
  {
    id: 'true-crime',
    name: 'True Crime',
    description: 'Unsolved mysteries, forensic breakthroughs, high-stakes heists, and investigative deep dives.',
    icon: 'ShieldAlert',
    color: '#ef4444',
    projectCount: 0,
    enabled: true,
  },
  {
    id: 'stoic-motivation',
    name: 'Stoic Motivation',
    description: 'Ancient philosophical wisdom from Marcus Aurelius, Seneca, and Epictetus applied to modern discipline.',
    icon: 'Flame',
    color: '#d97706',
    projectCount: 0,
    enabled: true,
  },
  {
    id: 'jokes-funny-stories',
    name: 'Jokes & Funny Stories',
    description: 'Clever observational humor, historical ironies, wit, satire, and comedic timing.',
    icon: 'Smile',
    color: '#ec4899',
    projectCount: 0,
    enabled: true,
  },
];

// In-Memory test/mock store for deterministic unit/integration test isolation
class MockFirestoreStore {
  projects = new Map<string, Project>();
  categories = new Map<string, StoryCategory>();
  auditLogs: AuditEvent[] = [];

  constructor() {
    for (const c of INITIAL_CATEGORIES) {
      this.categories.set(c.id, { ...c });
    }
  }

  clear() {
    this.projects.clear();
    this.categories.clear();
    for (const c of INITIAL_CATEGORIES) {
      this.categories.set(c.id, { ...c });
    }
    this.auditLogs = [];
  }
}

const mockStore = new MockFirestoreStore();

export function isUsingMockFirestore(): boolean {
  if (process.env.NODE_ENV === 'test' || process.env.USE_FIRESTORE_MOCK === 'true') {
    return true;
  }
  // In development environments without live Google Cloud / Firebase credentials, transparently use mock store
  if (process.env.NODE_ENV !== 'production' && !hasRealFirestoreCredentials()) {
    return true;
  }
  return false;
}

export function resetMockFirestore(): void {
  mockStore.clear();
}

export const firestoreDb = {
  async getProjects(ownerId: string): Promise<Project[]> {
    if (!ownerId) throw new ForbiddenError('Owner ID required to retrieve projects');

    if (isUsingMockFirestore()) {
      const list = Array.from(mockStore.projects.values()).filter((p) => p.ownerId === ownerId);
      return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection('projects').where('ownerId', '==', ownerId).get();
      const projects: Project[] = [];
      snapshot.forEach((doc: QueryDocumentSnapshot) => {
        projects.push(doc.data() as Project);
      });
      return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (err: any) {
      throw translateFirestoreError(err);
    }
  },

  async getProjectById(id: string, ownerId: string): Promise<Project | null> {
    if (!ownerId) throw new ForbiddenError('Owner ID required');

    if (isUsingMockFirestore()) {
      const project = mockStore.projects.get(id);
      if (!project) return null;
      if (project.ownerId !== ownerId) {
        throw new ForbiddenError('Access denied: You do not own this project.');
      }
      return project;
    }

    try {
      const db = getAdminFirestore();
      const doc = await db.collection('projects').doc(id).get();
      if (!doc.exists) return null;
      const data = doc.data() as Project;
      if (data.ownerId !== ownerId) {
        throw new ForbiddenError('Access denied: You do not own this project.');
      }
      return data;
    } catch (err: any) {
      throw translateFirestoreError(err);
    }
  },

  async createProject(
    payload: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'workflowStages' | 'status'> & { id?: string; status?: ProjectStatus },
    ownerId: string
  ): Promise<Project> {
    if (!ownerId) throw new ForbiddenError('Owner ID required to create a project');
    if (!payload.title || !payload.title.trim()) {
      throw new ValidationError('Project title is required and cannot be empty.');
    }
    if (!payload.category || !payload.category.trim()) {
      throw new ValidationError('Project category is required.');
    }

    const id = payload.id || `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const scriptHash = payload.script ? computeScriptHash(payload.script) : '';

    // SERVER-SIDE INVARIANT: Newly created claims are strictly normalized to Unverified and Pending
    const normalizedClaims: FactualClaim[] = (payload.claims || []).map((c: any, idx: number) => ({
      id: c.id || `claim-${Date.now()}-${idx}`,
      claimText: String(c.claimText || '').trim(),
      associatedScene: Number(c.associatedScene) || 1,
      status: 'Unverified' as const,
      confidenceAssessment: 'Pending' as const,
      evidence: c.evidence ? String(c.evidence).trim() : undefined,
      sourceReferences: Array.isArray(c.sourceReferences) ? c.sourceReferences : undefined,
      reviewerNotes: c.reviewerNotes ? String(c.reviewerNotes) : 'Initial draft claim. Awaiting verification.',
      updatedAt: now,
    }));

    const initialEvidenceStage = recalculateEvidenceStage(normalizedClaims);

    const newProject: Project = {
      ...payload,
      id,
      ownerId, // Strictly enforced from authenticated identity
      title: payload.title.trim(),
      description: payload.description?.trim() || payload.title.trim(),
      status: 'draft',
      workflowStages: {
        research: 'pending',
        evidence: initialEvidenceStage,
        script: payload.script ? 'ready' : 'draft',
        storyboard: 'pending',
        voiceVisuals: 'pending',
        videoPreview: 'pending',
        approval: 'pending',
        publishing: 'pending',
      },
      currentScriptHash: scriptHash,
      approvalRecord: null,
      publicationRecord: null,
      claims: normalizedClaims,
      createdAt: now,
      updatedAt: now,
    };

    if (isUsingMockFirestore()) {
      mockStore.projects.set(id, newProject);
      mockStore.auditLogs.unshift({
        id: `log-${Date.now()}`,
        projectId: id,
        projectTitle: newProject.title,
        action: 'Project Created',
        details: `Project "${newProject.title}" created with owner ID: ${ownerId}`,
        timestamp: now,
        type: 'create',
      });
      return newProject;
    }

    try {
      const db = getAdminFirestore();
      await db.collection('projects').doc(id).set(newProject);
      await db.collection('audit_logs').add({
        projectId: id,
        projectTitle: newProject.title,
        action: 'Project Created',
        details: `Project "${newProject.title}" created by ${ownerId}`,
        timestamp: now,
        type: 'create',
        userId: ownerId,
      });
      return newProject;
    } catch (err: any) {
      throw translateFirestoreError(err);
    }
  },

  async updateProject(
    id: string,
    rawUpdates: Record<string, any>,
    ownerId: string
  ): Promise<Project> {
    const executeUpdate = (existing: Project): Project => {
      if (existing.ownerId !== ownerId) {
        throw new ForbiddenError(`You do not have permission to modify project ${id}.`);
      }

      // Concurrency check if expectedScriptHash is provided
      if (
        rawUpdates.expectedScriptHash &&
        existing.currentScriptHash &&
        rawUpdates.expectedScriptHash !== existing.currentScriptHash
      ) {
        throw new ConcurrencyConflictError(
          'Script was modified by another operation. Please reload and review the latest changes before saving.'
        );
      }

      // Protect against mass-assignment
      const { sanitized } = sanitizeProjectUpdate(rawUpdates);

      if (rawUpdates.status && rawUpdates.status !== existing.status) {
        const transition = validateStatusTransition(existing.status, rawUpdates.status);
        if (!transition.valid) {
          throw new ValidationError(transition.reason || 'Invalid status transition.');
        }
        sanitized.status = rawUpdates.status;
      }

      const now = new Date().toISOString();
      let scriptVersions = existing.scriptVersions || [];
      let currentScriptHash = existing.currentScriptHash || computeScriptHash(existing.script);
      let approvalRecord = existing.approvalRecord;
      let status = sanitized.status || existing.status;
      let workflowStages = { ...existing.workflowStages };

      // Check if script content changed
      if (sanitized.script) {
        const newHash = computeScriptHash(sanitized.script);
        sanitized.script.contentHash = newHash;

        if (newHash !== currentScriptHash) {
          // Record previous script version in history
          if (existing.script) {
            scriptVersions = [{ ...existing.script }, ...scriptVersions].slice(0, 50);
          }
          currentScriptHash = newHash;

          // Invalidate approval whenever script content changes!
          if (existing.status === 'approved' || approvalRecord?.status === 'approved') {
            approvalRecord = {
              approvedBy: approvalRecord?.approvedBy || '',
              approvedAt: approvalRecord?.approvedAt || now,
              approvedScriptHash: approvalRecord?.approvedScriptHash || '',
              approvedScriptVersion: approvalRecord?.approvedScriptVersion || 1,
              status: 'invalidated',
              notes: 'Approval invalidated automatically: script content was modified.',
            };
            status = 'review'; // Demote back to review
            workflowStages.approval = 'pending';
          }
        }
      }

      // Check if claims changed
      if (sanitized.claims) {
        for (const c of sanitized.claims) {
          validateClaimEvidence(c);
        }
        workflowStages.evidence = recalculateEvidenceStage(sanitized.claims);
        const hasNonSupported = sanitized.claims.some((c) => c.status !== 'Supported');
        if (hasNonSupported && (existing.status === 'approved' || approvalRecord?.status === 'approved')) {
          approvalRecord = {
            approvedBy: approvalRecord?.approvedBy || '',
            approvedAt: approvalRecord?.approvedAt || now,
            approvedScriptHash: approvalRecord?.approvedScriptHash || '',
            approvedScriptVersion: approvalRecord?.approvedScriptVersion || 1,
            status: 'invalidated',
            notes: 'Approval invalidated automatically: Claims modified with non-supported claim statuses.',
          };
          status = 'review';
          workflowStages.approval = 'pending';
        }
      }

      const updated: Project = {
        ...existing,
        ...sanitized,
        id: existing.id,
        ownerId: existing.ownerId, // Immutable
        status,
        workflowStages,
        currentScriptHash,
        approvalRecord,
        scriptVersions,
        updatedAt: now,
      };

      return updated;
    };

    if (isUsingMockFirestore()) {
      const existing = mockStore.projects.get(id);
      if (!existing) throw new NotFoundError(`Project ${id} not found.`);
      const updated = executeUpdate(existing);
      mockStore.projects.set(id, updated);
      mockStore.auditLogs.unshift({
        id: `log-${Date.now()}`,
        projectId: id,
        projectTitle: updated.title,
        action: 'Project Updated',
        details: `Updated project "${updated.title}". Modified fields: ${Object.keys(rawUpdates).join(', ')}`,
        timestamp: updated.updatedAt,
        type: 'update',
      });
      return updated;
    }

    try {
      const db = getAdminFirestore();
      return await db.runTransaction(async (transaction) => {
        const docRef = db.collection('projects').doc(id);
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists) {
          throw new NotFoundError(`Project ${id} not found.`);
        }
        const existing = docSnap.data() as Project;
        const updated = executeUpdate(existing);
        transaction.set(docRef, updated);

        const auditRef = db.collection('audit_logs').doc();
        transaction.set(auditRef, {
          projectId: id,
          projectTitle: updated.title,
          action: 'Project Updated',
          details: `Updated project "${updated.title}" by ${ownerId}`,
          timestamp: updated.updatedAt,
          type: 'update',
          userId: ownerId,
        });

        return updated;
      });
    } catch (err: any) {
      throw translateFirestoreError(err);
    }
  },

  async approveProject(
    id: string,
    ownerId: string,
    scriptHash: string,
    notes?: string
  ): Promise<Project> {
    const executeApproval = (existing: Project): Project => {
      if (existing.ownerId !== ownerId) {
        throw new ForbiddenError(`You do not have permission to approve project ${id}.`);
      }

      // STATE MACHINE RULE: Project must be in 'review' state before formal approval
      if (existing.status !== 'review') {
        throw new ValidationError(
          `Cannot approve project: Project must be in 'review' status before formal approval. Current status is '${existing.status}'.`
        );
      }

      if (!existing.script || !Array.isArray(existing.script.scenes) || existing.script.scenes.length === 0) {
        throw new ValidationError('Cannot approve project without a valid script containing scenes.');
      }

      const currentHash = computeScriptHash(existing.script);
      if (scriptHash !== currentHash) {
        throw new ValidationError(
          'Script hash mismatch: The script was updated since approval was requested. Please refresh and review the latest script.'
        );
      }

      // Verify all factual claims are present, Supported, and have required evidence
      const claims = existing.claims || [];
      if (claims.length === 0) {
        throw new ValidationError(
          'Cannot approve project without factual claims verification. Extract or add claims in the Evidence tab.'
        );
      }

      for (const c of claims) {
        if (c.status !== 'Supported') {
          throw new ValidationError(
            `Cannot approve project: Claim "${c.claimText.slice(0, 30)}..." has status "${c.status}". All factual claims must have status "Supported" before formal approval.`
          );
        }
        validateClaimEvidence(c);
      }

      const now = new Date().toISOString();
      const approvalRecord = {
        approvedBy: ownerId,
        approvedAt: now,
        approvedScriptHash: currentHash,
        approvedScriptVersion: existing.script.version,
        status: 'approved' as const,
        notes: notes || 'Verified and approved by editorial reviewer.',
      };

      const updated: Project = {
        ...existing,
        status: 'approved',
        workflowStages: {
          ...existing.workflowStages,
          approval: 'approved',
        },
        approvalRecord,
        updatedAt: now,
      };

      return updated;
    };

    if (isUsingMockFirestore()) {
      const existing = mockStore.projects.get(id);
      if (!existing) throw new NotFoundError(`Project ${id} not found.`);
      const updated = executeApproval(existing);
      mockStore.projects.set(id, updated);
      mockStore.auditLogs.unshift({
        id: `log-${Date.now()}`,
        projectId: id,
        projectTitle: updated.title,
        action: 'Project Approved',
        details: `Project "${updated.title}" formally approved by ${ownerId} (Hash: ${scriptHash.slice(0, 8)})`,
        timestamp: updated.updatedAt,
        type: 'approval',
      });
      return updated;
    }

    try {
      const db = getAdminFirestore();
      return await db.runTransaction(async (transaction) => {
        const docRef = db.collection('projects').doc(id);
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists) {
          throw new NotFoundError(`Project ${id} not found.`);
        }
        const existing = docSnap.data() as Project;
        const updated = executeApproval(existing);
        transaction.set(docRef, updated);

        const auditRef = db.collection('audit_logs').doc();
        transaction.set(auditRef, {
          projectId: id,
          projectTitle: updated.title,
          action: 'Project Approved',
          details: `Project "${updated.title}" formally approved by ${ownerId}`,
          timestamp: updated.updatedAt,
          type: 'approval',
          userId: ownerId,
        });

        return updated;
      });
    } catch (err: any) {
      throw translateFirestoreError(err);
    }
  },

  async publishProject(
    id: string,
    ownerId: string,
    scriptHash: string,
    platform: string
  ): Promise<Project> {
    const executePreflightCheck = (existing: Project): void => {
      if (existing.ownerId !== ownerId) {
        throw new ForbiddenError(`You do not have permission to publish project ${id}.`);
      }

      if (existing.status !== 'approved' || !existing.approvalRecord || existing.approvalRecord.status !== 'approved') {
        throw new ValidationError(
          'Cannot publish project: Project must have an active approval before publication.'
        );
      }

      // Invariant: All factual claims must be Supported before publication
      const claims = existing.claims || [];
      const hasNonSupported = claims.some((c) => c.status !== 'Supported');
      if (hasNonSupported) {
        throw new ValidationError(
          'Cannot publish project: All factual claims must have status "Supported" before publication.'
        );
      }
      for (const c of claims) {
        validateClaimEvidence(c);
      }

      const currentHash = computeScriptHash(existing.script);
      if (existing.approvalRecord.approvedScriptHash !== currentHash || scriptHash !== currentHash) {
        throw new ValidationError(
          'Cannot publish project: Approved script version does not match current script. Approval has been invalidated.'
        );
      }

      // PHASE 1 REALITY GATE:
      // Social publishing integrations (YouTube Shorts, TikTok, Instagram Reels) are outside Phase 1.
      // An unconfigured adapter must NOT mark the project published and must NOT create a publication record.
      // Throw NotImplementedError (maps to 501 PUBLISHING_NOT_IMPLEMENTED).
      throw new NotImplementedError(
        `Publishing adapter for platform "${platform || 'YouTube Shorts'}" is not yet configured in Phase 1. Real social media distribution integrations are scheduled for Phase 2. The project remains in approved state.`
      );
    };

    if (isUsingMockFirestore()) {
      const existing = mockStore.projects.get(id);
      if (!existing) throw new NotFoundError(`Project ${id} not found.`);
      executePreflightCheck(existing);
      return existing; // unreachable due to throw
    }

    try {
      const db = getAdminFirestore();
      return await db.runTransaction(async (transaction) => {
        const docRef = db.collection('projects').doc(id);
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists) {
          throw new NotFoundError(`Project ${id} not found.`);
        }
        const existing = docSnap.data() as Project;
        executePreflightCheck(existing);
        return existing; // unreachable
      });
    } catch (err: any) {
      throw translateFirestoreError(err);
    }
  },

  async deleteProject(id: string, ownerId: string): Promise<boolean> {
    const existing = await this.getProjectById(id, ownerId);
    if (!existing) return false;

    if (isUsingMockFirestore()) {
      mockStore.projects.delete(id);
      mockStore.auditLogs.unshift({
        id: `log-${Date.now()}`,
        projectId: id,
        projectTitle: existing.title,
        action: 'Project Deleted',
        details: `Project "${existing.title}" deleted by ${ownerId}`,
        timestamp: new Date().toISOString(),
        type: 'delete',
      });
      return true;
    }

    try {
      const db = getAdminFirestore();
      await db.collection('projects').doc(id).delete();
      await db.collection('audit_logs').add({
        projectId: id,
        projectTitle: existing.title,
        action: 'Project Deleted',
        details: `Project "${existing.title}" deleted by ${ownerId}`,
        timestamp: new Date().toISOString(),
        type: 'delete',
        userId: ownerId,
      });
      return true;
    } catch (err: any) {
      throw translateFirestoreError(err);
    }
  },

  async updateClaim(
    projectId: string,
    claimId: string,
    updates: Partial<FactualClaim>,
    ownerId: string
  ): Promise<FactualClaim> {
    const executeClaimUpdate = (project: Project): FactualClaim => {
      if (project.ownerId !== ownerId) {
        throw new ForbiddenError(`You do not have permission to modify project ${projectId}.`);
      }

      const claims = project.claims || [];
      const claimIndex = claims.findIndex((c) => c.id === claimId);
      if (claimIndex === -1) {
        throw new NotFoundError(`Claim ${claimId} not found in project.`);
      }

      const oldClaim = claims[claimIndex];
      const mergedClaim: FactualClaim = {
        ...oldClaim,
        ...updates,
        id: oldClaim.id,
        updatedAt: new Date().toISOString(),
      };

      // Strict validation for Supported claims
      if (mergedClaim.status === 'Supported') {
        validateClaimEvidence(mergedClaim);
      }

      claims[claimIndex] = mergedClaim;
      project.claims = claims;
      project.workflowStages = {
        ...project.workflowStages,
        evidence: recalculateEvidenceStage(claims),
      };

      // SYSTEM-CONTROLLED WORKFLOW INVALIDATION:
      // If any claim is no longer Supported (e.g. Disputed, Contradicted, Unverified, Partially supported),
      // invalidate any existing approval, set workflow stage approval to pending, and demote status to review.
      const hasNonSupported = claims.some((c) => c.status !== 'Supported');
      if (hasNonSupported && (project.status === 'approved' || project.approvalRecord?.status === 'approved')) {
        project.status = 'review';
        project.workflowStages.approval = 'pending';
        project.approvalRecord = {
          approvedBy: project.approvalRecord?.approvedBy || '',
          approvedAt: project.approvalRecord?.approvedAt || new Date().toISOString(),
          approvedScriptHash: project.approvalRecord?.approvedScriptHash || '',
          approvedScriptVersion: project.approvalRecord?.approvedScriptVersion || 1,
          status: 'invalidated',
          notes: `Approval invalidated: Claim "${mergedClaim.claimText.slice(0, 30)}..." changed to ${mergedClaim.status}. All claims must remain Supported.`,
        };
      }

      project.updatedAt = new Date().toISOString();
      return mergedClaim;
    };

    if (isUsingMockFirestore()) {
      const project = mockStore.projects.get(projectId);
      if (!project) throw new NotFoundError(`Project ${projectId} not found.`);
      const updatedClaim = executeClaimUpdate(project);
      mockStore.projects.set(projectId, project);
      mockStore.auditLogs.unshift({
        id: `log-${Date.now()}`,
        projectId,
        projectTitle: project.title,
        action: 'Claim Updated',
        details: `Claim "${updatedClaim.claimText.slice(0, 40)}" status updated to ${updatedClaim.status} by ${ownerId}`,
        timestamp: updatedClaim.updatedAt || new Date().toISOString(),
        type: 'update',
      });
      return updatedClaim;
    }

    try {
      const db = getAdminFirestore();
      return await db.runTransaction(async (transaction) => {
        const docRef = db.collection('projects').doc(projectId);
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists) {
          throw new NotFoundError(`Project ${projectId} not found.`);
        }
        const project = docSnap.data() as Project;
        const updatedClaim = executeClaimUpdate(project);
        transaction.set(docRef, project);

        const auditRef = db.collection('audit_logs').doc();
        transaction.set(auditRef, {
          projectId,
          projectTitle: project.title,
          action: 'Claim Updated',
          details: `Claim "${updatedClaim.claimText.slice(0, 40)}" status updated to ${updatedClaim.status} by ${ownerId}`,
          timestamp: updatedClaim.updatedAt || new Date().toISOString(),
          type: 'update',
          userId: ownerId,
        });

        return updatedClaim;
      });
    } catch (err: any) {
      throw translateFirestoreError(err);
    }
  },

  async getCategories(): Promise<StoryCategory[]> {
    if (isUsingMockFirestore()) {
      return Array.from(mockStore.categories.values());
    }

    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection('categories').get();
      if (snapshot.empty) {
        const batch = db.batch();
        for (const cat of INITIAL_CATEGORIES) {
          const docRef = db.collection('categories').doc(cat.id);
          batch.set(docRef, cat);
        }
        await batch.commit();
        return INITIAL_CATEGORIES;
      }
      const list: StoryCategory[] = [];
      snapshot.forEach((doc: QueryDocumentSnapshot) => list.push(doc.data() as StoryCategory));
      return list;
    } catch (err: any) {
      return INITIAL_CATEGORIES;
    }
  },

  async addCategory(cat: Omit<StoryCategory, 'projectCount'>): Promise<StoryCategory> {
    const newCat: StoryCategory = {
      ...cat,
      projectCount: 0,
      isCustom: true,
    };

    if (isUsingMockFirestore()) {
      mockStore.categories.set(newCat.id, newCat);
      return newCat;
    }

    try {
      const db = getAdminFirestore();
      await db.collection('categories').doc(newCat.id).set(newCat);
      return newCat;
    } catch (err: any) {
      throw translateFirestoreError(err);
    }
  },

  async toggleCategory(id: string): Promise<StoryCategory | null> {
    if (isUsingMockFirestore()) {
      const cat = mockStore.categories.get(id);
      if (!cat) return null;
      cat.enabled = !cat.enabled;
      return cat;
    }

    try {
      const db = getAdminFirestore();
      const docRef = db.collection('categories').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return null;
      const cat = doc.data() as StoryCategory;
      cat.enabled = !cat.enabled;
      await docRef.update({ enabled: cat.enabled });
      return cat;
    } catch (err: any) {
      throw translateFirestoreError(err);
    }
  },

  async getStats(ownerId: string): Promise<ProjectStats> {
    const projects = await this.getProjects(ownerId);
    return {
      totalProjects: projects.length,
      projectsInProgress: projects.filter((p) => p.status !== 'approved' && p.status !== 'published').length,
      completedScripts: projects.filter((p) => p.workflowStages.script === 'ready' || p.workflowStages.script === 'revised').length,
      videosReadyForReview: projects.filter((p) => p.status === 'review' || p.workflowStages.videoPreview === 'ready').length,
      pendingApprovals: projects.filter((p) => p.workflowStages.approval === 'pending' && p.status === 'review').length,
      publishedCount: projects.filter((p) => p.status === 'published').length,
    };
  },

  async getAuditLogs(ownerId?: string, limit = 50): Promise<AuditEvent[]> {
    if (isUsingMockFirestore()) {
      return mockStore.auditLogs.slice(0, limit);
    }

    try {
      const db = getAdminFirestore();
      let query: Query = db.collection('audit_logs').orderBy('timestamp', 'desc').limit(limit);
      if (ownerId) {
        query = db.collection('audit_logs').where('userId', '==', ownerId).limit(limit);
      }
      const snapshot = await query.get();
      const logs: AuditEvent[] = [];
      snapshot.forEach((doc: QueryDocumentSnapshot) => logs.push({ id: doc.id, ...(doc.data() as any) }));
      return logs;
    } catch (err) {
      return [];
    }
  },

  async migrateFromJson(targetOwnerId: string): Promise<{ migratedProjects: number; skipped: number; backupPath: string }> {
    const jsonPath = path.resolve(process.cwd(), 'data', 'app_data.json');
    if (!fs.existsSync(jsonPath)) {
      return { migratedProjects: 0, skipped: 0, backupPath: 'No json file found' };
    }

    const backupPath = path.resolve(process.cwd(), 'data', `app_data.backup.${Date.now()}.json`);
    fs.copyFileSync(jsonPath, backupPath);

    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const projects: Project[] = parsed.projects || [];

    let migrated = 0;
    let skipped = 0;

    for (const proj of projects) {
      try {
        const id = proj.id;
        const ownerId = proj.ownerId || targetOwnerId;
        const scriptHash = proj.script ? computeScriptHash(proj.script) : '';
        const projectRecord: Project = {
          ...proj,
          ownerId,
          currentScriptHash: scriptHash,
          approvalRecord: proj.approvalRecord || null,
          publicationRecord: proj.publicationRecord || null,
          updatedAt: new Date().toISOString(),
        };

        if (isUsingMockFirestore()) {
          mockStore.projects.set(id, projectRecord);
        } else {
          const db = getAdminFirestore();
          await db.collection('projects').doc(id).set(projectRecord, { merge: true });
        }
        migrated++;
      } catch (err) {
        skipped++;
      }
    }

    return { migratedProjects: migrated, skipped, backupPath };
  },
};
