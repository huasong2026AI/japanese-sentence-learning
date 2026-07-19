import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2, VolumeX, Edit2, Trash2, Check, X,
  ChevronDown, ChevronUp, Globe, FileText
} from 'lucide-react';
import { db } from '../services/db';
import type { Passage } from '../services/db';

interface PassageCardProps {
  passage: Passage;
  onUpdate: () => void;
  onDelete: () => void;
}

export const PassageCard: React.FC<PassageCardProps> = ({ passage, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showChinese, setShowChinese] = useState(false);

  // Edit fields
  const [editTitle, setEditTitle] = useState(passage.title);
  const [editJapanese, setEditJapanese] = useState(passage.japanese);
  const [editChinese, setEditChinese] = useState(passage.chinese);
  const [editSource, setEditSource] = useState(passage.source || '');

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Split passage into sentences for highlight-reading
  const sentences = passage.japanese
    .split(/(?<=[。！？\n])/)
    .map(s => s.trim())
    .filter(Boolean);

  // Clean up speech on unmount
  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  const handleReadAll = () => {
    if (!('speechSynthesis' in window)) { alert('您的浏览器不支持语音播放'); return; }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSentenceIdx(null);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang.toLowerCase().startsWith('ja'));

    setIsSpeaking(true);

    // Read sentence by sentence so we can track highlight
    const readSentence = (idx: number) => {
      if (idx >= sentences.length) {
        setIsSpeaking(false);
        setCurrentSentenceIdx(null);
        return;
      }
      setCurrentSentenceIdx(idx);
      const utt = new SpeechSynthesisUtterance(sentences[idx]);
      utt.lang = 'ja-JP';
      utt.rate = 0.82;
      if (jaVoice) utt.voice = jaVoice;
      utt.onend = () => readSentence(idx + 1);
      utt.onerror = () => { setIsSpeaking(false); setCurrentSentenceIdx(null); };
      utteranceRef.current = utt;
      window.speechSynthesis.speak(utt);
    };

    readSentence(0);
  };

  const handleSave = () => {
    db.updatePassage(passage.id, {
      title: editTitle.trim() || '无题范文',
      japanese: editJapanese.trim(),
      chinese: editChinese.trim(),
      source: editSource.trim() || undefined,
    });
    setIsEditing(false);
    onUpdate();
  };

  const handleCancel = () => {
    setEditTitle(passage.title);
    setEditJapanese(passage.japanese);
    setEditChinese(passage.chinese);
    setEditSource(passage.source || '');
    setIsEditing(false);
  };

  return (
    <div className="w-full bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all animate-slide-up space-y-4">
      {isEditing ? (
        /* ── Edit Mode ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-japanese-blue">编辑范文</span>
            <div className="flex space-x-2">
              <button onClick={handleCancel}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
                <X className="h-4 w-4" />
              </button>
              <button onClick={handleSave}
                className="p-1.5 rounded-xl bg-japanese-blue/10 text-japanese-blue hover:bg-japanese-blue hover:text-white transition-all">
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">标题</label>
            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-japanese-blue focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">日语原文</label>
            <textarea rows={6} value={editJapanese} onChange={e => setEditJapanese(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm leading-relaxed resize-none focus:ring-2 focus:ring-japanese-blue focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">中文翻译</label>
            <textarea rows={4} value={editChinese} onChange={e => setEditChinese(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm leading-relaxed resize-none focus:ring-2 focus:ring-japanese-blue focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">来源备注（选填）</label>
            <input type="text" value={editSource} onChange={e => setEditSource(e.target.value)}
              placeholder="如：JLPT N3 / 第3课课文"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-japanese-blue focus:outline-none" />
          </div>
        </div>
      ) : (
        /* ── Read Mode ── */
        <div className="space-y-4">
          {/* Top bar */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-japanese-blue flex-shrink-0" />
                <h3 className="font-bold text-base text-japanese-charcoal leading-tight">{passage.title}</h3>
              </div>
              <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                <span>{new Date(passage.createdAt).toLocaleDateString()}</span>
                {passage.source && (
                  <>
                    <span>·</span>
                    <span className="text-japanese-blue font-medium">{passage.source}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button onClick={handleReadAll}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all ${
                  isSpeaking
                    ? 'bg-japanese-red text-white shadow-md shadow-japanese-red/30 scale-95'
                    : 'bg-japanese-blue/10 text-japanese-blue hover:bg-japanese-blue hover:text-white'
                }`}>
                {isSpeaking
                  ? <><VolumeX className="h-3.5 w-3.5" /><span>停止</span></>
                  : <><Volume2 className="h-3.5 w-3.5" /><span>朗读全文</span></>
                }
              </button>
              <button onClick={() => setIsEditing(true)}
                className="p-1.5 text-slate-400 hover:text-japanese-blue hover:bg-japanese-blue/10 rounded-xl transition-all">
                <Edit2 className="h-4 w-4" />
              </button>
              <button onClick={() => { if (confirm('确认删除这篇范文吗？')) onDelete(); }}
                className="p-1.5 text-slate-400 hover:text-japanese-red hover:bg-japanese-red/10 rounded-xl transition-all">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Japanese text with sentence highlighting */}
          <div className="bg-blue-50/50 border border-blue-100/60 rounded-2xl p-4 leading-loose text-sm md:text-base text-japanese-charcoal font-medium">
            {isSpeaking ? (
              // Sentence-by-sentence highlight mode
              <span>
                {sentences.map((s, i) => (
                  <span key={i}
                    className={`transition-all duration-200 rounded px-0.5 ${
                      i === currentSentenceIdx
                        ? 'bg-japanese-blue/20 text-japanese-blue font-bold underline decoration-japanese-blue/40'
                        : i < (currentSentenceIdx ?? 0)
                        ? 'text-slate-400'
                        : ''
                    }`}>
                    {s}
                  </span>
                ))}
              </span>
            ) : (
              // Normal whitespace-preserved display
              <span style={{ whiteSpace: 'pre-line' }}>{passage.japanese}</span>
            )}
          </div>

          {/* Chinese translation toggle */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <button onClick={() => setShowChinese(v => !v)}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">
              <span className="flex items-center space-x-1.5 text-japanese-green">
                <Globe className="h-4 w-4" />
                <span>中文翻译</span>
              </span>
              {showChinese ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showChinese && (
              <div className="px-4 pb-4 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100/50 whitespace-pre-line bg-white">
                {passage.chinese}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


/* ── Passage List ── */
interface PassageListProps {
  passages: Passage[];
  onRefresh: () => void;
}

export const PassageList: React.FC<PassageListProps> = ({ passages, onRefresh }) => {
  const handleDelete = (id: string) => {
    db.deletePassage(id);
    onRefresh();
  };

  if (passages.length === 0) return null;

  return (
    <div className="space-y-4">
      {passages.map(p => (
        <PassageCard
          key={p.id}
          passage={p}
          onUpdate={onRefresh}
          onDelete={() => handleDelete(p.id)}
        />
      ))}
    </div>
  );
};
