import React, { useState, useEffect } from 'react';
import { Sidebar, NavItem } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { NewProjectWizard } from './components/NewProjectWizard';
import { ProjectDetailView } from './components/ProjectDetailView';
import { StoryCategoriesView } from './components/StoryCategoriesView';
import { EvidenceHubView } from './components/EvidenceHubView';
import { SettingsView } from './components/SettingsView';
import { GenericSectionView } from './components/GenericSectionView';
import { AIGeneratorModal } from './components/AIGeneratorModal';
import { api, SystemStatus } from './lib/api';
import { Project, StoryCategory, AuditEvent, ProjectStats, FactualClaim, ScriptData } from './types';
import { Sparkles, PlusCircle, Search, Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<NavItem>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Core Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<StoryCategory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    projectsInProgress: 0,
    completedScripts: 0,
    videosReadyForReview: 0,
    pendingApprovals: 0,
    publishedCount: 0,
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = async () => {
    try {
      const [projs, cats, st, logs, sys] = await Promise.all([
        api.getProjects(),
        api.getCategories(),
        api.getStats(),
        api.getAuditLogs(),
        api.getSystemStatus(),
      ]);

      setProjects(projs);
      setCategories(cats);
      setStats(st);
      setAuditLogs(logs);
      setSystemStatus(sys);
    } catch (err: any) {
      console.error('Failed to load studio data:', err);
      showNotification('error', 'Could not sync with local studio server. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers
  const handleOpenProject = (id: string) => {
    setSelectedProjectId(id);
  };

  const handleCreateProject = async (data: Partial<Project>) => {
    try {
      const created = await api.createProject(data);
      setProjects((prev) => [created, ...prev]);
      const newStats = await api.getStats();
      setStats(newStats);
      const newLogs = await api.getAuditLogs();
      setAuditLogs(newLogs);
      showNotification('success', `Project "${created.title}" created successfully!`);
      setSelectedProjectId(created.id);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create project.');
      throw err;
    }
  };

  const handleUpdateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updated = await api.updateProject(id, updates);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      const newStats = await api.getStats();
      setStats(newStats);
      const newLogs = await api.getAuditLogs();
      setAuditLogs(newLogs);
      showNotification('success', 'Project changes saved to persistent database.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update project.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
      const newStats = await api.getStats();
      setStats(newStats);
      const newLogs = await api.getAuditLogs();
      setAuditLogs(newLogs);
      showNotification('info', 'Project removed.');
    } catch (err: any) {
      showNotification('error', 'Failed to delete project.');
    }
  };

  const handleUpdateClaim = async (projectId: string, claimId: string, updates: Partial<FactualClaim>) => {
    try {
      const updatedClaim = await api.updateClaim(projectId, claimId, updates);
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === projectId && p.claims) {
            return {
              ...p,
              claims: p.claims.map((c) => (c.id === claimId ? updatedClaim : c)),
            };
          }
          return p;
        })
      );
      showNotification('success', `Claim updated to: ${updatedClaim.status}`);
    } catch (err: any) {
      showNotification('error', 'Failed to update claim verification status.');
    }
  };

  const handleApproveProject = async (id: string, scriptHash: string, notes?: string) => {
    try {
      const updated = await api.approveProject(id, scriptHash, notes);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      const newStats = await api.getStats();
      setStats(newStats);
      const newLogs = await api.getAuditLogs();
      setAuditLogs(newLogs);
      showNotification('success', `Project "${updated.title}" formally approved.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Approval failed.');
      throw err;
    }
  };

  const handlePublishProject = async (id: string, scriptHash: string, platform?: string) => {
    try {
      const updated = await api.publishProject(id, scriptHash, platform);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      const newStats = await api.getStats();
      setStats(newStats);
      const newLogs = await api.getAuditLogs();
      setAuditLogs(newLogs);
      showNotification('success', `Project successfully dispatched to ${platform || 'YouTube Shorts'}!`);
    } catch (err: any) {
      showNotification('error', err.message || 'Publication failed.');
      throw err;
    }
  };

  const handleToggleCategory = async (id: string) => {
    try {
      const toggled = await api.toggleCategory(id);
      setCategories((prev) => prev.map((c) => (c.id === id ? toggled : c)));
    } catch (err: any) {
      showNotification('error', 'Failed to toggle category.');
    }
  };

  const handleAddCategory = async (data: Partial<StoryCategory>) => {
    try {
      const created = await api.createCategory(data);
      setCategories((prev) => [...prev, created]);
      showNotification('success', `Category "${created.name}" created!`);
    } catch (err: any) {
      showNotification('error', 'Failed to create category.');
    }
  };

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId) || null
    : null;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setSelectedProjectId(null);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        geminiActive={Boolean(systemStatus?.geminiConfigured)}
        firebaseActive={Boolean(systemStatus?.firebaseConfigured)}
        projectsCount={projects.length}
        pendingApprovalsCount={stats.pendingApprovals}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 px-6 flex items-center justify-between gap-4 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Workspace
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-bold text-indigo-400 capitalize">
              {selectedProject ? selectedProject.title : currentView.replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAIGeneratorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">AI Story Ideator</span>
            </button>

            <button
              onClick={() => {
                setSelectedProjectId(null);
                setCurrentView('new-project');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Project</span>
            </button>
          </div>
        </header>

        {/* Global Toast Notification */}
        {notification && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-lg z-30 transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : notification.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />}
              {notification.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />}
              {notification.type === 'info' && <Info className="w-4 h-4 shrink-0 text-indigo-400" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-slate-800">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading AI Video Studio workspace...</span>
            </div>
          ) : selectedProject ? (
            <ProjectDetailView
              project={selectedProject}
              onUpdateProject={handleUpdateProject}
              onUpdateClaim={handleUpdateClaim}
              onApproveProject={handleApproveProject}
              onPublishProject={handlePublishProject}
              onBack={() => setSelectedProjectId(null)}
              onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
            />
          ) : currentView === 'dashboard' ? (
            <DashboardView
              stats={stats}
              projects={projects}
              categories={categories}
              auditLogs={auditLogs}
              onOpenProject={handleOpenProject}
              onNewProject={() => setCurrentView('new-project')}
              onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
              onNavigateCategories={() => setCurrentView('categories')}
            />
          ) : currentView === 'projects' ? (
            <ProjectsView
              projects={projects}
              categories={categories}
              onOpenProject={handleOpenProject}
              onNewProject={() => setCurrentView('new-project')}
              onDeleteProject={handleDeleteProject}
              onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
            />
          ) : currentView === 'new-project' ? (
            <NewProjectWizard
              categories={categories}
              onCreateProject={handleCreateProject}
              onCancel={() => setCurrentView('projects')}
              onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
            />
          ) : currentView === 'categories' ? (
            <StoryCategoriesView
              categories={categories}
              onToggleCategory={handleToggleCategory}
              onAddCategory={handleAddCategory}
              onSelectCategoryFilter={(catName) => {
                setCurrentView('projects');
              }}
            />
          ) : currentView === 'evidence' ? (
            <EvidenceHubView
              projects={projects}
              onUpdateClaim={handleUpdateClaim}
              onOpenProject={handleOpenProject}
            />
          ) : currentView === 'settings' ? (
            <SettingsView
              systemStatus={systemStatus}
              onRefreshStatus={loadAllData}
            />
          ) : (
            <GenericSectionView
              section={currentView}
              projects={projects}
              onOpenProject={handleOpenProject}
              onNewProject={() => setCurrentView('new-project')}
              onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
            />
          )}
        </main>
      </div>

      {/* AI Story Ideator & Scriptwriter Modal */}
      <AIGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        categories={categories}
        currentProject={selectedProject}
        onApplyToProject={({ ideas, selectedIdeaIndex, script, claims }) => {
          if (selectedProject) {
            handleUpdateProject(selectedProject.id, {
              ideas,
              selectedIdeaIndex,
              script,
              claims,
              status: 'scripting',
              workflowStages: {
                ...selectedProject.workflowStages,
                script: 'ready',
                evidence: 'unverified',
              },
            });
            showNotification('success', 'Applied AI generated script and unverified claims to project.');
          }
        }}
        onCreateProjectFromGenerated={async (projData) => {
          await handleCreateProject(projData);
        }}
      />
    </div>
  );
}
