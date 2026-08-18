import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card.jsx';
import { Badge } from '../common/Badge.jsx';
import { Eye, MessageSquare, ThumbsUp, Bookmark, Share2 } from 'lucide-react';
import { ShareModal } from '../common/ShareModal.jsx';
import { useSelector } from 'react-redux';
import { useGetUserProfileQuery } from '../../redux/api/authApi.js';
import { useSaveQuestionMutation } from '../../redux/api/questionApi.js';
import toast from 'react-hot-toast';

export const QuestionCard = ({ question }) => {
  if (!question) return null;

  const { user: currentUser } = useSelector((state) => state.auth);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { data: profileResponse } = useGetUserProfileQuery(currentUser?._id, {
    skip: !currentUser?._id
  });
  const [saveQuestion, { isLoading: isSaving }] = useSaveQuestionMutation();

  const user = profileResponse?.data?.user || currentUser;
  const isSaved = user?.savedQuestions?.includes(question._id);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
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
    e.stopPropagation();
    if (!currentUser) {
      toast.error('Please login to share questions');
      return;
    }
    setIsShareModalOpen(true);
  };


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
    <Card className="hover:border-theme-indigo/40 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Author info */}
        <div className="flex items-center gap-3">
          <img
            src={question.askedBy?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'}
            alt={question.askedBy?.name}
            className="w-10 h-10 rounded-full object-cover border border-theme-border"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-theme-primary">
                {question.askedBy?.name || 'Anonymous Student'}
              </span>
              <Badge variant="blue" size="xs">
                ⚡ {question.askedBy?.reputation || 0} pts
              </Badge>
              <span className="text-[10px] text-theme-secondary font-medium">
                {question.askedBy?.badge}
              </span>
            </div>
            <p className="text-[11px] text-theme-secondary opacity-70">
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
          className="text-base font-bold text-theme-primary hover:text-theme-indigo transition-colors line-clamp-2 block"
        >
          {question.title}
        </Link>
        <Link
          to={`/questions/${question._id}`}
          className="text-xs text-theme-secondary hover:text-theme-primary transition-colors line-clamp-2 mt-1.5 leading-relaxed block"
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
            className="text-[11px] font-medium bg-theme-global text-theme-secondary px-2.5 py-0.5 rounded-lg border border-theme-border"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Footer Metrics & Actions (Mobile Layout) */}
      <div className="mt-4 pt-3 border-t border-theme-border space-y-3 text-xs text-theme-secondary sm:hidden">
        {/* Row 1: Metrics */}
        <div className="flex items-center justify-between">
          <Link
            to={`/questions/${question._id}`}
            className="flex items-center gap-1.5 font-medium hover:text-theme-indigo transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-theme-indigo" />
            {question.answersCount || 0} Answers
          </Link>
          <span className="flex items-center gap-1.5 font-medium">
            <Eye className="w-4 h-4" />
            {question.viewsCount || 0} Views
          </span>
        </div>

        {/* Row 2: Actions */}
        <div className="flex items-center justify-between">
          <Link to={`/questions/${question._id}`}>
            <span className="text-[11px] font-bold text-theme-indigo bg-theme-badge-indigo border border-theme-indigo/20 hover:opacity-80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap block">
              Answer Question →
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`p-1.5 rounded-lg border transition-colors ${
                isSaved
                  ? 'bg-theme-badge-indigo border-theme-indigo/20 text-theme-indigo hover:opacity-80'
                  : 'border-transparent hover:bg-theme-global text-theme-secondary hover:text-theme-primary'
              }`}
              title={isSaved ? 'Remove Saved Question' : 'Save Question'}
              aria-label={isSaved ? 'Remove Saved Question' : 'Save Question'}
            >
              <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg hover:bg-theme-global text-theme-secondary hover:text-theme-primary transition-colors"
              title="Share Question"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Metrics & Actions (Desktop Layout) */}
      <div className="mt-4 pt-3 border-t border-theme-border hidden sm:flex items-center justify-between text-xs text-theme-secondary">
        {/* Left side: Metrics */}
        <div className="flex items-center gap-4">
          <Link
            to={`/questions/${question._id}`}
            className="flex items-center gap-1.5 font-medium hover:text-theme-indigo transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-theme-indigo" />
            {question.answersCount || 0} Answers
          </Link>
          <span className="flex items-center gap-1.5 font-medium">
            <Eye className="w-4 h-4" />
            {question.viewsCount || 0} Views
          </span>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          <Link to={`/questions/${question._id}`}>
            <span className="text-[11px] font-bold text-theme-indigo bg-theme-badge-indigo border border-theme-indigo/20 hover:opacity-80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer mr-2 whitespace-nowrap block">
              Answer Question →
            </span>
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`p-1.5 rounded-lg border transition-colors ${
              isSaved
                ? 'bg-theme-badge-indigo border-theme-indigo/20 text-theme-indigo hover:opacity-80'
                : 'border-transparent hover:bg-theme-global text-theme-secondary hover:text-theme-primary'
            }`}
            title={isSaved ? 'Remove Saved Question' : 'Save Question'}
            aria-label={isSaved ? 'Remove Saved Question' : 'Save Question'}
          >
            <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg hover:bg-theme-global text-theme-secondary hover:text-theme-primary transition-colors"
            title="Share Question"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={`${window.location.origin}/questions/${question._id}`}
        shareTitle={question.title}
      />
    </Card>
  );
};
