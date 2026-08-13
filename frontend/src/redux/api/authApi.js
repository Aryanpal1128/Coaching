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
    getUserProfile: builder.query({
      query: (userId) => `/users/${userId}/profile`,
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }]
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
    verifyOtp: builder.mutation({
      query: (data) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: data
      })
    }),
    updateUsername: builder.mutation({
      query: (data) => ({
        url: '/users/me/username',
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: ['User']
    }),
    updateAvatar: builder.mutation({
      query: (formData) => ({
        url: '/users/me/avatar',
        method: 'PATCH',
        body: formData
      }),
      invalidatesTags: ['User']
    }),
    checkUsernameAvailable: builder.query({
      query: (value) => `/users/username-available?value=${encodeURIComponent(value)}`
    }),
    onboardUser: builder.mutation({
      query: (formData) => ({
        url: '/users/onboarding',
        method: 'POST',
        body: formData
      }),
      invalidatesTags: ['User']
    }),
    updateUserProfile: builder.mutation({
      query: (formData) => ({
        url: '/users/me/profile',
        method: 'PATCH',
        body: formData
      }),
      invalidatesTags: ['User']
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
  useVerifyOtpMutation,
  useGetUserProfileQuery,
  useUpdateUsernameMutation,
  useUpdateAvatarMutation,
  useCheckUsernameAvailableQuery,
  useLazyCheckUsernameAvailableQuery,
  useOnboardUserMutation,
  useUpdateUserProfileMutation
} = authApi;
