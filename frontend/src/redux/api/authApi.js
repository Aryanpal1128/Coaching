import { apiSlice } from './apiSlice.js';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData
      })
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials
      })
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User']
    }),
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data
      })
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data
      })
    })
  })
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation
} = authApi;
