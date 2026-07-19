import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageOcrScanner } from './components/ImageOcrScanner';
import { SentenceList } from './components/SentenceList';
import { GeminiConfigModal } from './components/GeminiConfigModal';
import { db } from './services/db';
import type { Sentence } from './services/db';
import { HelpCircle } from 'lucide-react';

function App() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const loadData = () => {
    setSentences(db.getSentences());
    setApiKey(db.getApiKey());
  };

  useEffect(() => {
    loadData();
    // Open settings by default if no API key is set
    if (!db.getApiKey()) {
      setIsSettingsOpen(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-japanese-cream text-japanese-charcoal pb-12 transition-colors duration-300">
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        sentenceCount={sentences.length}
        hasApiKey={!!apiKey}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Intro banner */}
        <div className="bg-gradient-to-r from-japanese-red/10 via-japanese-sakura/5 to-transparent border border-japanese-red/10 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-base md:text-lg font-bold text-japanese-red tracking-wide flex items-center space-x-1.5">
              <span>樱花季 · 智能日语学习助手</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
              欢迎使用日语例句学习软件！只需用手机拍下书本、屏幕或路标上的日语，谷歌 AI 即可自动帮您识别整句、提供精讲，并由系统带读，支持生成衍生例句助力高效记忆。
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

        {/* OCR Scanner */}
        <ImageOcrScanner
          apiKey={apiKey}
          onSentencesAdded={loadData}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Saved sentences */}
        <SentenceList
          sentences={sentences}
          onRefresh={loadData}
        />
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
