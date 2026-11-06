const express = require('express');
const cors = require('cors');
const app = express();

// ✅ CORS ကို အပြည့်အဝဖွင့်ပါ
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// ✅ Preflight requests ကို ဖြေရှင်းပါ
app.options('*', cors());

// အခြားကုဒ်များ...
