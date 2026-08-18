import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { useCreateQuestionMutation, useSuggestQuestionMutation } from '../../redux/api/questionApi.js';
import { HelpCircle, Sparkles, Plus, X, AlertTriangle, Lightbulb, Undo2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export const AskQuestion = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['algorithms']);
  const [suggestions, setSuggestions] = useState(null);
  const [previousValues, setPreviousValues] = useState({});

  const [createQuestion, { isLoading }] = useCreateQuestionMutation();
  const [suggestQuestion, { isLoading: isSuggesting }] = useSuggestQuestionMutation();
  const navigate = useNavigate();

  const STATUS_MESSAGES = [
    "Analyzing your question...",
    "Checking context & tags...",
    "Evaluating grammar & clarity...",
    "Almost done..."
  ];
  const [statusIdx, setStatusIdx] = useState(0);

  React.useEffect(() => {
    if (!isSuggesting) {
      setStatusIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isSuggesting]);

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

  const handleGetSuggestions = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Please enter both title and description first');
      return;
    }
    try {
      const res = await suggestQuestion({ title: title.trim(), description: description.trim() }).unwrap();
      setSuggestions(res.data);
      setPreviousValues({});
      toast.success('AI suggestions generated!');
    } catch (err) {
      toast.error('Failed to get AI suggestions');
    }
  };

  const handleToggleFieldSuggestion = (field, suggestedValue, setter, fieldLabel) => {
    const isApplied = previousValues[field] !== undefined;

    if (isApplied) {
      const originalValue = previousValues[field];
      setter(originalValue);
      setPreviousValues((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      toast.success(`Reverted ${fieldLabel}`);
    } else {
      let currentValue;
      if (field === 'title') currentValue = title;
      else if (field === 'description') currentValue = description;
      else if (field === 'difficulty') currentValue = difficulty;
      else if (field === 'tags') currentValue = tags;

      setPreviousValues((prev) => ({
        ...prev,
        [field]: currentValue
      }));
      setter(suggestedValue);
      toast.success(`Suggested ${fieldLabel} applied!`);
    }
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
      <div className="flex items-center gap-3 mb-6 border-b border-theme-border pb-4">
        <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-500">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-theme-primary">
            Ask a Question
          </h2>
          <p className="text-xs text-theme-secondary">
            Get instant answers evaluated by AI and top community instructors
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Question Title"
          placeholder="e.g. How does Red-Black Tree balancing work?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          error={title.trim().length > 0 && title.trim().length < 5 ? 'Title must be at least 5 characters' : undefined}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-theme-secondary mb-1.5">
            Detailed Description & Context <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={6}
            placeholder="Explain what you are trying to understand, edge cases, code context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full bg-theme-global border ${
              description.trim().length > 0 && description.trim().length < 10
                ? 'border-red-500 focus:ring-red-500'
                : 'border-theme-border focus:ring-brand-500'
            } rounded-xl p-3.5 text-sm text-theme-primary focus:outline-none focus:ring-2 transition-all`}
            required
          />
          {description.trim().length > 0 && description.trim().length < 10 && (
            <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Description must be at least 10 characters
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-theme-secondary mb-1.5">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-theme-global border border-theme-border text-theme-primary rounded-xl p-2.5 text-xs font-semibold"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-theme-secondary mb-1.5">
              Tags (Press Enter)
            </label>
            <input
              type="text"
              placeholder="e.g. trees, graph"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full bg-theme-global border border-theme-border rounded-xl p-2.5 text-xs text-theme-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
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

        {/* AI Suggestions Section */}
        {suggestions && (
          <div className="bg-theme-global border border-theme-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-2.5">
              <h4 className="text-sm font-bold text-theme-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-500 fill-brand-500/20 animate-pulse" />
                AI Learning Coach Suggestions
              </h4>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                suggestions.isGood 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-accent-500/10 text-accent-500'
              }`}>
                {suggestions.isGood ? 'Clear & Well-Structured' : 'Needs Polish'}
              </span>
            </div>

            <p className="text-xs text-theme-secondary italic bg-theme-card p-3 rounded-xl border border-theme-border">
              "{suggestions.generalFeedback}"
            </p>

            {(suggestions.grammarIssues?.length > 0 || suggestions.conceptualIssues?.length > 0) && (
              <div className="space-y-2">
                {suggestions.grammarIssues?.map((issue, idx) => (
                  <div key={idx} className="text-xs text-red-500 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{issue}</span>
                  </div>
                ))}
                {suggestions.conceptualIssues?.map((issue, idx) => (
                  <div key={idx} className="text-xs text-accent-500 flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Suggested Title */}
            {suggestions.suggestedTitle && (suggestions.suggestedTitle !== title || previousValues.title !== undefined) && (
              <div className="bg-theme-card border border-theme-border p-3 rounded-xl flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-theme-secondary tracking-wider">Suggested Title:</span>
                  <p className="text-xs font-semibold text-theme-primary">{suggestions.suggestedTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleFieldSuggestion('title', suggestions.suggestedTitle, setTitle, 'title')}
                  className="text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1.5 rounded-lg shrink-0 transition-colors flex items-center gap-1"
                >
                  {previousValues.title !== undefined ? (
                    <>
                      <Undo2 className="w-3 h-3" /> Revert
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" /> Apply
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Suggested Description */}
            {suggestions.suggestedDescription && (suggestions.suggestedDescription !== description || previousValues.description !== undefined) && (
              <div className="bg-theme-card border border-theme-border p-3 rounded-xl flex items-start justify-between gap-3">
                <div className="space-y-1 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-theme-secondary tracking-wider">Suggested Description:</span>
                  <p className="text-xs text-theme-primary line-clamp-3 leading-relaxed whitespace-pre-wrap">{suggestions.suggestedDescription}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleFieldSuggestion('description', suggestions.suggestedDescription, setDescription, 'description')}
                  className="text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1.5 rounded-lg shrink-0 transition-colors flex items-center gap-1"
                >
                  {previousValues.description !== undefined ? (
                    <>
                      <Undo2 className="w-3 h-3" /> Revert
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" /> Apply
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Suggested Difficulty */}
            {suggestions.suggestedDifficulty && (suggestions.suggestedDifficulty !== difficulty || previousValues.difficulty !== undefined) && (
              <div className="bg-theme-card border border-theme-border p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-theme-secondary tracking-wider">Suggested Difficulty:</span>
                  <p className="text-xs font-semibold text-theme-primary">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-brand-500/10 text-brand-500">
                      {suggestions.suggestedDifficulty}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleFieldSuggestion('difficulty', suggestions.suggestedDifficulty, setDifficulty, 'difficulty')}
                  className="text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1.5 rounded-lg shrink-0 transition-colors flex items-center gap-1"
                >
                  {previousValues.difficulty !== undefined ? (
                    <>
                      <Undo2 className="w-3 h-3" /> Revert
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" /> Apply
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Suggested Tags */}
            {suggestions.suggestedTags && suggestions.suggestedTags.length > 0 && (
              <div className="bg-theme-card border border-theme-border p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-1 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-theme-secondary tracking-wider">Suggested Tags:</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {suggestions.suggestedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center bg-theme-global text-theme-primary px-2 py-0.5 rounded text-[11px] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleFieldSuggestion('tags', suggestions.suggestedTags, setTags, 'tags')}
                  className="text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1.5 rounded-lg shrink-0 transition-colors flex items-center gap-1"
                >
                  {previousValues.tags !== undefined ? (
                    <>
                      <Undo2 className="w-3 h-3" /> Revert
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" /> Apply
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 pb-12 md:pb-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleGetSuggestions} 
            disabled={isSuggesting}
            size="md"
            className="w-full sm:w-auto justify-center"
          >
            {isSuggesting ? (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500 fill-brand-500/25 animate-spin shrink-0" />
                <span>{STATUS_MESSAGES[statusIdx]}</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500 fill-brand-500/25 shrink-0" />
                <span>Check with AI</span>
              </span>
            )}
          </Button>
          <Button type="submit" isLoading={isLoading} size="md" className="w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4 mr-1.5" /> Post Question
          </Button>
        </div>
      </form>
    </Card>
  );
};
