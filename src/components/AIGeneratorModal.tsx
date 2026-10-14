import React, { useState } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, AlertTriangle, ArrowRight, Copy, Check, FileText, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';
import { StoryCategory, StoryIdea, ScriptData, FactualClaim, Project } from '../types';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: StoryCategory[];
  currentProject?: Project | null;
  onApplyToProject?: (data: { ideas: StoryIdea[]; selectedIdeaIndex: number; script: ScriptData; claims: FactualClaim[] }) => void;
  onCreateProjectFromGenerated?: (projectData: Partial<Project>) => void;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  categories,
  currentProject,
  onApplyToProject,
  onCreateProjectFromGenerated,
}) => {
  const [topic, setTopic] = useState(currentProject?.description || currentProject?.title || '');
  const [category, setCategory] = useState(currentProject?.category || (categories[0]?.name ?? 'Historical Events'));
  const [language, setLanguage] = useState(currentProject?.language || 'English');
  const [targetDuration, setTargetDuration] = useState<string>(currentProject?.targetDuration || '60s');
  const [narrationStyle, setNarrationStyle] = useState(currentProject?.narrationStyle || 'Dramatic & Suspenseful');
  const [visualStyle, setVisualStyle] = useState(currentProject?.visualStyle || 'Cinematic Photorealistic');
  const [targetAudience, setTargetAudience] = useState(currentProject?.targetAudience || 'General Audience');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMissingKey, setIsMissingKey] = useState(false);

  const [generatedData, setGeneratedData] = useState<{
    ideas: StoryIdea[];
    recommendedIdeaIndex: number;
    script: ScriptData;
    claims: FactualClaim[];
  } | null>(null);

  const [selectedIdeaIdx, setSelectedIdeaIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (useFallback = false) => {
    if (!topic.trim()) {
      setError('Please provide a story topic or question.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsMissingKey(false);

    try {
      const res = await api.generateIdeasAndScript({
        topic: topic.trim(),
        category,
        language,
        targetDuration,
        narrationStyle,
        visualStyle,
        targetAudience,
        allowFallback: Boolean(useFallback),
      });

      if (res.success && res.data) {
        setGeneratedData(res.data);
        setSelectedIdeaIdx(res.data.recommendedIdeaIndex ?? 0);
      } else {
        setError(res.error || 'Failed to generate content.');
        if (res.isMissingKey) {
          setIsMissingKey(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while communicating with Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyScript = () => {
    if (!generatedData) return;
    const fullText = `TITLE: ${generatedData.script.title}
HOOK: ${generatedData.script.hook}

${generatedData.script.scenes.map((s) => `[SCENE ${s.sceneNumber}] (${s.durationSeconds}s)\nVISUAL: ${s.visualPrompt}\nNARRATION: "${s.narration}"`).join('\n\n')}

CALL TO ACTION: ${generatedData.script.callToAction}

FACTUAL CLAIMS TO VERIFY:
${generatedData.claims.map((c, i) => `${i + 1}. [${c.status}] ${c.claimText}`).join('\n')}`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToProject = () => {
    if (!generatedData) return;
    if (onApplyToProject) {
      onApplyToProject({
        ideas: generatedData.ideas,
        selectedIdeaIndex: selectedIdeaIdx,
        script: generatedData.script,
        claims: generatedData.claims,
      });
      onClose();
    }
  };

  const handleCreateNewProject = () => {
    if (!generatedData) return;
    if (onCreateProjectFromGenerated) {
      const selectedIdea = generatedData.ideas[selectedIdeaIdx] || generatedData.ideas[0];
      onCreateProjectFromGenerated({
        title: selectedIdea?.title || generatedData.script.title,
        description: selectedIdea?.synopsis || topic,
        category,
        language,
        targetDuration: (targetDuration as any) || '60s',
        narrationStyle,
        visualStyle,
        targetAudience,
        aspectRatio: '9:16',
        researchMode: 'combined',
        researchDepth: 'deep',
        scriptTransformation: 'Original script based on research',
        publishingWorkflow: 'Manual approval required',
        status: 'scripting',
        ideas: generatedData.ideas,
        selectedIdeaIndex: selectedIdeaIdx,
        script: generatedData.script,
        claims: generatedData.claims,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Gemini AI Story & Script Generator
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  gemini-3.8-flash
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate 3 viral story ideas, a recommended draft script, and atomic factual claims.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Controls Bar */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Topic, Mystery, or Core Event <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The lost Roman Legion IX Hispana that vanished into Scottish mists, or Marcus Aurelius dealing with his best friend's betrayal..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Portuguese">Portuguese</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Duration</label>
                <select
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="30s">30 seconds (Fast Viral)</option>
                  <option value="60s">60 seconds (Standard Short)</option>
                  <option value="90s">90 seconds (Deep Dive)</option>
                  <option value="180s">3 minutes (Extended Mini-Doc)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Narration Style</label>
                <select
                  value={narrationStyle}
                  onChange={(e) => setNarrationStyle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Dramatic & Suspenseful">Dramatic & Suspenseful</option>
                  <option value="Deep, Calm & Authoritative">Deep & Authoritative</option>
                  <option value="Fast-Paced & Energetic">Fast-Paced & Energetic</option>
                  <option value="Eerie & Intimate Whisper">Eerie & Whispering</option>
                  <option value="Witty & Observational">Witty & Conversational</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleGenerate(false)}
                disabled={isLoading || !topic.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini is Ideating & Scripting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate 3 Ideas & Script</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold text-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>AI Generation Notice</span>
              </div>
              <p>{error}</p>
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleGenerate(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Using Studio Script Engine Template</span>
                </button>
              </div>
              {isMissingKey && (
                <div className="mt-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <p className="font-semibold text-white mb-1">How to enable Gemini API:</p>
                  <p>In AI Studio, the Gemini API key is automatically injected or configured via the <strong>Settings &gt; Secrets</strong> panel. Ensure <code className="text-amber-400">GEMINI_API_KEY</code> is set.</p>
                </div>
              )}
            </div>
          )}

          {/* Results Display */}
          {generatedData && (
            <div className="space-y-6 pt-2">
              {/* Section 1: Ideas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    1. Three Generated Story Angles
                  </h3>
                  <span className="text-xs text-slate-400">
                    Select the concept you wish to use
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {generatedData.ideas.map((idea, idx) => {
                    const isSelected = selectedIdeaIdx === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedIdeaIdx(idx)}
                        className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 shadow-lg shadow-indigo-950/50'
                            : 'bg-slate-950/30 border-slate-800 hover:border-slate-700 hover:bg-slate-950/50'
                        }`}
                      >
                        {idea.isRecommended && (
                          <span className="absolute -top-2.5 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-md">
                            ★ Recommended
                          </span>
                        )}
                        <h4 className="font-bold text-white text-sm leading-snug mb-2">
                          {idea.title}
                        </h4>
                        <p className="text-xs text-indigo-300 italic mb-2">
                          "{idea.hook}"
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-3 mb-2">
                          {idea.synopsis}
                        </p>
                        {idea.whyRecommended && (
                          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 font-medium">
                            Why: {idea.whyRecommended}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Script Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    2. Draft Short Video Script (Est. {generatedData.script.estimatedDuration}s)
                  </h3>
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Script'}</span>
                  </button>
                </div>

                <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-4 space-y-4">
                  <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                      Opening Hook (First 3 Seconds)
                    </span>
                    <p className="text-sm font-semibold text-white">
                      "{generatedData.script.hook}"
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {generatedData.script.scenes.map((scene) => (
                      <div
                        key={scene.sceneNumber}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-800/90 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-indigo-400">
                            Scene {scene.sceneNumber}
                          </span>
                          <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                            ~{scene.durationSeconds}s
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          <span className="text-slate-500 font-medium">Narration: </span>
                          "{scene.narration}"
                        </p>
                        <p className="text-xs text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-800/60">
                          <span className="text-slate-500 font-medium">Visual: </span>
                          {scene.visualPrompt}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <span className="text-slate-500 font-medium">Call to Action: </span>
                    <span className="text-slate-200">{generatedData.script.callToAction}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Factual Claims */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    3. Atomic Factual Claims for Verification ({generatedData.claims.length})
                  </h3>
                  <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    Label: All Marked Unverified
                  </span>
                </div>

                <div className="bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="divide-y divide-slate-800">
                    {generatedData.claims.map((claim, idx) => (
                      <div key={idx} className="p-3 flex items-start gap-3 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] shrink-0 mt-0.5">
                          Sc. {claim.associatedScene}
                        </span>
                        <div className="flex-1">
                          <p className="text-slate-200 leading-relaxed font-medium">
                            {claim.claimText}
                          </p>
                          <span className="inline-block mt-1 text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            Status: Unverified (Evidence review pending)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          {generatedData && (
            <div className="flex items-center gap-3">
              {currentProject ? (
                <button
                  onClick={handleSaveToProject}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply Script & Claims to Current Project</span>
                </button>
              ) : (
                <button
                  onClick={handleCreateNewProject}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>Create New Project with this Script</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
