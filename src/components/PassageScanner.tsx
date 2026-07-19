import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Wand2, RefreshCw, AlertCircle, FileText, Check, Edit3 } from 'lucide-react';
import { db } from '../services/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface PassageScannerProps {
  apiKey: string;
  onPassageAdded: () => void;
  onOpenSettings: () => void;
}

async function extractPassageFromImage(
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<{ japanese: string; chinese: string; title: string }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: db.getModel(),
    generationConfig: { responseMimeType: 'application/json' },
  });

  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const prompt = `
你是一位专业的日语教师。请识别这张图片中的日语短文（可以是文章段落、课文、说明文、小说节选等完整的文字内容），并提供以下内容：

1. 日语原文：原样提取图片中的全部日语文字，保留段落结构和标点符号
2. 中文翻译：流畅自然的整篇中文翻译
3. 标题：根据内容自动生成一个简短的范文标题（不超过15个字）

严格以 JSON 格式返回，不要返回其他内容：
{
  "japanese": "日语原文全文",
  "chinese": "中文翻译全文",
  "title": "范文标题"
}
`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Data, mimeType: mimeType || 'image/jpeg' } },
  ]);
  const text = result.response.text();
  const parsed = JSON.parse(text);
  if (!parsed.japanese) throw new Error('未能识别出日语文字，请确认图片清晰且包含日文内容');
  return parsed;
}

export const PassageScanner: React.FC<PassageScannerProps> = ({
  apiKey, onPassageAdded, onOpenSettings,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extracted & editable result
  const [extracted, setExtracted] = useState<{ japanese: string; chinese: string; title: string } | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editJapanese, setEditJapanese] = useState('');
  const [editChinese, setEditChinese] = useState('');
  const [editSource, setEditSource] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const processImage = (file: File) => {
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 1400;
        let w = img.width, h = img.height;
        if (w > MAX) { h = h * MAX / w; w = MAX; }
        if (h > MAX) { w = w * MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        setImagePreview(canvas.toDataURL(file.type, 0.88));
        setExtracted(null);
        setError(null);
        setSaved(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    if (!apiKey) { setError('请先配置 Gemini API Key'); onOpenSettings(); return; }
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await extractPassageFromImage(imagePreview, imageMime, apiKey);
      setExtracted(result);
      setEditTitle(result.title);
      setEditJapanese(result.japanese);
      setEditChinese(result.chinese);
      setEditSource('');
      setIsEditing(false);
      setSaved(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '识别失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!editJapanese.trim()) return;
    db.addPassage({
      title: editTitle.trim() || '无题范文',
      japanese: editJapanese.trim(),
      chinese: editChinese.trim(),
      source: editSource.trim() || undefined,
    });
    setSaved(true);
    onPassageAdded();
    // Reset after a moment
    setTimeout(() => {
      setImagePreview(null);
      setExtracted(null);
      setSaved(false);
    }, 1200);
  };

  const handleReset = () => {
    setImagePreview(null);
    setExtracted(null);
    setError(null);
    setSaved(false);
  };

  return (
    <div className="w-full bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-md font-bold text-japanese-charcoal flex items-center space-x-2">
          <FileText className="h-5 w-5 text-japanese-blue" />
          <span>拍照识别日语范文</span>
        </h2>
        {imagePreview && !isAnalyzing && (
          <button onClick={handleReset} className="text-xs font-semibold text-japanese-red hover:underline">
            重置
          </button>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
             onChange={e => e.target.files?.[0] && processImage(e.target.files[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
             onChange={e => e.target.files?.[0] && processImage(e.target.files[0])} />

      {/* Image area */}
      {!imagePreview ? (
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-japanese-blue rounded-2xl hover:bg-japanese-blue/5 transition-all group duration-300">
            <Camera className="h-8 w-8 text-slate-400 group-hover:text-japanese-blue mb-2.5 transition-colors" />
            <span className="text-sm font-semibold text-slate-700">手机拍照</span>
            <span className="text-[10px] text-slate-400 mt-1">识别图片中的短文</span>
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-japanese-green rounded-2xl hover:bg-japanese-green/5 transition-all group duration-300">
            <ImageIcon className="h-8 w-8 text-slate-400 group-hover:text-japanese-green mb-2.5 transition-colors" />
            <span className="text-sm font-semibold text-slate-700">导入图片</span>
            <span className="text-[10px] text-slate-400 mt-1">选择本地图片文件</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-[250px] flex items-center justify-center">
            <img src={imagePreview} alt="预览" className="object-contain max-h-[250px] w-full" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-300" />
                <p className="text-sm font-medium">AI 正在识别短文并翻译...</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-3.5 rounded-2xl border border-rose-100 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isAnalyzing && !extracted && (
            <button onClick={handleAnalyze}
              className="w-full flex items-center justify-center space-x-2 bg-japanese-blue hover:bg-opacity-95 text-white py-3 px-4 rounded-2xl font-bold shadow-md shadow-japanese-blue/20 transition-all active:scale-[0.98]">
              <Wand2 className="h-4 w-4" />
              <span>识别并提取短文</span>
            </button>
          )}
        </div>
      )}

      {/* Extracted Result */}
      {extracted && !saved && (
        <div className="space-y-4 pt-2 border-t border-slate-100 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">AI 识别结果</h3>
            <button onClick={() => setIsEditing(e => !e)}
              className="flex items-center space-x-1 text-xs font-semibold text-japanese-blue hover:underline">
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditing ? '收起编辑' : '修改内容'}</span>
            </button>
          </div>

          {/* Title field */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">范文标题</label>
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-japanese-blue focus:outline-none"
            />
          </div>

          {/* Japanese text */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">日语原文</label>
            <textarea
              rows={isEditing ? 6 : 4}
              value={editJapanese}
              onChange={e => setEditJapanese(e.target.value)}
              readOnly={!isEditing}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm leading-relaxed resize-none transition-colors ${
                isEditing
                  ? 'border-japanese-blue focus:ring-2 focus:ring-japanese-blue focus:outline-none bg-white'
                  : 'border-slate-100 bg-slate-50 text-japanese-charcoal cursor-default'
              }`}
            />
          </div>

          {/* Chinese translation */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">中文翻译</label>
            <textarea
              rows={isEditing ? 5 : 3}
              value={editChinese}
              onChange={e => setEditChinese(e.target.value)}
              readOnly={!isEditing}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm leading-relaxed resize-none transition-colors ${
                isEditing
                  ? 'border-japanese-blue focus:ring-2 focus:ring-japanese-blue focus:outline-none bg-white'
                  : 'border-slate-100 bg-slate-50 text-slate-500 cursor-default'
              }`}
            />
          </div>

          {/* Source note */}
          {isEditing && (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">来源备注（选填）</label>
              <input
                type="text"
                value={editSource}
                onChange={e => setEditSource(e.target.value)}
                placeholder="如：JLPT N3 阅读理解 / 第3课课文"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-japanese-blue focus:outline-none"
              />
            </div>
          )}

          <button onClick={handleSave}
            className="w-full flex items-center justify-center space-x-2 bg-japanese-green text-white py-3 px-4 rounded-2xl font-bold shadow-md shadow-japanese-green/20 transition-all active:scale-[0.98] hover:opacity-95">
            <span>加入范文库</span>
          </button>
        </div>
      )}

      {saved && (
        <div className="flex items-center justify-center space-x-2 py-4 text-japanese-green font-bold animate-slide-up">
          <Check className="h-5 w-5" />
          <span>范文已保存！</span>
        </div>
      )}
    </div>
  );
};
