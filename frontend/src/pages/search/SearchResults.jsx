import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSearchQuestionsQuery } from '../../redux/api/questionApi.js';
import { useGetUsersQuery } from '../../redux/api/messageApi.js';
import { useGetSubjectsQuery } from '../../redux/api/teacherApi.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { HelpCircle, BookOpen, Users, ArrowUpRight, Search } from 'lucide-react';

export const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  // Questions search
  const { data: questionsData, isLoading: isQuestionsLoading } = useSearchQuestionsQuery(
    { query, limit: 10 },
    { skip: !query }
  );

  // Users / Teachers search
  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery(query, {
    skip: !query
  });

  // Subjects search
  const { data: subjectsData, isLoading: isSubjectsLoading } = useGetSubjectsQuery(undefined, {
    skip: !query
  });

  const questions = Array.isArray(questionsData?.data)
    ? questionsData.data
    : Array.isArray(questionsData?.questions)
    ? questionsData.questions
    : [];

  const users = usersData?.data || [];
  const teachers = users.filter(
    (u) => u.role === 'TEACHER' || u.role === 'ADMIN'
  );

  const allSubjects = subjectsData?.data || [];
  const filteredSubjects = allSubjects.filter(
    (s) =>
      s.name?.toLowerCase().includes(query.toLowerCase()) ||
      s.code?.toLowerCase().includes(query.toLowerCase())
  );

  const isLoading = isQuestionsLoading || isUsersLoading || isSubjectsLoading;

  if (!query.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
        <Search className="w-12 h-12 mb-3 opacity-30" />
        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">
          Search Coaching.ai
        </h3>
        <p className="text-xs mt-1">
          Type something in the search bar above to find questions, subjects, and teachers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
          Search Results for "{query}"
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Showing matched questions, subjects, and teachers
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Questions Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-500" />
                Questions ({questions.length})
              </h3>
            </div>
            {questions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No matching questions found.
              </p>
            ) : (
              <div className="space-y-3">
                {questions.map((q) => (
                  <div
                    key={q._id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/questions/${q._id}`}
                        className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-brand-500 transition-colors line-clamp-1"
                      >
                        {q.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        {q.subject?.name && (
                          <Badge variant="indigo" size="xs">
                            {q.subject.name}
                          </Badge>
                        )}
                        <span className="text-[11px] text-slate-500">
                          By {q.askedBy?.name || 'User'}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/questions/${q._id}`}
                      className="p-2 rounded-xl text-brand-500 hover:bg-brand-500/10 transition-colors shrink-0"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Subjects Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                Subjects ({filteredSubjects.length})
              </h3>
            </div>
            {filteredSubjects.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No matching subjects found.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredSubjects.map((s) => (
                  <Link
                    key={s._id}
                    to={`/questions?subject=${s._id}`}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {s.name}
                      </h4>
                      {s.code && (
                        <span className="text-[10px] text-slate-500">{s.code}</span>
                      )}
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* People (Teachers & Students) Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                People ({users.length})
              </h3>
            </div>
            {users.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No matching people found.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {users.map((u) => (
                  <Link
                    key={u._id}
                    to={`/profile/${u._id}`}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 transition-all flex items-center gap-3"
                  >
                    <img
                      src={
                        u.avatar ||
                        'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'
                      }
                      alt={u.name}
                      className="w-8 h-8 rounded-full border border-purple-500 object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {u.name}
                        </h4>
                        <Badge
                          variant={
                            u.role === 'TEACHER'
                              ? 'amber'
                              : u.role === 'ADMIN'
                              ? 'red'
                              : 'blue'
                          }
                          size="xs"
                        >
                          {u.role}
                        </Badge>
                      </div>
                      {u.username ? (
                        <p className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 truncate mt-0.5">
                          @{u.username}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{u.email}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
