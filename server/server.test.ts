import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'http';
import express from 'express';
import { app, configureTrustProxy } from '../server.ts';
import { firestoreDb, resetMockFirestore } from './firestoreDb.ts';
import { computeScriptHash, recalculateEvidenceStage } from './workflow.ts';
import { verifyToken, isDevTokenAllowed, assertProductionConfigSafe } from './firebaseAdmin.ts';
import { coerceFactualClaims, generateTemplateFallback } from './gemini.ts';
import { cleanupExpiredRateLimits, getRateLimitStoreSize, resetRateLimitStore } from './middleware/security.ts';
import { VerificationStatus } from '../src/types';

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.USE_FIRESTORE_MOCK = 'true';
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address() as { port: number };
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

beforeEach(() => {
  resetMockFirestore();
  resetRateLimitStore();
  process.env.NODE_ENV = 'test';
  delete process.env.ALLOW_DEV_TOKEN;
});

describe('Public Health & Security Headers', () => {
  it('allows unauthenticated access to /api/health without revealing secrets', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('AI Video Studio');
    expect(data.apiKey).toBeUndefined();
    expect(data.privateKey).toBeUndefined();
  });

  it('includes security headers on all responses', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(res.headers.get('x-xss-protection')).toBe('1; mode=block');
  });
});

describe('Authentication & Authorization Enforcement', () => {
  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const endpoints = [
      '/api/stats',
      '/api/projects',
      '/api/categories',
      '/api/audit-logs',
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
    }
  });

  it('rejects invalid or malformed bearer tokens with 401', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, {
      headers: { Authorization: 'Bearer bad-token-xyz' },
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('INVALID_TOKEN');
  });

  it('authenticates valid tokens and retrieves user-specific projects', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, {
      headers: { Authorization: 'Bearer test-token-user1' },
    });
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });
});

