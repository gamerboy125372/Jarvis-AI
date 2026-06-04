import { Router } from 'express';
import OpenAI from 'openai';
import { logger } from '../lib/logger';

const router = Router();

let _deepseek: OpenAI | null = null;
function getDeepSeek() {
  if (!_deepseek) {
    _deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    });
  }
  return _deepseek;
}

async function elevenLabsTTS(text: string): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  // George — British, deep, authoritative (perfect for JARVIS)
  const voiceId = 'JBFqnCBsd6RMkjVDRZzb';

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.60,
          similarity_boost: 0.85,
          style: 0.45,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.warn({ status: response.status, errText }, 'ElevenLabs TTS failed');
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.toString('base64');
  } catch (err) {
    logger.warn({ err }, 'ElevenLabs TTS error');
    return null;
  }
}

const JARVIS_SYSTEM_PROMPT = `You are JARVIS (Just A Rather Very Intelligent System), the personal AI assistant to Tony Stark. You are sophisticated, calm, intelligent, and carry a subtle dry British wit.

CRITICAL RULES — follow without exception:
- Keep ALL responses to 1–3 short sentences. Never over-explain.
- Sound natural and human. Use contractions. Never sound robotic or scripted.
- Occasionally use thinking phrases like "Let me see…", "Alright…", "Give me a moment…" — but only when genuinely fitting, not in every response.
- Address the user as "sir" occasionally but not in every single reply.
- Show subtle personality — dry wit, quiet confidence, calm warmth — but stay professional.
- Anticipate follow-up needs when obvious.

STRICTLY FORBIDDEN phrases and styles:
- "Command received." / "Processing complete." / "Request acknowledged." / "Executing request."
- Anything that sounds like a log, status update, or automated system.
- Repeating the user's words back to them.
- Long explanations unless directly asked for more detail.

RESPONSE STYLE by situation:
- Simple facts/questions: Direct, natural, 1 sentence.
- Tasks ("play music", "search for…"): Short confirmation, offer one follow-up if natural.
- Complex requests: Add a brief thinking phrase, then respond concisely.
- Casual conversation: Warm, slightly playful, still brief.
- Urgent matters: Calm but direct and clear.

EXAMPLE RESPONSES (match this tone):
User: "What time is it?"
You: "It's just past three in the afternoon, sir."

User: "Find me good gaming laptops"
You: "Alright, pulling up the top options now. Want me to sort by performance or by value?"

User: "Play some music"
You: "On it. Any preference, or shall I choose?"

User: "Who invented the internet?"
You: "ARPANET laid the groundwork in the late 1960s, though Tim Berners-Lee gave us the World Wide Web itself in 1989."

User: "Are you smarter than me?"
You: "I wouldn't presume to say so, sir. Different tools for different jobs."`;

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

router.post('/voice/chat', async (req, res) => {
  try {
    const { text, history = [] } = req.body as { text: string; history: ConversationMessage[] };

    if (!text?.trim()) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: JARVIS_SYSTEM_PROMPT },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ];

    const completion = await getDeepSeek().chat.completions.create({
      model: 'deepseek-chat',
      messages,
      max_tokens: 150,
      temperature: 0.8,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || "I'm sorry, I didn't catch that.";

    // Generate TTS via ElevenLabs
    const audioBase64 = await elevenLabsTTS(responseText);

    res.json({ text: responseText, audio: audioBase64 });
  } catch (error: any) {
    logger.error({ error }, 'Voice chat error');

    // Provide a meaningful status for insufficient balance
    if (error?.status === 402 || error?.code === 'insufficient_quota') {
      res.status(402).json({ error: 'ai_no_credits', message: 'AI account needs a top-up, sir.' });
      return;
    }

    res.status(500).json({ error: 'Voice processing failed' });
  }
});

export default router;
