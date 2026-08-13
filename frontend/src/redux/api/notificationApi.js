import { apiSlice } from './apiSlice.js';

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notification']
    }),
    getUnreadCount: builder.query({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification']
    }),
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT'
      }),
      invalidatesTags: ['Notification']
    })
  })
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation
} = notificationApi;
