const axios = require('axios');
const midtransClient = require('midtrans-client');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Inisialisasi Midtrans Snap
    const snap = new midtransClient.Snap({
      isProduction: false, // Ubah ke true jika sudah live production
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    const notificationJson = req.body;

    // Verifikasi status transaksi dari server Midtrans
    const statusResponse = await snap.transaction.notification(notificationJson);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    // Cek apakah pembayaran berhasil / lunas
    const isPaid =
      transactionStatus === 'settlement' ||
      (transactionStatus === 'capture' && fraudStatus === 'accept');

    if (isPaid) {
      const username = statusResponse.customer_details?.first_name || 'Player';
      const grossAmount = Number(statusResponse.gross_amount);

      // URL Firebase Realtime Database kamu dari Environment Variable
      const firebaseUrl = process.env.FIREBASE_DATABASE_URL; // misal: https://your-project-id-default-rtdb.firebaseio.com

      if (firebaseUrl) {
        // Bersihkan akhiran slash jika ada
        const cleanFirebaseUrl = firebaseUrl.replace(/\/$/, '');
        
        // Kirim data langsung ke Firebase Realtime Database via REST API
        await axios.put(`${cleanFirebaseUrl}/orders/${orderId}.json`, {
          orderId: orderId,
          username: username,
          amount: grossAmount,
          status: 'SUCCESS',
          paidAt: new Date().toISOString(),
          message: `Pembayaran berhasil! Berikan rank/item ke player ${username}`,
        });

        console.log(`Berhasil menyimpan pesanan ${orderId} ke Firebase Realtime Database.`);
      }

      return res.status(200).json({
        success: true,
        message: 'Payment processed and saved to Realtime Database',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction status received',
    });
  } catch (err) {
    console.error('Callback Error:', err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process callback',
    });
  }
};
