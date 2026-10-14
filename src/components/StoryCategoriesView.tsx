import React, { useState } from 'react';
import { Tag, Plus, Check, FolderKanban, ShieldCheck, Flame, Ghost, Crown, Zap, Landmark, ShieldAlert, Smile, Film } from 'lucide-react';
import { StoryCategory } from '../types';

interface StoryCategoriesViewProps {
  categories: StoryCategory[];
  onToggleCategory: (id: string) => Promise<void>;
  onAddCategory: (data: Partial<StoryCategory>) => Promise<void>;
  onSelectCategoryFilter: (categoryName: string) => void;
}

export const StoryCategoriesView: React.FC<StoryCategoriesViewProps> = ({
  categories,
  onToggleCategory,
  onAddCategory,
  onSelectCategoryFilter,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Ghost': return <Ghost className="w-5 h-5" />;
      case 'Crown': return <Crown className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'Landmark': return <Landmark className="w-5 h-5" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5" />;
      case 'Flame': return <Flame className="w-5 h-5" />;
      case 'Smile': return <Smile className="w-5 h-5" />;
      default: return <Film className="w-5 h-5" />;
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    await onAddCategory({
      name: name.trim(),
      description: description.trim(),
      color,
      icon: 'Film',
    });
    setName('');
    setDescription('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-indigo-400" />
            Story Categories System
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize video concepts by genre, themes, research frameworks, and storytelling tropes.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Category</span>
        </button>
      </div>

      {isAdding && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-white">Create New Story Category</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Category Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cyberpunk Legends, Medieval Warfare..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe narrative themes and expected audience..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Accent Color:</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all"
                >
                  Save Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all group ${
              cat.enabled ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-60'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: cat.color }}
                >
                  {getCategoryIcon(cat.icon)}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {cat.projectCount} project{cat.projectCount !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => onToggleCategory(cat.id)}
                    title={cat.enabled ? 'Disable category' : 'Enable category'}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                      cat.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {cat.enabled ? 'Active' : 'Disabled'}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => onSelectCategoryFilter(cat.name)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>View {cat.name} Projects</span>
                <span>→</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
