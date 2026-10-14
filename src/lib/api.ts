import { Project, StoryCategory, AuditEvent, ProjectStats, FactualClaim, ScriptData } from '../types';

export interface SystemStatus {
  geminiConfigured: boolean;
  firebaseConfigured: boolean;
  environment: string;
  serverTime: string;
}

export interface GenerateAIParams {
  topic: string;
  category: string;
  language?: string;
  targetDuration?: string;
  narrationStyle?: string;
  visualStyle?: string;
  targetAudience?: string;
  allowFallback?: boolean;
}

export interface GenerateAIResponse {
  success: boolean;
  data?: {
    ideas: any[];
    recommendedIdeaIndex: number;
    script: ScriptData;
    claims: FactualClaim[];
  };
  error?: string;
  isMissingKey?: boolean;
}

export const api = {
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/system/status');
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async getStats(): Promise<ProjectStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch project stats');
    return res.json();
  },

  async getProjects(): Promise<Project[]> {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) throw new Error('Project not found');
    return res.json();
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create project');
    }
    return res.json();
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update project');
    }
    return res.json();
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete project');
  },

  async updateClaim(projectId: string, claimId: string, updates: Partial<FactualClaim>): Promise<FactualClaim> {
    const res = await fetch(`/api/projects/${projectId}/claims/${claimId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update claim');
    return res.json();
  },

  async getCategories(): Promise<StoryCategory[]> {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async createCategory(data: Partial<StoryCategory>): Promise<StoryCategory> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add category');
    return res.json();
  },

  async toggleCategory(id: string): Promise<StoryCategory> {
    const res = await fetch(`/api/categories/${id}/toggle`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to toggle category');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditEvent[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async generateIdeasAndScript(params: GenerateAIParams): Promise<GenerateAIResponse> {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  }
};
