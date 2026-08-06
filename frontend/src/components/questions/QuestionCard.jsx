import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card.jsx';
import { Badge } from '../common/Badge.jsx';
import { Eye, MessageSquare, ThumbsUp, Bookmark, Share2 } from 'lucide-react';

export const QuestionCard = ({ question }) => {
  if (!question) return null;

  const getDifficultyVariant = (diff) => {
    switch (diff) {
      case 'Easy':
        return 'emerald';
      case 'Hard':
        return 'red';
      default:
        return 'amber';
    }
  };

  return (
    <Card className="hover:border-brand-500/40 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Author info */}
        <div className="flex items-center gap-3">
          <img
            src={question.askedBy?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'}
            alt={question.askedBy?.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-700"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {question.askedBy?.name || 'Anonymous Student'}
              </span>
              <Badge variant="blue" size="xs">
                ⚡ {question.askedBy?.reputation || 0} pts
              </Badge>
              <span className="text-[10px] text-slate-500 font-medium">
                {question.askedBy?.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Asked {new Date(question.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Difficulty Badge */}
        <Badge variant={getDifficultyVariant(question.difficulty)}>
          {question.difficulty || 'Medium'}
        </Badge>
      </div>

      {/* Title & Preview */}
      <div className="mt-3">
        <Link
          to={`/questions/${question._id}`}
          className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-brand-500 transition-colors line-clamp-2 block"
        >
          {question.title}
        </Link>
        <Link
          to={`/questions/${question._id}`}
          className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 transition-colors line-clamp-2 mt-1.5 leading-relaxed block"
        >
          {question.description}
        </Link>
      </div>

      {/* Tags & Subject */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {question.subject?.name && (
          <Badge variant="indigo" size="xs">
            {question.subject.name}
          </Badge>
        )}
        {question.tags?.map((tag, idx) => (
          <span
            key={idx}
            className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-lg"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Footer Metrics & Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <Link
            to={`/questions/${question._id}`}
            className="flex items-center gap-1.5 font-medium hover:text-brand-500 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-brand-500" />
            {question.answersCount || 0} Answers
          </Link>
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            {question.viewsCount || 0} Views
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/questions/${question._id}`}>
            <span className="text-[11px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer mr-2">
              Answer Question →
            </span>
          </Link>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Bookmark className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};
