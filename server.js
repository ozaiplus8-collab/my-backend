// ==========================================
// Cappy Studio Backend — REAL VERSION
// Groq API + ElevenLabs API Integration
// ==========================================

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// ==========================================
// 🔑 API Keys (Environment Variables မှဖတ်ရန်)
// ==========================================
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";

console.log('🔑 API Status:');
console.log('   Groq:', GROQ_API_KEY ? '✅ ရှိသည်' : '❌ မရှိသေး');
console.log('   ElevenLabs:', ELEVENLABS_API_KEY ? '✅ ရှိသည်' : '❌ မရှိသေး');

// ==========================================
// Middleware
// ==========================================
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// File Upload Setup
// ==========================================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// ==========================================
// ✅ Root Route — ပင်မစာမျက်နှာ
// ==========================================
app.get('/', (req, res) => {
  res.json({
    name: "Cappy Studio Backend",
    version: "1.0.0",
    status: "✅ အလုပ်လုပ်နေသည်",
    endpoints: {
      health: "/api/health",
      jobs: "/api/jobs",
      textToSpeech: "/api/text-to-speech (POST)",
      videoProcess: "/api/video/process (POST)"
    },
    apis: {
      groq: !!GROQ_API_KEY,
      elevenlabs: !!ELEVENLABS_API_KEY
    }
  });
});

// ==========================================
// ✅ Health Check
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Cappy Studio Backend — Real-Time Mode',
    apis: {
      groq: !!GROQ_API_KEY && GROQ_API_KEY.length > 10,
      elevenlabs: !!ELEVENLABS_API_KEY && ELEVENLABS_API_KEY.length > 10
    }
  });
});

// ==========================================
// ✅ Jobs API
// ==========================================
app.get('/api/jobs', (req, res) => {
  res.json({
    message: 'Jobs API အဆင်ပြေပါသည်',
    endpoints: {
      create: 'POST /api/jobs',
      tts: 'POST /api/text-to-speech',
      video: 'POST /api/video/process'
    }
  });
});

app.post('/api/jobs', (req, res) => {
  res.json({
    jobId: 'job_' + Date.now(),
    status: 'created',
    message: 'အလုပ်အသစ်ဖန်တီးပြီးပါပြီ',
    input: req.body
  });
});

// ==========================================
// 🔊 Text → Speech (ElevenLabs API)
// ==========================================
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text, voice = 'female', speed = 1.0 } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'စာသားလိုအပ်ပါသည်' });
    }

    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'ElevenLabs API Key မသတ်မှတ်ရသေးပါ' });
    }

    console.log('🔊 ElevenLabs ဖြင့် အသံဖန်တီးနေသည်...');

    // Voice IDs
    const voiceId = voice === 'female' ? '21m00Tcm4TlvDq8ikWAM' : 'AZnzlk1XvdvUeBnXmlld';
    const modelId = 'eleven_multilingual_v2';

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs Error:', errText);
      return res.status(response.status).json({ error: 'ElevenLabs API အမှား' });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    res.json({
      success: true,
      audio: `data:audio/mpeg;base64,${base64Audio}`,
      text: text
    });

  } catch (err) {
    console.error('TTS Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 🎥 Video → Text + Translate (Groq API)
// ==========================================

// Helper: Transcribe audio with Groq Whisper
async function transcribeAudio(filePath, lang = 'auto') {
  try {
    const FormData = require('form-data');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('model', 'whisper-large-v3');
    if (lang !== 'auto') formData.append('language', lang);
    formData.append('response_format', 'verbose_json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error('Groq Transcription Failed: ' + errText);
    }
    
    const result = await response.json();
    return result.text || '';
  } catch (err) {
    console.error('Transcription Error:', err);
    throw err;
  }
}

// Helper: Translate text with Groq
async function translateText(text, sourceLang = 'auto', targetLang = 'my') {
  try {
    const langNames = {
      'auto': 'မည်သည့်ဘာသာစကားမှမဆို',
      'zh': 'တရုတ်',
      'en': 'အင်္ဂလိပ်',
      'ja': 'ဂျပန်',
      'ko': 'ကိုရီးယား',
      'th': 'ထိုင်း',
      'my': 'မြန်မာ'
    };

    const prompt = `အောက်ပါစာသားကို ${langNames[sourceLang] || 'မူရင်းဘာသာစကား'}မှ မြန်မာဘာသာစကားသို့ တိကျစွာဘာသာပြန်ပေးပါ။ စာသားသာဖြေပါ၊ အချက်အလက်မထည့်ပါနှင့်။

မူရင်းစာသား:
${text}

မြန်မာဘာသာပြန်:`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'သင်သည် အတွေ့အကြုံရင့် ဘာသာပြန်ဆရာဖြစ်သည်။ တိကျသောမြန်မာဘာသာဖြင့်သာ ဖြေကြားပါ။' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2048
      })
    });

    if (!response.ok) throw new Error('Groq Translation Failed');
    const result = await response.json();
    return result.choices[0].message.content.trim();
  } catch (err) {
    console.error('Translation Error:', err);
    throw err;
  }
}

// Video Process Endpoint
app.post('/api/video/process', upload.single('video'), async (req, res) => {
  try {
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'Groq API Key မသတ်မှတ်ရသေးပါ' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'ဗီဒီယိုဖိုင်လိုအပ်ပါသည်' });
    }

    const { sourceLang = 'auto' } = req.body;
    const filePath = req.file.path;

    console.log('📁 ဖိုင်လက်ခံရရှိပါသည်:', req.file.filename);

    // Step 1: Transcribe
    res.write(JSON.stringify({ step: 1, status: 'အသံထုတ်ယူနေသည်...', progress: 25 }) + '\n');
    
    const originalText = await transcribeAudio(filePath, sourceLang);
    
    res.write(JSON.stringify({ step: 2, status: 'စာသားဖော်ထုတ်ပြီးပါပြီ', progress: 50, originalText }) + '\n');

    // Step 2: Translate
    res.write(JSON.stringify({ step: 3, status: 'ဘာသာပြန်နေသည်...', progress: 75 }) + '\n');
    
    const translatedText = await translateText(originalText, sourceLang, 'my');
    
    res.write(JSON.stringify({ step: 4, status: 'ပြီးဆုံးပါပြီ', progress: 100, translatedText }) + '\n');

    // Cleanup
    fs.unlink(filePath, (err) => { 
      if (err) console.warn('File delete warning:', err); 
    });

    res.end();

  } catch (err) {
    console.error('Video Processing Error:', err);
    if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
  console.log('=========================================');
  console.log(`✅ Server အလုပ်လုပ်နေသည် — Port ${PORT}`);
  console.log(`📍 ပင်မစာမျက်နှာ: http://localhost:${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
  console.log('=========================================');
});
