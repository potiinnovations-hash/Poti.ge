'use client';

import React, { useState, useEffect } from 'react';
import { onSnapshot, doc, collection, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';
import SEOManager from '@/components/SEOManager';
import { motion } from 'motion/react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  Bus: LucideIcons.Bus,
  Waves: LucideIcons.Waves,
  Wrench: LucideIcons.Wrench,
  Fish: LucideIcons.Fish,
  Gamepad2: LucideIcons.Gamepad2,
  Compass: LucideIcons.Compass,
  ShoppingBag: LucideIcons.ShoppingBag,
  Users: LucideIcons.Users,
  Info: LucideIcons.Info,
  Globe: LucideIcons.Globe,
  Lightbulb: LucideIcons.Lightbulb,
  Rocket: LucideIcons.Rocket,
  Network: LucideIcons.Network,
  Sparkles: LucideIcons.Sparkles,
};

interface FutureApp {
  id?: string;
  domain: string;
  icon: string;
  titleKa: string;
  titleEn: string;
  descKa: string;
  descEn: string;
  color: string;
  tagKa: string;
  tagEn: string;
  isReady?: boolean;
  link?: string;
  order?: number;
}

const defaultPlans: FutureApp[] = [
  {
    domain: 'bus.poti.ge',
    icon: 'Bus',
    titleKa: 'ავტობუსები ლაივში',
    titleEn: 'Live Bus Tracker',
    descKa: 'ავტობუსების ნავიგაცია რეალურ დროში და მარშრუტები ქალაქ ფოთში.',
    descEn: 'Live GPS navigation, routing, and schedules for Poti city buses in real-time.',
    color: 'from-emerald-500 to-teal-600',
    tagKa: 'ტრანსპორტი',
    tagEn: 'Transit',
    isReady: false,
    link: '',
    order: 0,
  },
  {
    domain: 'pull.poti.ge',
    icon: 'Waves',
    titleKa: 'ონლაინ ჯავშნები',
    titleEn: 'Online Sport Booking',
    descKa: 'სპორტ კომპლექსებისა და საცურაო აუზების ონლაინ ჯავშნის ფუნქცია.',
    descEn: 'Instant digital booking for local swim lanes, fitness complexes, and sports events.',
    color: 'from-blue-500 to-indigo-600',
    tagKa: 'აქტივობა',
    tagEn: 'Sports',
    isReady: false,
    link: '',
    order: 1,
  },
  {
    domain: 'fix.poti.ge',
    icon: 'Wrench',
    titleKa: 'პრობლემების რეაგირება',
    titleEn: 'Fix Poti Portal',
    descKa: 'ქალაქში არსებული ინფრასტრუქტურული პრობლემების დაფიქსირების და მათზე რეაგირების სისტემა.',
    descEn: 'Community report utility for municipal failures, public damages, and swift response updates.',
    color: 'from-amber-500 to-orange-600',
    tagKa: 'ინფრასტრუქტურა',
    tagEn: 'Municipal',
    isReady: false,
    link: '',
    order: 2,
  },
  {
    domain: 'fishing.poti.ge',
    icon: 'Fish',
    titleKa: 'თევზაობის რუკა',
    titleEn: 'Poti Fishing Club',
    descKa: 'თევზაობის ფედერაციის საიმიჯო პორტალი და თევზაობის აქტიური წერტილების ინტერაქტიული რუკა.',
    descEn: 'The Fishing Federation brand portal paired with an interactive map of prime angling hotspots.',
    color: 'from-cyan-500 to-blue-600',
    tagKa: 'რეკრეაცია',
    tagEn: 'Hobby',
    isReady: false,
    link: '',
    order: 3,
  },
  {
    domain: 'games.poti.ge',
    icon: 'Gamepad2',
    titleKa: 'ქალაქის თამაშები',
    titleEn: 'Poti City Quests',
    descKa: 'ონლაინ და რეალურ ცხოვრებაში (IRL) ქალაქის სათავგადასავლო თამაშებისა და ქვიზების სისტემა.',
    descEn: 'Engaging real-world urban exploration gaming engines, digital quests, and historical trivia.',
    color: 'from-purple-500 to-pink-600',
    tagKa: 'გართობა',
    tagEn: 'Gaming',
    isReady: false,
    link: '',
    order: 4,
  },
  {
    domain: 'visit.poti.ge',
    icon: 'Compass',
    titleKa: 'ციფრული გიდი',
    titleEn: 'Explore Poti',
    descKa: 'ტურისტული ადგილების დაგეგმარების, ტურის დაჯავშნისა და ლოკაციების ციფრული გიდი.',
    descEn: 'Curated sightseeing blueprints, booking channels, and smart location companions for travelers.',
    color: 'from-rose-500 to-red-600',
    tagKa: 'ტურიზმი',
    tagEn: 'Travel',
    isReady: false,
    link: '',
    order: 5,
  },
  {
    domain: 'shop.poti.ge',
    icon: 'ShoppingBag',
    titleKa: 'ადგილობრივი მაღაზია',
    titleEn: 'Handmade Marketplace',
    descKa: 'ონლაინ მაღაზია, ქალაქში არსებული უნიკალური ხელნაკეთი ნივთების რეალიზაციისთვის.',
    descEn: 'Local marketplace dedicated to promoting and selling exquisite handmade goods from Poti.',
    color: 'from-violet-500 to-purple-600',
    tagKa: 'ბაზარი',
    tagEn: 'Shop',
    isReady: false,
    link: '',
    order: 6,
  },
  {
    domain: 'people.poti.ge',
    icon: 'Users',
    titleKa: 'მოქალაქეთა ფორუმი',
    titleEn: 'Citizen Forum',
    descKa: 'ქალაქში მცხოვრები საერთო ინტერესების მქონე ადამიანების ფორუმი ღია ჯგუფების ფორმატით.',
    descEn: 'Interactive social discussion forums and public communities categorized by resident interests.',
    color: 'from-teal-500 to-emerald-600',
    tagKa: 'საზოგადოება',
    tagEn: 'Community',
    isReady: false,
    link: '',
    order: 7,
  },
  {
    domain: 'info.poti.ge',
    icon: 'Info',
    titleKa: 'თანამშრომელთა პორტალი',
    titleEn: 'Internal Service Portal',
    descKa: 'სწრაფი ინფორმაციის მიწოდების სისტემა სახელმწიფო სტრუქტურების, საგანმანათლებლო ან/და სერვისების თანამშრომლებისათვის.',
    descEn: 'Secure operational dashboard and bulletin pipeline for education staff and local civil officers.',
    color: 'from-sky-500 to-blue-600',
    tagKa: 'კავშირი',
    tagEn: 'Utilities',
    isReady: false,
    link: '',
    order: 8,
  }
];

