import React, { useRef, useState } from 'react';
import { Download, Upload, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { db } from '../services/db';
import type { Sentence } from '../services/db';
import { SentenceCard } from './SentenceCard';

interface SentenceListProps {
  sentences: Sentence[];
  onRefresh: () => void;
}

export const SentenceList: React.FC<SentenceListProps> = ({ sentences, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [importStatus, setImportStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const dataStr = db.exportToJson();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      // Name the exported file with the current date
      const date = new Date().toISOString().split('T')[0];
      link.download = `japanese_sentences_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('导出失败');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const res = db.importFromJson(result);
          if (res.success) {
            setImportStatus({ success: true, msg: `导入成功！新增了 ${res.count} 个句子。` });
            onRefresh();
          } else {
            setImportStatus({ success: false, msg: res.error || '导入失败，请检查文件格式。' });
          }
          // Clear status after 3 seconds
          setTimeout(() => setImportStatus(null), 4000);
        }
      };
      reader.readAsText(file);
      // Reset input value to allow selecting same file again
      e.target.value = '';
    }
  };

  const triggerImport = () => fileInputRef.current?.click();

  const handleUpdate = (id: string, updatedFields: Partial<Sentence>) => {
    db.updateSentence(id, updatedFields);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    db.deleteSentence(id);
    onRefresh();
  };

  // Filter sentences based on search input (checks Japanese, Chinese, or Grammar)
  const filteredSentences = sentences.filter(
    (s) =>
      s.japanese.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.chinese.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.grammar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Import / Export & Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        
        {/* Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-50">
          <div>
            <h2 className="text-md font-bold text-japanese-charcoal">我的日语学习库</h2>
            <p className="text-xs text-slate-400 font-medium">保存的学习例句与语法积淀</p>
          </div>
          
          <div className="flex items-center space-x-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
            
            <button
              onClick={triggerImport}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
              title="导入学习库 (JSON 文件)"
            >
              <Upload className="h-4 w-4" />
              <span>导入数据</span>
            </button>
            
            <button
              onClick={handleExport}
              disabled={sentences.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] disabled:active:scale-100 transition-all cursor-pointer"
              title="导出学习库备份"
            >
              <Download className="h-4 w-4" />
              <span>导出数据</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative rounded-2xl shadow-sm">
          <input
            type="text"
            placeholder="搜索日语原文、翻译或语法关键词..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-japanese-blue focus:border-transparent transition-all text-japanese-charcoal bg-slate-50"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>

        {/* Import Message Status */}
        {importStatus && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center space-x-2 animate-slide-up ${
              importStatus.success
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}
          >
            {importStatus.success ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="font-semibold">{importStatus.msg}</span>
          </div>
        )}
      </div>

      {/* List */}
      {filteredSentences.length > 0 ? (
        <div className="space-y-4">
          {filteredSentences.map((sentence) => (
            <SentenceCard
              key={sentence.id}
              sentence={sentence}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white py-12 px-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
          <div className="bg-slate-50 text-slate-400 p-4 rounded-full">
            <Search className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-600">未找到相关句子</h3>
            <p className="text-xs text-slate-400">
              {searchTerm ? '尝试更换搜索词或重置搜索条件' : '快去上面拍照或上传图片识别一些日语句子吧！'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
