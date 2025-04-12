import { io, Socket } from 'socket.io-client';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private connected: boolean = false;
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {
    // Singleton
  }

  /**
   * Singleton örneğini döndür
   */
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Socket.io sunucusuna bağlan
   */
  public connect(userId: string, userName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Eğer zaten bağlıysa tekrar bağlanma
        if (this.socket && this.connected) {
          resolve(true);
          return;
        }

        // Socket.io sunucusuna bağlan
        const socketUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        this.socket = io(socketUrl, {
          transports: ['websocket'],
          query: {
            userId,
            userName,
          },
        });

        // Bağlantı olaylarını dinle
        this.socket.on('connect', () => {
          console.log('Socket.io sunucusuna bağlandı');
          this.connected = true;
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket.io bağlantı hatası:', error);
          this.connected = false;
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket.io bağlantısı kesildi:', reason);
          this.connected = false;
        });
      } catch (error) {
        console.error('Socket.io bağlantı hatası:', error);
        reject(error);
      }
    });
  }

  /**
   * Socket.io sunucusundan bağlantıyı kes
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  /**
   * Sunucuya mesaj gönder
   */
  public sendMessage(message: string, sender: string): void {
    if (this.socket && this.connected) {
      this.socket.emit('sendMessage', { message, sender });
    } else {
      console.error('Socket.io sunucusuna bağlı değil');
    }
  }

  /**
   * Bir odaya katıl
   */
  public joinRoom(roomId: string, userId: string, userName: string): void {
    if (this.socket && this.connected) {
      this.socket.emit('joinRoom', { roomId, userId, userName });
    } else {
      console.error('Socket.io sunucusuna bağlı değil');
    }
  }

  /**
   * Bir odadan ayrıl
   */
  public leaveRoom(roomId: string, userId: string, userName: string): void {
    if (this.socket && this.connected) {
      this.socket.emit('leaveRoom', { roomId, userId, userName });
    } else {
      console.error('Socket.io sunucusuna bağlı değil');
    }
  }

  /**
   * Olay dinleyicisi ekle
   */
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)?.push(callback);
    
    if (this.socket) {
      this.socket.on(event, (...args: any[]) => {
        this.listeners.get(event)?.forEach(cb => cb(...args));
      });
    }
  }

  /**
   * Olay dinleyicisini kaldır
   */
  public off(event: string, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
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

export default SocketService; 