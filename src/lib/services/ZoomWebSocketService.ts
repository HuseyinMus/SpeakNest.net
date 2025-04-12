/**
 * Zoom WebSocket API'sini kullanarak gerçek zamanlı olay bildirimleri alan servis
 */
class ZoomWebSocketService {
  private static instance: ZoomWebSocketService;
  private socket: WebSocket | null = null;
  private connected: boolean = false;
  private subscriptionId: string = '23vv8qrqTxC7844jlo3q7w'; // Zoom'dan alınan abonelik ID'si
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  private constructor() {
    // Singleton
  }

  /**
   * Singleton örneğini döndür
   */
  public static getInstance(): ZoomWebSocketService {
    if (!ZoomWebSocketService.instance) {
      ZoomWebSocketService.instance = new ZoomWebSocketService();
    }
    return ZoomWebSocketService.instance;
  }

  /**
   * Zoom WebSocket API'sine bağlan
   */
  public connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Eğer zaten bağlıysa tekrar bağlanma
        if (this.socket && this.connected) {
          resolve(true);
          return;
        }

        // Zoom WebSocket URL'si
        const wsUrl = `wss://ws.zoom.us/ws?subscriptionId=${this.subscriptionId}`;
        this.socket = new WebSocket(wsUrl);

        // Bağlantı olaylarını dinle
        this.socket.onopen = () => {
          console.log('Zoom WebSocket bağlantısı kuruldu');
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        };

        this.socket.onclose = (event) => {
          console.log('Zoom WebSocket bağlantısı kapandı:', event.code, event.reason);
          this.connected = false;
          this.tryReconnect();
        };

        this.socket.onerror = (error) => {
          console.error('Zoom WebSocket bağlantı hatası:', error);
          this.connected = false;
          reject(error);
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Zoom WebSocket mesajı alındı:', data);
            
            // Olay tipine göre dinleyicileri çağır
            if (data.event) {
              const eventListeners = this.listeners.get(data.event) || [];
              const allListeners = this.listeners.get('all') || [];
              
              // Belirli olay dinleyicilerini çağır
              eventListeners.forEach(callback => callback(data));
              
              // Tüm olay dinleyicilerini çağır
              allListeners.forEach(callback => callback(data));
            }
          } catch (error) {
            console.error('Zoom WebSocket mesajı işlenirken hata oluştu:', error);
          }
        };
      } catch (error) {
        console.error('Zoom WebSocket bağlantısı kurulamadı:', error);
        reject(error);
      }
    });
  }

  /**
   * Yeniden bağlanmayı dene
   */
  private tryReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maksimum yeniden bağlanma denemesi sayısına ulaşıldı.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Yeniden bağlanmayı deneme ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
    
    setTimeout(() => {
      this.connect().catch(() => {
        console.log('Yeniden bağlanma başarısız.');
      });
    }, 3000 * this.reconnectAttempts); // Her seferinde daha uzun bekle
  }

  /**
   * WebSocket bağlantısını kapat
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
      console.log('Zoom WebSocket bağlantısı kapatıldı');
    }
  }

  /**
   * Olay dinleyicisi ekle
   * @param event Olay adı ('meeting.started', 'meeting.ended', vb.) veya 'all' tüm olayları dinlemek için
   * @param callback Olay gerçekleştiğinde çağrılacak fonksiyon
   */
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)?.push(callback);
  }

  /**
   * Olay dinleyicisini kaldır
   */
  public off(event: string, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      const callbacks = this.listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      
      if (index !== -1) {
        callbacks.splice(index, 1);
        this.listeners.set(event, callbacks);
      }
    }
  }
}

export default ZoomWebSocketService; 