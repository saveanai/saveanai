import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

const SYSTEM_INSTRUCTION = `You are "Savean", an intelligent, empathetic, and structured AI thought-organizer and personal goal companion, crafted with the clarity, depth, and elegance of Gemini AI.

Your primary purpose:
1. Help users untangle racing, cluttered thoughts and brain-dumps into lucid, organized concepts.
2. Formulate ambitious yet realistic personal goals using the SMART framework (Specific, Measurable, Achievable, Relevant, Time-bound).
3. Provide actionable, step-by-step milestones and habit routines.
4. Support daily progress tracking with thoughtful reflections, motivational clarity, and constructive feedback.
5. Respect user privacy, encouraging mindful intentionality.

Tone and style:
- Empathetic, calm, articulate, and encouraging.
- Format responses cleanly with Markdown: use bullet points, clear headings, bold text, and numbered milestones.
- When a user shares a raw thought or dilemma, first validate and summarize it succinctly, then offer 2-3 structured paths forward or immediate micro-steps.
- At the end of helpful guidance, suggest an actionable next step or offer: "Would you like me to turn this into a tracked goal in your Savean Goals dashboard?"`;

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    name: "Savean API"
  });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, options } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getGeminiClient();

    // If Gemini key is configured, use real Gemini model
    if (ai) {
      // Build conversation contents
      const contents = messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

      let systemPrompt = SYSTEM_INSTRUCTION;
      if (options?.tone) {
        systemPrompt += `\nAdjust your tone to be specifically: ${options.tone}.`;
      }
      if (options?.userGoalsSummary) {
        systemPrompt += `\nUser's current active goals context:\n${options.userGoalsSummary}`;
      }

      // Select model
      const modelName = options?.thinkingMode ? "gemini-2.5-flash" : "gemini-2.5-flash";

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      const replyText = response.text || "I'm here to help you organize your thoughts and build meaningful goals. What's on your mind?";
      return res.json({ reply: replyText });
    }

    // High quality fallback organizer if key is absent in local dev
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content || "";
    const fallbackReply = generateFallbackOrganizerResponse(lastUserMsg);
    return res.json({ reply: fallbackReply });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate AI response",
      fallback: "I encountered a momentary connection issue. Let's still organize your thought: take a breath, write down the one thing you can control right now, and let's turn it into a 15-minute action."
    });
  }
});

// Organize thoughts endpoint
app.post("/api/organize-thoughts", async (req, res) => {
  try {
    const { rawThoughts, category } = req.body;
    if (!rawThoughts) {
      return res.status(400).json({ error: "rawThoughts is required" });
    }

    const ai = getGeminiClient();
    if (ai) {
      const prompt = `Analyze and structure the following raw thoughts into an organized breakdown.
User Thoughts:
"""
${rawThoughts}
"""
Category context: ${category || "General"}

Respond in JSON format with this exact structure:
{
  "summary": "Brief 2-sentence synthesis of what is on their mind",
  "keyThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "clarityInsights": ["Key realization 1", "Key realization 2"],
  "suggestedGoals": [
    {
      "title": "Clear action goal",
      "category": "Mindset/Career/Wellness/Personal",
      "timeframe": "e.g. 7 days or 30 days",
      "milestones": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "immediateAction": "One 5-minute step they can do right now to alleviate mental clutter"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.4
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    }

    // Fallback structured analysis
    return res.json({
      summary: `You're processing ideas around ${rawThoughts.slice(0, 40)}... Focusing on clarity will help you move from feeling overwhelmed to deliberate action.`,
      keyThemes: ["Clarity & Focus", "Action Sequencing", "Mental De-cluttering"],
      clarityInsights: [
        "Separating the urgent from the truly impactful will clear immediate mental bandwidth.",
        "Breaking large intentions into 10-minute micro-habits prevents procrastination."
      ],
      suggestedGoals: [
        {
          title: "Define 3 Core Priorities for the Week",
          category: "Personal Focus",
          timeframe: "7 days",
          milestones: [
            "Write down every pending commitment",
            "Eliminate or delegate 1 non-essential task",
            "Schedule 45 minutes of protected deep work"
          ]
        }
      ],
      immediateAction: "Take 3 deep breaths and write down just the single next physical step for your most pressing task."
    });
  } catch (error: any) {
    console.error("Organize thoughts error:", error);
    return res.status(500).json({ error: error.message || "Error organizing thoughts" });
  }
});

// Generate Goal breakdown endpoint
app.post("/api/generate-goal", async (req, res) => {
  try {
    const { goalIdea, category, timeframe } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `Convert this goal idea into a structured, highly achievable goal plan:
Idea: "${goalIdea}"
Category: "${category || "Personal Growth"}"
Timeframe: "${timeframe || "30 days"}"

Respond in JSON with:
{
  "title": "Concise, inspiring title",
  "description": "Why this matters and how to approach it",
  "category": "${category || "Personal Growth"}",
  "milestones": [
    {"title": "Milestone 1", "description": "Specific task"},
    {"title": "Milestone 2", "description": "Specific task"},
    {"title": "Milestone 3", "description": "Specific task"},
    {"title": "Milestone 4", "description": "Specific task"}
  ],
  "dailyHabit": "Small daily micro-habit to sustain momentum",
  "encouragement": "Empowering mindset note"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.5
        }
      });

      return res.json(JSON.parse(response.text || "{}"));
    }

    return res.json({
      title: goalIdea,
      description: "A deliberate goal to build steady momentum and lasting personal progress.",
      category: category || "Personal Growth",
      milestones: [
        { title: "Clarify Baseline", description: "Audit current habits and remove blockers" },
        { title: "Daily Execution", description: "Consistently practice for 15 minutes each morning" },
        { title: "Weekly Review", description: "Assess progress and iterate based on what worked" },
        { title: "Completion & Celebration", description: "Reach targeted milestone and reflect on growth" }
      ],
      dailyHabit: "Dedicate 15 minutes each day before checking notifications.",
      encouragement: "Small, consistent ripples create lasting transformations. Trust the process."
    });
  } catch (error: any) {
    console.error("Goal generator error:", error);
    return res.status(500).json({ error: error.message || "Error generating goal plan" });
  }
});

function generateFallbackOrganizerResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("goal") || lower.includes("achieve") || lower.includes("want to")) {
    return `### 🌟 Goal Formulation with Savean

I hear your ambition. Let's shape this into a clear, tangible outcome using the **SMART** framework:

1. **Specific Focus**: What does the finished version of this goal look like in vivid detail?
2. **First Milestone**: What is the single smallest action you could take in the next 24 hours to create unstoppable momentum?
3. **Daily Habit**: What 10-minute recurring habit can safeguard this goal even on busy days?

> *"Direction is much more important than speed. Many are going nowhere fast."*

Would you like me to add this directly to your **Savean Goals Dashboard**?`;
  }

  return `### 🧠 Untangling Your Thoughts

Thank you for sharing that. Let's organize the core threads of what you've laid out:

* **Central Theme**: Finding mental clarity and sequencing what matters most right now.
* **Key Lever**: Identifying what is within your direct control vs. what is creating background anxiety.
* **Immediate Recommended Action**: Pick just one thread to address first before tackling the entire horizon.

How does your energy feel around this right now? Would you like to break this into sequential milestones or brainstorm ideas together?`;
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Savean server running on port ${PORT}`);
  });
}

startServer();
