import React, { useState } from 'react';
import { QuestionCard } from '../../components/questions/QuestionCard.jsx';
import { useSearchQuestionsQuery } from '../../redux/api/questionApi.js';
import { useGetMyAnswersQuery } from '../../redux/api/answerApi.js';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Card } from '../../components/common/Card.jsx';
import {
  Search, Sparkles, Plus, HelpCircle, TrendingUp, Clock, Zap, Filter, X,
  MessageSquare, ThumbsUp, CheckCircle, Calendar
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [feedMode, setFeedMode] = useState('all'); // 'all' | 'my-answers'
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const authorParam = searchParams.get('author') || searchParams.get('askedBy') || '';
  const answeredByParam = searchParams.get('answeredBy') || '';
  const solvedByParam = searchParams.get('solvedBy') || '';

  const searchApiParams = {
    query,
    tag: selectedTag,
    sortBy,
    ...(authorParam && { author: authorParam }),
    ...(answeredByParam && { answeredBy: answeredByParam }),
    ...(solvedByParam && { solvedBy: solvedByParam })
  };

  const { data, isLoading } = useSearchQuestionsQuery(searchApiParams, {
    skip: feedMode !== 'all'
  });

  const { data: myAnswersData, isLoading: isMyAnswersLoading } = useGetMyAnswersQuery(undefined, {
    skip: feedMode !== 'my-answers'
  });

  const questions = data?.data?.questions || MOCK_QUESTIONS;
  const myAnswers = myAnswersData?.data || [];

  const filtered = selectedTag
    ? questions.filter((q) => q.tags?.includes(selectedTag))
    : questions;

  const hasActiveUrlFilter = !!(authorParam || answeredByParam || solvedByParam);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-theme-primary">
            Community Q&A Feed
          </h2>
          <p className="text-xs text-theme-secondary mt-0.5">
            AI-graded questions & answers from students and instructors
          </p>
        </div>
        <Link to="/ask-question" className="shrink-0">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" /> Ask Question
          </Button>
        </Link>
      </div>

      {/* Feed Toggle Bar */}
      <div className="flex items-center gap-2 border-b border-theme-border pb-3">
        <button
          onClick={() => setFeedMode('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            feedMode === 'all'
              ? 'bg-theme-indigo text-white shadow-md shadow-theme'
              : 'bg-theme-card text-theme-secondary hover:bg-theme-global hover:text-theme-primary'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" /> All Questions
        </button>
        <button
          onClick={() => setFeedMode('my-answers')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            feedMode === 'my-answers'
              ? 'bg-theme-indigo text-white shadow-md shadow-theme'
              : 'bg-theme-card text-theme-secondary hover:bg-theme-global hover:text-theme-primary'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" /> My Answers
        </button>
      </div>

      {feedMode === 'all' ? (
        <>
          {/* Active URL Filter Indicator */}
          {hasActiveUrlFilter && (
            <div className="flex items-center justify-between bg-theme-badge-indigo border border-theme-indigo/20 p-3 rounded-2xl text-xs text-theme-indigo font-semibold">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-theme-indigo" />
                <span>
                  Filtering feed by:{' '}
                  {authorParam && <span>Questions asked by user</span>}
                  {answeredByParam && <span>Answers contributed by user</span>}
                  {solvedByParam && <span>Solved questions by user</span>}
                </span>
              </div>
              <button
                onClick={() => setSearchParams({})}
                className="flex items-center gap-1 text-xs font-bold text-theme-indigo hover:opacity-80 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Clear filter
              </button>
            </div>
          )}

          {/* Search + Sort Bar */}
          <div className="bg-theme-card p-4 rounded-2xl border border-theme-border shadow-theme space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 w-4 h-4 text-theme-secondary" />
                <input
                  type="text"
                  placeholder="Search questions, topics, keywords..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b border-theme-border focus:border-theme-amber rounded-none pl-8 pr-4 py-2 text-xs text-theme-primary focus:outline-none focus:ring-0"
                />
              </div>

              {/* Sort buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      sortBy === key
                        ? 'bg-theme-indigo text-white shadow-sm'
                        : 'bg-theme-global text-theme-secondary hover:bg-theme-card hover:text-theme-primary border border-transparent hover:border-theme-border'
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
              <span className="text-[10px] font-bold text-theme-secondary uppercase tracking-wider shrink-0">Filter:</span>
              <button
                onClick={() => setSelectedTag('')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  !selectedTag
                    ? 'bg-theme-indigo text-white'
                    : 'bg-theme-global text-theme-secondary hover:bg-theme-card hover:text-theme-primary border border-transparent hover:border-theme-border'
                }`}
              >
                All
              </button>
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-theme-indigo text-white'
                      : 'bg-theme-global text-theme-secondary hover:bg-theme-card hover:text-theme-primary border border-transparent hover:border-theme-border'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-theme-secondary">
              Showing <span className="font-bold text-theme-primary">{filtered.length}</span> questions
              {selectedTag && <> tagged <span className="text-theme-indigo">#{selectedTag}</span></>}
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
            <div className="text-center py-16 text-theme-secondary">
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
        </>
      ) : (
        /* My Answers Feed */
        <div className="space-y-4">
          {isMyAnswersLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
          ) : myAnswers.length === 0 ? (
            <Card className="p-12 text-center text-theme-secondary">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-theme-indigo" />
              <h3 className="font-extrabold text-theme-primary text-sm">
                You haven't answered any questions yet
              </h3>
              <p className="text-xs text-theme-secondary mt-1 mb-4">
                Browse the feed to help someone out and earn reputation points!
              </p>
              <Button onClick={() => setFeedMode('all')} variant="primary" size="sm">
                Browse Questions Feed
              </Button>
            </Card>
          ) : (
            myAnswers.map((ans) => (
              <Card key={ans._id} className="p-5 space-y-3 hover:border-theme-indigo/40 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-theme-secondary tracking-wider">
                      Question Answered
                    </span>
                    {ans.question ? (
                      <Link
                        to={`/questions/${ans.question._id}`}
                        className="text-base font-extrabold text-theme-primary hover:text-theme-indigo transition-colors block mt-0.5"
                      >
                        {ans.question.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-bold text-theme-secondary italic mt-0.5">[Question Deleted]</p>
                    )}
                  </div>
                  {ans.isAccepted && (
                    <Badge variant="emerald" size="xs" className="flex items-center gap-1 shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" /> Accepted Solution
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-theme-secondary leading-relaxed bg-theme-global p-3 rounded-xl border border-theme-border line-clamp-3">
                  "{ans.answerText}"
                </p>

                <div className="flex items-center justify-between text-xs text-theme-secondary pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Answered {new Date(ans.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-theme-primary">
                    <ThumbsUp className="w-3.5 h-3.5 text-theme-indigo" />
                    {ans.upvotesCount || 0} Upvotes
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
