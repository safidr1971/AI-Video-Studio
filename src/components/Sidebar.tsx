import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Tag,
  Search,
  CheckCircle2,
  FileText,
  Clapperboard,
  Image,
  Video,
  PlaySquare,
  ShieldCheck,
  Share2,
  Settings,
  HelpCircle,
  Sparkles,
  Server,
  Database,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export type NavItem =
  | 'dashboard'
  | 'projects'
  | 'new-project'
  | 'categories'
  | 'research'
  | 'evidence'
  | 'scripts'
  | 'storyboards'
  | 'media'
  | 'rendering'
  | 'preview'
  | 'approvals'
  | 'publishing'
  | 'settings'
  | 'help';

interface SidebarProps {
  currentView: NavItem;
  onNavigate: (view: NavItem) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  geminiActive: boolean;
  firebaseActive: boolean;
  projectsCount?: number;
  pendingApprovalsCount?: number;
}

interface SidebarNavItem {
  id: NavItem;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
  highlight?: boolean;
}

interface SidebarSection {
  title: string;
  items: SidebarNavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  geminiActive,
  firebaseActive,
  projectsCount = 0,
  pendingApprovalsCount = 0,
}) => {
  const navSections: SidebarSection[] = [
    {
      title: 'Studio Core',
      items: [
        { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects' as NavItem, label: 'Projects', icon: FolderKanban, badge: projectsCount > 0 ? projectsCount : undefined },
        { id: 'new-project' as NavItem, label: 'New Project', icon: PlusCircle, highlight: true },
        { id: 'categories' as NavItem, label: 'Story Categories', icon: Tag },
      ],
    },
    {
      title: 'Workflow & Research',
      items: [
        { id: 'research' as NavItem, label: 'Research', icon: Search },
        { id: 'evidence' as NavItem, label: 'Evidence & Sources', icon: CheckCircle2 },
        { id: 'scripts' as NavItem, label: 'Scripts', icon: FileText },
        { id: 'storyboards' as NavItem, label: 'Storyboards', icon: Clapperboard },
      ],
    },
    {
      title: 'Production & Delivery',
      items: [
        { id: 'media' as NavItem, label: 'Media Assets', icon: Image },
        { id: 'rendering' as NavItem, label: 'Video Rendering', icon: Video },
        { id: 'preview' as NavItem, label: 'Video Preview', icon: PlaySquare },
        { id: 'approvals' as NavItem, label: 'Approvals', icon: ShieldCheck, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined, badgeColor: 'bg-amber-500' },
        { id: 'publishing' as NavItem, label: 'Publishing', icon: Share2 },
      ],
    },
    {
      title: 'System',
      items: [
        { id: 'settings' as NavItem, label: 'Settings', icon: Settings },
        { id: 'help' as NavItem, label: 'Help & Docs', icon: HelpCircle },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/60">
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 cursor-pointer group overflow-hidden"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <span className="font-bold text-white tracking-tight text-base block">
                AI Video Studio
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400">
                Reelaty Engine
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </h3>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : item.highlight
                      ? 'bg-slate-800/80 text-indigo-300 hover:bg-slate-800 hover:text-white border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!collapsed && item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full text-white ${
                        item.badgeColor || 'bg-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* System Status Indicators in Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {!collapsed ? (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Gemini AI
              </span>
              <span
                className={`flex items-center gap-1 font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                  geminiActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    geminiActive ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                {geminiActive ? 'Ready' : 'Needs Key'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Persistence
              </span>
              <span className="flex items-center gap-1 font-semibold text-[11px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Server DB
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              title={geminiActive ? 'Gemini AI Ready' : 'Gemini AI Needs Key'}
              className={`w-2.5 h-2.5 rounded-full ${
                geminiActive ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <div
              title="Server Storage Ready"
              className="w-2.5 h-2.5 rounded-full bg-blue-400"
            />
          </div>
        )}
      </div>
    </aside>
  );
};
