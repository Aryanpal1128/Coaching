import { apiSlice } from './apiSlice.js';

export const messageApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query({
      query: () => '/messages/conversations',
      providesTags: ['Message']
    }),
    getMessages: builder.query({
      query: (partnerId) => `/messages/${partnerId}`,
      providesTags: (result, error, partnerId) => [{ type: 'Message', id: partnerId }]
    }),
    getUsers: builder.query({
      query: (search = '') => `/messages/users?search=${search}`,
      providesTags: ['User']
    }),
    toggleReaction: builder.mutation({
      query: ({ messageId, emoji }) => ({
        url: `/messages/reaction/${messageId}`,
        method: 'POST',
        body: { emoji }
      })
    })
  })
});

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useGetUsersQuery,
  useToggleReactionMutation
} = messageApi;
