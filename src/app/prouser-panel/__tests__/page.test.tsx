import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { auth, db } from '@/lib/firebase/config';
import ProUserPanel from '../page';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useToast } from '@/lib/context/ToastContext';

// Mock Firebase ve diğer bağımlılıklar
jest.mock('@/lib/firebase/config', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    signOut: jest.fn(),
  },
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
  },
}));

jest.mock('@/lib/context/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

jest.mock('@/lib/context/ToastContext', () => ({
  useToast: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('ProUserPanel', () => {
  const mockUser = {
    uid: 'test-uid',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/photo.jpg',
  };

  const mockUserProfile = {
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    photoURL: 'https://example.com/photo.jpg',
    role: 'proUser',
  };

  const mockMeetings = [
    {
      id: 'meeting-1',
      title: 'Test Meeting 1',
      description: 'Test Description 1',
      startTime: new Date(),
      level: 'intermediate',
      topic: 'daily',
      participantCount: 6,
      status: 'active',
      participants: [],
    },
    {
      id: 'meeting-2',
      title: 'Test Meeting 2',
      description: 'Test Description 2',
      startTime: new Date(),
      level: 'advanced',
      topic: 'business',
      participantCount: 4,
      status: 'scheduled',
      participants: [],
    },
  ];

  beforeEach(() => {
    // Mock dil bağlamı
    (useLanguage as jest.Mock).mockReturnValue({
      t: (key: string) => key,
    });

    // Mock toast bağlamı
    (useToast as jest.Mock).mockReturnValue({
      success: jest.fn(),
      error: jest.fn(),
    });

    // Mock Firebase auth
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    // Mock Firestore
    (db.collection as jest.Mock).mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        docs: mockMeetings.map(meeting => ({
          id: meeting.id,
          data: () => meeting,
        })),
      }),
    });

    (db.doc as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockUserProfile,
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('yükleme durumunda shimmer efektini gösterir', async () => {
    render(<ProUserPanel />);
    
    // Yükleme durumunda shimmer efektinin görünür olduğunu kontrol et
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('kullanıcı profili ve toplantıları başarıyla yükler', async () => {
    render(<ProUserPanel />);
    
    // Yükleme tamamlandıktan sonra kullanıcı bilgilerinin görünür olduğunu kontrol et
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    
    // Toplantıların görünür olduğunu kontrol et
    expect(screen.getByText('Test Meeting 1')).toBeInTheDocument();
    expect(screen.getByText('Test Meeting 2')).toBeInTheDocument();
  });

  it('toplantı düzenleme butonuna tıklandığında doğru işlevi çağırır', async () => {
    render(<ProUserPanel />);
    
    // Toplantı düzenleme butonunu bul ve tıkla
    const editButtons = await screen.findAllByText('edit');
    fireEvent.click(editButtons[0]);
    
    // Düzenleme işlevinin çağrıldığını kontrol et
    expect(console.log).toHaveBeenCalledWith('Edit meeting:', 'meeting-1');
  });

  it('toplantıya katılma butonuna tıklandığında doğru işlevi çağırır', async () => {
    render(<ProUserPanel />);
    
    // Toplantıya katılma butonunu bul ve tıkla
    const joinButtons = await screen.findAllByText('goToMeeting');
    fireEvent.click(joinButtons[0]);
    
    // Katılma işlevinin çağrıldığını kontrol et
    expect(console.log).toHaveBeenCalledWith('Join meeting:', 'meeting-1');
  });

  it('daha fazla yükle butonuna tıklandığında yeni toplantıları yükler', async () => {
    render(<ProUserPanel />);
    
    // Daha fazla yükle butonunu bul ve tıkla
    const loadMoreButton = await screen.findByText('loadMore');
    fireEvent.click(loadMoreButton);
    
    // Yükleme durumunun güncellendiğini kontrol et
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('hata durumunda hata mesajını gösterir', async () => {
    // Hata durumu için mock'u güncelle
    (db.collection as jest.Mock).mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockRejectedValue(new Error('Test error')),
    });

    render(<ProUserPanel />);
    
    // Hata mesajının görünür olduğunu kontrol et
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });

  it('çıkış yap butonuna tıklandığında doğru işlevi çağırır', async () => {
    render(<ProUserPanel />);
    
    // Çıkış yap butonunu bul ve tıkla
    const logoutButton = await screen.findByText('logout');
    fireEvent.click(logoutButton);
    
    // Çıkış işlevinin çağrıldığını kontrol et
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('erişilebilirlik özelliklerini doğru şekilde uygular', async () => {
    render(<ProUserPanel />);
    
    // ARIA etiketlerinin doğru şekilde uygulandığını kontrol et
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    
    // Butonların erişilebilir etiketlere sahip olduğunu kontrol et
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });
}); 