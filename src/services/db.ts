export interface DerivedSentence {
  id: string;
  japanese: string;
  chinese: string;
}

export function generateId(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export interface Sentence {
  id: string;
  japanese: string;
  chinese: string;
  grammar: string;
  derived: DerivedSentence[];
  createdAt: number;
}

export interface Passage {
  id: string;
  title: string;       // user-editable title
  japanese: string;    // full Japanese passage text
  chinese: string;     // Chinese translation (AI generated)
  source?: string;     // optional source note (e.g. "JLPT N3 reading passage")
  createdAt: number;
}

const SENTENCES_KEY = 'jp_learning_sentences';
const PASSAGES_KEY  = 'jp_learning_passages';
const API_KEY_KEY = 'jp_learning_api_key';
const MODEL_KEY = 'jp_learning_model';

export const db = {
  // --- Sentences CRUD ---
  getSentences(): Sentence[] {
    try {
      const data = localStorage.getItem(SENTENCES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load sentences', e);
      return [];
    }
  },

  saveSentences(sentences: Sentence[]): void {
    try {
      localStorage.setItem(SENTENCES_KEY, JSON.stringify(sentences));
    } catch (e) {
      console.error('Failed to save sentences', e);
    }
  },

  addSentence(sentence: Omit<Sentence, 'id' | 'createdAt'>): Sentence {
    const sentences = this.getSentences();
    const newSentence: Sentence = {
      ...sentence,
      id: generateId(),
      createdAt: Date.now(),
    };
    sentences.unshift(newSentence); // Add to the beginning of list
    this.saveSentences(sentences);
    return newSentence;
  },

  updateSentence(id: string, updatedFields: Partial<Omit<Sentence, 'id' | 'createdAt'>>): void {
    const sentences = this.getSentences();
    const index = sentences.findIndex(s => s.id === id);
    if (index !== -1) {
      sentences[index] = { ...sentences[index], ...updatedFields };
      this.saveSentences(sentences);
    }
  },

  deleteSentence(id: string): void {
    const sentences = this.getSentences();
    const filtered = sentences.filter(s => s.id !== id);
    this.saveSentences(filtered);
  },

  // --- Import / Export ---
  exportToJson(): string {
    const sentences = this.getSentences();
    return JSON.stringify(sentences, null, 2);
  },

  importFromJson(jsonStr: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) {
        return { success: false, count: 0, error: '导入的格式必须是数组' };
      }
      
      // Clean and validate
      const validSentences: Sentence[] = [];
      for (const item of parsed) {
        if (typeof item.japanese === 'string' && typeof item.chinese === 'string') {
          validSentences.push({
            id: item.id || generateId(),
            japanese: item.japanese,
            chinese: item.chinese,
            grammar: item.grammar || '暂无语法解析',
            derived: Array.isArray(item.derived)
              ? item.derived.map((d: any) => ({
                  id: d.id || generateId(),
                  japanese: d.japanese || '',
                  chinese: d.chinese || '',
                }))
              : [],
            createdAt: item.createdAt || Date.now(),
          });
        }
      }

      // Merge by adding unique items based on japanese sentence content
      const existing = this.getSentences();
      const existingJapanese = new Set(existing.map(s => s.japanese.trim()));
      
      let addedCount = 0;
      const merged = [...existing];
      
      for (const s of validSentences) {
        if (!existingJapanese.has(s.japanese.trim())) {
          merged.unshift(s);
          addedCount++;
        }
      }

      this.saveSentences(merged);
      return { success: true, count: addedCount };
    } catch (e) {
      return { success: false, count: 0, error: e instanceof Error ? e.message : '文件解析失败' };
    }
  },

  // --- API Key ---
  getApiKey(): string {
    return localStorage.getItem(API_KEY_KEY) || '';
  },

  setApiKey(key: string): void {
    localStorage.setItem(API_KEY_KEY, key.trim());
  },

  // --- Model Selection ---
  getModel(): string {
    return localStorage.getItem(MODEL_KEY) || 'gemini-3.1-flash-lite';
  },

  setModel(model: string): void {
    localStorage.setItem(MODEL_KEY, model);
  },

  // --- Passages (范文) CRUD ---
  getPassages(): Passage[] {
    try {
      const data = localStorage.getItem(PASSAGES_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  savePassages(passages: Passage[]): void {
    try {
      localStorage.setItem(PASSAGES_KEY, JSON.stringify(passages));
    } catch {}
  },

  addPassage(passage: Omit<Passage, 'id' | 'createdAt'>): Passage {
    const passages = this.getPassages();
    const newPassage: Passage = {
      ...passage,
      id: generateId(),
      createdAt: Date.now(),
    };
    passages.unshift(newPassage);
    this.savePassages(passages);
    return newPassage;
  },

  updatePassage(id: string, updatedFields: Partial<Omit<Passage, 'id' | 'createdAt'>>): void {
    const passages = this.getPassages();
    const idx = passages.findIndex(p => p.id === id);
    if (idx !== -1) {
      passages[idx] = { ...passages[idx], ...updatedFields };
      this.savePassages(passages);
    }
  },

  deletePassage(id: string): void {
    this.savePassages(this.getPassages().filter(p => p.id !== id));
  },
};
