import { apiSlice } from './apiSlice.js';

export const liveClassApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    scheduleLiveClass: builder.mutation({
      query: (data) => ({
        url: '/live-classes/schedule',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['LiveClass']
    }),
    startLiveClass: builder.mutation({
      query: (id) => ({
        url: `/live-classes/${id}/start`,
        method: 'PUT'
      }),
      invalidatesTags: ['LiveClass']
    })
  })
});

export const { useScheduleLiveClassMutation, useStartLiveClassMutation } = liveClassApi;
