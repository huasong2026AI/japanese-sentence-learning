import React from 'react';
import { BookOpen, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  sentenceCount: number;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, sentenceCount, hasApiKey }) => {
  return (
    <header className="sticky top-0 z-40 w-full glass shadow-sm px-4 py-3 md:px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="bg-japanese-red text-white p-2 rounded-xl shadow-md flex items-center justify-center">
          <BookOpen className="h-5 w-5 md:h-6 md:w-6" />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-japanese-charcoal tracking-wide flex items-center">
            日本語例句学习
          </h1>
          <p className="text-xs text-gray-500">
            拍照识别 · 语法精讲 · 朗读评测
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-japanese-sakura bg-opacity-20 text-japanese-red">
          已保存: {sentenceCount} 句
        </span>
        <button
          onClick={onOpenSettings}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all duration-300 ${
            hasApiKey
              ? 'bg-white hover:bg-japanese-gray border-slate-200 text-japanese-charcoal'
              : 'bg-japanese-red text-white hover:bg-opacity-90 border-transparent shadow-sm shadow-japanese-red/30 animate-pulse'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span className="hidden xs:inline">{hasApiKey ? '设置' : '配置 API Key'}</span>
        </button>
      </div>
    </header>
  );
};
