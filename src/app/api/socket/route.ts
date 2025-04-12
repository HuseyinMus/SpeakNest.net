import { NextResponse } from 'next/server';
import { Server } from 'socket.io';

// Global değişken olarak Socket.io sunucusunu saklıyoruz
let io: any;

export async function GET(req: Request) {
  if (!io) {
    // Socket.io sunucusu henüz oluşturulmadıysa oluştur
    const { createServer } = await import('http');
    const { Server: SocketIOServer } = await import('socket.io');
    
    const httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Bağlantı olaylarını dinle
    io.on('connection', (socket: any) => {
      console.log('Yeni kullanıcı bağlandı:', socket.id);
      
      // Kullanıcı mesaj gönderdiğinde
      socket.on('sendMessage', (data: any) => {
        console.log('Mesaj alındı:', data);
        // Mesajı tüm bağlı kullanıcılara gönder
        io.emit('newMessage', {
          id: socket.id,
          message: data.message,
          sender: data.sender,
          timestamp: new Date(),
        });
      });
      
      // Kullanıcı bir odaya katıldığında
      socket.on('joinRoom', (data: any) => {
        const { roomId, userId, userName } = data;
        socket.join(roomId);
        console.log(`${userName} (${userId}) odaya katıldı: ${roomId}`);
        
        // Odadaki diğer kullanıcılara bildir
        socket.to(roomId).emit('userJoined', {
          userId,
          userName,
          timestamp: new Date(),
        });
      });
      
      // Kullanıcı bir odadan ayrıldığında
      socket.on('leaveRoom', (data: any) => {
        const { roomId, userId, userName } = data;
        socket.leave(roomId);
        console.log(`${userName} (${userId}) odadan ayrıldı: ${roomId}`);
        
        // Odadaki diğer kullanıcılara bildir
        socket.to(roomId).emit('userLeft', {
          userId,
          userName,
          timestamp: new Date(),
        });
      });
      
      // Kullanıcı bağlantısı kesildiğinde
      socket.on('disconnect', () => {
        console.log('Kullanıcı bağlantısı kesildi:', socket.id);
      });
    });

    // HTTP sunucusunu başlat (varsayılan port 3001)
    const PORT = process.env.SOCKET_PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`Socket.io sunucusu çalışıyor: ${PORT}`);
    });
  }

  return NextResponse.json({
    status: 'ok',
    message: 'WebSocket sunucusu çalışıyor',
  });
} 