import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import {
  Sparkles, Camera, CheckCircle2, XCircle, Loader2, User,
  BookOpen, GraduationCap, Briefcase, Award, ArrowRight
} from 'lucide-react';
import { useLazyCheckUsernameAvailableQuery, useOnboardUserMutation } from '../../redux/api/authApi.js';
import { useGetSubjectsQuery } from '../../redux/api/subjectApi.js';
import { updateUser } from '../../redux/slices/authSlice.js';
import toast from 'react-hot-toast';

const STREAMS = ['Science', 'Commerce', 'Arts', 'Other'];

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

export const Onboarding = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redirect if already onboarded
  useEffect(() => {
    if (user?.isOnboarded) {
      if (user.role === 'TEACHER') navigate('/teacher-dashboard', { replace: true });
      else if (user.role === 'ADMIN') navigate('/admin-dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Username State & Validation
  const [username, setUsername] = useState(user?.username || '');
  const [usernameStatus, setUsernameStatus] = useState(null); // { isChecking, isValid, message }
  const [checkUsername] = useLazyCheckUsernameAvailableQuery();

  // Debounced username checking
  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (!clean) {
      setUsernameStatus(null);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(clean)) {
      setUsernameStatus({
        isChecking: false,
        isValid: false,
        message: 'Must be 3-20 characters long (letters, numbers, underscores)'
      });
      return;
    }

    setUsernameStatus({ isChecking: true, isValid: false, message: 'Checking availability...' });

    const timer = setTimeout(async () => {
      try {
        const res = await checkUsername(clean).unwrap();
        if (res?.data?.available) {
          setUsernameStatus({ isChecking: false, isValid: true, message: 'Username is available!' });
        } else {
          setUsernameStatus({ isChecking: false, isValid: false, message: res?.data?.message || 'Username is taken' });
        }
      } catch (err) {
        setUsernameStatus({ isChecking: false, isValid: false, message: 'Failed to check username' });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  // Optional Fields State
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const fileInputRef = useRef(null);

  const [bio, setBio] = useState('');
  const [stream, setStream] = useState('');
  const [institution, setInstitution] = useState('');
  const [gradeOrYear, setGradeOrYear] = useState('');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  // Fetch subjects list
  const { data: subjectsData } = useGetSubjectsQuery();
  const subjectsList = subjectsData?.data || [];

  const [onboardUser, { isLoading: isSubmitting }] = useOnboardUserMutation();

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, WEBP, GIF)');
      e.target.value = '';
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image file size must be under 20 MB');
      e.target.value = '';
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleToggleSubject = (subjectId) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usernameStatus?.isValid) {
      toast.error('Please choose a valid and available username to proceed.');
      return;
    }

    const formData = new FormData();
    formData.append('username', username.trim().toLowerCase());

    if (avatarFile) formData.append('avatar', avatarFile);
    if (bio.trim()) formData.append('bio', bio.trim());

    if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
      if (qualification.trim()) formData.append('qualification', qualification.trim());
      if (experienceYears) formData.append('experienceYears', experienceYears);
      if (selectedSubjects.length > 0) formData.append('subjectsTaught', JSON.stringify(selectedSubjects));
    } else {
      if (stream) formData.append('stream', stream);
      if (institution.trim()) formData.append('institution', institution.trim());
      if (gradeOrYear.trim()) formData.append('gradeOrYear', gradeOrYear.trim());
      if (selectedSubjects.length > 0) formData.append('subjectsOfInterest', JSON.stringify(selectedSubjects));
    }

    try {
      const res = await onboardUser(formData).unwrap();
      const updatedData = res?.data || {};

      dispatch(
        updateUser({
          username: updatedData.username || username.trim().toLowerCase(),
          avatar: updatedData.avatar || avatarPreview,
          isOnboarded: true
        })
      );

      toast.success('Welcome aboard! Your profile has been created.');

      if (user?.role === 'TEACHER') navigate('/teacher-dashboard', { replace: true });
      else if (user?.role === 'ADMIN') navigate('/admin-dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to complete onboarding');
    }
  };

  const isStudent = user?.role !== 'TEACHER' && user?.role !== 'ADMIN';

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-[#1B365D] to-[#C5A059] shadow-xl shadow-brand-500/20 text-[#060B16] mb-1">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Welcome to Coaching.ai!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Let's personalize your learning experience. Set your unique username to get started.
          </p>
        </div>
        
        {/* We skip to line 250 replace content directly by matching next chunks, but let's do this one first and the others in the same file sequentially */}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Required Username */}
          <Card className="p-6 space-y-4 border-2 border-brand-500/30">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <User className="w-4 h-4 text-brand-500" />
              <span>Choose Username <span className="text-rose-500">*</span></span>
            </div>

            <div>
              <Input
                type="text"
                placeholder="e.g. alex_learner"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="font-bold text-sm"
                required
              />

              {/* Status feedback */}
              {usernameStatus && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
                  {usernameStatus.isChecking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin shrink-0" />
                      <span className="text-slate-400">{usernameStatus.message}</span>
                    </>
                  ) : usernameStatus.isValid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <span className="text-green-500">{usernameStatus.message}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="text-rose-500">{usernameStatus.message}</span>
                    </>
                  )}
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                3–20 characters long. Letters, numbers, and underscores only.
              </p>
            </div>
          </Card>

          {/* Section 2: Optional Details */}
          <Card className="p-6 space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Tell us more <span className="text-xs font-normal text-slate-400">(optional — you can always add this later)</span>
              </h3>
            </div>

            {/* Avatar Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-brand-500 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1B365D] to-[#C5A059] flex items-center justify-center text-[#060B16] text-xl font-bold border-2 border-brand-500 shadow-md">
                    {getInitials(user?.name)}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white dark:bg-slate-800 border border-brand-500 text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Profile Picture</p>
                <p className="text-[11px] text-slate-400">Upload a photo to introduce yourself to peers and tutors.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 text-xs"
                >
                  Choose Image
                </Button>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Short Bio
              </label>
              <textarea
                placeholder="Share your learning goals or what subjects you love..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Role specific fields */}
            {isStudent ? (
              <>
                {/* Stream Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Academic Stream
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STREAMS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStream(stream === s ? '' : s)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          stream === s
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Institution & Grade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="School / Institution"
                    placeholder="e.g. St. Xavier High School"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                  />
                  <Input
                    label="Grade / Year"
                    placeholder="e.g. 11th Grade / Freshman"
                    value={gradeOrYear}
                    onChange={(e) => setGradeOrYear(e.target.value)}
                  />
                </div>

                {/* Subjects of Interest */}
                {subjectsList.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Subjects of Interest
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {subjectsList.map((subject) => {
                        const isSelected = selectedSubjects.includes(subject._id);
                        return (
                          <button
                            key={subject._id}
                            type="button"
                            onClick={() => handleToggleSubject(subject._id)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-brand-500 text-white shadow-sm'
                                : 'bg-white/5 text-[#8B85A3] hover:bg-white/10 hover:text-[#F5F3FA]'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}{subject.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Teacher Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Qualification"
                    placeholder="e.g. M.Sc Computer Science / B.Ed"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                  />
                  <Input
                    label="Experience (Years)"
                    type="number"
                    placeholder="e.g. 5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </div>

                {/* Subjects Taught */}
                {subjectsList.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Subjects You Teach
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {subjectsList.map((subject) => {
                        const isSelected = selectedSubjects.includes(subject._id);
                        return (
                          <button
                            key={subject._id}
                            type="button"
                            onClick={() => handleToggleSubject(subject._id)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-brand-500 text-white shadow-sm'
                                : 'bg-white/5 text-[#8B85A3] hover:bg-white/10 hover:text-[#F5F3FA]'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}{subject.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
            disabled={!usernameStatus?.isValid || isSubmitting}
            className="w-full text-sm font-bold flex items-center justify-center gap-2 py-3"
          >
            <span>Finish & Go to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
