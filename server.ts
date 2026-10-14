import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {
  firestoreDb,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  FirestoreConfigError,
  NotImplementedError,
  ConcurrencyConflictError,
} from './server/firestoreDb.ts';
import { generateIdeasAndScript, isGeminiConfigured } from './server/gemini.ts';
import { requireAuth } from './server/middleware/auth.ts';
import { createRateLimiter, securityHeadersMiddleware } from './server/middleware/security.ts';
import { isFirebaseAdminConfigured, assertProductionConfigSafe } from './server/firebaseAdmin.ts';

dotenv.config();

// Enforce production safety check: forbid ALLOW_DEV_TOKEN=true in production
assertProductionConfigSafe();

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Reverse Proxy & IP Resolution Safety:
// Blindly trusting arbitrary proxy headers (e.g. app.set('trust proxy', true)) is vulnerable to IP spoofing.
// Instead, trust proxy is controlled explicitly via TRUST_PROXY env var.
// When unconfigured or explicitly set to 'false', it safely sets boolean false (only trusting direct TCP socket remote address).
// Never pass string 'false' into Express app.set('trust proxy') as proxyaddr treats strings as IP/CIDR masks and throws TypeError.
export function configureTrustProxy(appInstance: express.Application, rawTrustProxyEnv?: string): void {
  const trustProxyEnv = rawTrustProxyEnv?.trim();
  if (!trustProxyEnv || trustProxyEnv.toLowerCase() === 'false') {
    appInstance.set('trust proxy', false);
  } else if (trustProxyEnv.toLowerCase() === 'true') {
    appInstance.set('trust proxy', 1); // Trust 1 hop (e.g. Google Cloud Run front-end)
  } else if (!isNaN(Number(trustProxyEnv))) {
    appInstance.set('trust proxy', Number(trustProxyEnv));
  } else {
    appInstance.set('trust proxy', trustProxyEnv);
  }
}

configureTrustProxy(app, process.env.TRUST_PROXY);

// Security Headers & Payload Limits
app.use(securityHeadersMiddleware);
app.use(express.json({ limit: '1mb' }));

// Rate limiters
const apiRateLimiter = createRateLimiter({ maxRequests: 120, windowMs: 60000, name: 'api' });
const aiRateLimiter = createRateLimiter({ maxRequests: 15, windowMs: 60000, name: 'ai-generation' });

// 1. GENUINELY PUBLIC HEALTH CHECK (No auth required, no secrets exposed)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'AI Video Studio',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 2. SYSTEM STATUS (Protected, reports connection readiness)
app.get('/api/system/status', requireAuth, (req: Request, res: Response) => {
  const firebaseConfigFileExists = fs.existsSync(path.resolve(process.cwd(), 'firebase-applet-config.json'));
  res.json({
    geminiConfigured: isGeminiConfigured(),
    firebaseConfigured: firebaseConfigFileExists,
    firebaseAdminReady: isFirebaseAdminConfigured(),
    authenticatedUser: {
      uid: req.user?.uid,
      email: req.user?.email,
      role: req.user?.role,
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

// 3. STATS (Protected & filtered by authenticated owner)
app.get('/api/stats', requireAuth, apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await firestoreDb.getStats(req.user!.uid);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// 4. PROJECTS (Protected & filtered by authenticated owner)
app.get('/api/projects', requireAuth, apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await firestoreDb.getProjects(req.user!.uid);
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

app.post('/api/projects', requireAuth, apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, category, targetDuration, aspectRatio, description, script, ideas, selectedIdeaIndex, claims } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Project title is required.' });
      return;
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Story category is required.' });
      return;
    }
    if (!targetDuration) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Target duration is required.' });
      return;
    }
    if (!aspectRatio) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Aspect ratio is required.' });
      return;
    }

    // Owner ID is forced from the verified identity
    const newProject = await firestoreDb.createProject(
      {
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : title.trim(),
        category: category.trim(),
        language: req.body.language || 'English',
        targetAudience: req.body.targetAudience || 'General Audience',
        targetDuration,
        aspectRatio,
        narrationStyle: req.body.narrationStyle || 'Dramatic & Suspenseful',
        visualStyle: req.body.visualStyle || 'Cinematic Photorealistic',
        researchMode: req.body.researchMode || 'combined',
        researchDepth: req.body.researchDepth || 'deep',
        scriptTransformation: req.body.scriptTransformation || 'Original script based on research',
        publishingWorkflow: 'Manual approval required',
        script,
        ideas,
        selectedIdeaIndex,
        claims,
      },
      req.user!.uid
    );

    res.status(201).json(newProject);
  } catch (err) {
    next(err);
  }
});

app.get('/api/projects/:id', requireAuth, apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await firestoreDb.getProjectById(req.params.id, req.user!.uid);
    if (!project) {
      res.status(404).json({ error: 'NOT_FOUND', message: `Project ${req.params.id} not found.` });
      return;
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
});

app.put('/api/projects/:id', requireAuth, apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await firestoreDb.updateProject(req.params.id, req.body, req.user!.uid);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/projects/:id', requireAuth, apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await firestoreDb.deleteProject(req.params.id, req.user!.uid);
    if (!success) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Project not found.' });
      return;
    }
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

// 5. DEDICATED APPROVAL OPERATION
app.post('/api/projects/:id/approve', requireAuth, apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scriptHash, notes } = req.body;
    if (!scriptHash) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'scriptHash is required for approval verification.',
      });
      return;
    }

    const approvedProject = await firestoreDb.approveProject(
      req.params.id,
      req.user!.uid,
      scriptHash,
      notes
    );
    res.json(approvedProject);
  } catch (err) {
    next(err);
  }
});

