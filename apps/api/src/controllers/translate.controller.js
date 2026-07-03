import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const LANG_PAIR = { ru: 'uz|ru', en: 'uz|en' };

async function translateText(text, targetLang) {
  const langpair = LANG_PAIR[targetLang];
  if (!langpair) throw new AppError('Unsupported target language', 400, 'INVALID_LANG');

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;
  const res = await fetch(url);
  if (!res.ok) throw new AppError('Translation service unavailable', 502, 'TRANSLATE_ERROR');

  const data = await res.json();
  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    throw new AppError('Translation failed', 502, 'TRANSLATE_ERROR');
  }
  return data.responseData.translatedText;
}

export const translate = asyncHandler(async (req, res) => {
  const { text, targetLangs = ['ru', 'en'] } = req.body;
  if (!text?.trim()) throw new AppError('Text is required', 400, 'VALIDATION_ERROR');

  const results = {};
  await Promise.all(
    targetLangs.map(async (lang) => {
      results[lang] = await translateText(text.trim(), lang);
    })
  );

  res.json({ translations: results });
});
