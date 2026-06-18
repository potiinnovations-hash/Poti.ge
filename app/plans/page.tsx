'use client';

import React, { useState, useEffect } from 'react';
import { onSnapshot, doc, collection, query, orderBy, addDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/firebase';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';
import SEOManager from '@/components/SEOManager';
import { motion, AnimatePresence } from 'motion/react';
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

const gradientOptions = [
  { label: 'Emerald-Teal (სავალი/ტრანსპორტი)', value: 'from-emerald-500 to-teal-600' },
  { label: 'Blue-Indigo (სპორტი/აუზი)', value: 'from-blue-500 to-indigo-600' },
  { label: 'Amber-Orange (მუნიციპალური/რეაგირება)', value: 'from-amber-500 to-orange-600' },
  { label: 'Cyan-Blue (რეკრეაცია/თევზაობა)', value: 'from-cyan-500 to-blue-600' },
  { label: 'Purple-Pink (გართობა/თამაშები)', value: 'from-purple-500 to-pink-600' },
  { label: 'Rose-Red (ტურიზმი/გიდი)', value: 'from-rose-500 to-red-600' },
  { label: 'Violet-Purple (მაღაზია/ბაზარი)', value: 'from-violet-500 to-purple-600' },
  { label: 'Teal-Emerald (საზოგადოება/ფორუმი)', value: 'from-teal-500 to-emerald-600' },
  { label: 'Sky-Blue (კავშირი/უნიფიკაცია)', value: 'from-sky-500 to-blue-600' }
];

const iconList = [
  'Bus', 'Waves', 'Wrench', 'Fish', 'Gamepad2', 'Compass', 
  'ShoppingBag', 'Users', 'Info', 'Globe', 'Lightbulb', 'Rocket', 
  'Network', 'Sparkles'
];

export default function PlansPage() {
  const [lang, setLang] = useState<'ka' | 'en'>('ka');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isInitialized, setIsInitialized] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [fullPageLoading, setFullPageLoading] = useState(true);
  const [plansFromDb, setPlansFromDb] = useState<FutureApp[]>([]);

  // Admin and inline management states
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [adminEditMode, setAdminEditMode] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FutureApp | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Auth status & check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        if (u.email === 'potiinnovations@gmail.com') {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', u.uid));
            setIsAdmin(adminDoc.exists());
          } catch (e) {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
        setAdminEditMode(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('Login error:', e instanceof Error ? e.message : String(e));
    }
  };

  const handleAddPlan = async () => {
    try {
      const nextOrder = displayedPlans.length > 0 ? Math.max(...displayedPlans.map(p => p.order ?? 0)) + 1 : 0;
      await addDoc(collection(db, 'plans'), {
        domain: 'newsite.poti.ge',
        icon: 'Globe',
        titleKa: 'ახალი პორტალი',
        titleEn: 'New Portal',
        descKa: 'ახალი პორტალის მოკლე აღწერა.',
        descEn: 'Brief description of the new digital site or ecosystem.',
        color: 'from-blue-500 to-indigo-600',
        tagKa: 'ახალი',
        tagEn: 'New',
        isReady: false,
        link: '',
        order: nextOrder
      });
      setConfirmDeleteId(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'plans');
    }
  };

  const handleUpdatePlan = async (id: string, updates: Partial<FutureApp>) => {
    try {
      await updateDoc(doc(db, 'plans', id), updates);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `plans/${id}`);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'plans', id));
      if (editingPlan?.id === id) {
        setEditingPlan(null);
      }
      setConfirmDeleteId(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `plans/${id}`);
    }
  };

  const handleAutoSeed = async () => {
    setIsSaving(true);
    try {
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      defaultPlans.forEach((p) => {
        const newDocRef = doc(collection(db, 'plans'));
        batch.set(newDocRef, p);
      });
      await batch.commit();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'plans/seed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveInGrid = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= displayedPlans.length) return;

    const currentItem = displayedPlans[index];
    const targetItem = displayedPlans[targetIndex];

    const currentId = currentItem.id;
    const targetId = targetItem.id;

    if (!currentId || !targetId) {
      alert("ბლოკების გადასაადგილებლად საჭიროა მათი ბაზაში შენახვა (ავტომატურად მოხდება წამებში)...");
      await handleAutoSeed();
      return;
    }

    const currentOrder = currentItem.order ?? index;
    const targetOrder = targetItem.order ?? targetIndex;

    let newCurrentOrder = targetOrder;
    let newTargetOrder = currentOrder;
    if (newCurrentOrder === newTargetOrder) {
      if (direction === 'up') {
        newCurrentOrder = targetOrder - 1;
      } else {
        newCurrentOrder = targetOrder + 1;
      }
    }

    await handleUpdatePlan(currentId, { order: newCurrentOrder });
    await handleUpdatePlan(targetId, { order: newTargetOrder });
  };

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
    return <LoadingScreen />;
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

      <main className="container mx-auto px-4 py-16 md:py-24 animate-fade-in">
        {/* Admin Header Notification / Control */}
        {isAdmin && (
          <div className="max-w-6xl mx-auto mb-10 flex items-center justify-between p-4 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-800 rounded-[2rem] shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3 pl-4">
              <span className="flex relative h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                ავტორიზებული ხართ როგორც ადმინისტრატორი
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAdminEditMode(!adminEditMode)}
                className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  adminEditMode 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350'
                }`}
              >
                {adminEditMode ? 'რედაქტირების გამორთვა' : 'რედაქტირების ჩართვა'}
              </button>
            </div>
          </div>
        )}

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
              const hasExternalLink = !adminEditMode && app.isReady && (app.link || app.domain);
              const linkUrl = app.link 
                ? app.link 
                : app.domain 
                  ? (app.domain.startsWith('http') ? app.domain : `https://${app.domain}`) 
                  : '#';
 
              const content = (
                <div className="h-full flex flex-col justify-between">
                  {/* Decorative background aura on hover */}
                  <span className={`absolute -right-16 -top-16 w-32 h-32 rounded-full bg-gradient-to-br ${app.color} opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 blur-2xl`} />
                  
                  {/* Inline Admin Controls for Plan Cell */}
                  {adminEditMode && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-full border border-slate-200/60 dark:border-slate-800 shadow-md">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingPlan(app);
                        }}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-md transition-colors cursor-pointer"
                        title="რედაქტირება KA / EN"
                      >
                        <LucideIcons.Edit3 size={13} />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMoveInGrid(index, 'up');
                        }}
                        disabled={index === 0}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title="წინ გადატანა"
                      >
                        <LucideIcons.ChevronUp size={13} />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMoveInGrid(index, 'down');
                        }}
                        disabled={index === displayedPlans.length - 1}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title="უკან გადატანა"
                      >
                        <LucideIcons.ChevronDown size={13} />
                      </button>

                      {confirmDeleteId === app.id ? (
                        <div className="flex items-center gap-1 pl-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (app.id) {
                                handleDeletePlan(app.id);
                              }
                            }}
                            className="px-2 py-1 bg-red-600 text-white rounded text-[9px] font-black cursor-pointer uppercase tracking-wider"
                          >
                            დასტური
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                            }}
                            className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded cursor-pointer"
                          >
                            <LucideIcons.X size={11} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (app.id) {
                              setConfirmDeleteId(app.id);
                            } else {
                              alert("დესტრუქციული წაშლისთვის ბლოკი ბაზაში უნდა არსებობდეს (ჯერ შეინახეთ ცვლილება).");
                            }
                          }}
                          className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 rounded-md transition-colors cursor-pointer"
                          title="წაშლა"
                        >
                          <LucideIcons.Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
 
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-6">
                      {/* Icon container */}
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${app.color} text-white shadow-lg shadow-blue-500/5`}>
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

            {/* Admin Add Block Cell */}
            {adminEditMode && (
              <motion.button
                onClick={handleAddPlan}
                variants={{
                  hidden: { opacity: 0, y: 25 },
                  show: { opacity: 1, y: 0 }
                }}
                className="group relative h-full min-h-[300px] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:border-blue-500/50 hover:bg-blue-50/10 transition-all duration-300 cursor-pointer"
              >
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <LucideIcons.Plus size={28} />
                </div>
                <h4 className="text-base font-black text-slate-700 dark:text-slate-300">ახალი ბლოკის დამატება</h4>
                <p className="text-xs text-slate-400 font-bold mt-1 text-center max-w-[200px]">შექმენით ახალი მუნიციპალური ციფრული გეგმა</p>
              </motion.button>
            )}
          </motion.div>
        </div>
      </main>

      {/* Floating Shield Lock verification button */}
      {!isAdmin && (
        <button
          onClick={handleLogin}
          className="fixed bottom-6 right-6 p-4 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer"
          title="ადმინის ვერიფიკაცია"
        >
          <LucideIcons.ShieldCheck size={20} />
        </button>
      )}

      {/* Comprehensive Edit Modal */}
      <AnimatePresence>
        {editingPlan && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] overflow-y-auto p-8 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <LucideIcons.X size={20} />
              </button>

              <div className="mb-6">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                  რედაქტირების პანელი
                </span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
                  ბლოკის მოდიფიცირება
                </h3>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSaving(true);
                
                // If it's a default plan without id, seed first or handle appropriately
                let targetId = editingPlan.id;
                if (!targetId) {
                  // Find all standard default plans, build a collection in firestore
                  try {
                    const { writeBatch } = await import('firebase/firestore');
                    const batch = writeBatch(db);
                    
                    for (const p of defaultPlans) {
                      const newDocRef = doc(collection(db, 'plans'));
                      const isTarget = p.domain === editingPlan.domain;
                      const payload = isTarget ? {
                        domain: editingPlan.domain,
                        titleKa: editingPlan.titleKa,
                        titleEn: editingPlan.titleEn,
                        descKa: editingPlan.descKa,
                        descEn: editingPlan.descEn,
                        tagKa: editingPlan.tagKa,
                        tagEn: editingPlan.tagEn,
                        color: editingPlan.color,
                        icon: editingPlan.icon,
                        link: editingPlan.link || '',
                        isReady: editingPlan.isReady || false,
                        order: p.order ?? 0
                      } : p;
                      batch.set(newDocRef, payload);
                    }
                    await batch.commit();
                    setEditingPlan(null);
                    setIsSaving(false);
                    return;
                  } catch (err: any) {
                    handleFirestoreError(err, OperationType.WRITE, 'plans/seed-on-save');
                    setIsSaving(false);
                    return;
                  }
                }

                await handleUpdatePlan(targetId, {
                  domain: editingPlan.domain,
                  titleKa: editingPlan.titleKa,
                  titleEn: editingPlan.titleEn,
                  descKa: editingPlan.descKa,
                  descEn: editingPlan.descEn,
                  tagKa: editingPlan.tagKa,
                  tagEn: editingPlan.tagEn,
                  color: editingPlan.color,
                  icon: editingPlan.icon,
                  link: editingPlan.link || '',
                  isReady: editingPlan.isReady || false,
                });
                
                setIsSaving(false);
                setEditingPlan(null);
              }} className="space-y-6">
                
                {/* Domain & Link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">დომენი (Domain)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editingPlan.domain}
                      onChange={(e) => setEditingPlan({ ...editingPlan, domain: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">გარე ლინკი (Optional Link)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editingPlan.link || ''}
                      placeholder="მაგ: https://visit.poti.ge"
                      onChange={(e) => setEditingPlan({ ...editingPlan, link: e.target.value })}
                    />
                  </div>
                </div>

                {/* Localized Titles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">სათაური (ქართული)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editingPlan.titleKa}
                      onChange={(e) => setEditingPlan({ ...editingPlan, titleKa: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Title (English)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editingPlan.titleEn}
                      onChange={(e) => setEditingPlan({ ...editingPlan, titleEn: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Localized Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">ტეგი (ქართული)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editingPlan.tagKa}
                      onChange={(e) => setEditingPlan({ ...editingPlan, tagKa: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Tag (English)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editingPlan.tagEn}
                      onChange={(e) => setEditingPlan({ ...editingPlan, tagEn: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">აღწერა (ქართული)</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed"
                      value={editingPlan.descKa}
                      onChange={(e) => setEditingPlan({ ...editingPlan, descKa: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Description (English)</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed"
                      value={editingPlan.descEn}
                      onChange={(e) => setEditingPlan({ ...editingPlan, descEn: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Design Color Profile & Icon */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">დიზაინი (ფერი)</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl text-slate-900 dark:text-slate-300 font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editingPlan.color}
                      onChange={(e) => setEditingPlan({ ...editingPlan, color: e.target.value })}
                    >
                      {gradientOptions.map(g => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">ხატულა (Icon)</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl text-slate-900 dark:text-slate-300 font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={editingPlan.icon}
                      onChange={(e) => setEditingPlan({ ...editingPlan, icon: e.target.value })}
                    >
                      {iconList.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Status and Seed notice */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-805 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    ჩაშვებულია / LIVE / კავშირზეა
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editingPlan.isReady || false}
                      onChange={(e) => setEditingPlan({ ...editingPlan, isReady: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {!editingPlan.id && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                    <LucideIcons.AlertCircle className="shrink-0 mt-0.5" size={16} />
                    <span className="font-bold">
                      ყურადღება: ეს არის ნაგულისხმევი გეგმა. ცვლილებების შესანარჩუნებლად საჭიროა ჯერ იმპორტის შესრულება (ის ავტომატურად მოხდება შენახვისას).
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="px-6 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'ინახება...' : 'შენახვა'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer lang={lang} />
    </div>
  );
}
