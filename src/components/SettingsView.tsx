import React, { useState } from 'react';
import {
  Settings,
  Sparkles,
  Database,
  ShieldCheck,
  Server,
  AlertCircle,
  CheckCircle2,
  Key,
  RefreshCw,
  User,
  ArrowRight,
  UploadCloud,
  FileText
} from 'lucide-react';
import { SystemStatus, api } from '../lib/api';
import { getStoredDevToken, setCustomDevToken, isDevTokenAllowed } from '../lib/firebase';

interface SettingsViewProps {
  systemStatus: SystemStatus | null;
  onRefreshStatus: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  systemStatus,
  onRefreshStatus,
}) => {
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [devUserUid, setDevUserUid] = useState(systemStatus?.authenticatedUser?.uid || 'creator-default');

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMigrationStatus(null);
    try {
      const res = await api.migrateFromJson();
      setMigrationStatus(res.message);
      onRefreshStatus();
    } catch (err: any) {
      setMigrationStatus(`Migration error: ${err.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSwitchDevUser = (newUid: string) => {
    setDevUserUid(newUid);
    setCustomDevToken(`test-token-${newUid}`);
    onRefreshStatus();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            Studio Settings & Security
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Server authentication, Firestore repository status, and AI reliability safeguards.
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

      {/* Authenticated Identity Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Authenticated Identity (Server-Verified)</h3>
              <p className="text-xs text-slate-400">
                All projects, scripts, claims, and approvals are strictly bound to this UID.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">User UID</span>
            <span className="font-mono text-white text-xs font-semibold">
              {systemStatus?.authenticatedUser?.uid || 'anonymous'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Email / Principal</span>
            <span className="text-slate-300 text-xs">
              {systemStatus?.authenticatedUser?.email || 'authenticated-creator'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Studio Role</span>
            <span className="font-semibold text-indigo-300 uppercase">
              {systemStatus?.authenticatedUser?.role || 'creator'}
            </span>
          </div>
        </div>

        {/* Development User Switcher */}
        {isDevTokenAllowed() && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              Test Ownership Isolation:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSwitchDevUser('creator-alice')}
                className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                  devUserUid === 'creator-alice'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                User Alice
              </button>
              <button
                onClick={() => handleSwitchDevUser('creator-bob')}
                className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                  devUserUid === 'creator-bob'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                User Bob
              </button>
            </div>
          </div>
        )}
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
              {systemStatus?.geminiConfigured ? 'Active (gemini-3.8-flash)' : 'Action Required'}
            </span>
          </div>

          <div>
            <h3 className="font-bold text-white text-sm">Gemini AI Service</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict server-side validation & claim quarantine
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

        {/* Firestore Repository */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Firestore Engine
            </span>
          </div>

          <div>
            <h3 className="font-bold text-white text-sm">Firestore Repository</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Backend data path uses Firestore models
            </p>
          </div>

          <div className="pt-2 text-[11px] text-emerald-400 flex items-center gap-1 border-t border-slate-800/80">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Zero-Trust ABAC isolation enforced.
          </div>
        </div>

        {/* Workflow Gatekeeper */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Enforced
            </span>
          </div>

          <div>
            <h3 className="font-bold text-white text-sm">Workflow Integrity Guard</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mass assignment blocked & approval hashing
            </p>
          </div>

          <div className="pt-2 text-[11px] text-emerald-400 flex items-center gap-1 border-t border-slate-800/80">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Status jumps to approved/published blocked.
          </div>
        </div>
      </div>

      {/* Migration to Firestore Tool */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              Migrate Existing Data to Firestore
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Import existing records from <code>data/app_data.json</code> into Firestore under your authenticated UID. Existing JSON data is safely backed up and never deleted.
            </p>
          </div>

          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all shrink-0 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isMigrating ? 'Migrating...' : 'Run Firestore Migration'}</span>
          </button>
        </div>

        {migrationStatus && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-mono">
            {migrationStatus}
          </div>
        )}
      </div>

      {/* Production Guidelines */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs text-slate-400">
        <h3 className="font-bold text-white text-sm">Repair Safeguards Enforced</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Ownership Isolation:</strong> All data queries filter by <code>ownerId == authenticatedUser.uid</code>. Manipulating IDs returns 403 Forbidden or 404 Not Found.</li>
          <li><strong>Approval Hashing:</strong> Approvals bind to the exact SHA-256 hash of the script. Any subsequent edit to narration or scenes automatically invalidates the approval.</li>
          <li><strong>Publishing Gate:</strong> The dedicated publishing endpoint refuses any video that lacks a valid approval matching the exact current script version.</li>
          <li><strong>Factual Claims Integrity:</strong> All AI-generated claims are unconditionally forced to status <code>"Unverified"</code> and confidence <code>"Pending"</code> on the server.</li>
        </ul>
      </div>
    </div>
  );
};
