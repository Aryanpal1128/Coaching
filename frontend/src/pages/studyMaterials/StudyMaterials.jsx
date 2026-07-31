import React, { useState } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { BookOpen, Download, FileText, Search, Filter, ExternalLink } from 'lucide-react';

const ALL_MATERIALS = [
  { id: 1, title: 'Graph Traversal & BFS-DFS Proofs.pdf', size: '2.4 MB', author: 'Prof. Alan Turing', subject: 'Computer Science', type: 'Notes', date: '2 days ago' },
  { id: 2, title: 'Red-Black Tree Self Balancing CheatSheet.pdf', size: '1.1 MB', author: 'Prof. Alan Turing', subject: 'Mathematics', type: 'Notes', date: '5 days ago' },
  { id: 3, title: 'Data Structures Algorithms Master Guide.pdf', size: '4.8 MB', author: 'System Admin', subject: 'Computer Science', type: 'Guide', date: '1 week ago' },
  { id: 4, title: 'Assignment 3 — Dijkstra Algorithm Implementation', size: '320 KB', author: 'Prof. Alan Turing', subject: 'Computer Science', type: 'Assignment', date: 'Due Aug 5' },
  { id: 5, title: 'Calculus & Differentiation Quick Reference.pdf', size: '900 KB', author: 'Dr. Grace Hopper', subject: 'Mathematics', type: 'Notes', date: '3 days ago' },
  { id: 6, title: 'Object Oriented Design Patterns.pdf', size: '2.1 MB', author: 'Dr. Grace Hopper', subject: 'Software Engineering', type: 'Guide', date: '2 weeks ago' }
];

const SUBJECTS = ['All', 'Computer Science', 'Mathematics', 'Software Engineering'];
const TYPES = ['All', 'Notes', 'Guide', 'Assignment'];

const typeVariant = { Notes: 'blue', Guide: 'indigo', Assignment: 'amber' };

export const StudyMaterials = () => {
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [activeType, setActiveType] = useState('All');

  const filtered = ALL_MATERIALS.filter((m) => {
    const matchSearch =
      !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.author.toLowerCase().includes(search.toLowerCase());
    const matchSubject = activeSubject === 'All' || m.subject === activeSubject;
    const matchType = activeType === 'All' || m.type === activeType;
    return matchSearch && matchSubject && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Study Resources & Notes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Download instructor-verified notes, guides, and assignments
          </p>
        </div>
        <Badge variant="blue" size="sm">{filtered.length} resources</Badge>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Subject Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subject:</span>
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSubject(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeSubject === s
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type:</span>
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeType === t
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No materials match your filters</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Card key={m.id} className="flex flex-col justify-between hover:border-brand-500/40 transition-all hover:shadow-md hover:shadow-brand-500/5">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <Badge variant={typeVariant[m.type] || 'blue'} size="xs">{m.type}</Badge>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5">
                  By {m.author} • {m.size}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="indigo" size="xs">{m.subject}</Badge>
                  <span className="text-[10px] text-slate-400">{m.date}</span>
                </div>
                <Button size="sm" variant="outline" className="shrink-0">
                  <Download className="w-3.5 h-3.5 mr-1" /> Download
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
