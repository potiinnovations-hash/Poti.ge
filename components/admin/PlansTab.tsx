'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, ChevronUp, ChevronDown, 
  Bus, Waves, Wrench, Fish, Gamepad2, Compass, 
  ShoppingBag, Users, Info, Globe, Lightbulb, Rocket, 
  Network, Sparkles, Check, AlertCircle, Link2
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';

// Icon Map with components
const iconComponents: Record<string, React.ComponentType<any>> = {
  Bus, Waves, Wrench, Fish, Gamepad2, Compass, 
  ShoppingBag, Users, Info, Globe, Lightbulb, Rocket, 
  Network, Sparkles
};

// Colors list
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

const defaultPlansToSeed = [
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

interface PlansTabProps {
  plans: any[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
}

export default function PlansTab({ 
  plans, 
  editingId, 
  setEditingId, 
  confirmDeleteId, 
  setConfirmDeleteId 
}: PlansTabProps) {
  
  const [isSeeding, setIsSeeding] = useState(false);

  const handleAddPlan = async () => {
    try {
      const nextOrder = plans.length > 0 ? Math.max(...plans.map(p => p.order ?? 0)) + 1 : 0;
      const docRef = await addDoc(collection(db, 'plans'), {
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
      setEditingId(docRef.id);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'plans');
    }
  };

  const handleUpdatePlan = async (id: string, updates: Partial<any>) => {
    try {
      await updateDoc(doc(db, 'plans', id), updates);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `plans/${id}`);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'plans', id));
      setEditingId(null);
      setConfirmDeleteId(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `plans/${id}`);
    }
  };

  const handleSeedDefaults = async () => {
    if (plans.length > 0) return;
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      defaultPlansToSeed.forEach((p) => {
        const newDocRef = doc(collection(db, 'plans'));
        batch.set(newDocRef, p);
      });
      await batch.commit();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'plans/seed');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleMovePlan = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= plans.length) return;

    const currentItem = plans[index];
    const targetItem = plans[targetIndex];

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

    handleUpdatePlan(currentItem.id, { order: newCurrentOrder });
    handleUpdatePlan(targetItem.id, { order: newTargetOrder });
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-2">სხვა საიტები & გეგმები</h2>
          <p className="text-slate-500 font-bold text-lg">მართეთ /plans გვერდზე მოთავსებული აპლიკაციების, პორტალების და შვილობილი საიტების ბლოკები</p>
        </div>
        <div className="flex gap-4">
          {plans.length === 0 && (
            <button 
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              className="flex items-center gap-2 px-6 py-5 bg-teal-600 text-white rounded-[2rem] font-bold text-sm hover:bg-teal-700 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={18} /> {isSeeding ? 'სინქრონიზაცია...' : 'სტანდარტულის იმპორტი'}
            </button>
          )}
          <button 
            onClick={handleAddPlan}
            className="flex items-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-[2rem] font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 active:scale-95 text-sm cursor-pointer"
          >
            <Plus size={20} /> ახალი საიტი / ბლოკი
          </button>
        </div>
      </header>

      {plans.length === 0 && !isSeeding && (
        <div className="bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-12 text-center text-slate-500">
          <Globe className="mx-auto text-slate-300 mb-4 animate-pulse" size={48} />
          <h3 className="text-lg font-bold mb-2">მონაცემები არ არის</h3>
          <p className="text-sm text-slate-400 font-semibold mb-6 max-w-sm mx-auto">ბაზაში ჯერ არ არის საიტები. შემოიტანეთ საწყისი 9 სტანდარტული პროექტი ან დაამატეთ თავიდან.</p>
          <button 
            onClick={handleSeedDefaults}
            className="px-6 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-full transition-colors"
          >
            საწყისი საიტების შემოტანა
          </button>
        </div>
      )}

      <div className="grid gap-6">
        {plans.map((item, index) => {
          const IconComponent = iconComponents[item.icon] || Globe;
          return (
            <motion.div 
              layout
              key={item.id} 
              className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all"
            >
              {/* Card Header collapsed */}
              <div className="p-6 flex items-center justify-between gap-6">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  {/* Sorting Controls */}
                  <div className="flex flex-col gap-1 flex-shrink-0 bg-slate-50 p-1 rounded-2xl border border-slate-100/80">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMovePlan(index, 'up');
                      }}
                      disabled={index === 0}
                      className="p-1 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-all cursor-pointer active:scale-90"
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMovePlan(index, 'down');
                      }}
                      disabled={index === plans.length - 1}
                      className="p-1 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-all cursor-pointer active:scale-90"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>

                  {/* Icon Container preview */}
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${item.color || 'from-blue-500 to-indigo-600'} text-white shadow-md flex-shrink-0`}>
                    <IconComponent size={22} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-900 truncate">{item.titleKa || 'Unnamed Plan'}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${item.isReady ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        {item.isReady ? 'აქტიური / ჩაშვებული' : 'დაგეგმილი'}
                      </span>
                    </div>
                    <div className="text-slate-400 text-xs font-bold truncate flex items-center gap-1.5 mt-1.5">
                      <span className="text-blue-600 font-black">{item.domain || 'no domain'}</span>
                      <span className="text-slate-300">|</span>
                      <span>ENG: {item.titleEn || '(No Title)'}</span>
                      <span className="text-slate-300">|</span>
                      <span className="bg-slate-50 px-2 py-0.5 rounded text-slate-500 uppercase tracking-widest text-[9px]">TAG: {item.tagKa || 'None'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                    className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${editingId === item.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-blue-50'}`}
                  >
                    {editingId === item.id ? 'დახურვა' : 'ჩასწორება'}
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirmDeleteId === item.id) {
                        handleDeletePlan(item.id);
                      } else {
                        setConfirmDeleteId(item.id);
                      }
                    }}
                    onMouseLeave={() => setConfirmDeleteId(null)}
                    className={`relative z-10 p-4 rounded-2xl transition-all active:scale-95 group cursor-pointer border ${confirmDeleteId === item.id ? 'bg-red-500 text-white border-red-600 px-6' : 'text-red-500 hover:bg-red-50 border-transparent hover:border-red-100'}`}
                  >
                    {confirmDeleteId === item.id ? (
                      <span className="text-xs font-black uppercase tracking-tight">ნამდვილად?</span>
                    ) : (
                      <Trash2 size={24} className="group-hover:scale-110 transition-transform pointer-events-none" />
                    )}
                  </button>
                </div>
              </div>

              {/* Editing Form Expanded */}
              <AnimatePresence>
                {editingId === item.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="border-t border-slate-100 bg-slate-50/50 p-6 md:p-10"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      {/* Georgian Version */}
                      <div className="space-y-4">
                        <h4 className="text-md font-black text-slate-800 border-b border-slate-200/60 pb-2">ქართული ვერსია</h4>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">დასახელება (KA)</label>
                          <input 
                            className="w-full bg-white border-none p-4 rounded-2xl text-md font-bold text-slate-900 shadow-sm"
                            value={item.titleKa || ''}
                            onChange={(e) => handleUpdatePlan(item.id, { titleKa: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">აღწერა (KA)</label>
                          <textarea 
                            className="w-full bg-white border-none p-4 rounded-2xl text-sm font-semibold text-slate-700 shadow-sm h-24 resize-none"
                            value={item.descKa || ''}
                            onChange={(e) => handleUpdatePlan(item.id, { descKa: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ჟანრი / ტეგი (KA)</label>
                          <input 
                            className="w-full bg-white border-none p-4 rounded-2xl text-sm font-semibold text-slate-800 shadow-sm"
                            value={item.tagKa || ''}
                            onChange={(e) => handleUpdatePlan(item.id, { tagKa: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* English Version */}
                      <div className="space-y-4">
                        <h4 className="text-md font-black text-slate-800 border-b border-slate-200/60 pb-2">ინგლისური ვერსია</h4>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Title (EN)</label>
                          <input 
                            className="w-full bg-white border-none p-4 rounded-2xl text-md font-bold text-slate-900 shadow-sm"
                            value={item.titleEn || ''}
                            onChange={(e) => handleUpdatePlan(item.id, { titleEn: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description (EN)</label>
                          <textarea 
                            className="w-full bg-white border-none p-4 rounded-2xl text-sm font-semibold text-slate-700 shadow-sm h-24 resize-none"
                            value={item.descEn || ''}
                            onChange={(e) => handleUpdatePlan(item.id, { descEn: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tag (EN)</label>
                          <input 
                            className="w-full bg-white border-none p-4 rounded-2xl text-sm font-semibold text-slate-800 shadow-sm"
                            value={item.tagEn || ''}
                            onChange={(e) => handleUpdatePlan(item.id, { tagEn: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shared Fields */}
                    <div className="mt-10 pt-8 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      
                      {/* Domain and Direct custom link */}
                      <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">დომენი (მაგ. bus.poti.ge)</label>
                        <input 
                          type="text"
                          className="w-full bg-white border-none p-4 rounded-2xl text-sm font-black text-blue-600 shadow-sm"
                          value={item.domain || ''}
                          onChange={(e) => handleUpdatePlan(item.id, { domain: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ლინკი (სხვა URL, თუ საჭიროა)</label>
                        <div className="relative">
                          <Link2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text"
                            placeholder="https://example.com"
                            className="w-full bg-white border-none pl-4 pr-10 py-4 rounded-2xl text-sm font-semibold text-slate-700 shadow-sm"
                            value={item.link || ''}
                            onChange={(e) => handleUpdatePlan(item.id, { link: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Is Ready toggle status */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">მზადყოფნის სტატუსი</label>
                        <div 
                          onClick={() => handleUpdatePlan(item.id, { isReady: !item.isReady })}
                          className={`w-full p-4 rounded-2xl font-bold text-sm cursor-pointer border flex items-center justify-between transition-all select-none ${
                            item.isReady 
                              ? 'bg-emerald-50/50 text-emerald-700 border-emerald-200 hover:bg-emerald-50' 
                              : 'bg-amber-50/50 text-amber-700 border-amber-200 hover:bg-amber-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${item.isReady ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
                            {item.isReady ? 'მზადაა / აქტიურია' : 'დაგეგმილია (Planned)'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-black ${item.isReady ? 'bg-emerald-600 text-white' : 'bg-amber-500/20 text-amber-800'}`}>
                            {item.isReady ? 'LIVE' : 'WAITING'}
                          </span>
                        </div>
                      </div>

                      {/* Icon Selection */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">აირჩიეთ იქონი</label>
                        <select
                          className="w-full bg-white border-none p-4 rounded-2xl text-sm font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500"
                          value={item.icon || 'Globe'}
                          onChange={(e) => handleUpdatePlan(item.id, { icon: e.target.value })}
                        >
                          <option value="Bus">🚌 ავტობუსი (Bus)</option>
                          <option value="Waves">🌊 ტალღები / საცურაო (Waves)</option>
                          <option value="Wrench">🔧 ხრახნი / სერვისები (Wrench)</option>
                          <option value="Fish">🐟 თევზაობა (Fish)</option>
                          <option value="Gamepad2">🎮 თამაშები / გართობა (Gamepad)</option>
                          <option value="Compass">🧭 კომპასი / ტურიზმი (Compass)</option>
                          <option value="ShoppingBag">🛍️ ჩანთა / მაღაზია (ShoppingBag)</option>
                          <option value="Users">👥 მოქალაქეები / ფორუმი (Users)</option>
                          <option value="Info">ℹ️ ინფორმაცია / ინფო (Info)</option>
                          <option value="Globe">🌐 გლობუსი (Globe)</option>
                          <option value="Lightbulb">💡 ნათურა / იდეები (Lightbulb)</option>
                          <option value="Rocket">🚀 რაკეტა / სტარტაპი (Rocket)</option>
                          <option value="Network">🔌 ქსელი / ბმულები (Network)</option>
                          <option value="Sparkles">✨ ბრჭყვიალები (Sparkles)</option>
                        </select>
                      </div>

                      {/* Color Option Selection */}
                      <div className="space-y-2 col-span-1 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ფერი / გრადიენტი</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <select
                            className="bg-white border-none p-4 rounded-2xl text-sm font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 w-full"
                            value={item.color || 'from-blue-500 to-indigo-600'}
                            onChange={(e) => handleUpdatePlan(item.id, { color: e.target.value })}
                          >
                            {gradientOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          
                          {/* Live preview gradient bar */}
                          <div className={`p-4 rounded-2xl bg-gradient-to-r ${item.color || 'from-blue-500 to-indigo-600'} text-white font-black text-xs flex items-center justify-center border border-white/10 uppercase tracking-widest`}>
                            ვიზუალური პრევიუ 🎨
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
