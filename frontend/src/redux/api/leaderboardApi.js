import { apiSlice } from './apiSlice.js';

export const leaderboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOverallLeaderboard: builder.query({
      query: () => '/leaderboard/overall',
      providesTags: ['Leaderboard']
    }),
    getWeeklyLeaderboard: builder.query({
      query: () => '/leaderboard/weekly',
      providesTags: ['Leaderboard']
    }),
    getMonthlyLeaderboard: builder.query({
      query: () => '/leaderboard/monthly',
      providesTags: ['Leaderboard']
    })
  })
});

export const {
  useGetOverallLeaderboardQuery,
  useGetWeeklyLeaderboardQuery,
  useGetMonthlyLeaderboardQuery
} = leaderboardApi;
