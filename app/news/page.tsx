'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { collection, query, orderBy, onSnapshot, where, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ExternalLink, Calendar, ArrowRight, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import SEOManager from '@/components/SEOManager';

function NewsContent() {
  const [news, setNews] = useState<any[]>([]);
  const [lang, setLang] = useState<'ka' | 'en'>('ka');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isInitialized, setIsInitialized] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [fullPageLoading, setFullPageLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const relatedId = searchParams.get('related');
  const selectedId = searchParams.get('id');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    if (!selectedId) {
      setSelectedItem(null);
      return;
    }
    const found = news.find(n => n.id === selectedId);
    if (found) {
      setSelectedItem(found);
    } else {
      const docRef = doc(db, 'news', selectedId);
      const unsubscribeSingle = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          setSelectedItem({ id: snap.id, ...snap.data() });
        }
      });
      return () => unsubscribeSingle();
    }
  }, [selectedId, news]);

  useEffect(() => {
    // Initial loading delay
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 200));
    
    if (settingsLoaded) {
      minLoadTime.then(() => {
        setFullPageLoading(false);
      });
    }
  }, [settingsLoaded]);

  useEffect(() => {
    // Inject custom fonts from settings
    if (settings?.customFonts) {
      const styleId = 'global-dynamic-fonts';
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      let content = '';
      settings.customFonts.forEach((f: any) => {
        content += `@font-face { font-family: '${f.name}'; src: url(${f.data}); font-display: swap; }\n`;
      });
      styleEl.textContent = content;
    }
    
    document.body.style.setProperty('font-family', "'BPG Glaho Web Caps', sans-serif", 'important');
  }, [settings]);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as 'ka' | 'en';
    if (savedLang) {
      setLang(savedLang);
    }
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    setIsInitialized(true);

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (d) => {
      if (d.exists()) {
        setSettings(d.data());
        setSettingsLoaded(true);
      } else {
        setSettingsLoaded(true);
      }
    }, (err) => {
      setSettingsLoaded(true);
      handleFirestoreError(err, OperationType.GET, 'settings/global');
    });

    let q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    if (relatedId) {
      q = query(collection(db, 'news'), where('relatedItemId', '==', relatedId), orderBy('createdAt', 'desc'));
    }

    const unsubscribeNews = onSnapshot(q, (snap) => {
      const newsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNews(newsData);
      
      // Update last seen
      if (newsData.length > 0) {
        localStorage.setItem('lastSeenNews', new Date().toISOString());
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'news');
    });

    return () => {
      unsubscribeSettings();
      unsubscribeNews();
    };
  }, [relatedId]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('lang', lang);
  }, [lang, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, isInitialized]);

  return (
    <AnimatePresence mode="wait">
      {fullPageLoading ? (
        <LoadingScreen key="loading" />
      ) : (
        <motion.div 
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`min-h-screen font-sans ${theme === 'dark' ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}
        >
          <SEOManager settings={settings} lang={lang} pageTitle={lang === 'ka' ? 'სიახლეები' : 'News'} />
          <Header 
            lang={lang} 
            setLang={setLang} 
            theme={theme} 
            setTheme={setTheme} 
            settings={settings}
          />

          <main className="container mx-auto px-4 py-12 md:py-20">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-sm uppercase tracking-widest mb-12">
              <Bell size={18} />
              {lang === 'ka' ? 'სიახლეები და სტატიები' : 'News & Articles'}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((item, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={item.id}
                  id={item.id}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => {
                    router.push(`/news?id=${item.id}`, { scroll: false });
                  }}
                  className="group bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-blue-50 dark:border-slate-800 cursor-pointer scroll-mt-24"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <Image 
                      src={item.imageUrl} 
                      alt={lang === 'ka' ? item.titleKa : item.titleEn} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4">
                      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <Calendar size={12} />
                        {new Date(item.createdAt).toLocaleDateString(lang === 'ka' ? 'ka-GE' : 'en-US')}
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <h2 className="text-2xl font-black mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {lang === 'ka' ? item.titleKa : item.titleEn}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium line-clamp-3 mb-8 leading-relaxed">
                      {lang === 'ka' ? item.contentKa : item.contentEn}
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/news?id=${item.id}`, { scroll: false });
                        }}
                        className="flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-400 hover:gap-3 transition-all bg-transparent border-none p-0 cursor-pointer"
                      >
                        {lang === 'ka' ? 'სრულად ნახვა' : 'Read Full'}
                        <ArrowRight size={16} />
                      </button>
                      {item.relatedItemId && (
                        <Link 
                          href={`/item?id=${item.relatedItemId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <ArrowRight size={20} />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              <AnimatePresence>
                {selectedId && selectedItem && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete('id');
                      router.push(params.toString() ? `/news?${params.toString()}` : '/news', { scroll: false });
                    }}
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 cursor-pointer"
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 15, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0.95, y: 15, opacity: 0 }}
                      transition={{ type: 'spring', duration: 0.5 }}
                      onClick={(e) => e.stopPropagation()}
                      className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-blue-50 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] cursor-default"
                    >
                      <button
                        onClick={() => {
                          const params = new URLSearchParams(searchParams.toString());
                          params.delete('id');
                          router.push(params.toString() ? `/news?${params.toString()}` : '/news', { scroll: false });
                        }}
                        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:scale-105 active:scale-95 transition-all"
                        aria-label="Close"
                      >
                        <span className="text-xl font-bold">×</span>
                      </button>

                      <div className="overflow-y-auto w-full h-full">
                        {selectedItem.imageUrl && (
                          <div className="relative aspect-video w-full max-h-[350px]">
                            <Image
                              src={selectedItem.imageUrl}
                              alt={lang === 'ka' ? selectedItem.titleKa : selectedItem.titleEn}
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-4 left-4">
                              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <Calendar size={14} />
                                {new Date(selectedItem.createdAt).toLocaleDateString(lang === 'ka' ? 'ka-GE' : 'en-US')}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="p-8 md:p-10">
                          <h1 className="text-xl md:text-3xl font-black mb-6 text-slate-900 dark:text-white leading-tight">
                            {lang === 'ka' ? selectedItem.titleKa : selectedItem.titleEn}
                          </h1>
                          <div className="text-slate-600 dark:text-slate-300 font-medium text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                            {lang === 'ka' ? selectedItem.contentKa : selectedItem.contentEn}
                          </div>

                          {selectedItem.sourceUrl && (
                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                              <a
                                href={selectedItem.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black text-sm rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all hover:scale-[1.02] active:scale-95"
                              >
                                {lang === 'ka' ? 'ორიგინალი წყარო' : 'Original Source'}
                                <ExternalLink size={16} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {news.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bell size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                    {lang === 'ka' ? 'სიახლეები ჯერ არ არის' : 'No news found'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    {lang === 'ka' ? 'დაბრუნდით მოგვიანებით განახლებებისთვის' : 'Check back later for updates'}
                  </p>
                </div>
              )}
            </div>
          </main>
          <Footer lang={lang} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewsContent />
    </Suspense>
  );
}
