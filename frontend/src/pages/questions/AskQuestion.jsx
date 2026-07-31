import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { useCreateQuestionMutation } from '../../redux/api/questionApi.js';
import { HelpCircle, Sparkles, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const AskQuestion = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['algorithms']);

  const [createQuestion, { isLoading }] = useCreateQuestionMutation();
  const navigate = useNavigate();

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
        setTags([...tags, tagInput.trim().toLowerCase()]);
        setTagInput('');
      }
    }
  };

  const removeTag = (t) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation (mirrors Zod schema on backend)
    if (title.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }
    if (description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    try {
      const res = await createQuestion({
        title: title.trim(),
        description: description.trim(),
        difficulty,
        tags
      }).unwrap();
      toast.success('Question published successfully!');
      navigate(`/questions/${res.data._id}`);
    } catch (err) {
      // Surface specific Zod validation errors if present
      const validationErrors = err?.data?.errors;
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        validationErrors.forEach((e) => toast.error(e.message || String(e)));
      } else {
        toast.error(err?.data?.message || 'Failed to post question. Please try again.');
      }
    }
  };

  return (
    <Card className="max-w-3xl mx-auto p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-500">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Ask a Question
          </h2>
          <p className="text-xs text-slate-500">
            Get instant answers evaluated by AI and top community instructors
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Question Title"
          placeholder="e.g. How does Red-Black Tree self-balancing work?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Detailed Description & Context <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={6}
            placeholder="Explain what you are trying to understand, edge cases, code context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-2.5 text-xs font-semibold"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Tags (Press Enter)
            </label>
            <input
              type="text"
              placeholder="e.g. trees, graph"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 bg-brand-500/10 text-brand-500 px-3 py-1 rounded-lg text-xs font-bold"
              >
                #{tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  <X className="w-3.5 h-3.5 hover:text-red-500" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button type="submit" isLoading={isLoading} size="lg">
            <Sparkles className="w-4 h-4 mr-2" /> Post Question
          </Button>
        </div>
      </form>
    </Card>
  );
};
