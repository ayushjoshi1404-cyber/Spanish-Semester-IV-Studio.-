
import React, { useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInAnonymously,
  User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  BookOpen, 
  LogOut, 
  ChevronLeft,
  ChevronRight, 
  FileText,
  X,
  MessageCircle,
  ClipboardList,
  Phone,
  Mail,
  ExternalLink,
  Sparkles,
  Send,
  Loader2,
  GraduationCap,
  Notebook,
  Library,
  Layers,
  Plus,
  Trash2,
  FileUp,
  Image as ImageIcon,
  Home,
  Zap,
  Layout,
  Mic,
  Video
} from 'lucide-react';

import { auth, db } from './services/firebase';
import { getStudyAssistantResponse } from './services/gemini';
import { 
  STUDENT_CREDENTIALS, 
  SYLLABUS_DATA, 
  ACADEMIC_CALENDAR, 
  SEMESTER_SCHEDULE, 
  FACULTY_CONTACTS, 
  WHATSAPP_LINKS 
} from './constants';
import { UserProfile, AIContextSource, ChatMessage, Session } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentInput, setEnrollmentInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [sources, setSources] = useState<AIContextSource[]>([]);
  const [activeDay, setActiveDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  
  // Modal states
  const [selectedSession, setSelectedSession] = useState<(Session & { day: string }) | null>(null);
  const [viewingSyllabus, setViewingSyllabus] = useState<string | null>(null);
  const [viewingArchive, setViewingArchive] = useState<string | null>(null);
  const [viewingCalendar, setViewingCalendar] = useState(false);
  const [viewingFaculty, setViewingFaculty] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  
  // Note state
  const [currentNote, setCurrentNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Gemini state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [uploadedImageData, setUploadedImageData] = useState<{ mimeType: string; data: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        signInAnonymously(auth).catch(err => console.error("Auth failed", err));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Use modular doc() and onSnapshot()
    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setUserData(snap.data() as UserProfile);
      }
    });

    // Use modular collection(), query(), orderBy(), and onSnapshot()
    const sourcesRef = collection(db, 'users', user.uid, 'sources');
    const q = query(sourcesRef, orderBy('createdAt', 'desc'));
    const unsubSources = onSnapshot(q, (snap) => {
      setSources(snap.docs.map(d => ({ id: d.id, ...d.data() } as AIContextSource)));
    });

    return () => {
      unsubProfile();
      unsubSources();
    };
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = enrollmentInput.trim();
    if (!STUDENT_CREDENTIALS[id]) {
      setLoginError("Enrollment ID not recognized for Spanish Semester IV.");
      return;
    }
    if (!user) return;

    try {
      // Use modular setDoc()
      await setDoc(doc(db, 'users', user.uid), {
        name: STUDENT_CREDENTIALS[id],
        enrollmentNo: id,
        notes: userData?.notes || {}
      }, { merge: true });
    } catch (err) {
      console.error(err);
      setLoginError("Failed to initialize profile.");
    }
  };

  const saveNote = async () => {
    if (!user || !selectedSession || !userData) return;
    setSavingNote(true);
    const key = `${selectedSession.day}_${selectedSession.code}`;
    try {
      // Use modular setDoc()
      await setDoc(doc(db, 'users', user.uid), {
        notes: { ...userData.notes, [key]: currentNote }
      }, { merge: true });
      setSelectedSession(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendMessage = async (text: string = chatInput) => {
    if (!text.trim() || aiLoading || !userData) return;
    
    const userMsg: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setAiLoading(true);
    setShowTools(false);

    const context = {
      syllabus: JSON.stringify(SYLLABUS_DATA),
      calendar: JSON.stringify(ACADEMIC_CALENDAR),
      notes: JSON.stringify(userData.notes),
      sources: sources.map(s => `${s.name}: ${s.content}`).join('\n')
    };

    try {
      const response = await getStudyAssistantResponse(text, context, uploadedImageData || undefined);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      setUploadedImageData(null);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Assistant is temporarily unavailable." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const data = base64.split(',')[1];
      const mimeType = file.type;
      setUploadedImageData({ mimeType, data });
      setShowTools(false);
    };
    reader.readAsDataURL(file);
  };

  const addNewSource = async (name: string, content: string) => {
    if (!user || !name || !content) return;
    try {
      // Use modular addDoc()
      await addDoc(collection(db, 'users', user.uid, 'sources'), {
        name,
        content,
        createdAt: new Date().toISOString()
      });
      setAddSourceOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSource = async (id: string) => {
    if (!user) return;
    try {
      // Use modular deleteDoc()
      await deleteDoc(doc(db, 'users', user.uid, 'sources', id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Initializing Portal</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#0e0e10] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1a1a1d] border border-slate-800 rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px]"></div>
          <div className="bg-indigo-600/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 border border-indigo-500/20">
            <GraduationCap className="text-indigo-400 w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Student Access</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-12">Spanish • Semester IV</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="text" 
              value={enrollmentInput}
              onChange={(e) => setEnrollmentInput(e.target.value)}
              placeholder="Enrollment ID"
              className="w-full bg-[#0e0e10] border border-slate-800 rounded-2xl py-5 px-8 text-white text-center font-bold text-lg focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
            />
            {loginError && <p className="text-red-400 text-xs font-bold uppercase">{loginError}</p>}
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-3xl shadow-xl transition-all active:scale-95 text-sm uppercase tracking-widest">
              Enter Studio
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-slate-300">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0e0e10]/80 backdrop-blur-xl border-b border-slate-800/50 h-20 flex items-center px-10 justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20">
            <Notebook className="text-white w-6 h-6" />
          </div>
          <h1 className="font-black text-xl text-white tracking-tighter uppercase">SPN-IV <span className="text-indigo-500">STUDIO</span></h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Student</p>
            <p className="text-sm font-black text-white tracking-tight uppercase">{userData.name}</p>
          </div>
          <button 
            onClick={() => setStudioOpen(true)}
            className="flex items-center gap-3 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            <Sparkles className="w-4 h-4" /> AI Assistant
          </button>
          <button 
            onClick={() => auth.signOut().then(() => setUserData(null))}
            className="p-2.5 bg-slate-800/50 hover:bg-red-500/20 hover:text-red-400 border border-slate-700 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-10 py-12">
        {/* DAY SELECTOR */}
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar mb-10">
          {SEMESTER_SCHEDULE.map((d) => (
            <button 
              key={d.day}
              onClick={() => setActiveDay(d.day)}
              className={`px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border transition-all shrink-0 ${
                activeDay === d.day 
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/20' 
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600'
              }`}
            >
              {d.day}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* TIMETABLE SECTION */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
              <Clock className="text-indigo-500" /> Daily Schedule
            </h2>
            
            {SEMESTER_SCHEDULE.find(d => d.day === activeDay)?.sessions.map((session, idx) => (
              <div 
                key={idx}
                className="group relative bg-[#1a1a1d] border border-slate-800/80 rounded-[2.5rem] p-10 shadow-xl transition-all hover:border-indigo-500/40 hover:-translate-y-1"
              >
                <div className={`absolute left-0 top-12 bottom-12 w-1 rounded-full bg-${session.color}-500 shadow-[0_0_15px_rgba(0,0,0,0.5)]`}></div>
                
                <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{session.code}</span>
                    <h3 
                      onClick={() => {
                        setSelectedSession({ ...session, day: activeDay });
                        setCurrentNote(userData.notes[`${activeDay}_${session.code}`] || '');
                      }}
                      className="text-3xl font-black text-white uppercase tracking-tighter leading-none cursor-pointer hover:text-indigo-400 transition-colors"
                    >
                      {session.title}
                    </h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setViewingSyllabus(session.code)}
                      className="p-3 bg-slate-900/80 border border-slate-700 rounded-xl hover:bg-indigo-600 hover:border-indigo-400 text-slate-400 hover:text-white transition-all group"
                      title="View Syllabus"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setViewingArchive(session.code)}
                      className="p-3 bg-slate-900/80 border border-slate-700 rounded-xl hover:bg-emerald-600 hover:border-emerald-400 text-slate-400 hover:text-white transition-all"
                      title="Notes Archive"
                    >
                      <Layers className="w-5 h-5" />
                    </button>
                    <a 
                      href={WHATSAPP_LINKS[session.code] || WHATSAPP_LINKS.OFFICIAL} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-3 bg-slate-900/80 border border-slate-700 rounded-xl hover:bg-emerald-600 hover:border-emerald-400 text-emerald-500 hover:text-white transition-all"
                      title="WhatsApp Group"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Clock className="w-4 h-4 text-indigo-500" /> {session.time}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <UserIcon className="w-4 h-4 text-indigo-500" /> {session.instructor}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <MapPin className="w-4 h-4 text-emerald-500" /> {session.room}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SIDEBAR WIDGETS */}
          <div className="space-y-10">
            {/* AI PROMO */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <Sparkles className="absolute -bottom-4 -right-4 w-48 h-48 text-white/10 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10">
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 leading-none">Gemini Studio</h3>
                <p className="text-indigo-100 text-sm font-medium mb-10 leading-relaxed opacity-80">
                  AI assistant grounded in your notes, syllabus, and academic schedule.
                </p>
                <button 
                  onClick={() => setStudioOpen(true)}
                  className="w-full bg-white text-indigo-700 font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:bg-indigo-50 active:scale-95 transition-all"
                >
                  Enter Lab <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="bg-[#1a1a1d] border border-slate-800 rounded-[2.5rem] p-4 space-y-2">
              <button 
                onClick={() => setViewingCalendar(true)}
                className="w-full flex items-center justify-between p-6 bg-slate-900/50 hover:bg-slate-800 rounded-2xl border border-slate-800/50 transition-all group"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">Academic Calendar</span>
                <CalendarIcon className="w-4 h-4 text-emerald-500" />
              </button>
              <button 
                onClick={() => setViewingFaculty(true)}
                className="w-full flex items-center justify-between p-6 bg-slate-900/50 hover:bg-slate-800 rounded-2xl border border-slate-800/50 transition-all group"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">Faculty Directory</span>
                <BookOpen className="w-4 h-4 text-blue-500" />
              </button>
              <a 
                href={WHATSAPP_LINKS.OFFICIAL} 
                target="_blank" 
                rel="noreferrer"
                className="w-full flex items-center justify-between p-6 bg-slate-900/50 hover:bg-slate-800 rounded-2xl border border-slate-800/50 transition-all group"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">Official Group</span>
                <MessageCircle className="w-4 h-4 text-emerald-500" />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* SYLLABUS MODAL */}
      {viewingSyllabus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-[#1a1a1d] border border-slate-800 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-12 shadow-2xl relative">
            <button onClick={() => setViewingSyllabus(null)} className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white"><X /></button>
            
            <div className="border-l-4 border-indigo-500 pl-8 mb-12">
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">{viewingSyllabus}</p>
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter">{SYLLABUS_DATA[viewingSyllabus]?.title}</h3>
            </div>

            <div className="space-y-12">
              <section className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem]">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Verbatim Objectives</h4>
                <p className="text-xl font-bold text-slate-200 leading-tight">
                  {SYLLABUS_DATA[viewingSyllabus]?.objectives}
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-indigo-500/5 border border-indigo-500/10 p-8 rounded-[2rem]">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Mid-Term Syllabus</h4>
                  <ul className="space-y-4">
                    {SYLLABUS_DATA[viewingSyllabus]?.midTerm.map((item, i) => (
                      <li key={i} className="text-sm font-bold text-slate-300 flex items-start gap-3">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0"></span> {item}
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[2rem]">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-6">End-Term Syllabus</h4>
                  <ul className="space-y-4">
                    {SYLLABUS_DATA[viewingSyllabus]?.endTerm.map((item, i) => (
                      <li key={i} className="text-sm font-bold text-slate-300 flex items-start gap-3">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></span> {item}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTE EDITOR MODAL */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in">
          <div className="bg-[#1a1a1d] border border-slate-800 rounded-[3rem] w-full max-w-2xl p-12 shadow-2xl relative">
            <button onClick={() => setSelectedSession(null)} className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white"><X /></button>
            
            <div className="border-l-4 border-indigo-500 pl-8 mb-10">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">{selectedSession.title}</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Session Notes • {selectedSession.day}</p>
            </div>

            <textarea 
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Record key learning points, homework, and session summaries..."
              className="w-full h-80 bg-[#0e0e10] border border-slate-800 rounded-[2rem] p-10 text-white font-medium text-lg focus:border-indigo-500 transition-all outline-none resize-none placeholder:text-slate-800"
            />

            <div className="flex gap-4 mt-10">
              <button 
                onClick={saveNote}
                disabled={savingNote}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-xs transition-all disabled:opacity-50"
              >
                {savingNote ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-4 h-4" /> Sync Note</>}
              </button>
              <button 
                onClick={() => setSelectedSession(null)}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTES ARCHIVE MODAL */}
      {viewingArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in">
          <div className="bg-[#1a1a1d] border border-slate-800 rounded-[3rem] w-full max-w-3xl max-h-[80vh] overflow-y-auto p-12 shadow-2xl relative">
            <button onClick={() => setViewingArchive(null)} className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white"><X /></button>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-12">Academic Records: {viewingArchive}</h3>
            
            <div className="space-y-6">
              {Object.entries(userData.notes)
                .filter(([k]) => k.endsWith(`_${viewingArchive}`))
                .map(([k, v]) => (
                  <div key={k} className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 group">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{k.split('_')[0]} Session Log</span>
                      <Clock className="w-4 h-4 text-slate-700" />
                    </div>
                    <p className="text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">{v}</p>
                  </div>
                ))}
              {Object.entries(userData.notes).filter(([k]) => k.endsWith(`_${viewingArchive}`)).length === 0 && (
                <div className="text-center py-20 opacity-20">
                  <ClipboardList className="w-20 h-20 mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest">No notes found for this course.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FACULTY MODAL */}
      {viewingFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in overflow-y-auto">
          <div className="bg-[#1a1a1d] border border-slate-800 rounded-[3.5rem] w-full max-w-xl p-16 shadow-2xl relative my-10">
            <button onClick={() => setViewingFaculty(false)} className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white"><X /></button>
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-12 border-b border-slate-800 pb-8">Faculty Directory</h3>
            
            <div className="space-y-10">
              {FACULTY_CONTACTS.map((f, i) => (
                <div key={i} className="group p-1 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-[2.5rem] border border-slate-800 hover:border-indigo-500/30 transition-all">
                  <div className="p-8 space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-indigo-400 border border-slate-800">
                        {f.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-2">{f.name}</h4>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{f.role}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {f.classroom && (
                        <a href={f.classroom} target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-2xl border border-blue-500/20 transition-all font-black text-[10px] uppercase tracking-widest">
                          Google Classroom <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <a href={`tel:${f.phone}`} className="flex items-center gap-5 p-5 bg-[#0e0e10] border border-slate-800 rounded-2xl text-slate-400 font-bold hover:text-white hover:border-emerald-500/30 transition-all">
                        <Phone className="w-5 h-5 text-emerald-500" /> {f.phone}
                      </a>
                      <a href={`mailto:${f.email}`} className="flex items-center gap-5 p-5 bg-[#0e0e10] border border-slate-800 rounded-2xl text-slate-400 font-bold hover:text-white hover:border-indigo-500/30 transition-all text-sm truncate">
                        <Mail className="w-5 h-5 text-indigo-500" /> {f.email}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR MODAL */}
      {viewingCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in">
          <div className="bg-[#1a1a1d] border border-slate-800 rounded-[3rem] w-full max-w-2xl p-16 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button onClick={() => setViewingCalendar(false)} className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white"><X /></button>
            <div className="mb-12">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">Even Semester</p>
              <h3 className="text-5xl font-black text-white uppercase tracking-tighter">Academic Tracker</h3>
            </div>
            
            <div className="space-y-2">
              {ACADEMIC_CALENDAR.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-slate-900/50 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-all group">
                  <span className="font-bold text-slate-300 group-hover:text-white">{item.event}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl ${
                    item.type === 'exam' ? 'bg-red-500/20 text-red-400' : 
                    item.type === 'class' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GEMINI STUDIO MODAL (FULL SCREEN) */}
      {studioOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0e0e10] animate-in slide-in-from-bottom-5 duration-500">
          {/* STUDIO HEADER */}
          <header className="h-20 border-b border-slate-800/50 flex items-center px-10 justify-between bg-[#1a1a1d]/80 backdrop-blur-xl">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setStudioOpen(false)}
                className="p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="h-6 w-px bg-slate-800"></div>
              <div className="flex items-center gap-3">
                <Sparkles className="text-indigo-500 w-5 h-5" />
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Academic Research Studio</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setMessages([])}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
              >
                Reset Canvas
              </button>
              <button 
                onClick={() => setStudioOpen(false)}
                className="p-3 text-slate-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* STUDIO SIDEBAR (SOURCES) */}
            <div className="w-80 border-r border-slate-800/50 flex flex-col hidden lg:flex bg-[#0e0e10]">
              <div className="p-8 border-b border-slate-800/50 flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Context Library</h4>
                <button 
                  onClick={() => setAddSourceOpen(true)}
                  className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center gap-4">
                  <Notebook className="w-6 h-6 text-indigo-500" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Class Notes</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Auto-grounded</p>
                  </div>
                </div>
                <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                  <Library className="w-6 h-6 text-emerald-500" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Official Syllabus</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Verbatim Context</p>
                  </div>
                </div>

                {sources.map(source => (
                  <div key={source.id} className="group relative p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
                    <button 
                      onClick={() => deleteSource(source.id)}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-4">
                      <FileUp className="w-5 h-5 text-slate-600" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate">{source.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{new Date(source.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STUDIO CHAT AREA */}
            <div className="flex-1 flex flex-col relative bg-[#0e0e10]">
              <div className="flex-1 overflow-y-auto p-10 lg:p-20 space-y-12">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-12">
                    <div className="space-y-4">
                      <div className="text-6xl font-black text-white tracking-tighter uppercase leading-none bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                        Research Ready
                      </div>
                      <h1 className="text-3xl font-medium text-slate-400">Ask Gemini anything about Semester IV.</h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      {[
                        { t: "Grammar Guide", p: "Explain the Present Subjunctive and historical tenses for SPC251.", i: <Zap className="text-indigo-400" /> },
                        { t: "Exam Planner", p: "Create a study guide for Mid-terms based on the verbatim syllabus objectives.", i: <ClipboardList className="text-emerald-400" /> },
                        { t: "History Review", p: "Summarize the Mexican Revolution for SPE251 using academic sources.", i: <BookOpen className="text-blue-400" /> },
                        { t: "Audio Script", p: "Generate a 2-minute audio overview script of my class notes.", i: <Mic className="text-red-400" /> }
                      ].map((item, i) => (
                        <button 
                          key={i}
                          onClick={() => handleSendMessage(item.p)}
                          className="bg-[#1a1a1d] border border-slate-800 p-8 rounded-[2rem] text-left hover:border-indigo-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between h-44 shadow-xl"
                        >
                          <div className="bg-[#0e0e10] p-3 rounded-xl w-fit mb-4">{item.i}</div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-white">{item.t}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-12">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                        <div className={`max-w-[85%] p-10 rounded-[3rem] text-xl leading-relaxed shadow-2xl ${
                          msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-[#1a1a1d] border border-slate-800 text-slate-200 rounded-tl-none font-medium'
                        }`}>
                          <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-indigo-400">$1</strong>').replace(/\n/g, '<br/>') }} />
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="flex justify-start">
                        <div className="bg-[#1a1a1d] p-10 rounded-[3rem] flex items-center gap-6 shadow-2xl">
                          <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
                          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Researching...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* FLOATING STUDIO INPUT */}
              <div className="p-12 flex flex-col items-center bg-gradient-to-t from-[#0e0e10] via-[#0e0e10] to-transparent relative">
                {showTools && (
                  <div className="absolute bottom-full mb-6 bg-[#1a1a1d] border border-slate-800 w-full max-w-lg rounded-[2.5rem] p-4 shadow-[0_32px_64px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-4 duration-300 z-50">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-4 p-5 bg-[#0e0e10] hover:bg-slate-800 rounded-2xl cursor-pointer transition-all border border-slate-800">
                        <FileUp className="w-5 h-5 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Ground with Image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </label>
                      <button onClick={() => handleSendMessage("Generate a textual infographic summarizing my notes.")} className="flex items-center gap-4 p-5 bg-[#0e0e10] hover:bg-slate-800 rounded-2xl transition-all border border-slate-800 text-left">
                        <Layout className="w-5 h-5 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Textual Infographic</span>
                      </button>
                      <button onClick={() => handleSendMessage("Create a video storyboard script for these concepts.")} className="flex items-center gap-4 p-5 bg-[#0e0e10] hover:bg-slate-800 rounded-2xl transition-all border border-slate-800 text-left">
                        <Video className="w-5 h-5 text-red-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Video Storyboard</span>
                      </button>
                      <button onClick={() => handleSendMessage("Create 5 practice quiz questions based on the syllabus.")} className="flex items-center gap-4 p-5 bg-[#0e0e10] hover:bg-slate-800 rounded-2xl transition-all border border-slate-800 text-left">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Gen Practice Quiz</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="w-full max-w-3xl relative">
                  {uploadedImageData && (
                    <div className="absolute -top-16 left-0 bg-indigo-600/20 border border-indigo-500/30 px-6 py-2 rounded-full flex items-center gap-4 shadow-2xl">
                      <ImageIcon className="w-4 h-4 text-indigo-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Image Resource Buffered</span>
                      <button onClick={() => setUploadedImageData(null)} className="text-red-400"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                  <div className="flex items-center gap-6 bg-[#1a1a1d] border-2 border-slate-800/80 rounded-[3rem] p-4 px-10 shadow-2xl focus-within:border-indigo-500/50 transition-all">
                    <button 
                      onClick={() => setShowTools(!showTools)}
                      className={`p-3 rounded-full transition-all ${showTools ? 'bg-indigo-600 text-white rotate-45' : 'hover:bg-slate-800 text-indigo-400'}`}
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                    <input 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask Gemini Studio..."
                      className="flex-1 bg-transparent text-white font-medium text-xl outline-none placeholder:text-slate-700"
                    />
                    <button 
                      onClick={() => handleSendMessage()}
                      disabled={aiLoading}
                      className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full active:scale-90 shadow-xl disabled:opacity-50"
                    >
                      {aiLoading ? <Loader2 className="animate-spin" /> : <Send className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD SOURCE MODAL */}
      {addSourceOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in fade-in">
          <div className="bg-[#1a1a1d] border border-slate-800 rounded-[3.5rem] w-full max-w-xl p-16 shadow-2xl relative">
            <button onClick={() => setAddSourceOpen(false)} className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white"><X /></button>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-12">Index New Source</h3>
            
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Source Title</label>
                <input 
                  id="sourceName"
                  placeholder="e.g., Historical Background of Porfiriato"
                  className="w-full bg-[#0e0e10] border border-slate-800 rounded-2xl p-6 text-white font-bold outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Context / Data</label>
                <textarea 
                  id="sourceContent"
                  placeholder="Paste verbatim text content here..."
                  className="w-full h-64 bg-[#0e0e10] border border-slate-800 rounded-3xl p-8 text-white font-medium outline-none focus:border-indigo-500 transition-all resize-none"
                />
              </div>
              <button 
                onClick={() => {
                  const n = (document.getElementById('sourceName') as HTMLInputElement).value;
                  const c = (document.getElementById('sourceContent') as HTMLTextAreaElement).value;
                  addNewSource(n, c);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-3xl shadow-xl transition-all uppercase tracking-widest text-xs"
              >
                Sync with AI Library
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
