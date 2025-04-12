import React, { useState, useEffect, useRef } from 'react';
import SocketService from '@/lib/services/SocketService';
import { useAuth } from '@/lib/hooks/useAuth';

interface Message {
  id: string;
  message: string;
  sender: string;
  timestamp: Date;
}

interface ChatBoxProps {
  roomId: string;
  isOpen?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ roomId, isOpen = true }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const socketService = SocketService.getInstance();

  // Kullanıcı adını belirle
  const userName = user?.displayName || 'Misafir Kullanıcı';
  const userId = user?.uid || 'guest';

  // WebSocket bağlantısını kur
  useEffect(() => {
    if (!user) return;

    async function connectSocket() {
      try {
        await socketService.connect(userId, userName);
        socketService.joinRoom(roomId, userId, userName);
        setIsConnected(true);
        
        // Oda mesajlarını dinle
        socketService.on('newMessage', (data: Message) => {
          setMessages(prev => [...prev, data]);
        });

        // Kullanıcı katılma olayını dinle
        socketService.on('userJoined', (data: any) => {
          // Sistem mesajı olarak ekle
          setMessages(prev => [
            ...prev, 
            {
              id: 'system',
              message: `${data.userName} odaya katıldı`,
              sender: 'Sistem',
              timestamp: new Date(data.timestamp)
            }
          ]);
        });

        // Kullanıcı ayrılma olayını dinle
        socketService.on('userLeft', (data: any) => {
          // Sistem mesajı olarak ekle
          setMessages(prev => [
            ...prev, 
            {
              id: 'system',
              message: `${data.userName} odadan ayrıldı`,
              sender: 'Sistem',
              timestamp: new Date(data.timestamp)
            }
          ]);
        });
      } catch (error) {
        console.error('Socket bağlantı hatası:', error);
      }
    }

    connectSocket();

    // Cleanup
    return () => {
      if (isConnected) {
        socketService.leaveRoom(roomId, userId, userName);
        socketService.off('newMessage');
        socketService.off('userJoined');
        socketService.off('userLeft');
      }
    };
  }, [user, roomId]);

  // Mesajların sonuna otomatik kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isConnected) return;

    socketService.sendMessage(message, userName);
    setMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-96">
      <div className="bg-green-600 text-white py-3 px-4">
        <h3 className="text-lg font-semibold">Sohbet</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            Henüz mesaj yok. İlk mesajı gönderen siz olun!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`p-2 rounded-lg max-w-xs ${
                msg.sender === userName 
                  ? 'ml-auto bg-green-100 text-green-800' 
                  : msg.sender === 'Sistem'
                    ? 'mx-auto bg-gray-100 text-gray-600 text-xs italic'
                    : 'bg-gray-200 text-gray-800'
              }`}
            >
              {msg.sender !== userName && msg.sender !== 'Sistem' && (
                <div className="text-xs font-semibold mb-1">{msg.sender}</div>
              )}
              <div>{msg.message}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="border-t p-2 flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mesajınızı yazın..."
          className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={!isConnected}
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-r-lg disabled:bg-gray-400"
          disabled={!isConnected || !message.trim()}
        >
          Gönder
        </button>
      </form>
    </div>
  );
};

export default ChatBox; 