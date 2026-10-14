import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'http';
import { app } from '../server.ts';
import { firestoreDb, resetMockFirestore } from './firestoreDb.ts';
import { computeScriptHash } from './workflow.ts';

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
