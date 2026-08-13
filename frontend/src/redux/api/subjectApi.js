import { apiSlice } from './apiSlice.js';

export const subjectApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSubjects: builder.query({
      query: () => '/subjects',
      providesTags: ['Subject']
    })
  })
});

export const { useGetSubjectsQuery } = subjectApi;
