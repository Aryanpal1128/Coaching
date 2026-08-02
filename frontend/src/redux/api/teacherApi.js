import { apiSlice } from './apiSlice.js';

export const teacherApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Study Materials
    getStudyMaterials: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.subjectId) search.set('subjectId', params.subjectId);
        if (params.fileType) search.set('fileType', params.fileType);
        if (params.teacherId) search.set('teacherId', params.teacherId);
        if (params.search) search.set('search', params.search);
        return `/study-materials?${search.toString()}`;
      },
      providesTags: ['StudyMaterial']
    }),
    uploadStudyMaterial: builder.mutation({
      query: (formData) => ({
        url: '/study-materials',
        method: 'POST',
        body: formData
        // Note: do NOT set Content-Type — browser sets it with the boundary for multipart
      }),
      invalidatesTags: ['StudyMaterial']
    }),
    deleteStudyMaterial: builder.mutation({
      query: (id) => ({
        url: `/study-materials/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['StudyMaterial']
    }),

    // Subjects (for dropdowns)
    getSubjects: builder.query({
      query: () => '/subjects',
      providesTags: ['Subject']
    })
  })
});

export const {
  useGetStudyMaterialsQuery,
  useUploadStudyMaterialMutation,
  useDeleteStudyMaterialMutation,
  useGetSubjectsQuery
} = teacherApi;
