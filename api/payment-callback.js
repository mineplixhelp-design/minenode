const axios = require('axios');
const midtransClient = require('midtrans-client');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const apiClient = new midtransClient.Snap({
      isProduction: false, // Ubah ke 'true' jika sudah siap Production
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    const notificationJson = req.body;
    
    // Verifikasi status transaksi dari server Midtrans
    const statusResponse = await apiClient.transaction.notification(notificationJson);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    // Cek jika pembayaran berhasil lunas
    const isPaid = 
      transactionStatus === 'settlement' || 
      (transactionStatus === 'capture' && fraudStatus === 'accept');

    if (isPaid) {
      // Ambil username dari detail order
      const username = statusResponse.customer_details?.first_name || 'Player';
      const grossAmount = Number(statusResponse.gross_amount);

      // Kirim notifikasi ke CraftingStore API
      await axios.post(
        'https://api.craftingstore.net/v1/payments',
        {
          packageName: `Order ${orderId}`,
          username: username,
          price: grossAmount,
          status: 'PAID'
        },
        {
          headers: {
            'token': process.env.CRAFTINGSTORE_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      return res.status(200).json({ success: true, message: 'Payment processed and sent to CraftingStore' });
    }

    return res.status(200).json({ success: true, message: 'Transaction status received' });
  } catch (err) {
    console.error('Callback Error:', err?.response?.data || err.message);
    return res.status(500).json({ success: false, message: 'Failed to process callback' });
  }
};
