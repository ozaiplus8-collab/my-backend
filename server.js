// ✅ Root Route — ပင်မစာမျက်နှာ
app.get('/', (req, res) => {
  res.json({
    name: "Cappy Studio Backend",
    version: "1.0.0",
    status: "✅ အလုပ်လုပ်နေသည်",
    endpoints: {
      health: "/api/health",
      jobs: "/api/jobs",
      textToSpeech: "/api/text-to-speech",
      videoProcess: "/api/video/process"
    },
    note: "Frontend ကို သင့်ဖိုင်တွဲထဲက index.html ကနေ ဖွင့်ပါ"
  });
});
