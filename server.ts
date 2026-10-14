import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { db } from './server/db.ts';
import { generateIdeasAndScript, isGeminiConfigured } from './server/gemini.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// System Status Endpoint
app.get('/api/system/status', (_req: Request, res: Response) => {
  const firebaseConfigExists = fs.existsSync(path.resolve(process.cwd(), 'firebase-applet-config.json'));
  res.json({
    geminiConfigured: isGeminiConfigured(),
    firebaseConfigured: firebaseConfigExists,
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString()
  });
});

// Stats
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute stats' });
  }
});

// Projects
app.get('/api/projects', (_req: Request, res: Response) => {
  try {
    const projects = db.getProjects();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch projects' });
  }
});

app.post('/api/projects', (req: Request, res: Response) => {
  try {
    const { title, category, targetDuration, aspectRatio, description } = req.body;
    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Project title is required.' });
      return;
    }
    if (!category || !category.trim()) {
      res.status(400).json({ error: 'Story category is required.' });
      return;
    }
    if (!targetDuration) {
      res.status(400).json({ error: 'Target duration is required.' });
      return;
    }
    if (!aspectRatio) {
      res.status(400).json({ error: 'Aspect ratio is required.' });
      return;
    }

    const newProject = db.createProject(req.body);
    res.status(201).json(newProject);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create project' });
  }
});

app.get('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const project = db.getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get project' });
  }
});

app.put('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateProject(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const success = db.deleteProject(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete project' });
  }
});

// Update claim
app.put('/api/projects/:id/claims/:claimId', (req: Request, res: Response) => {
  try {
    const updated = db.updateClaim(req.params.id, req.params.claimId, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Claim or project not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update claim' });
  }
});

// Categories
app.get('/api/categories', (_req: Request, res: Response) => {
  try {
    const categories = db.getCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch categories' });
  }
});

app.post('/api/categories', (req: Request, res: Response) => {
  try {
    const { name, description, icon, color } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }
    const cat = db.addCategory({
      id: `cat-${Date.now()}`,
      name: name.trim(),
      description: description || '',
      icon: icon || 'Film',
      color: color || '#6366f1',
      enabled: true
    });
    res.status(201).json(cat);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add category' });
  }
});

app.patch('/api/categories/:id/toggle', (req: Request, res: Response) => {
  try {
    const cat = db.toggleCategory(req.params.id);
    if (!cat) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(cat);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle category' });
  }
});

// Audit Logs
app.get('/api/audit-logs', (_req: Request, res: Response) => {
  try {
    const logs = db.getAuditLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch logs' });
  }
});

// AI Generation Route
app.post('/api/ai/generate', async (req: Request, res: Response) => {
  try {
    const { topic, category, language, targetDuration, narrationStyle, visualStyle, targetAudience, allowFallback } = req.body;
    if (!topic || !topic.trim()) {
      res.status(400).json({ error: 'Topic is required for AI generation.' });
      return;
    }
    if (!category || !category.trim()) {
      res.status(400).json({ error: 'Story category is required.' });
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

    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('AI generation error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate ideas and script with Gemini.',
      isMissingKey: !isGeminiConfigured()
    });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Video Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server start error:', err);
  process.exit(1);
});
