// ==========================================
// Cappy Studio Backend Server
// ==========================================

const express = require('express');
const cors = require('cors');
const app = express();

// ==========================================
// 1️⃣ အခြေခံ ဆက်တင်များ
// ==========================================
const PORT = process.env.PORT || 10000; // Render က 10000 ကို သုံးတယ်

// ==========================================
// 2️⃣ CORS ဖွင့်ခြင်း (အရေးကြီးဆုံး!)
// ==========================================
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors()); // Preflight request ဖြေရှင်းရန်

// ==========================================
// 3️⃣ ဒေတာဖတ်ရန် အဆင့်များ
// ==========================================
app.use(express.json()); // JSON ဒေတာဖတ်ရန်
app.use(express.urlencoded({ extended: true })); // Form ဒေတာဖတ်ရန်

// ဖိုင်တင်ရန်အတွက် နောက်ပိုင်းတွင် multer ထည့်နိုင်သည်

// ==========================================
// 4️⃣ API Routes များ
// ==========================================

// ✅ Health Check — အလုပ်လုပ်နေသလား စစ်ရန်
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running!' });
});

// ✅ Root URL
app.get('/', (req, res) => {
  res.json({ 
    message: 'Cappy Studio Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      jobs: '/api/jobs'
    }
  });
});

// ✅ Job ဖန်တီးရန် (POST)
app.post('/api/jobs', (req, res) => {
  const { type, videoUrl } = req.body;
  
  // နမူနာအကြောင်းအရာ
  res.json({
    jobId: 'job_' + Date.now(),
    status: 'queued',
    message: 'Job created successfully',
    type: type,
    createdAt: new Date().toISOString()
  });
});

// ✅ Job အခြေအနေ စစ်ရန် (GET)
app.get('/api/jobs/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  res.json({
    jobId: jobId,
    status: 'processing', // queued / processing / completed / failed
    progress: 50,
    message: 'Processing your request...'
  });
});

// ✅ ရလဒ်ယူရန် (GET)
app.get('/api/result/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  res.json({
    jobId: jobId,
    status: 'completed',
    result: 'This is where your final result will appear!'
  });
});

// ==========================================
// 5️⃣ ဆာဗာစတင်ခြင်း
// ==========================================
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
