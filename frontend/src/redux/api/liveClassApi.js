import { apiSlice } from './apiSlice.js';

export const liveClassApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLiveClasses: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.status) search.set('status', params.status);
        if (params.teacherId) search.set('teacherId', params.teacherId);
        return `/live-classes?${search.toString()}`;
      },
      providesTags: ['LiveClass']
    }),
    getLiveClass: builder.query({
      query: (id) => `/live-classes/${id}`,
      providesTags: (result, error, id) => [{ type: 'LiveClass', id }]
    }),
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
    }),
    endLiveClass: builder.mutation({
      query: (id) => ({
        url: `/live-classes/${id}/end`,
        method: 'PUT'
      }),
      invalidatesTags: ['LiveClass']
    }),
    cancelLiveClass: builder.mutation({
      query: (id) => ({
        url: `/live-classes/${id}/cancel`,
        method: 'PUT'
      }),
      invalidatesTags: ['LiveClass']
    }),
    recordAttendance: builder.mutation({
      query: (id) => ({
        url: `/live-classes/${id}/attendance`,
        method: 'POST'
      })
    })
  })
});

export const {
  useGetLiveClassesQuery,
  useGetLiveClassQuery,
  useScheduleLiveClassMutation,
  useStartLiveClassMutation,
  useEndLiveClassMutation,
  useCancelLiveClassMutation,
  useRecordAttendanceMutation
} = liveClassApi;
