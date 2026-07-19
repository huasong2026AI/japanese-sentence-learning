import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Check, Eye, EyeOff, Cpu } from 'lucide-react';
import { db } from '../services/db';

interface GeminiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const GeminiConfigModal: React.FC<GeminiConfigModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite');
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  const MODELS = [
    { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite',  desc: '✅ 可用 · 最新轻量版，额度宽裕（默认推荐）' },
    { id: 'gemini-2.0-flash',      label: 'Gemini 2 Flash',         desc: '✅ 可用 · 速度快，额度充足' },
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2 Flash Lite',    desc: '✅ 可用 · 最轻量，响应最快' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite',  desc: '✅ 可用 · 2.5 轻量版，额度较多' },
    { id: 'gemini-2.5-flash',      label: 'Gemini 2.5 Flash',       desc: '🔴 每日限额已超（当前超限，不推荐）' },
    { id: 'gemini-2.5-pro',        label: 'Gemini 2.5 Pro',         desc: '⚠️ 最强模型，每日额度有限' },
  ];

  useEffect(() => {
    if (isOpen) {
      setApiKey(db.getApiKey());
      setSelectedModel(db.getModel());
      setIsSavedSuccessfully(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.setApiKey(apiKey);
    db.setModel(selectedModel);
    setIsSavedSuccessfully(true);
    onSaved();
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-md bg-japanese-cream rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 animate-slide-up">
        
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="bg-japanese-blue text-white p-2 rounded-xl">
              <Key className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-japanese-charcoal">Gemini API 配置</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Google Gemini API Key
            </label>
            <div className="relative rounded-2xl shadow-sm">
              <input
                id="apiKey"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-japanese-blue focus:border-transparent transition-all pr-12 text-japanese-charcoal bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <span className="inline-flex items-center space-x-1"><Cpu className="h-3.5 w-3.5" /><span>选择 AI 模型</span></span>
            </label>
            <div className="space-y-2">
              {MODELS.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedModel === m.id
                      ? 'bg-japanese-blue bg-opacity-5 border-japanese-blue'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={m.id}
                    checked={selectedModel === m.id}
                    onChange={() => setSelectedModel(m.id)}
                    className="mt-0.5 accent-japanese-blue"
                  />
                  <div>
                    <p className={`text-sm font-semibold ${ selectedModel === m.id ? 'text-japanese-blue' : 'text-japanese-charcoal' }`}>{m.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed">
            <p className="mb-2 font-medium text-slate-600">说明：</p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>API Key 仅保存在您本地浏览器的 LocalStorage 中，不会上传至第三方服务器。</li>
              <li>使用 Google Gemini 2.5 Flash 提取日语例句，目前提供充足的免费额度。</li>
            </ol>
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3.5 inline-flex items-center text-japanese-blue font-semibold hover:underline"
            >
              获取免费的 Gemini API Key <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSavedSuccessfully}
              className={`min-w-[100px] flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-sm transition-all duration-300 ${
                isSavedSuccessfully
                  ? 'bg-emerald-500 text-white shadow-emerald-100'
                  : 'bg-japanese-blue text-white hover:bg-opacity-95 hover:shadow-md hover:shadow-japanese-blue/20'
              }`}
            >
              {isSavedSuccessfully ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>已保存</span>
                </>
              ) : (
                <span>保存配置</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
