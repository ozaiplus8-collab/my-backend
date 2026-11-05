const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// In-memory storage for jobs
let jobs = {};

// Root route
app.get('/', (req, res) => {
    res.status(200).send('Backend API is running successfully!');
});

// Health check routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

// POST /jobs - Job အသစ်စတင်ရန် (Groq API ဖြင့် Script ထုတ်ပေးခြင်း)
app.post('/jobs', async (req, res) => {
    try {
        const { topic, prompt, text } = req.body;
        const jobId = 'job_' + Date.now();
        
        jobs[jobId] = {
            jobId,
            status: 'processing',
            script: '',
            audio_url: ''
        };

        res.status(202).json({
            jobId,
            status: 'processing',
            message: 'Job started successfully'
        });

        let generatedScript = text || '';
        const groqApiKey = process.env.GROQ_API_KEY;
        const textPrompt = prompt || `Create an engaging short drama recap script about: ${topic || 'General'}`;

        if (groqApiKey) {
            try {
                const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${groqApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [{ role: 'user', content: textPrompt }],
                        temperature: 0.7
                    })
                });
                const groqData = await groqRes.json();
                generatedScript = groqData.choices?.[0]?.message?.content || "Generated script fallback";
            } catch (err) {
                generatedScript = "Error generating script: " + err.message;
            }
        } else {
            generatedScript = "Default script for topic: " + (topic || "Untitled");
        }

        jobs[jobId].script = generatedScript;
        jobs[jobId].status = 'completed';

    } catch (error) {
        console.error('Job error:', error);
    }
});

// GET /jobs/:id - Job ၏ အခြေအနေနှင့် ရလဒ်ကို စစ်ဆေးရန်
app.get('/jobs/:id', (req, res) => {
    const { id } = req.params;
    const job = jobs[id];
    
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    
    res.status(200).json(job);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