export default function PlansPage() {
  const [lang, setLang] = useState<'ka' | 'en'>('ka');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isInitialized, setIsInitialized] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [fullPageLoading, setFullPageLoading] = useState(true);
  const [plansFromDb, setPlansFromDb] = useState<FutureApp[]>([]);

  useEffect(() => {
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 200));
    if (settingsLoaded) {
      minLoadTime.then(() => {
        setFullPageLoading(false);
      });
    }
  }, [settingsLoaded]);

  useEffect(() => {
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
    
    const activeFont = settings?.primaryFont || settings?.fontFamily;
    if (activeFont) {
      const formattedFont = activeFont.includes(' ') && !activeFont.startsWith("'") && !activeFont.startsWith('"')
        ? `'${activeFont}'`
        : activeFont;
      document.body.style.setProperty('font-family', `${formattedFont}, 'BPG Glaho Web Caps', 'Inter', sans-serif`, 'important');
    }
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

    const qPlans = query(collection(db, 'plans'), orderBy('order', 'asc'));
    const unsubscribePlans = onSnapshot(qPlans, (snap) => {
      if (!snap.empty) {
        setPlansFromDb(snap.docs.map(d => ({ id: d.id, ...d.data() } as FutureApp)));
      } else {
        setPlansFromDb([]);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'plans');
    });

    return () => {
      unsubscribeSettings();
      unsubscribePlans();
    };
  }, []);

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

  const displayedPlans = plansFromDb.length > 0 ? plansFromDb : defaultPlans;

  if (fullPageLoading) {
    return <LoadingScreen theme={theme} />;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <SEOManager 
        settings={settings} 
        lang={lang} 
        pageTitle={lang === 'ka' ? 'ციფრული ეკოსისტემა' : 'Digital Ecosystem'} 
        pageDescription={lang === 'ka' ? 'ფოთის ერთიანი ციფრული განვითარების გეგმები და მომავალი აპლიკაციები.' : 'Future apps and digital development master plan of Poti.'}
      />
      
      <Header 
        lang={lang} 
        setLang={setLang} 
        theme={theme} 
        setTheme={setTheme} 
        settings={settings}
      />

      <main className="container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16 md:mb-24">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-slate-800 dark:text-slate-100"
          >
            {lang === 'ka' ? 'ფოთის ერთიანი' : 'Poti Unified'} <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-blue-300 dark:to-indigo-400">
              {lang === 'ka' ? 'ციფრული ეკოსისტემა' : 'Digital Ecosystem'}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-500 dark:text-slate-400 text-base md:text-xl font-bold mt-6 leading-relaxed max-w-2xl mx-auto"
          >
            {lang === 'ka' ? (
              <>
                <span className="text-blue-600 dark:text-blue-400">Poti.ge</span> წარმოადგენს ქალაქის მთავარ პორტალს, რომელიც გააერთიანებს მუნიციპალური სერვისების ფართო ეკოსისტემას. გაეცანით ჩვენს სამომავლო გეგმებსა და შვილობილ პროექტებს.
              </>
            ) : (
              <>
                <span className="text-blue-600 dark:text-blue-400">Poti.ge</span> serves as the gateway portal coordinating a cohesive municipal platform. Explore our future maps, smart integrations, and sister ecosystems.
              </>
            )}
          </motion.p>
        </div>

        {/* Dynamic Bento Style Grid for Future Plans */}
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}
          >
            {displayedPlans.map((app: FutureApp, index: number) => {
              const IconComponent = iconMap[app.icon] || LucideIcons.Globe;
              const hasExternalLink = app.isReady && (app.link || app.domain);
              const linkUrl = app.link 
                ? app.link 
                : app.domain 
                  ? (app.domain.startsWith('http') ? app.domain : `https://${app.domain}`) 
                  : '#';

              const content = (
                <div className="h-full flex flex-col justify-between">
                  {/* Decorative background aura on hover */}
                  <span className={`absolute -right-16 -top-16 w-32 h-32 rounded-full bg-gradient-to-br ${app.color} opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 blur-2xl`} />

                  <div>
                    <div className="flex items-center justify-between gap-4 mb-6">
                      {/* Icon container */}
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${app.color} text-white shadow-lg`}>
                        <IconComponent size={22} />
                      </div>

                      {/* Subcategory Pill */}
                      <span className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 font-extrabold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {lang === 'ka' ? app.tagKa : app.tagEn}
                      </span>
                    </div>

                    {/* Title & Domain */}
                    <div className="space-y-1 mb-3">
                      <h3 className="text-lg md:text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                        {lang === 'ka' ? app.titleKa : app.titleEn}
                      </h3>
                      <code className="inline-block text-xs font-black text-blue-600 dark:text-blue-400 font-mono select-all">
                        {app.domain}
                      </code>
                    </div>

                    {/* Description */}
                    <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-bold leading-relaxed mb-6">
                      {lang === 'ka' ? app.descKa : app.descEn}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                      {app.isReady ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">{lang === 'ka' ? 'ჩაშვებულია / LIVE' : 'LIVE / REGULAR'}</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                          <span>{lang === 'ka' ? 'დაგეგმილი' : 'Planned'}</span>
                        </>
                      )}
                    </span>
                    
                    <span className="opacity-0 group-hover:opacity-100 group-hover:transform group-hover:translate-x-1 duration-300">
                      <LucideIcons.ArrowRight size={16} className={app.isReady ? "text-emerald-500" : "text-blue-500"} />
                    </span>
                  </div>
                </div>
              );

              // If active link, wrap in an actual A tag, else just render as card
              return (
                <motion.div
                  key={app.id || index}
                  variants={{
                    hidden: { opacity: 0, y: 25 },
                    show: { opacity: 1, y: 0 }
                  }}
                  className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-none hover:shadow-[0_12px_40px_rgba(37,99,235,0.08)] hover:border-slate-200 dark:hover:border-slate-700/80 transition-all duration-300 ease-out"
                >
                  {hasExternalLink ? (
                    <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="block h-full cursor-pointer">
                      {content}
                    </a>
                  ) : (
                    content
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
}
