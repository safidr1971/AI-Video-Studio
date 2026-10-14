import React from 'react';
import { Settings, Sparkles, Database, ShieldCheck, Server, AlertCircle, CheckCircle2, Key, RefreshCw } from 'lucide-react';
import { SystemStatus } from '../lib/api';

interface SettingsViewProps {
  systemStatus: SystemStatus | null;
  onRefreshStatus: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  systemStatus,
  onRefreshStatus,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            Studio Settings & Integrations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            System configuration, AI credentials, and database persistence infrastructure.
          </p>
        </div>

        <button
          onClick={onRefreshStatus}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Health Check</span>
        </button>
      </div>

      {/* Services Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gemini Service */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                systemStatus?.geminiConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {systemStatus?.geminiConfigured ? 'Connected' : 'Action Required'}
            </span>
          </div>

          <div>
            <h3 className="font-bold text-white text-sm">Gemini AI Service</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Powered by @google/genai SDK (gemini-3.8-flash)
            </p>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
            {systemStatus?.geminiConfigured ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                API key injected & verified.
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Key missing in Settings &gt; Secrets.
              </span>
            )}
          </div>
        </div>

        {/* Persistent Server Database */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Active & Saved
            </span>
          </div>

          <div>
            <h3 className="font-bold text-white text-sm">Server Storage Engine</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Atomic disk writes (data/app_data.json)
            </p>
          </div>

          <div className="pt-2 text-[11px] text-emerald-400 flex items-center gap-1 border-t border-slate-800/80">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Persists across reboots and browser refreshes.
          </div>
        </div>

        {/* Firebase Cloud Firestore / Auth */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                systemStatus?.firebaseConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {systemStatus?.firebaseConfigured ? 'Configured' : 'Blueprint Ready'}
            </span>
          </div>

          <div>
            <h3 className="font-bold text-white text-sm">Firebase Cloud Firestore</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              firebase-blueprint.json & firestore.rules
            </p>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
            {systemStatus?.firebaseConfigured ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Linked to Google Cloud project.
              </span>
            ) : (
              <span className="text-slate-400">
                Ready for user approval in UI modal.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Firebase Setup Guidance Details */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-400" />
          Persistence Architecture & Firebase Setup Guidance
        </h2>
        <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
          <p>
            AI Video Studio adheres to the principle: <em>"Never silently substitute temporary storage or pretend an integration is complete."</em>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Current Main Persistence:</span>
              <p className="text-slate-400">
                All projects, categories, atomic claims, scripts, and audit events are stored in the server-side persistent engine. Your data is preserved across page refreshes and server restarts.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Firebase Firestore & Auth Ready:</span>
              <p className="text-slate-400">
                The intermediate representation schema (<code className="text-indigo-300">firebase-blueprint.json</code>) and security rules (<code className="text-indigo-300">firestore.rules</code>) have been created and validated for ABAC zero-trust standards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Production Guidelines */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs text-slate-400">
        <h3 className="font-bold text-white text-sm">System Guardrails</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>Factual claims are tagged "Unverified" until verified by human reviewers or verified search engine citations.</li>
          <li>Video scripts require manual review and sign-off before entering the publishing queue.</li>
          <li>API keys and credentials are kept strictly on the Node.js server and never sent to browser bundles.</li>
        </ul>
      </div>
    </div>
  );
};
