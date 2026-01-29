
import { DaySchedule, Syllabus } from './types';

export const STUDENT_CREDENTIALS: Record<string, string> = {
  "2446001": "ADITI BHATT", "2446002": "ADITI BUTOLA", "2446003": "ADITI GHILDIYAL",
  "2446004": "Anshika", "2446005": "ARADHNA UNIYAL", "2446006": "AYESHA RAWAT",
  "2446007": "DEEPALI SINGH", "2446008": "DIYA BAUNTHIYAL", "2446009": "DIYA MAMGAIN",
  "2446010": "HANSIKA DEVRANI", "2446011": "KASHISH AAGRI", "2446012": "KRITIKA LOHANI",
  "2446013": "Mehak", "2446014": "PARIDHI SEMWAL", "2446015": "SAPNA",
  "2446016": "SHIVANGI ARYAN", "2446017": "SONALI", "2446018": "VAISHNVI RAWAT",
  "2446019": "AAYUSH RAWAT", "2446020": "ADITYA SINGH", "2446021": "ADITYA YADAV",
  "2446022": "AJAY JASWAN", "2446023": "AKSHAT BAHUGUNA", "2446024": "ANSHUL SINGH",
  "2446026": "AYUSH JOSHI", "2446027": "GAURAV KUMAR", "2446028": "RAJ KUNWAR",
  "2446030": "ROHIT SINGH", "2446032": "TARUN BISHT", "2446033": "YASH UPADHYAY"
};

export const SYLLABUS_DATA: Record<string, Syllabus> = {
  "SPC251": { 
    title: "Spanish in Context: Reading & Writing-II", 
    objectives: "To enable the learner to read and understand texts in future tense; write texts and answer questions based on texts; use subjunctive mood in present.",
    midTerm: ["Unit I & II: Reading and understanding texts in simple future.", "Unit III & IV: Monologue and dialogue writing in simple future."],
    endTerm: ["Unit V: Reading to understand texts in Present Subjunctive.", "Unit VI: Writing using Present Subjunctive.", "Unit VII & VIII: Life in Spain and Spanish speaking countries."]
  },
  "SPC252": { 
    title: "Spanish in Context: Listening & Speaking-II", 
    objectives: "To enable the learner to listen and understand texts in future tense; talk and answer questions based on texts; use subjunctive mood in present.",
    midTerm: ["Unit I & II: Listening and understanding texts in simple future.", "Unit III & IV: Monologue and dialogue speaking in simple future."],
    endTerm: ["Unit V: Listening to understand Present Subjunctive.", "Unit VI: Speaking and answering questions using Present Subjunctive.", "Unit VII & VIII: Life in Spain and Spanish speaking countries."]
  },
  "SPC253": { 
    title: "Spanish through Texts: Cultural Competence-II", 
    objectives: "To enable the learner to read and understand literary and cultural texts adapted for B2 level; reflect on how culture shapes language; apply cultural knowledge in context.",
    midTerm: ["Unit 1: Landmarks (Architectural and Geographic).", "Unit 2: Movements (Renaissance, Baroque, Modernism).", "Unit 3: Selection of key writers.", "Unit 4: Level-based texts."],
    endTerm: ["Unit 5: Socio-economic situation of Spanish World.", "Unit 6: Selection of idiomatic expressions.", "Unit 7: Audio-visual texts (theater, dance, etc.).", "Unit 8: Intercultural communication."]
  },
  "SPE251": { 
    title: "Intro to History of Spanish Speaking World-II", 
    objectives: "Introductory knowledge about 19th and 20th-century history of Spain and Latin America.",
    midTerm: ["Unit I: Napoleonic Invasion & Constitution of Cádiz.", "Unit II: Emancipation of colonies (Liberators).", "Unit III: Conservatives vs Liberals.", "Unit IV: Caudillismo and Porfiriato."],
    endTerm: ["Unit V: Mexican Revolution.", "Unit VI: Spanish Civil War & Francoism.", "Unit VII: Cuban Revolution & Cold War.", "Unit VIII: Contemporary Spain (EU transition)."]
  },
  "SPS251": { 
    title: "Spanish through Audio-visual Texts-IV", 
    objectives: "Acquiring Listening, Analytical and Communicative skills through media adapted for B1.1 level.",
    midTerm: ["Unit I: Dreams and improbable plans (Conditional).", "Unit II: Opinions (porque, ya que, puesto que)."],
    endTerm: ["Unit III: Expressing Emotions (Subjunctive).", "Unit IV: Agreement/Disagreement (Subjunctive)."]
  }
};

