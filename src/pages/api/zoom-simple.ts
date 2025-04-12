export default function handler(req, res) {
  // Challenge parametresi için basit kontrol
  const challenge = req.query.challenge;
  
  if (challenge) {
    // Content type'ı text/plain olarak ayarla
    res.setHeader('Content-Type', 'text/plain');
    // Status 200 ile sadece challenge değerini döndür
    res.status(200).end(challenge);
  } else {
    // Normal yanıt
    res.status(200).json({ message: 'Ready' });
  }
} 