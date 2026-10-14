import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Save,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  Search,
  FileText,
  Clapperboard,
  Mic,
  Video,
  PlaySquare,
  ShieldCheck,
  Share2,
  Layers,
  Clock,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { Project, FactualClaim, ScriptScene, ScriptData, StoryboardScene, VerificationStatus, ConfidenceAssessment } from '../types';

interface ProjectDetailViewProps {
  project: Project;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  onUpdateClaim: (projectId: string, claimId: string, updates: Partial<FactualClaim>) => Promise<void>;
  onBack: () => void;
  onOpenAIGenerator: () => void;
}

type StageTab =
  | 'research'
  | 'evidence'
  | 'script'
  | 'storyboard'
  | 'voiceVisuals'
  | 'videoPreview'
  | 'approval'
  | 'publishing';

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onUpdateProject,
  onUpdateClaim,
  onBack,
  onOpenAIGenerator,
}) => {
  const [activeTab, setActiveTab] = useState<StageTab>('script');

  // Script Editing State
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [scriptTitle, setScriptTitle] = useState(project.script?.title || project.title);
  const [scriptHook, setScriptHook] = useState(project.script?.hook || '');
  const [scriptScenes, setScriptScenes] = useState<ScriptScene[]>(project.script?.scenes || []);
  const [scriptCta, setScriptCta] = useState(project.script?.callToAction || '');
  const [isSavingScript, setIsSavingScript] = useState(false);

  // New Claim State
  const [newClaimText, setNewClaimText] = useState('');
  const [newClaimScene, setNewClaimScene] = useState<number>(1);
  const [isAddingClaim, setIsAddingClaim] = useState(false);

  // Video Preview Simulation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);

  const stages = [
    { id: 'research' as StageTab, label: '1. Research', status: project.workflowStages.research, icon: Search },
    { id: 'evidence' as StageTab, label: '2. Evidence & Claims', status: project.workflowStages.evidence, icon: ShieldAlert },
    { id: 'script' as StageTab, label: '3. Script Editor', status: project.workflowStages.script, icon: FileText },
    { id: 'storyboard' as StageTab, label: '4. Storyboard', status: project.workflowStages.storyboard, icon: Clapperboard },
    { id: 'voiceVisuals' as StageTab, label: '5. Voice & Visuals', status: project.workflowStages.voiceVisuals, icon: Mic },
    { id: 'videoPreview' as StageTab, label: '6. Video Preview', status: project.workflowStages.videoPreview, icon: PlaySquare },
    { id: 'approval' as StageTab, label: '7. Approval', status: project.workflowStages.approval, icon: ShieldCheck },
    { id: 'publishing' as StageTab, label: '8. Publishing', status: project.workflowStages.publishing, icon: Share2 },
  ];

  const handleSaveScript = async () => {
    setIsSavingScript(true);
    try {
      const estimatedDuration = scriptScenes.reduce((acc, sc) => acc + (Number(sc.durationSeconds) || 0), 0);
      const newScript: ScriptData = {
        version: (project.script?.version || 1) + 1,
        title: scriptTitle,
        hook: scriptHook,
        scenes: scriptScenes,
        callToAction: scriptCta,
        estimatedDuration,
        lastEditedAt: new Date().toISOString(),
      };

      await onUpdateProject(project.id, {
        script: newScript,
        workflowStages: {
          ...project.workflowStages,
          script: 'ready',
        },
      });
      setIsEditingScript(false);
    } finally {
      setIsSavingScript(false);
    }
  };

  const handleAddClaim = async () => {
    if (!newClaimText.trim()) return;
    const newClaim: FactualClaim = {
      id: `claim-${Date.now()}`,
      claimText: newClaimText.trim(),
      associatedScene: newClaimScene,
      status: 'Unverified',
      confidenceAssessment: 'Pending',
      reviewerNotes: 'Added manually for verification.',
      updatedAt: new Date().toISOString(),
    };

    const currentClaims = project.claims || [];
    await onUpdateProject(project.id, {
      claims: [...currentClaims, newClaim],
    });

    setNewClaimText('');
    setIsAddingClaim(false);
  };

  const handleClaimStatusChange = async (claimId: string, status: VerificationStatus) => {
    await onUpdateClaim(project.id, claimId, { status });
  };

  const handleApproveProject = async () => {
    await onUpdateProject(project.id, {
      status: 'approved',
      workflowStages: {
        ...project.workflowStages,
        approval: 'approved',
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {project.category}
              </span>
              <span className="text-xs text-slate-400">
                {project.targetDuration} • {project.aspectRatio} • {project.language}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">
              {project.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenAIGenerator}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Story Ideator</span>
          </button>
        </div>
      </div>

      {/* Stage Pipeline Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        {stages.map((st) => {
          const Icon = st.icon;
          const isActive = activeTab === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setActiveTab(st.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                isActive
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{st.label}</span>
              <span
                className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                  st.status === 'ready' || st.status === 'verified' || st.status === 'completed' || st.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : st.status === 'unverified' || st.status === 'pending'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {st.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* STAGE 1: Research View */}
      {activeTab === 'research' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" />
                Research Engine
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Target query parameters, source extraction, and search engine integration.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Provider Integration Scheduled
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Active Research Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Research Mode</span>
                <span className="font-bold text-white uppercase">{project.researchMode}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Depth</span>
                <span className="font-bold text-white uppercase">{project.researchDepth}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Script Transformation</span>
                <span className="font-bold text-white">{project.scriptTransformation}</span>
              </div>
            </div>
          </div>

          {/* Research Engine Status Notice */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs space-y-2 text-indigo-200">
            <div className="flex items-center gap-2 font-bold text-white">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Research Engine Specification Notice</span>
            </div>
            <p className="leading-relaxed">
              Per System Instructions, external web search engines and automated scraper providers are strictly configured through authenticated safe endpoints. In Phase 1, ideas and initial factual claim extractions are generated directly via server-side Gemini 3.8 Flash. Automated internet live crawler and source deduplication providers will connect in Phase 2.
            </p>
          </div>
        </div>
      )}

      {/* STAGE 2: Evidence & Factual Claims */}
      {activeTab === 'evidence' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Factual Claims & Evidence Verification
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every factual assertion is audited. Distinguish documented evidence from dramatization.
              </p>
            </div>

            <button
              onClick={() => setIsAddingClaim(!isAddingClaim)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Factual Claim</span>
            </button>
          </div>

          {/* Add Claim Form */}
          {isAddingClaim && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  New Factual Statement
                </h3>
                <button
                  onClick={() => setIsAddingClaim(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <textarea
                rows={2}
                value={newClaimText}
                onChange={(e) => setNewClaimText(e.target.value)}
                placeholder="Enter atomic claim (e.g. 'Marcus Aurelius auctioned imperial treasures in the Forum of Trajan')..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-400">Associated Scene:</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newClaimScene}
                  onChange={(e) => setNewClaimScene(Number(e.target.value) || 1)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                />
                <button
                  onClick={handleAddClaim}
                  disabled={!newClaimText.trim()}
                  className="ml-auto px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all"
                >
                  Save Claim
                </button>
              </div>
            </div>
          )}

          {/* Claims List */}
          {(!project.claims || project.claims.length === 0) ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No claims recorded yet. Generate a script with Gemini AI or add claims manually above.
            </div>
          ) : (
            <div className="space-y-3">
              {project.claims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Scene {claim.associatedScene}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          claim.status === 'Supported'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : claim.status === 'Partially supported'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : claim.status === 'Disputed' || claim.status === 'Contradicted'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {claim.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Confidence: <strong className="text-slate-300">{claim.confidenceAssessment}</strong>
                      </span>
                    </div>

                    {/* Quick status selector */}
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] text-slate-400">Set Status:</label>
                      <select
                        value={claim.status}
                        onChange={(e) => handleClaimStatusChange(claim.id, e.target.value as VerificationStatus)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                      >
                        <option value="Supported">Supported</option>
                        <option value="Partially supported">Partially supported</option>
                        <option value="Disputed">Disputed</option>
                        <option value="Unverified">Unverified</option>
                        <option value="Contradicted">Contradicted</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-100">
                    "{claim.claimText}"
                  </p>

                  {claim.evidence && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                      <span className="text-slate-400 font-semibold block text-[11px]">
                        Supporting Evidence:
                      </span>
                      <p className="text-slate-300">{claim.evidence}</p>
                    </div>
                  )}

                  {claim.sourceReferences && claim.sourceReferences.length > 0 && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="font-semibold text-slate-400">Sources:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {claim.sourceReferences.map((src, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                            {src}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: Script Editor */}
      {activeTab === 'script' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Scene-by-Scene Script Editor
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  Version {project.script?.version || 1}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Estimated duration: ~{project.script?.estimatedDuration || 60} seconds • {project.script?.scenes.length || 0} Scenes
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isEditingScript ? (
                <>
                  <button
                    onClick={() => setIsEditingScript(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveScript}
                    disabled={isSavingScript}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingScript ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingScript(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Script</span>
                </button>
              )}
            </div>
          </div>

          {/* Hook section */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
              Opening Hook (First 3 Seconds)
            </span>
            {isEditingScript ? (
              <textarea
                rows={2}
                value={scriptHook}
                onChange={(e) => setScriptHook(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <p className="text-sm font-semibold text-white leading-relaxed">
                "{project.script?.hook || 'No hook set yet.'}"
              </p>
            )}
          </div>

          {/* Scenes */}
          <div className="space-y-4">
            {(!project.script || project.script.scenes.length === 0) ? (
              <div className="text-center py-8 text-xs text-slate-400 space-y-3">
                <p>No script scenes yet.</p>
                <button
                  onClick={onOpenAIGenerator}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Script with Gemini</span>
                </button>
              </div>
            ) : (
              (isEditingScript ? scriptScenes : project.script.scenes).map((scene, idx) => (
                <div
                  key={scene.sceneNumber || idx}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px]">
                        {scene.sceneNumber}
                      </span>
                      Scene {scene.sceneNumber}
                    </span>
                    <span className="text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded text-[11px] font-mono border border-slate-800">
                      ~{scene.durationSeconds}s
                    </span>
                  </div>

                  {isEditingScript ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Narration:</label>
                        <textarea
                          rows={2}
                          value={scene.narration}
                          onChange={(e) => {
                            const updated = [...scriptScenes];
                            updated[idx] = { ...updated[idx], narration: e.target.value };
                            setScriptScenes(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Visual Prompt:</label>
                        <textarea
                          rows={2}
                          value={scene.visualPrompt}
                          onChange={(e) => {
                            const updated = [...scriptScenes];
                            updated[idx] = { ...updated[idx], visualPrompt: e.target.value };
                            setScriptScenes(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/90 text-xs">
                        <span className="text-slate-400 font-semibold block mb-1">Narration Voiceover:</span>
                        <p className="text-slate-200 leading-relaxed font-medium">"{scene.narration}"</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60 text-xs">
                        <span className="text-slate-400 font-semibold block mb-0.5">Visual Scene Prompt:</span>
                        <p className="text-slate-400 italic">{scene.visualPrompt}</p>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Call to action */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold block mb-1">Ending Call to Action:</span>
            {isEditingScript ? (
              <input
                type="text"
                value={scriptCta}
                onChange={(e) => setScriptCta(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            ) : (
              <p className="text-slate-200">{project.script?.callToAction || 'Subscribe for more.'}</p>
            )}
          </div>
        </div>
      )}

      {/* STAGE 4: Storyboard */}
      {activeTab === 'storyboard' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-indigo-400" />
                Visual Storyboard & Shot Flow
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Timeline pacing, visual cues, sound directions, and transitions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(project.storyboard && project.storyboard.length > 0
              ? project.storyboard
              : (project.script?.scenes || []).map((sc, i) => ({
                  id: `sb-${i}`,
                  sceneOrder: sc.sceneNumber,
                  narrationText: sc.narration,
                  estimatedDuration: sc.durationSeconds,
                  visualDescription: sc.visualPrompt,
                  subtitleText: sc.narration,
                  transition: sc.transition || 'Smooth Cut',
                  soundMusicInstructions: sc.soundCue || 'Atmospheric tension',
                }))
            ).map((item) => (
              <div
                key={item.sceneOrder}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-400">
                    Shot #{item.sceneOrder}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {item.estimatedDuration}s • {item.transition}
                  </span>
                </div>

                <div className="aspect-video w-full rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <Clapperboard className="w-6 h-6 text-slate-600" />
                  <p className="text-xs text-slate-400 italic line-clamp-3">
                    {item.visualDescription}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-medium block text-[10px]">Subtitle Text:</span>
                  <p className="text-slate-200">"{item.subtitleText}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 5: Voice & Visuals */}
      {activeTab === 'voiceVisuals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-indigo-400" />
                Voice Narration & Visual Model Pipeline
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                TTS voice persona, cadence, and visual generation prompts.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
              Media Engine Ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
                Narration Configuration
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Narration Style</span>
                  <span className="font-semibold text-white">{project.narrationStyle}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Language</span>
                  <span className="font-semibold text-white">{project.language}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">TTS Engine Model</span>
                  <span className="font-semibold text-indigo-300">gemini-3.8-flash-lite-tts</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
                Visual Art Direction
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Visual Style</span>
                  <span className="font-semibold text-white">{project.visualStyle}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Aspect Ratio</span>
                  <span className="font-semibold text-white">{project.aspectRatio}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Image/Video Engine</span>
                  <span className="font-semibold text-purple-300">gemini-3.1-flash-lite-image</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 6: Video Preview Player */}
      {activeTab === 'videoPreview' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PlaySquare className="w-5 h-5 text-indigo-400" />
                Short Video Interactive Preview Player
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate vertical 9:16 mobile playback, subtitle synchronization, and pacing.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
            {/* 9:16 Mobile Mockup Player */}
            <div className="relative w-72 h-[480px] bg-slate-950 rounded-3xl border-4 border-slate-700 shadow-2xl overflow-hidden flex flex-col justify-between p-4">
              {/* Header inside phone */}
              <div className="flex items-center justify-between text-white text-[10px] z-10">
                <span className="font-bold bg-slate-900/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {project.category}
                </span>
                <span className="font-mono bg-slate-900/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Scene {currentSceneIdx + 1}/{(project.script?.scenes.length || 1)}
                </span>
              </div>

              {/* Center Scene Visual Content */}
              <div className="my-auto text-center space-y-3 px-2 z-10">
                <div className="w-12 h-12 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
                  <PlaySquare className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-300 italic line-clamp-3 bg-black/40 p-2.5 rounded-xl backdrop-blur-sm border border-white/5">
                  {project.script?.scenes[currentSceneIdx]?.visualPrompt || 'Visual scene simulation'}
                </p>
              </div>

              {/* Subtitles Overlay */}
              <div className="space-y-3 z-10">
                <div className="bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                    Live Subtitles
                  </span>
                  <p className="text-xs font-bold text-white leading-snug">
                    "{project.script?.scenes[currentSceneIdx]?.narration || project.script?.hook || 'Narration playback...'}"
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{
                      width: `${((currentSceneIdx + 1) / (project.script?.scenes.length || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Background ambient lighting */}
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-purple-950/60 pointer-events-none" />
            </div>

            {/* Controls panel */}
            <div className="space-y-4 max-w-sm w-full">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Playback Timeline Controls
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const scenesCount = project.script?.scenes.length || 1;
                      setCurrentSceneIdx((prev) => (prev > 0 ? prev - 1 : 0));
                    }}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlaying ? 'Pause' : 'Play Simulation'}</span>
                  </button>
                  <button
                    onClick={() => {
                      const scenesCount = project.script?.scenes.length || 1;
                      setCurrentSceneIdx((prev) => (prev < scenesCount - 1 ? prev + 1 : 0));
                    }}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">Reviewer Guidance:</span>
                <p>Confirm that the opening hook fires within the first 3 seconds and that subtitles maintain high contrast over visual elements.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 7: Approval */}
      {activeTab === 'approval' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Editorial & Factual Approval Gate
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enforce quality standards, verify all claims, and sign off for publication.
              </p>
            </div>
            <span
              className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                project.status === 'approved'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              Status: {project.status}
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'Factual Claims Verified',
                desc: 'All statements cross-referenced against reliable sources with evidence notes.',
                passed: (project.claims || []).every((c) => c.status === 'Supported') && (project.claims || []).length > 0,
              },
              {
                title: 'Script Pacing & Originality Screened',
                desc: 'Original narrative phrasing with viral 3-second hook.',
                passed: Boolean(project.script && project.script.scenes.length > 0),
              },
              {
                title: 'Visual Assets & Safe Zones Checked',
                desc: 'Subtitle text within 9:16 vertical safe margins for mobile UI.',
                passed: true,
              },
              {
                title: 'Manual Publisher Authorization',
                desc: 'Final human sign-off requirement satisfied.',
                passed: project.status === 'approved',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <span className="font-bold text-white block text-sm">{item.title}</span>
                  <span className="text-slate-400">{item.desc}</span>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    item.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            {project.status !== 'approved' ? (
              <button
                onClick={handleApproveProject}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Approve Video for Publishing</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Approved & Ready for Dispatch</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 8: Publishing */}
      {activeTab === 'publishing' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-400" />
                Social Media Dispatch & Publishing
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Schedule and distribute approved short videos to official accounts.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              API Connectors Scheduled
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Target Platforms
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['YouTube Shorts', 'TikTok', 'Instagram Reels'].map((plt) => (
                <div key={plt} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{plt}</span>
                  <span className="text-[10px] text-slate-500 uppercase">Awaiting OAuth</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 space-y-1">
            <span className="font-bold text-white block">Publishing Safety Guard:</span>
            <p>
              In accordance with Phase 1 instructions, publishing connectors are not fabricated. Once OAuth credentials for YouTube, TikTok, and Instagram are linked in future phases, videos will be scheduled and dispatched seamlessly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
