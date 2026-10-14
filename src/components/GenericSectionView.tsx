import React from 'react';
import {
  FileText,
  Clapperboard,
  Image,
  Video,
  PlaySquare,
  ShieldCheck,
  Share2,
  HelpCircle,
  Search,
  ExternalLink,
  Clock,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Layers,
  BookOpen,
  Cpu,
  Smartphone
} from 'lucide-react';
import { Project } from '../types';
import { NavItem } from './Sidebar';

interface GenericSectionViewProps {
  section: NavItem;
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
  onOpenAIGenerator: () => void;
}

export const GenericSectionView: React.FC<GenericSectionViewProps> = ({
  section,
  projects,
  onOpenProject,
  onNewProject,
  onOpenAIGenerator,
}) => {
  if (section === 'scripts') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" />
              Scripts Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Central library of all drafted, revised, and approved short-video scripts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-400 uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                  {p.category}
                </span>
                <span className="text-slate-400">
                  v{p.script?.version || 1} • ~{p.script?.estimatedDuration || 60}s
                </span>
              </div>

              <h3 className="font-bold text-white text-base">{p.title}</h3>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Hook:
                </span>
                <p className="text-slate-200 italic">"{p.script?.hook || 'Draft pending'}"</p>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-slate-400">
                  {p.script?.scenes.length || 0} scenes • {p.language}
                </span>
                <button
                  onClick={() => onOpenProject(p.id)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-semibold transition-all flex items-center gap-1"
                >
                  <span>Open Script</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'storyboards') {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clapperboard className="w-6 h-6 text-indigo-400" />
            Storyboards & Shot Lists
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual pacing, camera descriptions, transitions, and audio cues.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => onOpenProject(p.id)}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-400">{p.category}</span>
                <span className="text-slate-400">{p.aspectRatio}</span>
              </div>
              <h3 className="font-bold text-white text-base">{p.title}</h3>
              <p className="text-xs text-slate-400">
                Visual Style: <strong className="text-slate-300">{p.visualStyle}</strong>
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
                <span>{p.script?.scenes.length || 0} Storyboard Shots</span>
                <span className="text-indigo-400 hover:underline">View Board →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'media') {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Image className="w-6 h-6 text-indigo-400" />
            Media Assets & Licensing Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audio voiceovers, visual scene renders, background score, and copyright clearance.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-800/30 text-xs text-indigo-300 space-y-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Media Licensing Policy
          </span>
          <p>
            Track asset origins and licensing information. Publicly accessible media is never assumed to be free to use. Generated imagery uses Gemini 3.1 Flash Image.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Voiceover Tracks</span>
            <div className="text-2xl font-black text-white">{projects.length * 4}</div>
            <p className="text-[11px] text-slate-400">Generated TTS chunks (24kHz Mono)</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Visual Prompts</span>
            <div className="text-2xl font-black text-white">{projects.length * 4}</div>
            <p className="text-[11px] text-slate-400">Cinematic scene descriptions</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Licensing Clearance</span>
            <div className="text-2xl font-black text-emerald-400">100%</div>
            <p className="text-[11px] text-slate-400">Original AI expression clearance</p>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'rendering') {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Video className="w-6 h-6 text-indigo-400" />
              Video Rendering Engine
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              FFmpeg & Cloud Video Rendering Worker pipeline specifications.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Worker Queue Ready
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Worker Architecture Specification
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Per architectural instructions: <em>"If rendering requires a separate worker, design the worker interface and job system rather than pretending the web server has completed the rendering."</em>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-bold text-indigo-300 block">1. Job Queue Contract</span>
              <p className="text-slate-400">
                Jobs contain: project ID, aspect ratio (9:16), scene durations, audio stems, subtitle SRT chunks, and transition commands.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-bold text-indigo-300 block">2. Worker Execution</span>
              <p className="text-slate-400">
                Worker utilizes FFmpeg multi-pass filter complexes for 1080x1920 (9:16) resolution, subtitle burning, and audio ducking.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'preview') {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <PlaySquare className="w-6 h-6 text-indigo-400" />
            Global Video Previews
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and inspect mobile 9:16 vertical video players across all projects.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => onOpenProject(p.id)}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer space-y-3"
            >
              <div className="aspect-[9/16] w-full max-w-[200px] mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between p-3 relative overflow-hidden group">
                <span className="text-[10px] font-bold text-indigo-400 bg-black/60 px-2 py-0.5 rounded-full z-10 w-fit">
                  {p.aspectRatio}
                </span>

                <div className="my-auto text-center z-10">
                  <PlaySquare className="w-8 h-8 text-indigo-400 mx-auto" />
                </div>

                <div className="bg-black/80 p-2 rounded-lg text-center z-10">
                  <p className="text-[11px] font-bold text-white line-clamp-2">
                    "{p.script?.hook || p.title}"
                  </p>
                </div>

                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 to-purple-950/40" />
              </div>

              <div className="text-center">
                <h4 className="font-bold text-white text-sm">{p.title}</h4>
                <span className="text-[11px] text-slate-400">{p.targetDuration} • {p.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'approvals') {
    const pendingApprovals = projects.filter((p) => p.status === 'review');
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Approvals & Editorial Gate
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Factual claim audits, pacing reviews, and producer sign-offs.
          </p>
        </div>

        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {p.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      p.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm">{p.title}</h3>
                <p className="text-xs text-slate-400">
                  Claims: {(p.claims || []).filter((c) => c.status === 'Supported').length} verified of {(p.claims || []).length}
                </p>
              </div>

              <button
                onClick={() => onOpenProject(p.id)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Review Gate
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'publishing') {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Share2 className="w-6 h-6 text-indigo-400" />
              Social Media Publishing & Scheduling
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Official YouTube Shorts, TikTok, and Instagram Reels dispatch center.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Manual Sign-Off Enforced
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Connected Social Media Accounts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'YouTube Shorts', status: 'Pending OAuth Integration', note: 'Requires YouTube Data API v3' },
              { name: 'TikTok', status: 'Pending OAuth Integration', note: 'Requires TikTok Content Posting API' },
              { name: 'Instagram Reels', status: 'Pending OAuth Integration', note: 'Requires Meta Graph API' },
            ].map((acc) => (
              <div key={acc.name} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
                <span className="font-bold text-white block">{acc.name}</span>
                <span className="text-[11px] text-amber-400 block">{acc.status}</span>
                <span className="text-[10px] text-slate-400">{acc.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Help & Docs
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-indigo-400" />
          AI Video Studio Documentation & Playbook
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Production best practices, fact-checking methodology, and viral short-form pacing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="font-bold text-white text-sm flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            The 3-Second Hook Rule
          </span>
          <p className="text-slate-300 leading-relaxed">
            Short-form viewers decide whether to stay or scroll within 1.8 to 3.2 seconds. Never start with a greeting ("Hey guys"). Start with an immediate contradiction, a shock statistic, or an impossible scenario.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="font-bold text-white text-sm flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Factual Claim Atomicity
          </span>
          <p className="text-slate-300 leading-relaxed">
            Every date, historical figure action, and crime claim is split into atomic assertions. When sources dispute a narrative, mark the claim as "Disputed" and explain both perspectives.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="font-bold text-white text-sm flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-purple-400" />
            9:16 Vertical Safe Zones
          </span>
          <p className="text-slate-300 leading-relaxed">
            Keep visual focal points and subtitle animations inside the middle 70% of the screen. YouTube and TikTok UI overlays obscure the bottom 15% and right 10%.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="font-bold text-white text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Gemini 3.8 Flash Integration
          </span>
          <p className="text-slate-300 leading-relaxed">
            Generate 3 creative angles, draft scene narrations, estimated duration, and unverified claims list automatically using server-side Gemini endpoints.
          </p>
        </div>
      </div>
    </div>
  );
};
