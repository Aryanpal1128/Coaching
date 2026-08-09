import React from 'react';
import { Bookmark, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetSavedQuestionsQuery } from '../../redux/api/questionApi.js';
import { QuestionCard } from '../../components/questions/QuestionCard.jsx';
import { Card } from '../../components/common/Card.jsx';

export const SavedQuestions = () => {
  const { data: savedData, isLoading, error } = useGetSavedQuestionsQuery();
  const questions = savedData?.data?.questions || savedData?.questions || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-brand-500 fill-brand-500" /> Saved Questions
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Questions you have saved for quick access and offline review
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-xs text-rose-500">Failed to load saved questions</p>
        </Card>
      ) : questions.length === 0 ? (
        <Card className="p-12 text-center">
          <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No saved questions yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Save questions to see them here for easy reference anytime.
          </p>
          <Link
            to="/questions"
            className="inline-block mt-4 text-xs font-bold text-brand-500 hover:underline"
          >
            Browse Questions →
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <QuestionCard key={q._id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedQuestions;
