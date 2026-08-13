import { apiSlice } from './apiSlice.js';

export const answerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnswersForQuestion: builder.query({
      query: (questionId) => `/answers/question/${questionId}`,
      providesTags: ['Answer']
    }),
    submitAnswer: builder.mutation({
      query: (data) => ({
        url: '/answers',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Answer', 'Question']
    }),
    voteAnswer: builder.mutation({
      query: ({ answerId, voteType }) => ({
        url: `/answers/${answerId}/vote`,
        method: 'POST',
        body: { voteType }
      }),
      invalidatesTags: ['Answer']
    }),
    acceptAnswer: builder.mutation({
      query: (answerId) => ({
        url: `/answers/${answerId}/accept`,
        method: 'POST'
      }),
      invalidatesTags: ['Answer', 'Question']
    }),
    endorseAnswer: builder.mutation({
      query: (answerId) => ({
        url: `/answers/${answerId}/endorse`,
        method: 'POST'
      }),
      invalidatesTags: ['Answer']
    }),
    getMyAnswers: builder.query({
      query: () => '/answers/mine',
      providesTags: ['Answer']
    })
  })
});

export const {
  useGetAnswersForQuestionQuery,
  useSubmitAnswerMutation,
  useVoteAnswerMutation,
  useAcceptAnswerMutation,
  useEndorseAnswerMutation,
  useGetMyAnswersQuery
} = answerApi;
