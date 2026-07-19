import React, { useState } from 'react';
import { Volume2, Edit2, Trash2, Check, X, BookOpen, Layers, Plus, Minimize2, Maximize2 } from 'lucide-react';
import { generateId } from '../services/db';
import type { Sentence, DerivedSentence } from '../services/db';

interface SentenceCardProps {
  sentence: Sentence;
  onUpdate: (id: string, updatedFields: Partial<Sentence>) => void;
  onDelete: (id: string) => void;
}

export const SentenceCard: React.FC<SentenceCardProps> = ({ sentence, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showGrammar, setShowGrammar] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);

  // Form states for editing
  const [editJapanese, setEditJapanese] = useState(sentence.japanese);
  const [editChinese, setEditChinese] = useState(sentence.chinese);
  const [editGrammar, setEditGrammar] = useState(sentence.grammar);
  const [editDerived, setEditDerived] = useState<DerivedSentence[]>(sentence.derived);

  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) {
      alert('您的浏览器不支持语音播放');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85; // Slightly slower for language learners

    // Find a Japanese voice if possible
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang.toLowerCase().includes('ja'));
    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    utterance.onstart = () => setIsSpeaking(id);
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    onUpdate(sentence.id, {
      japanese: editJapanese.trim(),
      chinese: editChinese.trim(),
      grammar: editGrammar.trim(),
      derived: editDerived.filter(d => d.japanese.trim() !== '')
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditJapanese(sentence.japanese);
    setEditChinese(sentence.chinese);
    setEditGrammar(sentence.grammar);
    setEditDerived(sentence.derived);
    setIsEditing(false);
  };

  const handleUpdateDerived = (id: string, field: 'japanese' | 'chinese', value: string) => {
    setEditDerived(prev =>
      prev.map(d => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleDeleteDerived = (id: string) => {
    setEditDerived(prev => prev.filter(d => d.id !== id));
  };

  const handleAddDerived = () => {
    setEditDerived(prev => [
      ...prev,
      { id: generateId(), japanese: '', chinese: '' }
    ]);
  };

  return (
    <div className="w-full bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md animate-slide-up space-y-4">
      {/* Edit Mode */}
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-japanese-blue">编辑句子卡片</span>
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                title="取消"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={handleSave}
                className="p-1.5 rounded-xl bg-japanese-blue bg-opacity-10 text-japanese-blue hover:bg-japanese-blue hover:text-white transition-all"
                title="保存"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">日语原文</label>
              <input
                type="text"
                value={editJapanese}
                onChange={e => setEditJapanese(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-japanese-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">中文翻译</label>
              <input
                type="text"
                value={editChinese}
                onChange={e => setEditChinese(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-japanese-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">语法讲解</label>
              <textarea
                rows={3}
                value={editGrammar}
                onChange={e => setEditGrammar(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-japanese-blue focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-400">派生例句</label>
                <button
                  type="button"
                  onClick={handleAddDerived}
                  className="text-xs text-japanese-blue hover:underline flex items-center space-x-1 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>添加派生例句</span>
                </button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {editDerived.map((d, index) => (
                  <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 relative pr-10">
                    <input
                      type="text"
                      placeholder={`派生日语例句 ${index + 1}`}
                      value={d.japanese}
                      onChange={e => handleUpdateDerived(d.id, 'japanese', e.target.value)}
                      className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-japanese-blue"
                    />
                    <input
                      type="text"
                      placeholder="例句中文翻译"
                      value={d.chinese}
                      onChange={e => handleUpdateDerived(d.id, 'chinese', e.target.value)}
                      className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-japanese-blue"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteDerived(d.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Read-only Mode */
        <div className="space-y-4">
          {/* Action Row */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {new Date(sentence.createdAt).toLocaleDateString()}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-slate-400 hover:text-japanese-blue hover:bg-japanese-blue hover:bg-opacity-10 rounded-xl transition-all"
                title="修改"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm('确认删除这个句子吗？')) {
                    onDelete(sentence.id);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-japanese-red hover:bg-japanese-red hover:bg-opacity-10 rounded-xl transition-all"
                title="删除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Main Sentence and Speech synthesis */}
          <div className="flex items-start justify-between space-x-3 bg-japanese-sakura bg-opacity-5 p-4 rounded-2xl border border-japanese-sakura border-opacity-20">
            <div className="space-y-1.5 flex-1">
              <p className="text-base md:text-lg font-bold text-japanese-charcoal tracking-wide font-sans">
                {sentence.japanese}
              </p>
              <p className="text-sm text-slate-600 font-medium">
                {sentence.chinese}
              </p>
            </div>
            <button
              onClick={() => handleSpeak(sentence.japanese, sentence.id)}
              className={`p-2.5 rounded-2xl flex items-center justify-center transition-all ${
                isSpeaking === sentence.id
                  ? 'bg-japanese-red text-white scale-95 shadow-md shadow-japanese-red/20'
                  : 'bg-white hover:bg-slate-100 text-japanese-red border border-slate-200'
              }`}
              title="朗读"
            >
              <Volume2 className={`h-5 w-5 ${isSpeaking === sentence.id ? 'animate-bounce' : ''}`} />
            </button>
          </div>

          {/* Collapsible Grammar and Key Vocabs */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
            <button
              onClick={() => setShowGrammar(!showGrammar)}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center space-x-1.5 text-japanese-green">
                <BookOpen className="h-4 w-4" />
                <span>语法解析与要点</span>
              </span>
              {showGrammar ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
            
            {showGrammar && (
              <div className="px-4 pb-4 pt-1 text-sm text-slate-700 leading-relaxed border-t border-slate-100/50 whitespace-pre-line font-medium bg-white">
                {sentence.grammar}
              </div>
            )}
          </div>

          {/* Derived Sentences */}
          {sentence.derived && sentence.derived.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5">
                <Layers className="h-3.5 w-3.5 text-japanese-blue" />
                <span>AI 派生例句</span>
              </span>
              <div className="space-y-2">
                {sentence.derived.map((der) => (
                  <div
                    key={der.id}
                    className="group flex items-start justify-between bg-slate-50 border border-slate-100 hover:border-slate-200 p-3 rounded-2xl transition-all"
                  >
                    <div className="space-y-0.5 flex-1 pr-2">
                      <p className="text-xs md:text-sm font-bold text-japanese-charcoal tracking-wide font-sans">
                        {der.japanese}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {der.chinese}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSpeak(der.japanese, der.id)}
                      className={`p-1.5 rounded-lg flex items-center justify-center opacity-70 group-hover:opacity-100 transition-all ${
                        isSpeaking === der.id
                          ? 'bg-japanese-blue text-white'
                          : 'bg-white text-japanese-blue border border-slate-200'
                      }`}
                      title="朗读派生句"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