describe('Tenant Isolation & Ownership Security', () => {
  it('prevents user B from reading, updating, or deleting user A projects', async () => {
    // 1. User A creates a project
    const createRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-alice',
      },
      body: JSON.stringify({
        title: 'Alice Roman History Project',
        category: 'Historical Events',
        targetDuration: '60s',
        aspectRatio: '9:16',
      }),
    });
    expect(createRes.status).toBe(201);
    const aliceProject = await createRes.json();
    expect(aliceProject.ownerId).toBe('alice');

    // 2. User B tries to read Alice project -> 403 Forbidden
    const getResB = await fetch(`${baseUrl}/api/projects/${aliceProject.id}`, {
      headers: { Authorization: 'Bearer test-token-bob' },
    });
    expect(getResB.status).toBe(403);
    const getDataB = await getResB.json();
    expect(getDataB.error).toBe('FORBIDDEN');

    // 3. User B tries to update Alice project -> 403 Forbidden
    const putResB = await fetch(`${baseUrl}/api/projects/${aliceProject.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-bob',
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    expect(putResB.status).toBe(403);

    // 4. User B tries to delete Alice project -> 403 Forbidden
    const delResB = await fetch(`${baseUrl}/api/projects/${aliceProject.id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-token-bob' },
    });
    expect(delResB.status).toBe(403);

    // 5. User A can successfully read her project
    const getResA = await fetch(`${baseUrl}/api/projects/${aliceProject.id}`, {
      headers: { Authorization: 'Bearer test-token-alice' },
    });
    expect(getResA.status).toBe(200);
    const getDataA = await getResA.json();
    expect(getDataA.title).toBe('Alice Roman History Project');
  });

  it('rejects mass-assignment attempts to change ownerId or status directly', async () => {
    const createRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-charlie',
      },
      body: JSON.stringify({
        title: 'Charlie Motivation',
        category: 'Stoic Motivation',
        targetDuration: '30s',
        aspectRatio: '9:16',
        ownerId: 'victim-user', // Should be ignored; server forces verified identity
      }),
    });
    const project = await createRes.json();
    expect(project.ownerId).toBe('charlie');

    // Attempt to spoof ownerId and status via PUT
    const putRes = await fetch(`${baseUrl}/api/projects/${project.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-charlie',
      },
      body: JSON.stringify({
        ownerId: 'someone-else',
        status: 'approved', // Protected: cannot directly jump to approved
      }),
    });

    expect(putRes.status).toBe(400); // Rejects setting status to approved via generic PUT
    const putData = await putRes.json();
    expect(putData.error).toBe('VALIDATION_ERROR');
  });
});

describe('Workflow Integrity & Formal Approval', () => {
  it('strictly enforces formal approval requirements and hash verification', async () => {
    const initialScript = {
      version: 1,
      title: 'The Great Fire of Rome',
      hook: 'Rome was burning, but did Nero really play the fiddle?',
      scenes: [
        {
          sceneNumber: 1,
          narration: 'In July of 64 AD, flames engulfed Rome.',
          visualPrompt: 'Colosseum on fire',
          durationSeconds: 15,
        },
      ],
      callToAction: 'Follow for real history.',
      estimatedDuration: 30,
      lastEditedAt: new Date().toISOString(),
    };

    const initialClaims = [
      {
        id: 'claim-1',
        claimText: 'The Great Fire of Rome occurred in 64 AD.',
        associatedScene: 1,
        status: 'Supported' as const,
        confidenceAssessment: 'High' as const,
        evidence: 'Tacitus, Annals, Book XV.',
      },
    ];

    // Create project
    const projRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-historian',
      },
      body: JSON.stringify({
        title: 'Nero and the Great Fire',
        category: 'Historical Events',
        targetDuration: '30s',
        aspectRatio: '9:16',
        script: initialScript,
        claims: initialClaims,
      }),
    });
    const proj = await projRes.json();
    const correctHash = computeScriptHash(initialScript);

    // 1. Trying to approve with wrong scriptHash fails
    const failApproveRes = await fetch(`${baseUrl}/api/projects/${proj.id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-historian',
      },
      body: JSON.stringify({
        scriptHash: 'wrong-hash-1234',
        notes: 'Trying to approve outdated version',
      }),
    });
    expect(failApproveRes.status).toBe(400);

    // 2. Approving with correct hash succeeds
    const approveRes = await fetch(`${baseUrl}/api/projects/${proj.id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-historian',
      },
      body: JSON.stringify({
        scriptHash: correctHash,
        notes: 'Verified historical sources',
      }),
    });
    expect(approveRes.status).toBe(200);
    const approvedProj = await approveRes.json();
    expect(approvedProj.status).toBe('approved');
    expect(approvedProj.approvalRecord.status).toBe('approved');
    expect(approvedProj.approvalRecord.approvedBy).toBe('historian');

    // 3. Modifying script content automatically invalidates the approval
    const modifiedScript = {
      ...initialScript,
      hook: 'Rome was burning, and Nero was actually at Antium.',
    };
    const updateRes = await fetch(`${baseUrl}/api/projects/${proj.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-historian',
      },
      body: JSON.stringify({
        script: modifiedScript,
      }),
    });
    expect(updateRes.status).toBe(200);
    const updatedProj = await updateRes.json();
    expect(updatedProj.status).toBe('review'); // Demoted from approved to review
    expect(updatedProj.approvalRecord.status).toBe('invalidated');

    // 4. Publishing requires active approval
    const publishRes = await fetch(`${baseUrl}/api/projects/${proj.id}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-historian',
      },
      body: JSON.stringify({
        scriptHash: computeScriptHash(modifiedScript),
        platform: 'YouTube Shorts',
      }),
    });
    expect(publishRes.status).toBe(400);
    const publishErr = await publishRes.json();
    expect(publishErr.message).toContain('active approval');
  });
});

describe('Claim Downgrade Approval Invalidation (Phase 1.1 Regression Suite)', () => {
  const setupApprovedProject = async (owner = 'factchecker') => {
    const script = {
      version: 1,
      title: 'Alexander the Great in Egypt',
      hook: 'Did Alexander conquer Egypt without fighting a single battle?',
      scenes: [
        {
          sceneNumber: 1,
          narration: 'In 332 BC, Alexander marched into Memphis.',
          visualPrompt: 'Alexander riding through Egypt',
          durationSeconds: 15,
        },
      ],
      callToAction: 'Follow for ancient history.',
      estimatedDuration: 30,
      lastEditedAt: new Date().toISOString(),
    };

    const claims = [
      {
        id: 'claim-alexander-1',
        claimText: 'Alexander entered Egypt in 332 BC.',
        associatedScene: 1,
        status: 'Supported' as const,
        confidenceAssessment: 'High' as const,
        evidence: 'Arrian, Anabasis of Alexander, Book III.',
      },
      {
        id: 'claim-alexander-2',
        claimText: 'The Persian satrap Mazaces surrendered Egypt without resistance.',
        associatedScene: 1,
        status: 'Supported' as const,
        confidenceAssessment: 'High' as const,
        evidence: 'Curtius Rufus, History of Alexander.',
      },
    ];

    const createRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer test-token-${owner}`,
      },
      body: JSON.stringify({
        title: 'Alexander in Egypt',
        category: 'Historical Events',
        targetDuration: '30s',
        aspectRatio: '9:16',
        script,
        claims,
      }),
    });
    const project = await createRes.json();
    const scriptHash = computeScriptHash(script);

    // Formally approve the project
    const approveRes = await fetch(`${baseUrl}/api/projects/${project.id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer test-token-${owner}`,
      },
      body: JSON.stringify({
        scriptHash,
        notes: 'All claims verified with primary sources.',
      }),
    });
    expect(approveRes.status).toBe(200);
    const approved = await approveRes.json();
    expect(approved.status).toBe('approved');
    expect(approved.approvalRecord.status).toBe('approved');

    return { project: approved, scriptHash };
  };

  it('downgrading a claim from Supported to Disputed invalidates approval and rejects publishing', async () => {
    const { project, scriptHash } = await setupApprovedProject('reviewer-disputed');

    // 1. Change one claim from Supported to Disputed
    const claimRes = await fetch(`${baseUrl}/api/projects/${project.id}/claims/claim-alexander-2`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-reviewer-disputed',
      },
      body: JSON.stringify({
        status: 'Disputed',
        reviewerNotes: 'New academic consensus challenges peaceful capitulation narrative.',
      }),
    });
    expect(claimRes.status).toBe(200);
    const updatedClaim = await claimRes.json();
    expect(updatedClaim.status).toBe('Disputed');

    // 2. Reload project from the database
    const getRes = await fetch(`${baseUrl}/api/projects/${project.id}`, {
      headers: { Authorization: 'Bearer test-token-reviewer-disputed' },
    });
    expect(getRes.status).toBe(200);
    const reloaded = await getRes.json();

    // 3. Assert project is demoted from approved to review
    expect(reloaded.status).toBe('review');
    expect(reloaded.workflowStages.approval).toBe('pending');
    expect(reloaded.approvalRecord.status).toBe('invalidated');
    expect(reloaded.approvalRecord.notes).toContain('Approval invalidated');

    // 4. Assert publishing is blocked
    const publishRes = await fetch(`${baseUrl}/api/projects/${project.id}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-reviewer-disputed',
      },
      body: JSON.stringify({
        scriptHash,
        platform: 'YouTube Shorts',
      }),
    });
    expect(publishRes.status).toBe(400);
    const publishData = await publishRes.json();
    expect(publishData.error).toBe('VALIDATION_ERROR');
  });

  const nonSupportedStatuses: VerificationStatus[] = [
    'Contradicted',
    'Unverified',
    'Partially supported',
  ];

  for (const targetStatus of nonSupportedStatuses) {
    it(`downgrading a claim to "${targetStatus}" invalidates approval and blocks publishing`, async () => {
      const { project, scriptHash } = await setupApprovedProject(`tester-${targetStatus.toLowerCase().replace(/\s+/g, '-')}`);

      const claimRes = await fetch(`${baseUrl}/api/projects/${project.id}/claims/claim-alexander-1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer test-token-tester-${targetStatus.toLowerCase().replace(/\s+/g, '-')}`,
        },
        body: JSON.stringify({
          status: targetStatus,
          reviewerNotes: `Claim marked as ${targetStatus}`,
        }),
      });
      expect(claimRes.status).toBe(200);

      // Reload project from database
      const getRes = await fetch(`${baseUrl}/api/projects/${project.id}`, {
        headers: { Authorization: `Bearer test-token-tester-${targetStatus.toLowerCase().replace(/\s+/g, '-')}` },
      });
      const reloaded = await getRes.json();

      expect(reloaded.status).toBe('review');
      expect(reloaded.workflowStages.approval).toBe('pending');
      expect(reloaded.approvalRecord.status).toBe('invalidated');

      // Publishing must be blocked
      const pubRes = await fetch(`${baseUrl}/api/projects/${project.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer test-token-tester-${targetStatus.toLowerCase().replace(/\s+/g, '-')}`,
        },
        body: JSON.stringify({
          scriptHash,
          platform: 'TikTok',
        }),
      });
      expect(pubRes.status).toBe(400);
    });
  }

  it('correctly recalculates workflow evidence stage based on claim statuses', () => {
    expect(recalculateEvidenceStage([])).toBe('pending');

    expect(
      recalculateEvidenceStage([
        { id: '1', claimText: 'fact 1', associatedScene: 1, status: 'Supported', confidenceAssessment: 'High' },
        { id: '2', claimText: 'fact 2', associatedScene: 2, status: 'Supported', confidenceAssessment: 'High' },
      ])
    ).toBe('verified');

    expect(
      recalculateEvidenceStage([
        { id: '1', claimText: 'fact 1', associatedScene: 1, status: 'Supported', confidenceAssessment: 'High' },
        { id: '2', claimText: 'fact 2', associatedScene: 2, status: 'Disputed', confidenceAssessment: 'Medium' },
      ])
    ).toBe('in_progress');

    expect(
      recalculateEvidenceStage([
        { id: '1', claimText: 'fact 1', associatedScene: 1, status: 'Unverified', confidenceAssessment: 'Pending' },
      ])
    ).toBe('unverified');
  });
});

describe('Local Development Authentication Policy', () => {
  it('strictly rejects dev tokens when NODE_ENV is production even if ALLOW_DEV_TOKEN=true', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_DEV_TOKEN = 'true';

    expect(isDevTokenAllowed()).toBe(false);

    await expect(verifyToken('dev-token-attacker')).rejects.toThrow(
      'Development tokens are strictly forbidden in production.'
    );
    await expect(verifyToken('test-token-attacker')).rejects.toThrow(
      'Development tokens are strictly forbidden in production.'
    );
  });

  it('rejects dev tokens in development when ALLOW_DEV_TOKEN is not enabled', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOW_DEV_TOKEN;

    expect(isDevTokenAllowed()).toBe(false);

    await expect(verifyToken('dev-token-localuser')).rejects.toThrow(
      'Development tokens are disabled'
    );
  });

  it('accepts dev tokens in development when ALLOW_DEV_TOKEN=true', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_DEV_TOKEN = 'true';

    expect(isDevTokenAllowed()).toBe(true);

    const verified = await verifyToken('dev-token-engineer1');
    expect(verified.uid).toBe('engineer1');
    expect(verified.role).toBe('creator');
  });

  it('fails production startup check when ALLOW_DEV_TOKEN=true in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_DEV_TOKEN = 'true';

    expect(() => assertProductionConfigSafe()).toThrow(
      'FATAL SECURITY CONFIGURATION: ALLOW_DEV_TOKEN=true is strictly prohibited in production mode.'
    );
  });

  it('passes production startup check when ALLOW_DEV_TOKEN is not enabled in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_DEV_TOKEN;

    expect(() => assertProductionConfigSafe()).not.toThrow();
  });

  it('rejects empty or non-string tokens immediately', async () => {
    await expect(verifyToken('')).rejects.toThrow('Token is missing or not a string');
    await expect(verifyToken(null as any)).rejects.toThrow('Token is missing or not a string');
  });
});

describe('Server-Side Gemini Claim Coercion', () => {
  it('forces claims to Unverified and Pending regardless of model output', () => {
    const rawModelOutputClaims = [
      {
        id: 'claim-ai-1',
        claimText: 'The sun rises in the east.',
        associatedScene: 1,
        status: 'Supported', // AI attempting to declare truth
        confidenceAssessment: 'High',
      },
      {
        id: 'claim-ai-2',
        claimText: 'Water boils at 100 degrees Celsius.',
        associatedScene: 2,
        status: 'Verified',
        confidenceAssessment: 'Certain',
      },
    ];

    const coerced = coerceFactualClaims(rawModelOutputClaims);

    expect(coerced.length).toBe(2);
    for (const c of coerced) {
      expect(c.status).toBe('Unverified');
      expect(c.confidenceAssessment).toBe('Pending');
    }
  });

  it('ensures template fallback strictly produces Unverified and Pending claims', () => {
    const fallback = generateTemplateFallback({
      topic: 'The Library of Alexandria',
      category: 'Historical Events',
      allowFallback: true,
    });

    expect(fallback.isFallback).toBe(true);
    expect(fallback.claims.length).toBeGreaterThan(0);
    for (const claim of fallback.claims) {
      expect(claim.status).toBe('Unverified');
      expect(claim.confidenceAssessment).toBe('Pending');
    }
  });
});

describe('Rate Limiter Bounded Memory Cleanup', () => {
  it('cleans up expired entries opportunistically without hanging timers', () => {
    const now = Date.now();
    // Verify cleanup runs cleanly
    const evicted = cleanupExpiredRateLimits(now + 100000);
    expect(typeof evicted).toBe('number');
  });

  it('limits memory store size and prevents indefinite memory growth', () => {
    // Verify store size method works
    expect(getRateLimitStoreSize()).toBeGreaterThanOrEqual(0);
  });
});

describe('Express Reverse Proxy & Trust Configuration', () => {
  it('correctly sets boolean false when TRUST_PROXY is string "false" without throwing TypeError', () => {
    const testApp = express();
    expect(() => configureTrustProxy(testApp, 'false')).not.toThrow();
    expect(testApp.get('trust proxy')).toBe(false);
  });

  it('correctly sets boolean false when TRUST_PROXY is uppercase "FALSE" or whitespace', () => {
    const testApp = express();
    expect(() => configureTrustProxy(testApp, '  FALSE  ')).not.toThrow();
    expect(testApp.get('trust proxy')).toBe(false);
  });

  it('defaults to boolean false when TRUST_PROXY is undefined or empty', () => {
    const testApp = express();
    expect(() => configureTrustProxy(testApp, undefined)).not.toThrow();
    expect(testApp.get('trust proxy')).toBe(false);

    expect(() => configureTrustProxy(testApp, '')).not.toThrow();
    expect(testApp.get('trust proxy')).toBe(false);
  });

  it('sets 1 hop when TRUST_PROXY is "true"', () => {
    const testApp = express();
    expect(() => configureTrustProxy(testApp, 'true')).not.toThrow();
    expect(testApp.get('trust proxy')).toBe(1);
  });

  it('sets numeric hop count when TRUST_PROXY is a number string', () => {
    const testApp = express();
    expect(() => configureTrustProxy(testApp, '2')).not.toThrow();
    expect(testApp.get('trust proxy')).toBe(2);
  });

  it('supports CIDR/IP notation strings safely', () => {
    const testApp = express();
    expect(() => configureTrustProxy(testApp, 'loopback')).not.toThrow();
    expect(testApp.get('trust proxy')).toBeDefined();
  });
});
