import { apiSlice } from './apiSlice.js';

export const followApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    followUser: builder.mutation({
      query: (userId) => ({
        url: `/follow/${userId}`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'Follow', id: userId },
        'Follow',
        'User'
      ]
    }),
    unfollowUser: builder.mutation({
      query: (userId) => ({
        url: `/follow/${userId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'Follow', id: userId },
        'Follow',
        'User'
      ]
    }),
    getFollowers: builder.query({
      query: (userId) => `/follow/${userId}/followers`,
      providesTags: (result, error, userId) => [{ type: 'Follow', id: `followers-${userId}` }]
    }),
    getFollowing: builder.query({
      query: (userId) => `/follow/${userId}/following`,
      providesTags: (result, error, userId) => [{ type: 'Follow', id: `following-${userId}` }]
    }),
    getFollowCounts: builder.query({
      query: (userId) => `/follow/${userId}/counts`,
      providesTags: (result, error, userId) => [{ type: 'Follow', id: userId }]
    })
  })
});

export const {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetFollowCountsQuery
} = followApi;
