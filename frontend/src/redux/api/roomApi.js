import { apiSlice } from './apiSlice.js';

export const roomApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyRooms: builder.query({
      query: () => '/rooms/mine',
      providesTags: ['Room']
    }),
    getTeacherRooms: builder.query({
      query: (teacherId) => `/rooms/${teacherId}`,
      providesTags: ['Room']
    }),
    createRoom: builder.mutation({
      query: (data) => ({
        url: '/rooms',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Room']
    }),
    createRoomOrder: builder.mutation({
      query: (roomId) => ({
        url: `/rooms/${roomId}/create-order`,
        method: 'POST'
      })
    }),
    verifyRoomPayment: builder.mutation({
      query: ({ roomId, paymentData }) => ({
        url: `/rooms/${roomId}/verify-payment`,
        method: 'POST',
        body: paymentData
      }),
      invalidatesTags: ['Room', 'Enrollment', 'LiveClass', 'StudyMaterial']
    }),
    getMyEnrollments: builder.query({
      query: () => '/rooms/my-enrollments',
      providesTags: ['Enrollment']
    })
  })
});

export const {
  useGetMyRoomsQuery,
  useGetTeacherRoomsQuery,
  useCreateRoomMutation,
  useCreateRoomOrderMutation,
  useVerifyRoomPaymentMutation,
  useGetMyEnrollmentsQuery
} = roomApi;
