import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { UploadMaterialModal } from '../../components/studyMaterials/UploadMaterialModal.jsx';
import { LockedContentModal } from '../../components/rooms/LockedContentModal.jsx';
import {
  BookOpen,
  Download,
  FileText,
  Search,
  Upload,
  Trash2,
  Image,
  FileCode2,
  Presentation,
  RefreshCw,
  Sparkles,
  Video,
  X,
  Play
} from 'lucide-react';
import {
  useGetStudyMaterialsQuery,
  useGetRecommendedMaterialsQuery,
  useDeleteStudyMaterialMutation,
  useGetSubjectsQuery
} from '../../redux/api/teacherApi.js';
import { useGetMyEnrollmentsQuery } from '../../redux/api/roomApi.js';
import toast from 'react-hot-toast';

const FILE_TYPE_FILTERS = ['All', 'PDF', 'IMAGE', 'DOC', 'PPT', 'VIDEO', 'OTHER'];

const typeVariant = {
  PDF: 'blue',
  IMAGE: 'indigo',
  DOC: 'emerald',
  PPT: 'amber',
  VIDEO: 'rose',
  OTHER: 'slate'
};

const FileIcon = ({ type }) => {
  const cls = 'w-5 h-5';
  if (type === 'VIDEO') return <Video className={cls} />;
  if (type === 'IMAGE') return <Image className={cls} />;
  if (type === 'DOC') return <FileCode2 className={cls} />;
  if (type === 'PPT') return <Presentation className={cls} />;
  return <FileText className={cls} />;
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const StudyMaterials = () => {
  const { user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightId = searchParams.get('highlight');

  const [activeMainTab, setActiveMainTab] = useState('Uploaded'); // 'Uploaded' | 'Recommended'
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeVideoMaterial, setActiveVideoMaterial] = useState(null);
  const [lockedItem, setLockedItem] = useState(null);

  const { data: enrollmentsData } = useGetMyEnrollmentsQuery(undefined, {
    skip: !user || isTeacher
  });
  const enrollments = enrollmentsData?.data || [];
  const enrolledRoomIds = enrollments.map((e) => e.room?._id || e.room) || [];

  const { data: subjectsData } = useGetSubjectsQuery();
  const subjects = subjectsData?.data || [];

  const queryParams = {};
  if (activeSubject) queryParams.subjectId = activeSubject;
  if (activeType !== 'All') queryParams.fileType = activeType;
  if (search) queryParams.search = search;

  const { data, isLoading, refetch } = useGetStudyMaterialsQuery(queryParams, {
    refetchOnMountOrArgChange: true
  });
  const materials = data?.data || [];

  // Auto-scroll and highlight when deep-linking with ?highlight= parameter
  useEffect(() => {
    if (highlightId && materials.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`material-card-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-brand-500');
          setTimeout(() => el.classList.remove('ring-2', 'ring-brand-500'), 3000);
        }
      }, 150);
      navigate('/study-materials', { replace: true });
    }
  }, [highlightId, materials, navigate]);

  const { data: recData, isLoading: recLoading, refetch: refetchRec } = useGetRecommendedMaterialsQuery(undefined, {
    skip: activeMainTab !== 'Recommended',
    refetchOnMountOrArgChange: true
  });
  const recommendedMaterials = recData?.data || [];

  const [deleteMaterial, { isLoading: deleting }] = useDeleteStudyMaterialMutation();

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteMaterial(id).unwrap();
      toast.success('Material deleted');
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Study Resources
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTeacher
              ? 'Upload and manage your study materials and video lectures'
              : 'Browse instructor-uploaded notes, video lectures, and study guides'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => (activeMainTab === 'Uploaded' ? refetch() : refetchRec())} className="gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          {isTeacher && (
            <Button
              size="sm"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-500 gap-1"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Material
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs (Uploaded vs Recommended) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveMainTab('Uploaded')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === 'Uploaded'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Uploaded Resources
        </button>
        <button
          onClick={() => setActiveMainTab('Recommended')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === 'Recommended'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" /> Recommended For You
        </button>
      </div>

      {activeMainTab === 'Uploaded' ? (
        <>
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Subject filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subject:</span>
              <button
                onClick={() => setActiveSubject('')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  !activeSubject
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All
              </button>
              {subjects.map((s) => (
                <button
                  key={s._id}
                  onClick={() => setActiveSubject(s._id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeSubject === s._id
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* File type filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type:</span>
              {FILE_TYPE_FILTERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeType === t
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Stats row */}
          {!isLoading && materials.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{materials.length} resource{materials.length !== 1 ? 's' : ''} found</span>
            </div>
          )}

          {/* Materials grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-44 bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No materials found</p>
              <p className="text-xs mt-1">
                {isTeacher ? 'Upload your first study material above' : 'Check back later'}
              </p>
              {isTeacher && (
                <Button size="sm" variant="primary" className="mt-4 bg-emerald-600" onClick={() => setShowUploadModal(true)}>
                  Upload First Material
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((m) => {
                const isOwner = m.teacher?._id === user?._id;
                const isVideo = m.fileType === 'VIDEO';
                const isLocked = m.accessType === 'paid' && !isTeacher && !enrolledRoomIds.includes(m.room?._id || m.room);

                return (
                  <Card
                    key={m._id}
                    id={`material-card-${m._id}`}
                    className="flex flex-col justify-between hover:border-brand-500/40 transition-all hover:shadow-md hover:shadow-brand-500/5 relative group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className={`p-2.5 rounded-xl ${isVideo ? 'bg-rose-500/10 text-rose-500' : 'bg-brand-500/10 text-brand-500'} shrink-0`}>
                          <FileIcon type={m.fileType} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {m.accessType === 'paid' && (
                            <Badge variant="amber" size="xs">PAID</Badge>
                          )}
                          <Badge variant={typeVariant[m.fileType] || 'blue'} size="xs">{m.fileType}</Badge>
                        </div>
                      </div>

                      {/* Video Preview thumbnail trigger */}
                      {isVideo && (
                        <div
                          onClick={() => {
                            if (isLocked) {
                              setLockedItem(m);
                            } else {
                              setActiveVideoMaterial(m);
                            }
                          }}
                          className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video mb-3 flex items-center justify-center cursor-pointer group-hover:border-rose-500/50 transition-all"
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                          <span className="absolute bottom-2 left-2.5 text-[10px] font-extrabold text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                            Watch Video
                          </span>
                        </div>
                      )}

                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                        {m.title}
                      </h3>
                      {m.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.description}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1.5">
                        By {m.teacher?.name} {m.fileSize ? `• ${formatSize(m.fileSize)}` : ''}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="indigo" size="xs">{m.subject?.name}</Badge>
                        <span className="text-[10px] text-slate-400 truncate">
                          {new Date(m.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(isOwner || user?.role === 'ADMIN') && (
                          <button
                            onClick={() => handleDelete(m._id, m.title)}
                            disabled={deleting}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isVideo ? (
                          <button
                            onClick={() => {
                              if (isLocked) {
                                setLockedItem(m);
                              } else {
                                setActiveVideoMaterial(m);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-500 transition-all shadow-md shadow-rose-500/20 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            Watch
                          </button>
                        ) : (
                          <a
                            href={isLocked ? '#' : m.fileUrl}
                            onClick={(e) => {
                              if (isLocked) {
                                e.preventDefault();
                                setLockedItem(m);
                              }
                            }}
                            target={isLocked ? '_self' : '_blank'}
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Recommended Tab */
        <div>
          {recLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-44 bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : recommendedMaterials.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-amber-400 opacity-60" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No personalized recommendations yet</p>
              <p className="text-xs mt-1 text-slate-500 max-w-sm mx-auto">
                Add subjects of interest to your profile to get personalized study material recommendations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedMaterials.map((m) => {
                const isOwner = m.teacher?._id === user?._id;
                const isVideo = m.fileType === 'VIDEO';
                const isLocked = m.accessType === 'paid' && !isTeacher && !enrolledRoomIds.includes(m.room?._id || m.room);

                return (
                  <Card
                    key={m._id}
                    className="flex flex-col justify-between hover:border-amber-500/40 transition-all hover:shadow-md hover:shadow-amber-500/5 border-amber-500/10"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className={`p-2.5 rounded-xl ${isVideo ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'} shrink-0`}>
                          <FileIcon type={m.fileType} />
                        </div>
                        <Badge variant="amber" size="xs">Recommended</Badge>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                        {m.title}
                      </h3>
                      {m.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.description}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1.5">
                        By {m.teacher?.name} {m.fileSize ? `• ${formatSize(m.fileSize)}` : ''}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="indigo" size="xs">{m.subject?.name}</Badge>
                        <span className="text-[10px] text-slate-400 truncate">
                          {new Date(m.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(isOwner || user?.role === 'ADMIN') && (
                          <button
                            onClick={() => handleDelete(m._id, m.title)}
                            disabled={deleting}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isVideo ? (
                          <button
                            onClick={() => {
                              if (isLocked) {
                                setLockedItem(m);
                              } else {
                                setActiveVideoMaterial(m);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-500 transition-all shadow-md shadow-rose-500/20 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            Watch
                          </button>
                        ) : (
                          <a
                            href={isLocked ? '#' : m.fileUrl}
                            onClick={(e) => {
                              if (isLocked) {
                                e.preventDefault();
                                setLockedItem(m);
                              }
                            }}
                            target={isLocked ? '_self' : '_blank'}
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Inline Video Player Modal */}
      {activeVideoMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{activeVideoMaterial.title}</h3>
                  <p className="text-xs text-slate-400">By {activeVideoMaterial.teacher?.name || 'Instructor'}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveVideoMaterial(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800">
              <video
                src={activeVideoMaterial.fileUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            {activeVideoMaterial.description && (
              <p className="text-xs text-slate-300 px-1">{activeVideoMaterial.description}</p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <Badge variant="rose">{activeVideoMaterial.subject?.name}</Badge>
              <a
                href={activeVideoMaterial.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-500 transition-all shadow-md shadow-rose-500/20"
              >
                <Download className="w-4 h-4" /> Download Video File
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadMaterialModal onClose={() => setShowUploadModal(false)} />
      )}

      {/* Locked Content Modal */}
      {lockedItem && (
        <LockedContentModal
          item={lockedItem}
          user={user}
          onClose={() => setLockedItem(null)}
          onSuccess={() => {
            setLockedItem(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};
