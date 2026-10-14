import { GoogleGenAI, Type } from '@google/genai';
import { StoryIdea, ScriptData, FactualClaim } from '../src/types';

export interface GenerateRequestOptions {
  topic: string;
  category: string;
  language?: string;
  targetDuration?: string;
  narrationStyle?: string;
  visualStyle?: string;
  targetAudience?: string;
  allowFallback?: boolean;
}

export interface GenerateResult {
  ideas: StoryIdea[];
  recommendedIdeaIndex: number;
  script: ScriptData;
  claims: FactualClaim[];
  isFallback: boolean;
  modelUsed: string;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
}

export function coerceFactualClaims(rawClaims: any[]): FactualClaim[] {
  return (rawClaims || []).map((fc: any, idx: number) => ({
    id: fc.id || `claim-${Date.now()}-${idx}`,
    claimText: String(fc.claimText || ''),
    associatedScene: Number(fc.associatedScene) || 1,
    status: 'Unverified' as const, // SERVER-SIDE INVARIANT: Strictly forced to Unverified
    confidenceAssessment: 'Pending' as const, // SERVER-SIDE INVARIANT: Strictly forced to Pending
    reviewerNotes: fc.reviewerNotes ? String(fc.reviewerNotes) : 'Extracted by AI. Awaiting source verification.',
    updatedAt: new Date().toISOString(),
  }));
}

export function generateTemplateFallback(options: GenerateRequestOptions): GenerateResult {
  const topic = options.topic;
  const targetDuration = options.targetDuration || '60s';

  const ideas: StoryIdea[] = [
    {
      id: `idea-${Date.now()}-1`,
      title: `${topic}: The Hidden Paradox`,
      hook: `You think you know about ${topic}. But the official records left out one terrifying detail.`,
      angle: 'Investigative contradiction and untold turning point',
      synopsis: `An evidence-grounded look into ${topic}, revealing how a single overlooked decision transformed the entire event.`,
      isRecommended: true,
      whyRecommended: 'Highest emotional stakes and clearest 3-second hook for short-form video retention.',
    },
    {
      id: `idea-${Date.now()}-2`,
      title: `The Last Witness of ${topic}`,
      hook: `On the final night of ${topic}, one survivor wrote a journal entry that was sealed for centuries.`,
      angle: 'Personal eyewitness perspective',
      synopsis: `Focusing on firsthand testimony and personal accounts surrounding ${topic}.`,
      isRecommended: false,
    },
    {
      id: `idea-${Date.now()}-3`,
      title: `3 Shocking Facts About ${topic}`,
      hook: `Three facts about ${topic} that school history textbooks always skip.`,
      angle: 'Fast-paced countdown',
      synopsis: `Rapid-fire breakdown of the most surprising, verifiable elements of ${topic}.`,
      isRecommended: false,
    },
  ];

  const scenes = [
    {
      sceneNumber: 1,
      narration: `You think you know about ${topic}. But the official records left out one unbelievable detail.`,
      visualPrompt: `Dramatic cinematic opening shot of ${topic}, moody atmosphere, 9:16 vertical framing, volumetric light.`,
      durationSeconds: 12,
      transition: 'Impact Zoom',
      soundCue: 'Low sub-bass boom followed by ticking clock',
    },
    {
      sceneNumber: 2,
      narration: `When witnesses first documented the event, the initial reports directly contradicted the story we are told today.`,
      visualPrompt: `Archival documents and dramatic close-up of historical parchment with candlelight reflection.`,
      durationSeconds: 16,
      transition: 'Fast Whip Cut',
      soundCue: 'Suspenseful string tremolo',
    },
    {
      sceneNumber: 3,
      narration: `Modern researchers cross-referencing the primary sources discovered something that changes everything we assumed about ${topic}.`,
      visualPrompt: `High-contrast cinematic revelation, shadows falling across old stone walls or city streets.`,
      durationSeconds: 18,
      transition: 'Cross Dissolve',
      soundCue: 'Rising choir chord with resonant bell strike',
    },
    {
      sceneNumber: 4,
      narration: `History isn't just what was written down—it's what survived.`,
      visualPrompt: `Slow cinematic camera pullback, golden hour backlight, majestic silhouette.`,
      durationSeconds: 14,
      transition: 'Fade to Black',
      soundCue: 'Lingering orchestral resolution',
    },
  ];

  const script: ScriptData = {
    version: 1,
    title: `${topic}: The Untold Truth`,
    hook: `You think you know about ${topic}. But the official records left out one unbelievable detail.`,
    scenes,
    callToAction: 'Which part surprised you the most? Subscribe for more deep-dive historical investigations.',
    estimatedDuration: 60,
    lastEditedAt: new Date().toISOString(),
  };

  const rawFallbackClaims = [
    {
      id: `claim-${Date.now()}-1`,
      claimText: `The documented timeline of ${topic} contains verified historical records and contemporary eyewitness accounts.`,
      associatedScene: 1,
      status: 'Supported', // Even if model or template claims Supported...
      confidenceAssessment: 'High', // ...server-side coercion will enforce Unverified and Pending
      reviewerNotes: 'Requires primary source citations and verification check before publication.',
    },
    {
      id: `claim-${Date.now()}-2`,
      claimText: `Early reports regarding ${topic} contained discrepancies that historians later reconciled.`,
      associatedScene: 2,
      status: 'Supported',
      confidenceAssessment: 'High',
      reviewerNotes: 'Cross-check against reputable academic historiography.',
    },
  ];

  const claims = coerceFactualClaims(rawFallbackClaims);

  return {
    ideas,
    recommendedIdeaIndex: 0,
    script,
    claims,
    isFallback: true,
    modelUsed: 'Template Studio Engine',
  };
}

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  timeoutMs = 35000
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs)
      );
      return await Promise.race([fn(), timeoutPromise]);
    } catch (err: any) {
      lastError = err;
      const msg = err.message || '';
      // Only retry transient errors (rate limit, service unavailable, timeout)
      const isTransient =
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('timed out') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('UNAVAILABLE');

      if (attempt < retries && isTransient) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 6000);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

