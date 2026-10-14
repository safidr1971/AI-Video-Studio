import React from 'react';
import {
  FolderKanban,
  Clock,
  FileCheck,
  PlaySquare,
  ShieldAlert,
  Share2,
  PlusCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  CheckCircle2,
  Calendar,
  Layers,
  History
} from 'lucide-react';
import { Project, ProjectStats, StoryCategory, AuditEvent } from '../types';

interface DashboardViewProps {
  stats: ProjectStats;
  projects: Project[];
  categories: StoryCategory[];
  auditLogs: AuditEvent[];
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
  onOpenAIGenerator: () => void;
  onNavigateCategories: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  projects,
  categories,
  auditLogs,
  onOpenProject,
  onNewProject,
  onOpenAIGenerator,
  onNavigateCategories,
}) => {
  const statCards = [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderKanban,
      color: 'from-blue-600 to-indigo-600',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      description: 'Active workspaces in studio',
    },
    {
      label: 'In Progress',
      value: stats.projectsInProgress,
      icon: Clock,
      color: 'from-amber-600 to-orange-600',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      description: 'Research, scripts & storyboards',
    },
    {
      label: 'Completed Scripts',
      value: stats.completedScripts,
      icon: FileCheck,
      color: 'from-emerald-600 to-teal-600',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Ready for asset generation',
    },
    {
      label: 'Ready for Review',
      value: stats.videosReadyForReview,
      icon: PlaySquare,
      color: 'from-purple-600 to-pink-600',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      description: 'Rendered previews awaiting review',
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: ShieldAlert,
      color: 'from-rose-600 to-red-600',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      description: 'Factual & editorial sign-off',
    },
    {
      label: 'Published',
      value: stats.publishedCount,
      icon: Share2,
      color: 'from-indigo-600 to-cyan-600',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      description: 'Dispatched to short channels',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Autonomous Short-Form Video Production</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Create Fact-Checked, High-Retention Short Videos
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Research deep historical, crime, and mythology topics, generate scene-by-scene verified scripts, and assemble complete viral shorts with full evidence accountability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenAIGenerator}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Story Ideator</span>
            </button>
            <button
              onClick={onNewProject}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Project Wizard</span>
            </button>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Studio Statistics (Live Database)
          </h2>
          <span className="text-xs text-slate-400">
            Computed strictly from active project records
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${card.badgeColor}`}
                  >
                    Actual
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    {card.value}
                  </div>
                  <div className="text-xs font-semibold text-slate-300 mt-0.5">
                    {card.label}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {card.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Area: Recent Projects & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Recent Project Activity
            </h2>
            <span className="text-xs text-slate-400">
              {projects.length} Total Projects
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No projects found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Start your first video project or use the Gemini AI story generator to create an idea with verified claims.
                </p>
              </div>
              <button
                onClick={onNewProject}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Your First Project</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => {
                const verifiedClaims = (project.claims || []).filter(c => c.status === 'Supported').length;
                const unverifiedClaims = (project.claims || []).filter(c => c.status === 'Unverified').length;

                return (
                  <div
                    key={project.id}
                    onClick={() => onOpenProject(project.id)}
                    className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all cursor-pointer shadow-sm hover:shadow-md hover:shadow-indigo-950/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {project.category}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {project.targetDuration} ({project.aspectRatio})
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            Status: <strong className="text-white uppercase">{project.status}</strong>
                          </span>
                        </div>

                        <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                          {project.title}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-2">
                          {project.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Updated {new Date(project.updatedAt).toLocaleDateString()}
                          </span>

                          {project.script && (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Script Ready ({project.script.scenes.length} scenes)
                            </span>
                          )}

                          {unverifiedClaims > 0 ? (
                            <span className="text-amber-400 flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              {unverifiedClaims} unverified claim{unverifiedClaims > 1 ? 's' : ''}
                            </span>
                          ) : verifiedClaims > 0 ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {verifiedClaims} claims verified
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Categories & Activity Trail */}
        <div className="space-y-6">
          {/* Categories Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                Story Categories
              </h2>
              <button
                onClick={onNavigateCategories}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Manage All →
              </button>
            </div>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={onNavigateCategories}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                    {cat.projectCount} proj
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Real Audit Trail Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              Studio Audit Trail
            </h2>

            <div className="space-y-3">
              {auditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-300">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
