import React from 'react';
import { Card } from '../common/Card.jsx';
import { Badge } from '../common/Badge.jsx';
import { AIEvaluationCard } from './AIEvaluationCard.jsx';
import { ThumbsUp, ThumbsDown, CheckCircle2, Award, Sparkles, Star } from 'lucide-react';
import { useVoteAnswerMutation, useAcceptAnswerMutation, useEndorseAnswerMutation } from '../../redux/api/answerApi.js';
import toast from 'react-hot-toast';

export const AnswerCard = ({ answer, isQuestionAuthor, isTeacher }) => {
  const [voteAnswer] = useVoteAnswerMutation();
  const [acceptAnswer] = useAcceptAnswerMutation();
  const [endorseAnswer] = useEndorseAnswerMutation();

  const handleVote = async (voteType) => {
    try {
      await voteAnswer({ answerId: answer._id, voteType }).unwrap();
      toast.success(`Answer ${voteType.toLowerCase()}d!`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record vote');
    }
  };

  const handleAccept = async () => {
    try {
      await acceptAnswer(answer._id).unwrap();
      toast.success('Answer marked as accepted solution!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to accept answer');
    }
  };

  const handleEndorse = async () => {
    try {
      await endorseAnswer(answer._id).unwrap();
      toast.success('Answer endorsed as teacher solution!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to endorse answer');
    }
  };

  return (
    <Card className={`relative ${answer.isAccepted ? 'border-2 border-green-500/60 bg-green-500/5' : ''}`}>
      {/* Ranking Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {answer.isAccepted && (
          <Badge variant="emerald" size="sm" className="font-bold">
            🏆 Accepted Solution
          </Badge>
        )}
        {answer.isTeacherEndorsed && (
          <Badge variant="amber" size="sm" className="font-bold">
            ⭐ Teacher Endorsed
          </Badge>
        )}
        {answer.aiAccuracyScore > 90 && (
          <Badge variant="purple" size="sm" className="font-bold">
            🤖 High AI Accuracy ({answer.aiAccuracyScore}%)
          </Badge>
        )}
        <span className="ml-auto text-xs font-bold text-brand-500">
          Rank Score: {answer.finalRankingScore || 0} pts
        </span>
      </div>

      {/* Author Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-3">
          <img
            src={answer.author?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'}
            alt={answer.author?.name}
            className="w-9 h-9 rounded-full object-cover border border-slate-700"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {answer.author?.name}
              </span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                ⚡ {answer.author?.reputation || 0} pts
              </span>
              {answer.author?.role === 'TEACHER' && (
                <Badge variant="indigo" size="xs">
                  Instructor
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Answered {new Date(answer.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action controls for Accepting / Endorsing */}
        <div className="flex items-center gap-2">
          {isQuestionAuthor && !answer.isAccepted && (
            <button
              onClick={handleAccept}
              className="text-xs text-green-500 font-bold hover:underline flex items-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" /> Accept Solution
            </button>
          )}
          {isTeacher && !answer.isTeacherEndorsed && (
            <button
              onClick={handleEndorse}
              className="text-xs text-accent-500 font-bold hover:underline flex items-center gap-1"
            >
              <Star className="w-4 h-4" /> Endorse
            </button>
          )}
        </div>
      </div>

      {/* Answer Body */}
      <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
        {answer.answerText}
      </div>

      {/* AI Feedback Card */}
      {answer.aiEvaluation && (
        <AIEvaluationCard
          aiEvaluation={answer.aiEvaluation}
          accuracyScore={answer.aiAccuracyScore}
        />
      )}

      {/* Voting Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleVote('UPVOTE')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-green-500/10 text-slate-700 dark:text-slate-300 hover:text-green-500 transition-colors font-medium"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{answer.upvotesCount || 0}</span>
          </button>
          <button
            onClick={() => handleVote('DOWNVOTE')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-500/10 text-slate-700 dark:text-slate-300 hover:text-red-500 transition-colors font-medium"
          >
            <ThumbsDown className="w-4 h-4" />
            <span>{answer.downvotesCount || 0}</span>
          </button>
        </div>

        <div className="text-slate-400 text-[11px]">
          Time taken: {Math.round((answer.timeTakenSeconds || 120) / 60)} mins
        </div>
      </div>
    </Card>
  );
};