export async function generateIdeasAndScript(options: GenerateRequestOptions): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    if (options.allowFallback) {
      return generateTemplateFallback(options);
    }
    throw new Error('GEMINI_API_KEY is not configured on server. Please configure it in Settings > Secrets.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const language = options.language || 'English';
  const targetDuration = options.targetDuration || '60s';
  const narrationStyle = options.narrationStyle || 'Dramatic & Suspenseful';
  const visualStyle = options.visualStyle || 'Cinematic Photorealistic';
  const targetAudience = options.targetAudience || 'General Audience';

  const systemPrompt = `You are a world-class short-form video showrunner, investigative researcher, and scriptwriter for YouTube Shorts, TikTok, and Instagram Reels.
You create viral, high-retention stories with strong opening hooks, compelling narrative pacing, punchy scene breakdowns, and rigorous factual accountability.

CRITICAL INSTRUCTION FOR FACTUAL VERIFICATION:
- Every historical, scientific, biographical, statistical, or crime statement must be extracted as an atomic claim.
- All factual claims MUST initially be marked with status "Unverified" and confidenceAssessment "Pending".
- Never fabricate sources or present unverified claims as absolute truth without verification flags.`;

  const userPrompt = `Generate short-form video ideas, a recommended script, and factual claims for verification:
- Topic: "${options.topic}"
- Category: "${options.category}"
- Language: "${language}"
- Target Duration: ${targetDuration}
- Narration Style: "${narrationStyle}"
- Visual Style: "${visualStyle}"
- Target Audience: "${targetAudience}"

Provide:
1. Exactly THREE distinct story ideas (one must be recommended with rationale).
2. The index of the recommended idea (0, 1, or 2).
3. A complete, scene-by-scene short-form script based on the recommended idea, including visual descriptions, timing, hook, and call to action.
4. A list of all factual claims in the script that require verification (marked "Unverified").`;

  try {
    const response = await executeWithRetry(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ideas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    hook: { type: Type.STRING },
                    angle: { type: Type.STRING },
                    synopsis: { type: Type.STRING },
                    isRecommended: { type: Type.BOOLEAN },
                    whyRecommended: { type: Type.STRING },
                  },
                  required: ['id', 'title', 'hook', 'angle', 'synopsis', 'isRecommended'],
                },
              },
              recommendedIdeaIndex: { type: Type.INTEGER },
              script: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  hook: { type: Type.STRING },
                  scenes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        sceneNumber: { type: Type.INTEGER },
                        narration: { type: Type.STRING },
                        visualPrompt: { type: Type.STRING },
                        durationSeconds: { type: Type.INTEGER },
                        transition: { type: Type.STRING },
                        soundCue: { type: Type.STRING },
                      },
                      required: ['sceneNumber', 'narration', 'visualPrompt', 'durationSeconds'],
                    },
                  },
                  callToAction: { type: Type.STRING },
                  estimatedDuration: { type: Type.INTEGER },
                },
                required: ['title', 'hook', 'scenes', 'callToAction', 'estimatedDuration'],
              },
              factualClaims: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    claimText: { type: Type.STRING },
                    associatedScene: { type: Type.INTEGER },
                    status: { type: Type.STRING },
                    confidenceAssessment: { type: Type.STRING },
                    reviewerNotes: { type: Type.STRING },
                  },
                  required: ['id', 'claimText', 'associatedScene', 'status'],
                },
              },
            },
            required: ['ideas', 'recommendedIdeaIndex', 'script', 'factualClaims'],
          },
        },
      });
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini API returned an empty text payload.');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      throw new Error('Failed to parse Gemini JSON output schema.');
    }

    const ideas: StoryIdea[] = (parsed.ideas || []).slice(0, 3).map((item: any, idx: number) => ({
      id: item.id || `idea-${Date.now()}-${idx}`,
      title: String(item.title || `Idea ${idx + 1}`),
      hook: String(item.hook || ''),
      angle: String(item.angle || ''),
      synopsis: String(item.synopsis || ''),
      isRecommended: Boolean(item.isRecommended ?? (idx === parsed.recommendedIdeaIndex)),
      whyRecommended: item.whyRecommended ? String(item.whyRecommended) : undefined,
    }));

    const scenes = (parsed.script?.scenes || []).map((sc: any, idx: number) => ({
      sceneNumber: Number(sc.sceneNumber) || idx + 1,
      narration: String(sc.narration || ''),
      visualPrompt: String(sc.visualPrompt || ''),
      durationSeconds: Number(sc.durationSeconds) || 15,
      transition: String(sc.transition || 'Cut'),
      soundCue: String(sc.soundCue || 'Atmospheric background'),
    }));

    const script: ScriptData = {
      version: 1,
      title: String(parsed.script?.title || options.topic),
      hook: String(parsed.script?.hook || (scenes[0]?.narration ?? '')),
      scenes,
      callToAction: String(parsed.script?.callToAction || 'Subscribe for more.'),
      estimatedDuration: Number(parsed.script?.estimatedDuration) || scenes.reduce((acc: number, s: any) => acc + s.durationSeconds, 0),
      lastEditedAt: new Date().toISOString(),
    };

    // SERVER-SIDE INVARIANT: Force every factual claim to Unverified and Pending
    const claims = coerceFactualClaims(parsed.factualClaims);

    return {
      ideas,
      recommendedIdeaIndex: parsed.recommendedIdeaIndex ?? 0,
      script,
      claims,
      isFallback: false,
      modelUsed: 'gemini-3.8-flash',
    };
  } catch (error: any) {
    console.error('Gemini API call failed:', error);
    if (options.allowFallback) {
      return generateTemplateFallback(options);
    }
    const rawMsg = error.message || String(error);
    if (rawMsg.includes('401') || rawMsg.includes('UNAUTHENTICATED') || rawMsg.includes('service account')) {
      throw new Error(
        'Gemini API Authorization Notice: The current API key credentials need refreshing or activation in Settings > Secrets. You can also generate using the Studio Script Template mode.'
      );
    }
    throw error;
  }
}
