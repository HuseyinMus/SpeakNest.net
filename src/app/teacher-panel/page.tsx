'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import Image from 'next/image';

export default function TeacherPanel() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState('');
  
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            setUser(user);
            await fetchUserProfile(user.uid);
          } else {
            // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
            router.push('/login');
          }
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error('Auth kontrolü sırasında hata:', err);
        setError('Oturum kontrolü sırasında bir hata oluştu.');
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Kullanıcı profilini getir
  const fetchUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile(userData);
        
        // Kullanıcı öğretmen değilse yönlendir
        if (userData.role !== 'teacher') {
          if (userData.role === 'admin') {
            router.push('/dashboard');
          } else if (userData.role === 'student') {
            router.push('/student-panel');
          } else {
            router.push('/');
          }
          return;
        }
        
        // Kurslar, ödevler ve öğrencileri getir
        await fetchTeacherData(userId);
      } else {
        setError('Kullanıcı profili bulunamadı.');
      }
    } catch (err) {
      console.error('Profil verisi alınamadı:', err);
      setError('Profil bilgileri alınırken bir hata oluştu.');
    }
  };
  
  // Öğretmen verilerini getir (kurslar, ödevler, öğrenciler)
  const fetchTeacherData = async (userId: string) => {
    try {
      // Öğretmenin aktif kurslarını getir
      const coursesQuery = query(
        collection(db, 'courses'),
        where('teacherId', '==', userId),
        where('isActive', '==', true)
      );
      
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesData: any[] = [];
      
      coursesSnapshot.forEach((doc) => {
        coursesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setActiveCourses(coursesData);
      
      // Bekleyen ödevleri getir
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('teacherId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('dueDate', 'asc'),
        limit(5)
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignmentsData: any[] = [];
      
      assignmentsSnapshot.forEach((doc) => {
        assignmentsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPendingAssignments(assignmentsData);
      
      // Öğretmenin kurslarına kayıtlı öğrencileri getir
      if (coursesData.length > 0) {
        const courseIds = coursesData.map(course => course.id);
        
        const studentsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('enrolledCourses', 'array-contains-any', courseIds),
          limit(10)
        );
        
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsData: any[] = [];
        
        studentsSnapshot.forEach((doc) => {
          studentsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setStudents(studentsData);
      }
      
    } catch (err) {
      console.error('Öğretmen verileri alınamadı:', err);
      setError('Kurs, ödev ve öğrenci bilgileri alınırken bir hata oluştu.');
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Çıkış yapılamadı:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md">
          <h2 className="text-lg font-medium mb-2">Hata</h2>
          <p>{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Öğretmen Paneli</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                {userProfile?.displayName || user?.displayName || 'Öğretmen'}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-white text-green-600 rounded hover:bg-green-50 transition-colors"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Teacher Profile Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl font-bold">
              {userProfile?.displayName?.charAt(0) || user?.displayName?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{userProfile?.displayName || user?.displayName || 'Öğretmen'}</h2>
              <p className="text-gray-500">{userProfile?.email || user?.email}</p>
              <div className="mt-1 inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Öğretmen
              </div>
            </div>
            <div className="ml-auto">
              <button 
                onClick={() => router.push('/create-course')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Yeni Kurs Oluştur
              </button>
            </div>
          </div>
        </div>
        
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Aktif Kurslar</h2>
            <p className="text-3xl font-bold text-green-600">{activeCourses.length}</p>
            <div className="mt-4">
              <Link href="/teacher-panel/courses" className="text-sm text-green-600 hover:underline">
                Tüm Kurslarımı Görüntüle →
              </Link>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Bekleyen Ödevler</h2>
            <p className="text-3xl font-bold text-orange-600">{pendingAssignments.length}</p>
            <div className="mt-4">
              <Link href="/teacher-panel/assignments" className="text-sm text-green-600 hover:underline">
                Ödevleri Yönet →
              </Link>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Öğrencilerim</h2>
            <p className="text-3xl font-bold text-blue-600">{students.length}</p>
            <div className="mt-4">
              <Link href="/teacher-panel/students" className="text-sm text-green-600 hover:underline">
                Tüm Öğrencileri Görüntüle →
              </Link>
            </div>
          </div>
        </div>
        
        {/* Active Courses */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Aktif Kurslarım</h2>
          </div>
          
          <div className="p-6">
            {activeCourses.length > 0 ? (
              <div className="space-y-4">
                {activeCourses.map((course) => (
                  <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-green-600">{course.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{course.description}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <span className="mr-4">Öğrenci Sayısı: {course.studentCount || '0'}</span>
                          <span>Oluşturma: {course.createdAt ? new Date(course.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                          onClick={() => router.push(`/courses/${course.id}`)}
                        >
                          Görüntüle
                        </button>
                        <button 
                          className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100"
                          onClick={() => router.push(`/courses/${course.id}/edit`)}
                        >
                          Düzenle
                        </button>
                        <button 
                          className="px-3 py-1 text-sm bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                          onClick={() => router.push(`/courses/${course.id}/assignments/create`)}
                        >
                          Ödev Ekle
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Henüz aktif kursunuz bulunmamaktadır.</p>
                <button 
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={() => router.push('/create-course')}
                >
                  İlk Kursunuzu Oluşturun
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Pending Assignments */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Bekleyen Ödevler</h2>
          </div>
          
          <div className="p-6">
            {pendingAssignments.length > 0 ? (
              <div className="space-y-4">
                {pendingAssignments.map((assignment) => (
                  <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">{assignment.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{assignment.description}</p>
                        <span className="text-sm text-gray-500 block mt-2">
                          Kurs: {assignment.courseName || 'Belirtilmemiş'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${
                          new Date(assignment.dueDate.seconds * 1000) < new Date() 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          Teslim Tarihi: {new Date(assignment.dueDate.seconds * 1000).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button 
                        className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-md hover:bg-green-100 mr-2"
                        onClick={() => router.push(`/assignments/${assignment.id}`)}
                      >
                        Teslim Edilenleri Görüntüle
                      </button>
                      <button 
                        className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-100"
                        onClick={() => router.push(`/assignments/${assignment.id}/edit`)}
                      >
                        Düzenle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Bekleyen ödev bulunmamaktadır.</p>
                <button 
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={() => router.push('/create-assignment')}
                >
                  Yeni Ödev Oluştur
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Students */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Kurslarımdaki Öğrenciler</h2>
          </div>
          
          <div className="p-6">
            {students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Öğrenci
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E-posta
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Katıldığı Kurs
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                              {student.displayName?.charAt(0) || student.firstName?.charAt(0) || '?'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.displayName || `${student.firstName || ''} ${student.lastName || ''}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {activeCourses.find(course => 
                              student.enrolledCourses?.includes(course.id))?.title || 'Bilinmiyor'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            className="text-blue-600 hover:text-blue-800 mr-3"
                            onClick={() => router.push(`/students/${student.id}`)}
                          >
                            Görüntüle
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-800"
                            onClick={() => router.push(`/students/${student.id}/assignments`)}
                          >
                            Ödevler
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Kurslarınıza henüz öğrenci kaydı bulunmamaktadır.</p>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <Link href="/teacher-panel/students" className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                Tüm Öğrencileri Görüntüle
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-green-600 hover:underline"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
} 