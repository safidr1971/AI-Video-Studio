import { Project, StoryCategory, AuditEvent, ProjectStats, FactualClaim, ScriptData } from '../types';
import { getIdToken, isDevTokenAllowed } from './firebase';

export interface SystemStatus {
  geminiConfigured: boolean;
  firebaseConfigured: boolean;
  firebaseAdminReady: boolean;
  authenticatedUser?: {
    uid: string;
    email?: string;
    role?: string;
  };
  environment: string;
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
  isFallback?: boolean;
  data?: {
    ideas: any[];
    recommendedIdeaIndex: number;
    script: ScriptData;
    claims: FactualClaim[];
  };
  message?: string;
  error?: string;
  isMissingKey?: boolean;
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const api = {
  async getHealth(): Promise<{ status: string; service: string }> {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getSystemStatus(): Promise<SystemStatus> {
    const headers = await authHeaders();
    const res = await fetch('/api/system/status', { headers });
    if (!res.ok) {
      if (res.status === 401) {
        if (isDevTokenAllowed()) {
          localStorage.removeItem('ai_studio_auth_token');
        }
        throw new Error('UNAUTHORIZED: Authentication required.');
      }
      throw new Error('Failed to fetch system status');
    }
    return res.json();
  },

  async getStats(): Promise<ProjectStats> {
    const headers = await authHeaders();
    const res = await fetch('/api/stats', { headers });
    if (!res.ok) throw new Error('Failed to fetch project stats');
    return res.json();
  },

  async getProjects(): Promise<Project[]> {
    const headers = await authHeaders();
    const res = await fetch('/api/projects', { headers });
    if (!res.ok) {
      if (res.status === 401) {
        if (isDevTokenAllowed()) {
          localStorage.removeItem('ai_studio_auth_token');
        }
        throw new Error('UNAUTHORIZED: Please sign in or set valid credentials.');
      }
      throw new Error('Failed to fetch projects');
    }
    return res.json();
  },

  async getProject(id: string): Promise<Project> {
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}`, { headers });
    if (!res.ok) {
      if (res.status === 403) throw new Error('Access denied: You do not own this project.');
      if (res.status === 404) throw new Error('Project not found.');
      throw new Error('Failed to load project details.');
    }
    return res.json();
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const headers = await authHeaders();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to create project');
    }
    return res.json();
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to update project');
    }
    return res.json();
  },

  async approveProject(id: string, scriptHash: string, notes?: string): Promise<Project> {
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}/approve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ scriptHash, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Approval failed');
    }
    return res.json();
  },

  async publishProject(id: string, scriptHash: string, platform?: string): Promise<Project> {
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}/publish`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ scriptHash, platform }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Publication failed');
    }
    return res.json();
  },

  async deleteProject(id: string): Promise<void> {
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to delete project');
  },

  async updateClaim(projectId: string, claimId: string, updates: Partial<FactualClaim>): Promise<FactualClaim> {
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${projectId}/claims/${claimId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update claim');
    }
    return res.json();
  },

  async getCategories(): Promise<StoryCategory[]> {
    const headers = await authHeaders();
    const res = await fetch('/api/categories', { headers });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async createCategory(data: Partial<StoryCategory>): Promise<StoryCategory> {
    const headers = await authHeaders();
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add category');
    return res.json();
  },

  async toggleCategory(id: string): Promise<StoryCategory> {
    const headers = await authHeaders();
    const res = await fetch(`/api/categories/${id}/toggle`, {
      method: 'PATCH',
      headers,
    });
    if (!res.ok) throw new Error('Failed to toggle category');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditEvent[]> {
    const headers = await authHeaders();
    const res = await fetch('/api/audit-logs', { headers });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async generateIdeasAndScript(params: GenerateAIParams): Promise<GenerateAIResponse> {
    const headers = await authHeaders();
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async migrateFromJson(): Promise<{ success: boolean; message: string }> {
    const headers = await authHeaders();
    const res = await fetch('/api/admin/migrate-from-json', {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Migration failed');
    }
    return res.json();
  },
};
