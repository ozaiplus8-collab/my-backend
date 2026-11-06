const BASE_URL = "https://my-backend-xrwt.onrender.com";

// ==========================================
// Server Status Check
// ==========================================
async function checkServer() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    if (res.ok) {
      statusDot.classList.add('on');
      statusText.textContent = '✅ အွန်လိုင်း — Groq: ' + (data.apis.groq ? '✅' : '❌') + ' ElevenLabs: ' + (data.apis.elevenlabs ? '✅' : '❌');
    }
  } catch (err) {
    statusDot.classList.add('off');
    statusText.textContent = '❌ ဆာဗာအော့ဖ်လိုင်း';
  }
}
checkServer();

// ==========================================
// Tab Switching
// ==========================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active from all tabs
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Activate clicked tab
    btn.classList.add('active');
    const tabId = btn.dataset.tab;
    document.getElementById(tabId).classList.add('active');
  });
});

// ==========================================
// 🎥 Video Upload Workflow
// ==========================================
let selectedVideoFile = null;
const uploadArea = document.getElementById('uploadArea');
const videoInput = document.createElement('input');
videoInput.type = 'file';
videoInput.accept = 'video/*';
videoInput.hidden = true;
document.body.appendChild(videoInput);

// Click to select
uploadArea.addEventListener('click', () => videoInput.click());

// File selected
videoInput.addEventListener('change', (e) => {
  if (e.target.files.length === 0) return;
  
  selectedVideoFile = e.target.files[0];
  
  // Check file size (50MB limit for Render free)
  if (selectedVideoFile.size > 50 * 1024 * 1024) {
    alert('⚠️ ဖိုင်အရွယ်အစား အလွန်ကြီးနေပါသည်။ Render အခမဲ့အစီအစဉ်တွင် အများဆုံး 50MB သာခွင့်ပြုသည်။ ဖိုင်ကို သေးအောင်လျှော့ပါ။');
    selectedVideoFile = null;
    return;
  }
  
  // Show file info
  document.getElementById('fileInfo').classList.remove('hidden');
  document.getElementById('fileName').textContent = selectedVideoFile.name;
  document.getElementById('fileSize').textContent = (selectedVideoFile.size / (1024 * 1024)).toFixed(1) + ' MB';
  document.getElementById('startBtn').disabled = false;
});

// Remove file
document.getElementById('removeFile').addEventListener('click', () => {
  selectedVideoFile = null;
  videoInput.value = '';
  document.getElementById('fileInfo').classList.add('hidden');
  document.getElementById('startBtn').disabled = true;
  // Hide result section too
  document.getElementById('progressSection').classList.add('hidden');
  document.getElementById('resultSection').classList.add('hidden');
});

// Start Processing
document.getElementById('startBtn').addEventListener('click', async () => {
  if (!selectedVideoFile) {
    alert('ဗီဒီယိုဖိုင်ကို အရင်ရွေးပါ!');
    return;
  }
  
  const startBtn = document.getElementById('startBtn');
  const progressSection = document.getElementById('progressSection');
  const resultSection = document.getElementById('resultSection');
  
  // Show progress
  progressSection.classList.remove('hidden');
  resultSection.classList.add('hidden');
  startBtn.disabled = true;
  
  // Reset progress display
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('progressPercent').textContent = '0%';
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active', 'completed'));
  
  // Prepare form data
  const formData = new FormData();
  formData.append('video', selectedVideoFile);
  formData.append('sourceLang', document.getElementById('sourceLang').value);
  formData.append('outputMode', document.getElementById('outputMode').value);
  
  try {
    // Update step 1
    document.getElementById('step1').classList.add('active');
    document.getElementById('progressFill').style.width = '25%';
    document.getElementById('progressPercent').textContent = '25%';
    document.getElementById('statusText').textContent = 'ဖိုင်ပို့နေသည်...';
    
    const res = await fetch(`${BASE_URL}/api/video/process`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) throw new Error('ဆာဗာတုံ့ပြန်မှုမအောင်မြင်ပါ');
    
    // Read streaming response
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let originalText = '';
    let translatedText = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          // Update progress
          if (data.progress) {
            document.getElementById('progressFill').style.width = data.progress + '%';
            document.getElementById('progressPercent').textContent = data.progress + '%';
          }
          if (data.status) {
            document.getElementById('statusText').textContent = data.status;
          }
          
          // Update steps
          if (data.step === 1) {
            document.getElementById('step1').classList.add('completed');
            document.getElementById('step2').classList.add('active');
          } else if (data.step === 2) {
            document.getElementById('step2').classList.add('completed');
            document.getElementById('step3').classList.add('active');
            if (data.originalText) originalText = data.originalText;
          } else if (data.step === 3) {
            document.getElementById('step3').classList.add('completed');
            document.getElementById('step4').classList.add('active');
            if (data.translatedText) translatedText = data.translatedText;
          } else if (data.step === 4) {
            document.getElementById('step4').classList.add('completed');
          }
          
        } catch (e) {
          console.log('Parse error:', e);
        }
      }
    }
    
    // Show results
    progressSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
    
    document.getElementById('originalText').value = originalText || 'စာသားမရရှိခဲ့ပါ';
    document.getElementById('subtitleText').value = translatedText || 'ဘာသာပြန်မရရှိခဲ့ပါ';
    document.getElementById('summaryText').value = 'အကျဉ်းချုပ်- ' + (translatedText || 'မရရှိ');
    
    // Store for history
    saveToHistory(selectedVideoFile.name, originalText, translatedText);
    
  } catch (err) {
    alert('❌ အမှား: ' + err.message + '\n\nဖြစ်နိုင်သည့်အကြောင်းရင်းများ-\n• ဖိုင်အရွယ်အစားကြီးနေခြင်း\n• API Key မမှန်ခြင်း\n• ဆာဗာအော့ဖ်လိုင်းဖြစ်နေခြင်း');
    progressSection.classList.add('hidden');
  } finally {
    startBtn.disabled = false;
  }
});

