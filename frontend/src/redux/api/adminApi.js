import { apiSlice } from './apiSlice.js';

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnalytics: builder.query({
      query: () => '/admin/analytics',
      providesTags: ['Admin']
    }),
    toggleUserSuspension: builder.mutation({
      query: ({ userId, isSuspended }) => ({
        url: `/admin/users/${userId}/suspension`,
        method: 'PUT',
        body: { isSuspended }
      }),
      invalidatesTags: ['Admin', 'User']
    })
  })
});

export const { useGetAnalyticsQuery, useToggleUserSuspensionMutation } = adminApi;
