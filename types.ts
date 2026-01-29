
export interface Syllabus {
  title: string;
  objectives: string;
  midTerm: string[];
  endTerm: string[];
}

export interface Session {
  code: string;
  title: string;
  instructor: string;
  time: string;
  room: string;
  color: string;
}

export interface DaySchedule {
  day: string;
  sessions: Session[];
}

export interface UserProfile {
  name: string;
  enrollmentNo: string;
  notes: Record<string, string>; // Key format: Day_Code
}

export interface AIContextSource {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}
