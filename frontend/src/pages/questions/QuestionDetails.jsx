import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetQuestionByIdQuery, useSaveQuestionMutation } from '../../redux/api/questionApi.js';
import { useGetUserProfileQuery } from '../../redux/api/authApi.js';
import { useGetAnswersForQuestionQuery, useSubmitAnswerMutation } from '../../redux/api/answerApi.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { AnswerCard } from '../../components/questions/AnswerCard.jsx';
import {
  Eye, MessageSquare, Send, Sparkles, AlertCircle,
  ChevronLeft, Clock, Bookmark, Share2, Tag
} from 'lucide-react';
import { ShareModal } from '../../components/common/ShareModal.jsx';
import toast from 'react-hot-toast';

const diffVariant = { Easy: 'emerald', Medium: 'amber', Hard: 'red' };

const FALLBACK_QUESTION = {
  _id: '1',
  title: 'What is the difference between BFS and DFS in Graph Traversal?',
  description: 'Can someone explain when to use Breadth-First Search vs Depth-First Search with time complexities? I am particularly confused about space complexity differences and when each is more optimal.',
  askedBy: { _id: '101', name: 'Ada Lovelace', avatar: '', reputation: 350, badge: '⚡ Contributor' },
  subject: { name: 'Computer Science' },
  tags: ['graph', 'algorithms', 'dfs', 'bfs'],
  difficulty: 'Medium',
  viewsCount: 45,
  answersCount: 1,
  createdAt: new Date()
};

const FALLBACK_ANSWERS = [
  {
    _id: 'ans1',
    answerText: 'Breadth-First Search (BFS) explores layer by layer using a Queue (FIFO), ideal for shortest paths in unweighted graphs with O(V+E) time and O(W) space (where W = max width). Depth-First Search (DFS) explores deep paths using a Stack (LIFO), ideal for topological sorting and cycle detection with O(V+E) time and O(H) space (where H = max height/depth). Use BFS for shortest path; use DFS for exhaustive searches like topological sort.',
    author: { name: 'Prof. Alan Turing', avatar: '', reputation: 850, level: 'Expert', badge: '🔥 Expert', role: 'TEACHER' },
    aiAccuracyScore: 95,
    aiEvaluation: {
      accuracyScore: 95,
      conceptCoverage: 'Covers Queue vs Stack implementation and BFS/DFS traversal differences along with space complexity.',
      missingPoints: ['Bidirectional BFS optimization'],
      shortSummary: 'High accuracy answer covering queue/stack usage and space complexity comparison.'
    },
    upvotesCount: 12,
    downvotesCount: 0,
    isAccepted: true,
    isTeacherEndorsed: true,
    finalRankingScore: 98.5,
    timeTakenSeconds: 180,
    createdAt: new Date()
  }
];

