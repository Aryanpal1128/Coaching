import toast from 'react-hot-toast';

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const handleRazorpayPayment = async ({
  orderResponse,
  user,
  verifyPaymentMutation,
  onSuccess
}) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    toast.error('Razorpay SDK failed to load. Please check your network connection.');
    return;
  }

  const { order, keyId, room } = orderResponse;

  if (order.id.startsWith('order_mock_')) {
    toast.loading('Processing payment verification...', { id: 'razorpay-toast' });
    try {
      const mockPaymentId = `pay_mock_${Date.now()}`;
      await verifyPaymentMutation({
        roomId: room._id,
        paymentData: {
          razorpayOrderId: order.id,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: 'mock_signature'
        }
      }).unwrap();

      toast.success(`Enrolled in "${room.title}" successfully! 🎉`, { id: 'razorpay-toast' });
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err?.data?.message || 'Payment verification failed', { id: 'razorpay-toast' });
    }
    return;
  }

  const options = {
    key: keyId,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'Coaching.ai',
    description: `Enrollment for ${room.title}`,
    order_id: order.id,
    prefill: {
      name: user?.name || '',
      email: user?.email || ''
    },
    theme: {
      color: '#2563eb'
    },
    handler: async function (response) {
      toast.loading('Verifying payment with bank...', { id: 'razorpay-toast' });
      try {
        await verifyPaymentMutation({
          roomId: room._id,
          paymentData: {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          }
        }).unwrap();

        toast.success(`Enrolled in "${room.title}" successfully! 🎉`, { id: 'razorpay-toast' });
        if (onSuccess) onSuccess();
      } catch (err) {
        toast.error(err?.data?.message || 'Payment verification failed', { id: 'razorpay-toast' });
      }
    }
  };

  const razorpayWindow = new window.Razorpay(options);
  razorpayWindow.on('payment.failed', function (response) {
    toast.error(response.error.description || 'Payment cancelled or failed');
  });
  razorpayWindow.open();
};
