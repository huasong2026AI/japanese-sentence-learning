import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Wand2, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { scanImageForJapanese } from '../services/gemini';
import type { ExtractedSentence } from '../services/gemini';
import { db, generateId } from '../services/db';

interface ImageOcrScannerProps {
  onSentencesAdded: () => void;
  apiKey: string;
  onOpenSettings: () => void;
}

export const ImageOcrScanner: React.FC<ImageOcrScannerProps> = ({ onSentencesAdded, apiKey, onOpenSettings }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ExtractedSentence[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Resize and compress image to avoid hitting Gemini request payload limits and make upload fast
  const processImage = (file: File) => {
    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL(file.type, 0.85);
          setImagePreview(compressedBase64);
          setCandidates([]);
          setSelectedIndices(new Set());
          setErrorMsg(null);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    if (!apiKey) {
      setErrorMsg('请先配置您的 Gemini API Key');
      onOpenSettings();
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const results = await scanImageForJapanese(imagePreview, imageMimeType, apiKey, db.getModel());
      setCandidates(results);
      // Select all candidates by default
      setSelectedIndices(new Set(results.keys()));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '识别过程中发生未知错误');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const handleAddSelected = () => {
    if (selectedIndices.size === 0) return;
    
    let addedCount = 0;
    candidates.forEach((candidate, index) => {
      if (selectedIndices.has(index)) {
        db.addSentence({
          japanese: candidate.japanese,
          chinese: candidate.chinese,
          grammar: candidate.grammar,
          derived: candidate.derived.map(d => ({
            id: generateId(),
            japanese: d.japanese,
            chinese: d.chinese
          }))
        });
        addedCount++;
      }
    });

    onSentencesAdded();
    
    // Reset state
    setImagePreview(null);
    setCandidates([]);
    setSelectedIndices(new Set());
  };

  return (
    <div className="w-full bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-md font-bold text-japanese-charcoal flex items-center space-x-2">
          <Camera className="h-5 w-5 text-japanese-red" />
          <span>拍摄或导入日语图片</span>
        </h2>
        {imagePreview && !isAnalyzing && (
          <button
            onClick={() => {
              setImagePreview(null);
              setCandidates([]);
              setErrorMsg(null);
            }}
            className="text-xs font-semibold text-japanese-red hover:underline"
          >
            重置
          </button>
        )}
      </div>

      {/* Inputs (Hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      {/* Capture="environment" triggers the rear-facing camera on mobile */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Image selector placeholder / preview */}
      {!imagePreview ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={triggerCamera}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-japanese-red rounded-2xl hover:bg-japanese-sakura hover:bg-opacity-5 transition-all group duration-300"
          >
            <Camera className="h-8 w-8 text-slate-400 group-hover:text-japanese-red mb-2.5 transition-colors" />
            <span className="text-sm font-semibold text-slate-700">手机拍照</span>
            <span className="text-[10px] text-slate-400 mt-1">调用后置摄像头</span>
          </button>

          <button
            onClick={triggerUpload}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-japanese-blue rounded-2xl hover:bg-japanese-blue hover:bg-opacity-5 transition-all group duration-300"
          >
            <ImageIcon className="h-8 w-8 text-slate-400 group-hover:text-japanese-blue mb-2.5 transition-colors" />
            <span className="text-sm font-semibold text-slate-700">导入相册</span>
            <span className="text-[10px] text-slate-400 mt-1">选择本地照片文件</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-[300px] flex items-center justify-center">
            <img src={imagePreview} alt="Preview" className="object-contain max-h-[300px] w-full" />
            
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-japanese-sakura" />
                <p className="text-sm font-medium tracking-wide">AI 正在识别日语并生成解析...</p>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="bg-rose-50 text-rose-600 p-3.5 rounded-2xl border border-rose-100 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isAnalyzing && candidates.length === 0 && (
            <button
              onClick={handleAnalyze}
              className="w-full flex items-center justify-center space-x-2 bg-japanese-red hover:bg-opacity-95 text-white py-3 px-4 rounded-2xl font-bold shadow-md shadow-japanese-red/20 transition-all active:scale-[0.98]"
            >
              <Wand2 className="h-4 w-4" />
              <span>智能识别日语句子</span>
            </button>
          )}
        </div>
      )}

      {/* Candidate Selection List */}
      {candidates.length > 0 && (
        <div className="space-y-4 pt-3 border-t border-slate-100 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">
              识别到 {candidates.length} 个句子，请勾选需要学习的保存：
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              已选 {selectedIndices.size} 句
            </span>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
            {candidates.map((cand, idx) => {
              const isSelected = selectedIndices.has(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleSelect(idx)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
                    isSelected
                      ? 'bg-japanese-blue bg-opacity-5 border-japanese-blue'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-100'
                  }`}
                >
                  <div
                    className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-japanese-blue border-japanese-blue text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold text-japanese-charcoal font-sans">{cand.japanese}</p>
                    <p className="text-xs text-slate-500">{cand.chinese}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleAddSelected}
            disabled={selectedIndices.size === 0}
            className="w-full flex items-center justify-center space-x-2 bg-japanese-blue text-white disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none py-3 px-4 rounded-2xl font-bold shadow-md shadow-japanese-blue/20 transition-all duration-200"
          >
            <span>添加至学习库 ({selectedIndices.size} 句)</span>
          </button>
        </div>
      )}
    </div>
  );
};
