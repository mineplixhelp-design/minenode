const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { username, whatsapp, productId, price, method, platform } = req.body;

  if (!username || !productId || !price) {
    return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
  }

  try {
    const merchantRef = 'MPX-' + Date.now();

    const payload = {
      method: method || 'QRIS',
      merchant_ref: merchantRef,
      amount: price,
      customer_name: username,
      customer_phone: whatsapp,
      order_items: [
        {
          name: `${productId} (${platform.toUpperCase()})`,
          price: price,
          quantity: 1
        }
      ],
      callback_url: `https://${process.env.VERCEL_URL}/api/payment-callback`
    };

    const response = await axios.post(
      'https://tripay.co.id/api-sandbox/transaction/create',
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.TRIPAY_API_KEY}`
        }
      }
    );

    return res.status(200).json({
      success: true,
      checkout_url: response.data.data.checkout_url
    });
  } catch (error) {
    console.error(error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat transaksi ke Payment Gateway'
    });
  }
};