// ==========================================
// Result Tabs Switching
// ==========================================
document.querySelectorAll('.result-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.result-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.result-content').forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    const targetId = 'res-' + tab.dataset.tab;
    document.getElementById(targetId).classList.add('active');
  });
});

// Copy buttons
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const text = document.getElementById(targetId).value;
    navigator.clipboard.writeText(text).then(() => {
      const originalText = btn.textContent;
      btn.textContent = '✅ ကူးပြီး';
      setTimeout(() => btn.textContent = originalText, 2000);
    });
  });
});

// Download SRT
document.getElementById('downloadSrt').addEventListener('click', () => {
  const text = document.getElementById('subtitleText').value;
  const srtContent = `1\n00:00:00,000 --> 00:00:10,000\n${text}\n`;
  const blob = new Blob([srtContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'subtitles.srt';
  a.click();
  URL.revokeObjectURL(url);
});

// New video
document.getElementById('newVideo').addEventListener('click', () => {
  selectedVideoFile = null;
  videoInput.value = '';
  document.getElementById('fileInfo').classList.add('hidden');
  document.getElementById('progressSection').classList.add('hidden');
  document.getElementById('resultSection').classList.add('hidden');
  document.getElementById('startBtn').disabled = true;
});

// ==========================================
// 📝 Text to Speech Workflow
// ==========================================
document.getElementById('ttsBtn').addEventListener('click', async () => {
  const text = document.getElementById('inputText').value.trim();
  const voiceInput = document.querySelector('input[name="voice"]:checked');
  const voice = voiceInput ? voiceInput.value : 'female';
  
  if (!text) {
    alert('စာသားရိုက်ထည့်ပါ!');
    return;
  }
  
  const ttsBtn = document.getElementById('ttsBtn');
  const ttsLoading = document.getElementById('ttsLoading');
  const ttsResult = document.getElementById('ttsResult');
  
  ttsLoading.classList.remove('hidden');
  ttsResult.classList.add('hidden');
  ttsBtn.disabled = true;
  
  try {
    const res = await fetch(`${BASE_URL}/api/text-to-speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, speed: 1.0 })
    });
    
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'အမှားဖြစ်နေသည်');
    
    ttsLoading.classList.add('hidden');
    ttsResult.classList.remove('hidden');
    
    const audio = document.getElementById('ttsAudio');
    audio.src = data.audio;
    audio.play();
    
    window.currentAudioUrl = data.audio;
    
  } catch (err) {
    alert('❌ အမှား: ' + err.message);
    ttsLoading.classList.add('hidden');
  } finally {
    ttsBtn.disabled = false;
  }
});

// TTS Download
document.getElementById('ttsDownload').addEventListener('click', () => {
  if (!window.currentAudioUrl) return;
  const a = document.createElement('a');
  a.href = window.currentAudioUrl;
  a.download = 'myanmar-audio.mp3';
  a.click();
});

// TTS Reset
document.getElementById('ttsReset').addEventListener('click', () => {
  document.getElementById('inputText').value = '';
  document.getElementById('ttsResult').classList.add('hidden');
  window.currentAudioUrl = null;
});

// ==========================================
// 🕐 History Functions
// ==========================================
let history = JSON.parse(localStorage.getItem('movieRecapHistory') || '[]');

function saveToHistory(filename, original, translated) {
  const item = {
    id: Date.now(),
    filename,
    original,
    translated,
    date: new Date().toLocaleString('my-MM')
  };
  history.unshift(item);
  if (history.length > 10) history = history.slice(0, 10);
  localStorage.setItem('movieRecapHistory', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (history.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <h3>မှတ်တမ်းမရှိသေးပါ</h3>
        <p>ပြောင်းလဲမှုများ ပြုလုပ်ပါက ဤနေရာတွင် ပေါ်လာမည်ဖြစ်ပါသည်</p>
      </div>
    `;
    return;
  }
  
  list.innerHTML = history.map(item => `
    <div class="history-item">
      <p class="history-filename">🎬 ${item.filename}</p>
      <p class="history-date">${item.date}</p>
      <button class="history-view" data-id="${item.id}">ကြည့်ရန်</button>
    </div>
  `).join('');
}

// Clear history
document.getElementById('clearHistory').addEventListener('click', () => {
  if (confirm('မှတ်တမ်းအားလုံးကို ဖျက်မှာ သေချာပါသလား?')) {
    history = [];
    localStorage.removeItem('movieRecapHistory');
    renderHistory();
  }
});

// Initialize history on load
renderHistory();
