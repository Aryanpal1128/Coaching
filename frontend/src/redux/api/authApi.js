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
    googleLogin: builder.mutation({
      query: (data) => ({
        url: '/auth/google',
        method: 'POST',
        body: data
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
    }),
    verifyEmail: builder.mutation({
      query: (token) => ({
        url: `/auth/verify-email?token=${token}`,
        method: 'GET'
      })
    })
  })
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGoogleLoginMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation
} = authApi;
