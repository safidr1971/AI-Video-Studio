import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, Search, Filter, ExternalLink } from 'lucide-react';
import { Project, FactualClaim, VerificationStatus } from '../types';

interface EvidenceHubViewProps {
  projects: Project[];
  onUpdateClaim: (projectId: string, claimId: string, updates: Partial<FactualClaim>) => Promise<void>;
  onOpenProject: (projectId: string) => void;
}

export const EvidenceHubView: React.FC<EvidenceHubViewProps> = ({
  projects,
  onUpdateClaim,
  onOpenProject,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Collect all claims from all projects
  const allClaimsWithProject = projects.flatMap((p) =>
    (p.claims || []).map((c) => ({
      ...c,
      projectId: p.id,
      projectTitle: p.title,
      projectCategory: p.category,
    }))
  );

  const filtered = allClaimsWithProject.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSearch =
      search === '' ||
      c.claimText.toLowerCase().includes(search.toLowerCase()) ||
      c.projectTitle.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const unverifiedCount = allClaimsWithProject.filter((c) => c.status === 'Unverified').length;
  const supportedCount = allClaimsWithProject.filter((c) => c.status === 'Supported').length;
  const disputedCount = allClaimsWithProject.filter((c) => c.status === 'Disputed' || c.status === 'Contradicted').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Factual Verification & Evidence Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global repository of atomic factual assertions, evidence links, citations, and confidence evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {unverifiedCount} Unverified
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {supportedCount} Supported
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search claims or project titles..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Verification Statuses</option>
            <option value="Unverified">Unverified</option>
            <option value="Supported">Supported</option>
            <option value="Partially supported">Partially supported</option>
            <option value="Disputed">Disputed</option>
            <option value="Contradicted">Contradicted</option>
          </select>
        </div>
      </div>

      {/* Claims Table / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-400 space-y-2">
          <p>No claims found matching filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    onClick={() => onOpenProject(item.projectId)}
                    className="text-[11px] font-bold text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{item.projectTitle}</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Scene #{item.associatedScene}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      item.status === 'Supported'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : item.status === 'Partially supported'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : item.status === 'Disputed' || item.status === 'Contradicted'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-slate-400">Change Status:</label>
                  <select
                    value={item.status}
                    onChange={(e) =>
                      onUpdateClaim(item.projectId, item.id, {
                        status: e.target.value as VerificationStatus,
                      })
                    }
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
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
                "{item.claimText}"
              </p>

              {item.evidence && (
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                  <span className="font-semibold text-slate-400 block text-[11px] mb-0.5">Evidence Note:</span>
                  {item.evidence}
                </div>
              )}

              {item.sourceReferences && item.sourceReferences.length > 0 && (
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span className="font-semibold">Sources:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.sourceReferences.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]">
                        {s}
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
  );
};
