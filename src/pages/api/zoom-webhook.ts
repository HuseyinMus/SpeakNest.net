import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Zoom Webhook Handler - Basic Authentication Destekli
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Basic Authentication bilgileri
  const ZOOM_USERNAME = "speaknest";  // Zoom'da gireceğiniz kullanıcı adını buraya yazın
  const ZOOM_PASSWORD = "SpeakNest2023!"; // Zoom'da gireceğiniz şifreyi buraya yazın
  
  // Basic Authentication kontrolü
  const authHeader = req.headers.authorization;
  
  if (req.method !== 'GET') {  // POST istekleri için auth kontrolü yap
    if (!authHeader || !checkBasicAuth(authHeader, ZOOM_USERNAME, ZOOM_PASSWORD)) {
      console.log("Basic Authentication başarısız");
      res.setHeader('WWW-Authenticate', 'Basic');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.log("Basic Authentication başarılı");
  }
  
  // GET isteği için basit challenge yanıtı (eski model)
  if (req.method === 'GET') {
    const challenge = req.query.challenge;
    
    if (challenge) {
      console.log("GET challenge yanıtı gönderiliyor:", challenge);
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(String(challenge));
    }
    
    return res.status(200).json({ message: 'Zoom Webhook GET endpoint hazır' });
  }
  
  // POST isteği için JSON payload işleme (yeni model)
  if (req.method === 'POST') {
    const { event, payload } = req.body;
    console.log("POST isteği alındı:", event);
    
    // URL validation event'i
    if (event === 'endpoint.url_validation') {
      const plainToken = payload?.plainToken;
      // Zoom Dashboard'dan alınan Secret Token değeri
      const secret = "7K23_C41SAesYthlX-kKyA";
      
      console.log("URL doğrulama isteği alındı, plainToken:", plainToken);
      console.log("Tam istek body:", JSON.stringify(req.body));
      
      // Zoom'un orijinal örneklerini takip eden şifreleme
      const encryptedToken = crypto
        .createHmac('sha256', secret)
        .update(plainToken)
        .digest('hex');
      
      console.log("Şifrelenmiş token oluşturuldu:", encryptedToken);
      
      // Yanıt objesi
      const response = {
        plainToken,
        encryptedToken,
      };
      
      console.log("Gönderilen yanıt:", JSON.stringify(response));
      
      return res.status(200).json(response);
    }
    
    // Diğer Zoom event'leri
    console.log('Zoom Webhook Event:', event, req.body);
    return res.status(200).json({ received: true });
  }
  
  // Desteklenmeyen HTTP method'ları için
  res.status(405).json({ error: 'Method Not Allowed' });
}

/**
 * Basic Authentication header'ını kontrol eder
 */
function checkBasicAuth(authHeader: string, username: string, password: string): boolean {
  // "Basic " prefix'ini kaldır
  const base64Credentials = authHeader.split(' ')[1];
  if (!base64Credentials) return false;
  
  // Base64 decode
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [authUsername, authPassword] = credentials.split(':');
  
  // Kullanıcı adı ve şifre kontrolü
  return authUsername === username && authPassword === password;
} 