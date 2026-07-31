import React, { useState } from 'react';
import { QuestionCard } from '../../components/questions/QuestionCard.jsx';
import { useSearchQuestionsQuery } from '../../redux/api/questionApi.js';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Search, Sparkles, Plus, HelpCircle, TrendingUp, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const POPULAR_TAGS = ['algorithms', 'data-structures', 'graphs', 'trees', 'recursion', 'dp', 'sorting'];

const MOCK_QUESTIONS = [
  {
    _id: '1',
    title: 'What is the difference between BFS and DFS in Graph Traversal?',
    description: 'Can someone explain when to use Breadth-First Search vs Depth-First Search with time complexities and space complexity differences?',
    tags: ['graph', 'algorithms', 'dfs', 'bfs'],
    difficulty: 'Medium',
    viewsCount: 45,
    answersCount: 3,
    createdAt: new Date(),
    askedBy: { name: 'Ada Lovelace', avatar: '', reputation: 350, badge: '⚡ Contributor' },
    subject: { name: 'Computer Science' }
  },
  {
    _id: '2',
    title: 'How does Red-Black Tree self-balancing work during insertions?',
    description: 'Explain color properties, rotations, and edge cases in balancing Red-Black Trees. When does double rotation occur?',
    tags: ['trees', 'data-structures', 'balanced-tree'],
    difficulty: 'Hard',
    viewsCount: 112,
    answersCount: 5,
    createdAt: new Date(Date.now() - 86400000),
    askedBy: { name: 'Prof. Alan Turing', avatar: '', reputation: 850, badge: '🔥 Expert' },
    subject: { name: 'Mathematics' }
  },
  {
    _id: '3',
    title: 'What is the time complexity of QuickSort worst case?',
    description: 'When does QuickSort degrade to O(n²) and how can we avoid this with randomized pivot selection?',
    tags: ['sorting', 'algorithms', 'complexity'],
    difficulty: 'Easy',
    viewsCount: 78,
    answersCount: 7,
    createdAt: new Date(Date.now() - 172800000),
    askedBy: { name: 'Grace Hopper', avatar: '', reputation: 290, badge: '📘 Learner' },
    subject: { name: 'Computer Science' }
  }
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest', icon: Clock },
  { key: 'popularity', label: 'Popular', icon: TrendingUp },
  { key: 'answers', label: 'Most Answered', icon: Zap }
];

export const QuestionFeed = () => {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const { data, isLoading } = useSearchQuestionsQuery({ query, tag: selectedTag, sortBy });

  const questions = data?.data?.questions || MOCK_QUESTIONS;

  const filtered = selectedTag
    ? questions.filter((q) => q.tags?.includes(selectedTag))
    : questions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Community Q&A Feed
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-graded questions & answers from students and instructors
          </p>
        </div>
        <Link to="/ask-question" className="shrink-0">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" /> Ask Question
          </Button>
        </Link>
      </div>

      {/* Search + Sort Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions, topics, keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Sort buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  sortBy === key
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tag pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter:</span>
          <button
            onClick={() => setSelectedTag('')}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
              !selectedTag
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All
          </button>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                selectedTag === tag
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900 dark:text-slate-100">{filtered.length}</span> questions
          {selectedTag && <> tagged <span className="text-brand-500">#{selectedTag}</span></>}
        </p>
        <Badge variant="blue" size="xs" className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI Graded
        </Badge>
      </div>

      {/* Questions Feed */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-sm">No questions found</p>
          <p className="text-xs mt-1 mb-4">Try different keywords or remove the tag filter</p>
          <Link to="/ask-question">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Ask the first question!
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q) => (
            <QuestionCard key={q._id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
};