export const ACADEMIC_CALENDAR = [
  { event: "Registration & Fee Payment", date: "Jan 15 - Jan 20, 2026", type: "admin" },
  { event: "Commencement of Classes", date: "15th January, 2026", type: "class" },
  { event: "Notification of PhD Admission", date: "16th February, 2026", type: "admin" },
  { event: "Mid Semester Exam", date: "March 09 - March 16, 2026", type: "exam" },
  { event: "Practical Exams / Viva Voce", date: "May 11 - May 14, 2026", type: "exam" },
  { event: "Teaching Ends", date: "14th May, 2026", type: "class" },
  { event: "Semester Final Examination", date: "May 15 - May 30, 2026", type: "exam" },
  { event: "Declaration of Result", date: "10th June, 2026", type: "admin" }
];

export const SEMESTER_SCHEDULE: DaySchedule[] = [
  { day: "Monday", sessions: [{ code: "SPE251", title: "History of Spanish Speaking World-II", instructor: "Shreya Rawat", time: "10:00 AM - 12:00 PM", room: "307, LHC", color: "blue" }, { code: "SPC252", title: "Listening & Speaking-II", instructor: "Ana Rived Singh", time: "12:00 PM - 02:00 PM", room: "307, LHC", color: "emerald" }] },
  { day: "Tuesday", sessions: [{ code: "SPC251", title: "Reading & Writing-II", instructor: "Amrit Goyal", time: "10:00 AM - 12:00 PM", room: "307, LHC", color: "orange" }, { code: "SPE251", title: "History of Spanish Speaking World-II", instructor: "Shreya Rawat", time: "12:00 PM - 02:00 PM", room: "307, LHC", color: "blue" }] },
  { day: "Wednesday", sessions: [{ code: "SPC253", title: "Cultural Competence-II", instructor: "Shreya Rawat", time: "10:00 AM - 12:00 PM", room: "307, LHC", color: "purple" }, { code: "SPC252", title: "Listening & Speaking-II", instructor: "Ana Rived Singh", time: "12:00 PM - 02:00 PM", room: "307, LHC", color: "emerald" }] },
  { day: "Thursday", sessions: [{ code: "SPC253", title: "Cultural Competence-II", instructor: "Shreya Rawat", time: "10:00 AM - 12:00 PM", room: "307, LHC", color: "purple" }, { code: "SPC251", title: "Reading & Writing-II", instructor: "Amrit Goyal", time: "12:00 PM - 02:00 PM", room: "307, LHC", color: "orange" }] },
  { day: "Friday", sessions: [{ code: "SPS251", title: "Audio-visual Texts-IV", instructor: "Ana Rived Singh", time: "12:00 PM - 02:00 PM", room: "307, LHC", color: "cyan" }] }
];

export const FACULTY_CONTACTS = [
  { name: "Amrit Goyal", role: "Assistant Professor", phone: "+91 99101 67527", email: "amrit.goyal@doon.ac.in", classroom: "https://classroom.google.com/c/Nzk5Nzc4MzEwMTA5" },
  { name: "Shreya Rawat", role: "Assistant Professor", phone: "+91 88009 58182", email: "shreya.rawat@doon.ac.in", classroom: "https://classroom.google.com/c/ODE2NzY5MDgwODQ4" },
  { name: "Ana Rived Singh", role: "Assistant Professor", phone: "+91 83949 28860", email: "ana.rived@doon.ac.in", classroom: null }
];

export const WHATSAPP_LINKS: Record<string, string> = {
  OFFICIAL: "https://chat.whatsapp.com/DFdL3s7ZCaG2AvGBEti2ZI",
  SPE251: "https://chat.whatsapp.com/JE1pRuMv5aI0mkNzo2bG34",
  SPC253: "https://chat.whatsapp.com/J8EWupjYVYdKhYxtYjQaqt",
  SPC251: "https://chat.whatsapp.com/J3b0973gxcuIStG63bQFFK",
  SPC252: "https://chat.whatsapp.com/JXuoATh92RbCsVTzF4sZEE",
  SPS251: "https://chat.whatsapp.com/JXuoATh92RbCsVTzF4sZEE"
};
