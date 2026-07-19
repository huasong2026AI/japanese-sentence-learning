import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ExtractedSentence {
  japanese: string;
  chinese: string;
  grammar: string;
  derived: {
    japanese: string;
    chinese: string;
  }[];
}

export async function scanImageForJapanese(
  base64Image: string,
  mimeType: string,
  apiKey: string,
  modelName: string = 'gemini-2.0-flash'
): Promise<ExtractedSentence[]> {
  if (!apiKey) {
    throw new Error('请输入并保存 Gemini API Key 后再进行识别');
  }

  // Initialize client
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use the model selected by the user
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  // Extract base64 raw data
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType || 'image/jpeg'
    }
  };

  const prompt = `
你是一个专业的日语教师。请识别并提取这张图片中所有具有完整学习意义的日语句子。
针对图片中的每一个日语整句，你需要提供：
1. 日语原文句子
2. 中文翻译
3. 针对该句子的重要语法点/核心词汇的简要讲解（精炼、通俗易懂，支持换行）
4. 从该句子派生出的3个新日语例句（包含对应的中文翻译），展示该语法的不同用法或词汇拓展。

请严格以 JSON 格式输出，返回一个 JSON 数组。不要返回任何其他文字。格式如下：
[
  {
    "japanese": "日语句子原文",
    "chinese": "中文翻译",
    "grammar": "语法/核心词汇讲解",
    "derived": [
      {
        "japanese": "新派生例句1",
        "chinese": "新派生例句1翻译"
      },
      {
        "japanese": "新派生例句2",
        "chinese": "新派生例句2翻译"
      },
      {
        "japanese": "新派生例句3",
        "chinese": "新派生例句3翻译"
      }
    ]
  }
]
`;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON safely
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error('AI 返回的数据格式不正确（期待数组）');
    }
    
    return parsed as ExtractedSentence[];
  } catch (error) {
    console.error('Gemini API Error:', error);
    if (error instanceof SyntaxError) {
      throw new Error('AI 返回的数据解析失败，请再试一次');
    }
    throw error;
  }
}
