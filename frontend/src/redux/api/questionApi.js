import { apiSlice } from './apiSlice.js';

export const questionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchQuestions: builder.query({
      query: (params) => ({
        url: '/questions/search',
        params
      }),
      providesTags: ['Question']
    }),
    suggestQuestion: builder.mutation({
      query: (data) => ({
        url: '/questions/suggest',
        method: 'POST',
        body: data
      })
    }),
    getQuestionById: builder.query({
      query: (id) => `/questions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Question', id }]
    }),
    createQuestion: builder.mutation({
      query: (data) => ({
        url: '/questions',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Question']
    }),
    followQuestion: builder.mutation({
      query: (id) => ({
        url: `/questions/${id}/follow`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Question', id }]
    }),
    bookmarkQuestion: builder.mutation({
      query: (id) => ({
        url: `/questions/${id}/bookmark`,
        method: 'POST'
      }),
      invalidatesTags: ['Question']
    })
  })
});

export const {
  useSearchQuestionsQuery,
  useSuggestQuestionMutation,
  useGetQuestionByIdQuery,
  useCreateQuestionMutation,
  useFollowQuestionMutation,
  useBookmarkQuestionMutation
} = questionApi;
