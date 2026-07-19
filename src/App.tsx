import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageOcrScanner } from './components/ImageOcrScanner';
import { SentenceList } from './components/SentenceList';
import { PassageScanner } from './components/PassageScanner';
import { PassageList } from './components/PassageCard';
import { GeminiConfigModal } from './components/GeminiConfigModal';
import { db } from './services/db';
import type { Sentence, Passage } from './services/db';
import { HelpCircle, BookOpen, FileText } from 'lucide-react';

type Tab = 'sentences' | 'passages';

function App() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('sentences');

  const loadData = () => {
    setSentences(db.getSentences());
    setPassages(db.getPassages());
    setApiKey(db.getApiKey());
  };

  useEffect(() => {
    loadData();
    if (!db.getApiKey()) {
      setIsSettingsOpen(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-japanese-cream text-japanese-charcoal pb-12 transition-colors duration-300">
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        sentenceCount={sentences.length}
        passageCount={passages.length}
        hasApiKey={!!apiKey}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">

        {/* Intro banner */}
        <div className="bg-gradient-to-r from-japanese-red/10 via-japanese-sakura/5 to-transparent border border-japanese-red/10 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-base md:text-lg font-bold text-japanese-red tracking-wide">
              樱花季 · 智能日语学习助手
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
              欢迎使用日语例句学习软件！拍下书本、屏幕或路标上的日语，AI 即可识别整句或整篇短文，提供翻译精讲，并支持朗读练习与衍生例句。
            </p>
          </div>
          <a
            href="https://aistudio.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center space-x-1 text-xs font-bold text-japanese-red bg-white hover:bg-japanese-sakura/5 border border-japanese-sakura/30 px-3.5 py-2 rounded-2xl transition-all"
          >
            <HelpCircle className="h-4 w-4" />
            <span>获取免费 Gemini Key</span>
          </a>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button
            onClick={() => setActiveTab('sentences')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === 'sentences'
                ? 'bg-japanese-red text-white shadow-md shadow-japanese-red/20'
                : 'text-slate-500 hover:text-japanese-charcoal hover:bg-slate-50'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>例句学习</span>
            {sentences.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'sentences' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {sentences.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('passages')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === 'passages'
                ? 'bg-japanese-blue text-white shadow-md shadow-japanese-blue/20'
                : 'text-slate-500 hover:text-japanese-charcoal hover:bg-slate-50'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>范文朗读</span>
            {passages.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'passages' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {passages.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'sentences' ? (
          <>
            <ImageOcrScanner
              apiKey={apiKey}
              onSentencesAdded={loadData}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
            <SentenceList sentences={sentences} onRefresh={loadData} />
          </>
        ) : (
          <>
            <PassageScanner
              apiKey={apiKey}
              onPassageAdded={loadData}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
            {passages.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-600 px-1 flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-japanese-blue" />
                  <span>我的范文库 ({passages.length} 篇)</span>
                </h3>
                <PassageList passages={passages} onRefresh={loadData} />
              </div>
            )}
            {passages.length === 0 && (
              <div className="text-center py-14 text-slate-400 space-y-3">
                <FileText className="h-12 w-12 mx-auto opacity-20" />
                <p className="text-sm font-medium">范文库还是空的</p>
                <p className="text-xs">拍照识别后，范文会保存在这里</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Global Config Modal */}
      <GeminiConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
}

export default App;