// 6. DEDICATED PUBLISHING OPERATION
app.post('/api/projects/:id/publish', requireAuth, apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scriptHash, platform } = req.body;
    if (!scriptHash) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'scriptHash of the approved video version is required.',
      });
      return;
    }

    const publishedProject = await firestoreDb.publishProject(
      req.params.id,
      req.user!.uid,
      scriptHash,
      platform || 'YouTube Shorts'
    );
    res.json(publishedProject);
  } catch (err) {
    next(err);
  }
});

// 7. CLAIMS (Protected & ownership verified)
app.put('/api/projects/:id/claims/:claimId', requireAuth, apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await firestoreDb.updateClaim(
      req.params.id,
      req.params.claimId,
      req.body,
      req.user!.uid
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// 8. CATEGORIES (Protected)
app.get('/api/categories', requireAuth, apiRateLimiter, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await firestoreDb.getCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

app.post('/api/categories', requireAuth, apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, icon, color } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Category name is required' });
      return;
    }
    const cat = await firestoreDb.addCategory({
      id: `cat-${Date.now()}`,
      name: name.trim(),
      description: description || '',
      icon: icon || 'Film',
      color: color || '#6366f1',
      enabled: true,
    });
    res.status(201).json(cat);
  } catch (err) {
    next(err);
  }
});

app.patch('/api/categories/:id/toggle', requireAuth, apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cat = await firestoreDb.toggleCategory(req.params.id);
    if (!cat) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Category not found' });
      return;
    }
    res.json(cat);
  } catch (err) {
    next(err);
  }
});

// 9. AUDIT LOGS (Protected & user-isolated)
app.get('/api/audit-logs', requireAuth, apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await firestoreDb.getAuditLogs(req.user!.uid);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// 10. AI GENERATION (Protected & rate-limited)
app.post('/api/ai/generate', requireAuth, aiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, category, language, targetDuration, narrationStyle, visualStyle, targetAudience, allowFallback } = req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Topic is required for AI generation.' });
      return;
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Story category is required.' });
      return;
    }

    const result = await generateIdeasAndScript({
      topic,
      category,
      language,
      targetDuration,
      narrationStyle,
      visualStyle,
      targetAudience,
      allowFallback: Boolean(allowFallback),
    });

    res.json({
      success: true,
      isFallback: result.isFallback,
      data: result,
      message: result.isFallback
        ? 'Generated using Studio Script Engine Template (API Authorization pending)'
        : 'Generated via Gemini 3.8 Flash',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate ideas and script with Gemini.',
      isMissingKey: !isGeminiConfigured(),
    });
  }
});

// 11. MIGRATION UTILITY
app.post('/api/admin/migrate-from-json', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await firestoreDb.migrateFromJson(req.user!.uid);
    res.json({
      success: true,
      message: `Migrated ${result.migratedProjects} projects to Firestore for user ${req.user!.uid}. Backup saved to ${result.backupPath}.`,
      result,
    });
  } catch (err) {
    next(err);
  }
});

// Centralized Secure Error Handler (No stack traces in client response)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]:', err.name || 'Error', err.message);

  if (err instanceof ForbiddenError) {
    res.status(403).json({ error: 'FORBIDDEN', message: err.message });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: 'NOT_FOUND', message: err.message });
    return;
  }
  if (err instanceof ValidationError) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: err.message });
    return;
  }
  if (err instanceof ConcurrencyConflictError) {
    res.status(409).json({ error: 'CONFLICT', message: err.message });
    return;
  }
  if (err instanceof NotImplementedError) {
    res.status(501).json({ error: 'PUBLISHING_NOT_IMPLEMENTED', message: err.message });
    return;
  }
  if (err instanceof FirestoreConfigError) {
    res.status(503).json({
      error: 'FIRESTORE_NOT_CONFIGURED',
      message: err.message,
      setupHelp: 'Configure Firebase in AI Studio or provide Google Cloud service account credentials.',
    });
    return;
  }

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred.',
  });
});

// Setup Vite middleware or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd && process.env.NODE_ENV !== 'test') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (isProd) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`AI Video Studio server listening on http://0.0.0.0:${PORT}`);
    });
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Server start error:', err);
    process.exit(1);
  });
}
