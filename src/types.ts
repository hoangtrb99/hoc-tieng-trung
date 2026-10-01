// Kieu du lieu giao trinh phien am (trich tu ban HTML goc)
export interface Example {
  p: string; // pinyin
  h: string; // chu Han
}

export interface TheoryItem {
  s: string; // ky hieu / mo ta thanh mau, van mau
  v?: string; // cach doc gan dung
  t?: string; // meo / ghi chu
  a?: Example[]; // vi du minh hoa
}

export interface TheorySection {
  h: string; // tieu de nhom
  x: TheoryItem[];
}

export interface DrillItem {
  p: string; // pinyin viet
  h: string | null; // chu Han tuong ung (null = am hiem, khong co mau)
  r?: string; // cach doc thuc te sau bien dieu (vd thanh 3+3)
  sy?: string[]; // tach am tiet (cho cum nhieu chu, cham diem nhan dang giong noi)
}

export interface Drill {
  h: string; // tieu de nhom luyen doc
  x: DrillItem[];
}

export interface GridCell {
  s: string; // am tiet (vd "ba")
  t: (string | null)[]; // 4 chu Han theo 4 thanh, null = khong ton tai
  tp: string[]; // 4 pinyin co dau tuong ung
}

export interface GridRow {
  i: string; // thanh mau dau dong (vd "b")
  c: (GridCell | null)[]; // theo tung van mau cot
}

export interface LessonGrid {
  cols: string[];
  rows: GridRow[];
}

export interface Poem {
  t: string; // tieu de
  l: [string, string][]; // [pinyin, chu Han] moi dong
}

export interface Lesson {
  id: string;
  title: string;
  sub: string;
  theory: TheorySection[];
  grid: LessonGrid | null;
  drills: Drill[];
  pairs?: [DrillItem, DrillItem][];
  poems?: Poem[];
  toneDrill?: boolean;
  markQuiz?: boolean;
}

// ----- Tu vung (module SRS) -----
export interface VocabEntry {
  hz: string;
  py: string;
  vi: string;
  lv: 0 | 1 | 2; // 0 = cau giao tiep, 1 = HSK1, 2 = HSK2
}

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface CardProgress {
  ease: number; // SM-2 ease factor (>=1.3)
  intervalDays: number;
  due: number; // epoch ms
  reps: number;
  lapses: number;
  lastGrade?: Grade;
  lastReview?: number;
}

export type QuizType = 'listen' | 'tone' | 'pair' | 'mark' | 'sandhi';

export interface Question {
  type: QuizType;
  x: DrillItem;
  opts?: DrillItem[]; // listen/pair/mark/sandhi
  ans?: number; // tone (1-4)
}

export interface QuizState {
  scope: 'lesson' | 'done' | 'all' | 'missed';
  qs: Question[];
  i: number;
  score: number;
  answered: string | null;
  lastOk?: boolean;
}
