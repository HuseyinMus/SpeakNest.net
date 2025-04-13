'use client';

import React, { useState } from 'react';
import { FiEdit2, FiInfo, FiSun, FiMoon, FiTwitter, FiGithub, FiLinkedin, FiMapPin, FiBarChart2, FiUsers } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const ProfilePage = () => {
  const [darkMode, setDarkMode] = useState(false);

  const user = {
    username: 'kullanici_adi',
    name: 'Ahmet Yılmaz',
    email: 'kullanici@eposta.com',
    location: 'İstanbul, Türkiye',
    profilePicture: 'https://via.placeholder.com/150',
    bio: 'Bu benim kısa biyografim. Yeni şeyler öğrenmeyi ve teknoloji ile ilgilenmeyi seviyorum.',
    joinDate: 'Ocak 2023',
    posts: 24,
    followers: 156,
    following: 89,
    socialMedia: {
      twitter: 'twitter.com/kullanici',
      github: 'github.com/kullanici',
      linkedin: 'linkedin.com/in/kullanici',
    },
  };

  const data = {
    labels: ['Gönderi', 'Takipçi', 'Takip'],
    datasets: [
      {
        data: [user.posts, user.followers, user.following],
        backgroundColor: ['#10B981', '#059669', '#047857'],
        borderWidth: 0,
      },
    ],
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0C1E17] text-white' : 'bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50'} py-12 px-4 sm:px-6 transition-all duration-300`}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-4xl mx-auto"
      >
        <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/70' : 'bg-white/70'} rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 border ${darkMode ? 'border-emerald-800/30' : 'border-emerald-200/50'}`}>
          {/* Header banner */}
          <div className="h-48 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-20"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(16,185,129,0.3)_0%,transparent_50%),radial-gradient(circle_at_85%_30%,rgba(5,150,105,0.3)_0%,transparent_50%)]"></div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className={`absolute top-6 right-6 p-3 rounded-xl ${darkMode ? 'bg-emerald-900 text-emerald-300' : 'bg-white/20 backdrop-blur-md text-white'} shadow-lg hover:shadow-xl transition-all duration-200`}
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </motion.button>
          </div>

          {/* Profile section */}
          <div className="px-8 py-10 -mt-20 relative">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="flex flex-col items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-emerald-300 to-teal-500 p-1 shadow-xl">
                    <img
                      src={user.profilePicture}
                      alt="Profil Resmi"
                      className="w-full h-full rounded-xl object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg bg-emerald-500 text-white shadow-lg"
                    >
                      <FiEdit2 size={18} />
                    </motion.button>
                  </div>
                </motion.div>

                <div className="mt-6 space-y-2 text-center">
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiMapPin size={16} />
                  <span>{user.location}</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-6 py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow-lg hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/30 transition-all duration-300"
                >
                  Profili Düzenle
                </motion.button>
              </div>

              <div className="flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    whileHover={{ y: -5 }}
                    className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50 border border-emerald-800/20' : 'bg-white/70 border border-emerald-100'} backdrop-blur-lg shadow-lg`}
                  >
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FiInfo className="text-emerald-500" />
                      Hakkında
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">{user.bio}</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50 border border-emerald-800/20' : 'bg-white/70 border border-emerald-100'} backdrop-blur-lg shadow-lg`}
                  >
                    <div className="aspect-square">
                      <Doughnut data={data} options={{ responsive: true, maintainAspectRatio: true }} />
                    </div>
                  </motion.div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  <motion.div
                    whileHover={{ y: -3 }}
                    className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-800/40 border border-emerald-800/20' : 'bg-white/60 border border-emerald-100'} backdrop-blur-sm shadow flex flex-col items-center justify-center`}
                  >
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2">
                      <FiBarChart2 size={20} />
                    </div>
                    <p className="text-2xl font-bold">{user.posts}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gönderiler</p>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ y: -3 }}
                    className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-800/40 border border-emerald-800/20' : 'bg-white/60 border border-emerald-100'} backdrop-blur-sm shadow flex flex-col items-center justify-center`}
                  >
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2">
                      <FiUsers size={20} />
                    </div>
                    <p className="text-2xl font-bold">{user.followers}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Takipçiler</p>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ y: -3 }}
                    className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-800/40 border border-emerald-800/20' : 'bg-white/60 border border-emerald-100'} backdrop-blur-sm shadow flex flex-col items-center justify-center`}
                  >
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2">
                      <FiUsers size={20} />
                    </div>
                    <p className="text-2xl font-bold">{user.following}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Takip</p>
                  </motion.div>
                </div>

                <div className="mt-8 flex justify-center gap-4">
                  <motion.a
                    whileHover={{ y: -2, scale: 1.1 }}
                    href={user.socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-emerald-400 text-white shadow-lg hover:shadow-emerald-200/50"
                  >
                    <FiTwitter size={20} />
                  </motion.a>
                  <motion.a
                    whileHover={{ y: -2, scale: 1.1 }}
                    href={user.socialMedia.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-emerald-800 text-white shadow-lg hover:shadow-emerald-200/50"
                  >
                    <FiGithub size={20} />
                  </motion.a>
                  <motion.a
                    whileHover={{ y: -2, scale: 1.1 }}
                    href={user.socialMedia.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-emerald-600 text-white shadow-lg hover:shadow-emerald-200/50"
                  >
                    <FiLinkedin size={20} />
                  </motion.a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;