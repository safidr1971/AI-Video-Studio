import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  FolderKanban,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  Trash2,
  ExternalLink,
  Smartphone,
  Monitor,
  Square,
  Clock,
  Sparkles
} from 'lucide-react';
import { Project, StoryCategory } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  categories: StoryCategory[];
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onOpenAIGenerator: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  categories,
  onOpenProject,
  onNewProject,
  onDeleteProject,
  onOpenAIGenerator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesStatus =
        selectedStatus === 'all' ||
        p.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [projects, searchQuery, selectedCategory, selectedStatus]);

  const confirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  const renderAspectRatioIcon = (ratio: string) => {
    if (ratio === '9:16') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
          <Smartphone className="w-3 h-3 text-indigo-400" />
          9:16 Short
        </span>
      );
    }
    if (ratio === '16:9') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
          <Monitor className="w-3 h-3 text-blue-400" />
          16:9
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
        <Square className="w-3 h-3 text-purple-400" />
        1:1
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-400" />
            Projects Library
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage all video creation pipelines, scripts, and claim verifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAIGenerator}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Story Ideator</span>
          </button>
          <button
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title, topic, or description..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-40">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="ideation">Ideation</option>
              <option value="research">Research</option>
              <option value="scripting">Scripting</option>
              <option value="storyboarding">Storyboarding</option>
              <option value="review">Review</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects List Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No projects found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No projects matched your search criteria. Try clearing the search or category filters.
            </p>
          </div>
          {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              className="text-xs text-indigo-400 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const verifiedClaims = (project.claims || []).filter((c) => c.status === 'Supported').length;
            const unverifiedClaims = (project.claims || []).filter((c) => c.status === 'Unverified').length;
            const totalClaims = (project.claims || []).length;

            return (
              <div
                key={project.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-sm hover:shadow-lg hover:shadow-indigo-950/30"
              >
                <div className="space-y-3">
                  {/* Card top tags */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {project.category}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        project.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : project.status === 'review'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      onClick={() => onOpenProject(project.id)}
                      className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors cursor-pointer line-clamp-2"
                    >
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {project.description}
                    </p>
                  </div>

                  {/* Format & Pacing Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {renderAspectRatioIcon(project.aspectRatio)}
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {project.targetDuration}
                    </span>
                    <span className="text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                      {project.language}
                    </span>
                  </div>

                  {/* Claims & Script Stats */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Script Status</span>
                      {project.script ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready ({project.script.scenes.length} sc)
                        </span>
                      ) : (
                        <span className="text-slate-400">Draft pending</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Evidence & Claims</span>
                      {totalClaims === 0 ? (
                        <span className="text-slate-400">0 claims</span>
                      ) : unverifiedClaims > 0 ? (
                        <span className="text-amber-400 font-medium flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          {unverifiedClaims} unverified
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {verifiedClaims}/{totalClaims} verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setProjectToDelete(project)}
                      title="Delete Project"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenProject(project.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all"
                    >
                      <span>Open Workspace</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Delete Project?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to permanently delete "{projectToDelete.title}"? All scripts, storyboards, and claim verification records will be permanently removed.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
