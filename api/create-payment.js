const midtransClient = require('midtrans-client');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { username, whatsapp, productId, price, platform } = req.body;

  if (!username || !productId || !price) {
    return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
  }

  try {
    // Inisialisasi Snap Midtrans
    const snap = new midtransClient.Snap({
      isProduction: false, // Ubah ke 'true' jika sudah siap Production
      serverKey: process.env.MIDTRANS_SERVER_KEY
    });

    const orderId = 'MPX-' + Date.now();

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Number(price)
      },
      customer_details: {
        first_name: username,
        phone: whatsapp
      },
      item_details: [
        {
          id: productId,
          price: Number(price),
          quantity: 1,
          name: `${productId} (${platform.toUpperCase()})`.substring(0, 50)
        }
      ]
    };

    const transaction = await snap.createTransaction(parameter);

    // Midtrans mengembalikan 'redirect_url' untuk halaman pembayaran
    return res.status(200).json({
      success: true,
      checkout_url: transaction.redirect_url
    });
  } catch (error) {
    console.error('Midtrans Create Error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat transaksi ke Midtrans'
    });
  }
};
