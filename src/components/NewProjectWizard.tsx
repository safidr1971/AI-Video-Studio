import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Smartphone,
  Monitor,
  Square,
  ShieldCheck,
  Search,
  Brain,
  Layers,
  Wand2
} from 'lucide-react';
import { StoryCategory, Project, TargetDuration, AspectRatio, ResearchMode, ResearchDepth } from '../types';

interface NewProjectWizardProps {
  categories: StoryCategory[];
  onCreateProject: (data: Partial<Project>) => Promise<string | void>;
  onCancel: () => void;
  onOpenAIGenerator: () => void;
}

export const NewProjectWizard: React.FC<NewProjectWizardProps> = ({
  categories,
  onCreateProject,
  onCancel,
  onOpenAIGenerator,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Historical Events');
  const [language, setLanguage] = useState('English');
  const [targetAudience, setTargetAudience] = useState('General Public & Short-Video Enthusiasts');
  const [targetDuration, setTargetDuration] = useState<TargetDuration>('60s');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [narrationStyle, setNarrationStyle] = useState('Dramatic & Suspenseful');
  const [visualStyle, setVisualStyle] = useState('Cinematic Photorealistic');
  const [researchMode, setResearchMode] = useState<ResearchMode>('combined');
  const [researchDepth, setResearchDepth] = useState<ResearchDepth>('deep');
  const [scriptTransformation, setScriptTransformation] = useState('Original script based on research');
  const [publishingWorkflow, setPublishingWorkflow] = useState('Manual approval required');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Project title is required.';
    }
    if (!category) {
      errs.category = 'Please select a story category.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateProject({
        title: title.trim(),
        description: description.trim() || title.trim(),
        category,
        language,
        targetAudience,
        targetDuration,
        aspectRatio,
        narrationStyle,
        visualStyle,
        researchMode,
        researchDepth,
        scriptTransformation,
        publishingWorkflow,
        status: 'draft',
      });
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to create project' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>New Video Project Wizard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure parameters, audience, pacing, and factual verification rules.
          </p>
        </div>

        <button
          onClick={onOpenAIGenerator}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Generate with Gemini AI First</span>
        </button>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { num: 1, label: 'Story & Category', desc: 'Title, topic, premise' },
          { num: 2, label: 'Format & Audience', desc: 'Ratio, timing, listeners' },
          { num: 3, label: 'Style & Verification', desc: 'Tone, research mode' },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => {
              if (s.num < step) setStep(s.num as any);
            }}
            className={`p-3.5 rounded-xl border transition-all ${
              step === s.num
                ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                : step > s.num
                ? 'bg-slate-900 border-emerald-500/40 text-emerald-400 cursor-pointer'
                : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.num
                    ? 'bg-indigo-600 text-white'
                    : step > s.num
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <div>
                <span className="text-xs font-bold block text-white">{s.label}</span>
                <span className="text-[10px] text-slate-400 hidden sm:block">{s.desc}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {errors.submit && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errors.submit}</span>
        </div>
      )}

      {/* STEP 1: Story & Category */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Project Title <span className="text-rose-400">*</span></span>
              {errors.title && <span className="text-rose-400 lowercase font-normal">{errors.title}</span>}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder="e.g., The Mystery of Room 1046: The Man Who Talked to Shadows"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Story Description or Research Topic
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the historical event, myth, crime narrative, or philosophical dilemma you want to explore..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Story Category <span className="text-rose-400">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => {
                const isSelected = category.toLowerCase() === cat.name.toLowerCase();
                return (
                  <div
                    key={cat.id}
                    onClick={() => setCategory(cat.name)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-950'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-bold text-white">
                        {cat.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Format & Audience */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          {/* Aspect Ratio */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Video Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  id: '9:16' as AspectRatio,
                  label: '9:16 Vertical Short',
                  desc: 'YouTube Shorts, TikTok, Instagram Reels',
                  icon: Smartphone,
                },
                {
                  id: '16:9' as AspectRatio,
                  label: '16:9 Widescreen',
                  desc: 'Standard YouTube, Web Video',
                  icon: Monitor,
                },
                {
                  id: '1:1' as AspectRatio,
                  label: '1:1 Square',
                  desc: 'Instagram Feed, LinkedIn Video',
                  icon: Square,
                },
              ].map((ar) => {
                const Icon = ar.icon;
                const isSelected = aspectRatio === ar.id;
                return (
                  <div
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all text-center flex flex-col items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-950'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white">{ar.label}</span>
                    <span className="text-[10px] text-slate-400">{ar.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Duration */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Target Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: '30s' as TargetDuration, label: '30 Seconds', pace: 'Super Fast Viral hook' },
                { id: '60s' as TargetDuration, label: '60 Seconds', pace: 'Recommended Standard' },
                { id: '90s' as TargetDuration, label: '90 Seconds', pace: 'Detailed narrative' },
                { id: '180s' as TargetDuration, label: '3 Minutes', pace: 'Extended mini-doc' },
              ].map((d) => {
                const isSelected = targetDuration === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setTargetDuration(d.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {d.label}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{d.pace}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Language & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Primary Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Japanese">Japanese (日本語)</option>
                <option value="Arabic">Arabic (العربية)</option>
                <option value="Portuguese">Portuguese (Português)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Target Audience Demographics
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Young adults, history buffs, stoic practitioners..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Creative Tone & Verification Mode */}
      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          {/* Creative Styles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Narration Voice & Style
              </label>
              <select
                value={narrationStyle}
                onChange={(e) => setNarrationStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Dramatic & Suspenseful">Dramatic & Suspenseful (Mystery/Crime)</option>
                <option value="Deep, Calm & Authoritative">Deep, Calm & Authoritative (Stoic/History)</option>
                <option value="Fast-Paced & Energetic">Fast-Paced & Energetic (Viral Pop/Humor)</option>
                <option value="Eerie & Intimate Whisper">Eerie & Intimate Whisper (Scary Stories)</option>
                <option value="Epic & Mythic">Epic & Mythic (Olympian/Legends)</option>
                <option value="Witty & Observational">Witty & Conversational (Jokes/Satire)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Visual Aesthetic
              </label>
              <select
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Cinematic Photorealistic">Cinematic Photorealistic (High Drama)</option>
                <option value="Dark Noir & Chiaroscuro">Dark Noir & Chiaroscuro (Crime/Suspense)</option>
                <option value="Epic Mythological Bronze Age">Epic Mythological (Bronze Age glow)</option>
                <option value="Vintage Archival & Sepia">Vintage Archival & Sepia (Documentary)</option>
                <option value="Stylized Gothic Horror">Stylized Gothic Horror (Dark Fog)</option>
                <option value="Modern Minimalist & Typography">Modern Minimalist & Kinetic Typography</option>
              </select>
            </div>
          </div>

          {/* Research Mode */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Research Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'combined' as ResearchMode,
                  title: 'Combined Research & AI',
                  desc: 'Search internet evidence + creative AI ideation (Default)',
                  icon: Layers,
                },
                {
                  id: 'internet' as ResearchMode,
                  title: 'Strict Internet Research',
                  desc: 'Prioritize primary sources, records, and documented accounts',
                  icon: Search,
                },
                {
                  id: 'ai_only' as ResearchMode,
                  title: 'AI-Only Ideation',
                  desc: 'Direct generative synthesis for humor and fictional lore',
                  icon: Brain,
                },
              ].map((rm) => {
                const Icon = rm.icon;
                const isSelected = researchMode === rm.id;
                return (
                  <div
                    key={rm.id}
                    onClick={() => setResearchMode(rm.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-white">{rm.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">{rm.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Research Depth & Publishing Guard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                Research Depth
              </span>
              <div className="flex gap-2">
                {(['standard', 'deep', 'exhaustive'] as ResearchDepth[]).map((depth) => (
                  <button
                    key={depth}
                    type="button"
                    onClick={() => setResearchDepth(depth)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize border ${
                      researchDepth === depth
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {depth}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">
                {researchDepth === 'deep'
                  ? 'Exhaustive cross-referencing of claims, quotes, and primary sources.'
                  : researchDepth === 'exhaustive'
                  ? 'Maximum source gathering with full contradiction checking.'
                  : 'Fast synthesis of verified core facts.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Publishing Workflow Guard
              </span>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-emerald-400">Manual Approval Required</span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  No video will be scheduled or published to social media APIs until evidence is verified and approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        {step > 1 ? (
          <button
            onClick={() => setStep((step - 1) as any)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        )}

        {step < 3 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <span>Saving Project to Database...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Create & Open Project Workspace</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
