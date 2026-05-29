import axios from 'axios';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt } = body;

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const razorpayResponse = await axios.post('https://api.razorpay.com/v1/orders', {
      amount: Math.round(numericAmount * 100), // Convert to paisa
      currency,
      receipt: receipt || `order_${Date.now()}`
    }, {
      auth: {
        username: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET
      }
    });

    return new Response(JSON.stringify({
      success: true,
      order: razorpayResponse.data
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Razorpay order creation error:', error.response?.data || error.message);

    return new Response(JSON.stringify({
      error: 'Failed to create Razorpay order',
      details: error.response?.data || error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}