export const QuestionDetails = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [answerText, setAnswerText] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { data: questionRes, isLoading: qLoading, isError: qError } = useGetQuestionByIdQuery(id);
  const { data: answersRes, isLoading: aLoading } = useGetAnswersForQuestionQuery(id);
  const [submitAnswer, { isLoading: isSubmitting }] = useSubmitAnswerMutation();

  const question = questionRes?.data || FALLBACK_QUESTION;
  const answers = answersRes?.data || FALLBACK_ANSWERS;

  const [saveQuestion, { isLoading: isSaving }] = useSaveQuestionMutation();
  const { data: profileResponse } = useGetUserProfileQuery(user?._id, {
    skip: !user?._id
  });

  const userObj = profileResponse?.data?.user || user;
  const isSaved = userObj?.savedQuestions?.includes(question._id);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to save questions');
      return;
    }
    try {
      const res = await saveQuestion(question._id).unwrap();
      const status = res?.data?.isSaved !== undefined ? res.data.isSaved : !isSaved;
      toast.success(status ? 'Question saved' : 'Question removed from saved');
    } catch (err) {
      toast.error('Failed to update saved status');
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to share questions');
      return;
    }
    setIsShareModalOpen(true);
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (answerText.trim().length < 20) {
      toast.error('Answer must be at least 20 characters');
      return;
    }

    try {
      await submitAnswer({
        questionId: id,
        answerText: answerText.trim(),
        timeTakenSeconds: 120
      }).unwrap();
      toast.success('Answer submitted! Gemini AI is evaluating your submission...');
      setAnswerText('');
    } catch (err) {
      const validationErrors = err?.data?.errors;
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        validationErrors.forEach((e) => toast.error(e.message || String(e)));
      } else {
        toast.error(err?.data?.message || 'Failed to submit answer');
      }
    }
  };

  const isQuestionAuthor = user && question.askedBy?._id?.toString() === user._id?.toString();
  const isTeacher = user && user.role === 'TEACHER';

  if (qLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (qError && !questionRes) {
    return (
      <Card className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Question not found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">This question may have been removed or the ID is incorrect</p>
        <Link to="/questions">
          <Button variant="outline" size="sm">← Back to Q&A Feed</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        to="/questions"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-500 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Question Feed
      </Link>

      {/* Question Main Card */}
      <Card>
        {/* Meta header */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant={diffVariant[question.difficulty] || 'amber'}>
            {question.difficulty || 'Medium'}
          </Badge>
          {question.subject?.name && (
            <Badge variant="indigo" size="xs">{question.subject.name}</Badge>
          )}
          {question.isSolved && (
            <Badge variant="emerald" size="xs">✓ Solved</Badge>
          )}
          <span className="ml-auto flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {question.viewsCount || 0} views
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> {question.answersCount || 0} answers
            </span>
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
          {question.title}
        </h1>

        <p className="text-sm text-slate-700 dark:text-slate-300 mt-4 leading-relaxed whitespace-pre-wrap">
          {question.description}
        </p>

        {/* Tags */}
        {question.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            {question.tags.map((t, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-lg"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Author + actions footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={question.askedBy?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'}
              alt={question.askedBy?.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-700"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {question.askedBy?.name}
              </p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(question.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                {' '}• ⚡ {question.askedBy?.reputation || 0} pts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`p-2 rounded-xl transition-colors ${
                isSaved
                  ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/60'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600'
              }`}
              title={isSaved ? 'Remove Saved Question' : 'Save Question'}
              aria-label={isSaved ? 'Remove Saved Question' : 'Save Question'}
            >
              <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
              title="Share Question"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Answer Submission Form */}
      <Card className="border-2 border-brand-500/20 dark:border-brand-500/20">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-brand-500" /> Your Answer
          <span className="text-xs font-normal text-slate-500 ml-1">— Evaluated live by Gemini AI</span>
        </h3>

        <form onSubmit={handleSubmitAnswer} className="space-y-3">
          <div className="relative">
            <textarea
              rows={5}
              placeholder="Write your explanation here... (minimum 20 characters)"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              required
            />
            <span className={`absolute bottom-3 right-3 text-[10px] font-medium ${
              answerText.length < 20 ? 'text-slate-400' : 'text-emerald-500'
            }`}>
              {answerText.length} / 20 min
            </span>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Gemini AI will score accuracy, grammar & concept coverage
            </p>
            <Button type="submit" isLoading={isSubmitting} size="md" disabled={answerText.trim().length < 20}>
              <Send className="w-4 h-4 mr-2" /> Post Answer & Grade with AI
            </Button>
          </div>
        </form>
      </Card>

      {/* Answers List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-500" />
            Answers ({answers.length})
          </h2>
          <span className="text-xs text-slate-400">Sorted by AI Ranking Score</span>
        </div>

        {aLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : answers.length === 0 ? (
          <Card className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No answers yet</p>
            <p className="text-xs text-slate-400 mt-1">Be the first to answer this question!</p>
          </Card>
        ) : (
          answers.map((ans) => (
            <AnswerCard
              key={ans._id}
              answer={ans}
              isQuestionAuthor={isQuestionAuthor}
              isTeacher={isTeacher}
            />
          ))
        )}
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={`${window.location.origin}/questions/${question._id}`}
        shareTitle={question.title}
      />
    </div>
  );
};
