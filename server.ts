import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Extract owner and repo from GitHub URL
function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const trimmed = url.trim().replace(/\.git$/, "");
    const match = trimmed.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match && match[1] && match[2]) {
      // Handle subdirectories or query parameters if any
      const repoName = match[2].split("/")[0];
      return { owner: match[1], repo: repoName };
    }
  } catch (err) {
    console.error("Error parsing GitHub URL:", err);
  }
  return null;
}

// Sandbox Demo Repository Data for Instant Play (when GitHub rate limits or no internet or user selects Demo)
const DEMO_REPOSITORIES: Record<string, any> = {
  "react-todo-app": {
    repoInfo: {
      name: "cyber-task-react",
      owner: "repospace-demo",
      description: "A futuristic cyberpunk todo application built with React, Tailwind, and motion. Features persistent local storage, custom sound effects, and task priority matrix.",
      stars: 1240,
      forks: 89,
      language: "TypeScript",
      defaultBranch: "main"
    },
    tree: [
      { path: "src/App.tsx", type: "blob", size: 4500 },
      { path: "src/main.tsx", type: "blob", size: 600 },
      { path: "src/index.css", type: "blob", size: 800 },
      { path: "src/components/TaskInput.tsx", type: "blob", size: 2300 },
      { path: "src/components/TaskList.tsx", type: "blob", size: 3100 },
      { path: "src/components/TaskItem.tsx", type: "blob", size: 3800 },
      { path: "src/components/MatrixGrid.tsx", type: "blob", size: 2900 },
      { path: "src/hooks/useLocalStorage.ts", type: "blob", size: 1500 },
      { path: "package.json", type: "blob", size: 1200 },
      { path: "tailwind.config.js", type: "blob", size: 900 },
      { path: "tsconfig.json", type: "blob", size: 1000 },
      { path: "README.md", type: "blob", size: 2100 }
    ],
    analysis: {
      summary: "This is a clean, modern, single-page application representing a Cyberpunk Task Manager. It is structured around highly modularized React functional components, incorporating animated state transitions with motion and robust client-side storage.",
      techStack: ["React 19", "TypeScript", "Tailwind CSS v4", "motion/react", "HTML5 LocalStorage"],
      architecture: "The application uses a declarative component-driven architecture. The main application state is managed in App.tsx and persisted via a custom useLocalStorage hook. UI sub-components handle task entry, filter categories, and prioritize tasks on a Eisenhower matrix style 2x2 grid.",
      keyModules: [
        { path: "src/App.tsx", description: "The central layout controller containing task arrays, filter categories, statistics calculation, and Eisenhower matrix logic." },
        { path: "src/components/TaskItem.tsx", description: "Displays individual tasks with support for priority indicators, custom complete animations, edit triggers, and click-vibration cues." },
        { path: "src/components/MatrixGrid.tsx", description: "Implements a 2x2 priority matrix overlay (Urgent/Important) to categorize task importance visually." },
        { path: "src/hooks/useLocalStorage.ts", description: "A robust custom state synchronization hook that handles auto-serialization of task changes to local browser storage." }
      ],
      improvements: [
        "Introduce React Context or a lightweight state library like Zustand to avoid prop drilling from App.tsx into nested list items.",
        "Add a Service Worker to support full offline Progressive Web App (PWA) capabilities.",
        "Include automated unit testing suite with Vitest and React Testing Library for matrix categorizations."
      ],
      suggestedQuestions: [
        "Explain the Eisenhower matrix calculation logic in src/App.tsx.",
        "How is the custom useLocalStorage hook implemented and why is it generic?",
        "How can we integrate drag-and-drop support into src/components/MatrixGrid.tsx?"
      ],
      initialGreeting: "Welcome to the RepoSpace AI Core for cyber-task-react! I have fully scanned and cataloged this cyberpunk application's codebase. It features clean structure, modular custom hooks, and striking visual elements. What would you like to know about how this codebase is constructed?"
    }
  },
  "python-fastapi-service": {
    repoInfo: {
      name: "neural-api-server",
      owner: "repospace-demo",
      description: "A production-ready high-performance backend API service built with FastAPI, PostgreSQL, SQLAlchemy, and Celery for asynchronous background queue processing.",
      stars: 3410,
      forks: 412,
      language: "Python",
      defaultBranch: "main"
    },
    tree: [
      { path: "app/main.py", type: "blob", size: 1800 },
      { path: "app/core/config.py", type: "blob", size: 1400 },
      { path: "app/core/security.py", type: "blob", size: 2600 },
      { path: "app/db/session.py", type: "blob", size: 1100 },
      { path: "app/db/base_class.py", type: "blob", size: 600 },
      { path: "app/models/user.py", type: "blob", size: 1500 },
      { path: "app/models/prediction.py", type: "blob", size: 1200 },
      { path: "app/schemas/user.py", type: "blob", size: 1900 },
      { path: "app/schemas/prediction.py", type: "blob", size: 1100 },
      { path: "app/api/deps.py", type: "blob", size: 1600 },
      { path: "app/api/endpoints/auth.py", type: "blob", size: 3100 },
      { path: "app/api/endpoints/predict.py", type: "blob", size: 4200 },
      { path: "app/tasks/worker.py", type: "blob", size: 1500 },
      { path: "requirements.txt", type: "blob", size: 450 },
      { path: "Dockerfile", type: "blob", size: 800 },
      { path: "docker-compose.yml", type: "blob", size: 1200 },
      { path: "README.md", type: "blob", size: 3400 }
    ],
    analysis: {
      summary: "This is a full-stack asynchronous Python microservice tailored for running machine learning predictions and managing secure user accounts. It relies on standard async database connections and worker-based task execution.",
      techStack: ["Python 3.11", "FastAPI", "SQLAlchemy", "Alembic", "Celery", "PostgreSQL", "Docker"],
      architecture: "The codebase implements a decoupled hexagonal-style structure. Endpoints reside in app/api/, SQLAlchemy models define databases in app/models/, Pydantic classes validate inputs/outputs in app/schemas/, and Celery workers process heavy prediction requests asynchronously inside app/tasks/.",
      keyModules: [
        { path: "app/main.py", description: "Initializes FastAPI application instance, registers CORS middleware, configures exception handlers, and mounts global API router." },
        { path: "app/api/endpoints/predict.py", description: "Exposes the prediction engine endpoint, schedules long-running inference tasks to Celery queue, and immediately returns task IDs to client." },
        { path: "app/core/security.py", description: "Implements industry-standard password hashing using bcrypt and handles generation/validation of stateless JWT authorization credentials." },
        { path: "app/tasks/worker.py", description: "Celery task execution unit that loads deep learning model weights and evaluates data batches asynchronously in a background worker context." }
      ],
      improvements: [
        "Implement request rate limiting middleware in app/main.py using redis-rate-limiter.",
        "Add database indexing on foreign keys in app/models/prediction.py for faster history lookups.",
        "Switch SQLAlchemy database driver to asyncpg to ensure true asynchronous connection pooling across all routers."
      ],
      suggestedQuestions: [
        "How are predictions processed asynchronously and synced with Celery?",
        "Explain the authentication middleware and how JWT checks are performed in app/api/deps.py.",
        "What is the structure of SQLAlchemy models and migrations in this project?"
      ],
      initialGreeting: "Neural API Core initialized. I've mapped this Python FastAPI backend structure. It employs modern async structures, strict security abstractions, and decoupled background workers. Ask me anything about its configurations, endpoints, or db models!"
    }
  }
};

// GET Demo Repositories
app.get("/api/demo-repos", (req, res) => {
  res.json({ success: true, repos: Object.keys(DEMO_REPOSITORIES) });
});

// GET Fetch Demo Repo directly
app.get("/api/demo-repo/:key", (req, res) => {
  const repo = DEMO_REPOSITORIES[req.params.key];
  if (repo) {
    res.json({ success: true, ...repo });
  } else {
    res.status(404).json({ success: false, error: "Demo repository not found." });
  }
});

// Analyze GitHub Repository URL
app.post("/api/analyze", async (req, res) => {
  const { repoUrl, githubToken, useDemo, demoKey } = req.body;

  // Handle Demo mode requested from client
  if (useDemo && demoKey) {
    const demoData = DEMO_REPOSITORIES[demoKey];
    if (demoData) {
      return res.json({ success: true, isDemo: true, ...demoData });
    }
  }

  if (!repoUrl) {
    return res.status(400).json({ success: false, error: "Repository URL is required." });
  }

  const parsed = parseGithubUrl(repoUrl);
  if (!parsed) {
    return res.status(400).json({
      success: false,
      error: "Invalid GitHub URL format. Please provide a link in the form of 'https://github.com/owner/repository'."
    });
  }

  const { owner, repo } = parsed;
  const headers: HeadersInit = {
    "User-Agent": "RepoSpace-App",
    "Accept": "application/vnd.github.v3+json",
  };

  if (githubToken && githubToken.trim() !== "") {
    headers["Authorization"] = `token ${githubToken.trim()}`;
  }

  try {
    // 1. Fetch Repository Info (To find default branch and basic metadata)
    const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    
    if (repoInfoRes.status === 404) {
      return res.status(404).json({
        success: false,
        error: `GitHub Repository '${owner}/${repo}' was not found. If this repository is private, please provide a GitHub Personal Access Token in the Advanced Settings.`
      });
    }

    if (repoInfoRes.status === 403) {
      const rateLimitRemaining = repoInfoRes.headers.get("x-ratelimit-remaining");
      if (rateLimitRemaining === "0") {
        return res.status(403).json({
          success: false,
          isRateLimit: true,
          error: "GitHub API rate limit exceeded for your server IP. Please use one of our pre-analyzed Sandboxed Demo repositories in the dropdown, or provide a GitHub Personal Access Token in the settings tab to execute this live scan."
        });
      }
      return res.status(403).json({
        success: false,
        error: "GitHub API access forbidden. Ensure the repository is public or your token has sufficient read permissions."
      });
    }

    if (!repoInfoRes.ok) {
      const errText = await repoInfoRes.text();
      throw new Error(`GitHub API returned error: ${repoInfoRes.status} - ${errText}`);
    }

    const repoDetails = await repoInfoRes.json();
    const defaultBranch = repoDetails.default_branch || "main";

    const repoInfo = {
      name: repoDetails.name,
      owner: repoDetails.owner?.login || owner,
      description: repoDetails.description || "No description provided.",
      stars: repoDetails.stargazers_count || 0,
      forks: repoDetails.forks_count || 0,
      language: repoDetails.language || "Unknown",
      defaultBranch,
    };

    // 2. Fetch Git Tree recursively to understand directory structure
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
    const treeRes = await fetch(treeUrl, { headers });
    
    let rawTree: any[] = [];
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      rawTree = treeData.tree || [];
    } else {
      console.warn(`Could not fetch git tree recursively, falling back to a flat repository overview.`);
    }

    // Filter and sanitize tree to stay within reasonable token/processing limits
    // Skip binary, lock, minified, or auto-generated folders
    const skipFolders = ["node_modules", ".git", "dist", "build", "target", "venv", ".next", ".nuxt", "out", "vendor", "pods"];
    const skipFiles = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "cargo.lock", "poetry.lock", "mix.lock", "gradle-wrapper.properties"];
    const skipExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg", ".mp4", ".pdf", ".zip", ".tar.gz", ".woff", ".woff2", ".eot", ".ttf"];

    const sanitizedTree = rawTree
      .filter((item) => {
        const parts = item.path.split("/");
        // Check folder skips
        if (parts.some((part: string) => skipFolders.includes(part))) {
          return false;
        }
        // Check file skips
        const fileName = parts[parts.length - 1];
        if (skipFiles.includes(fileName)) {
          return false;
        }
        // Check extensions
        if (skipExtensions.some((ext) => fileName.endsWith(ext))) {
          return false;
        }
        return true;
      })
      .map((item) => ({
        path: item.path,
        type: item.type === "tree" ? "tree" : "blob",
        size: item.size || 0
      }))
      .slice(0, 300); // Limit to top 300 files to stay efficient

    // 3. Fetch key files to provide deep concrete implementation context (README & manifest files)
    let readmeContent = "";
    let manifestContent = "";

    // Helper to fetch single file content raw
    const fetchRawFile = async (filePath: string): Promise<string> => {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${filePath}`;
        const rawRes = await fetch(rawUrl, { headers });
        if (rawRes.ok) {
          const text = await rawRes.text();
          return text.slice(0, 4000); // Grab up to 4KB of content
        }
      } catch (e) {
        console.error(`Failed to fetch raw file ${filePath}:`, e);
      }
      return "";
    };

    // Find readme
    const readmeItem = sanitizedTree.find(f => f.path.toLowerCase() === "readme.md");
    if (readmeItem) {
      readmeContent = await fetchRawFile(readmeItem.path);
    }

    // Find main dependency manifest
    const manifestCandidates = ["package.json", "requirements.txt", "cargo.toml", "gemfile", "go.mod", "pom.xml", "build.gradle"];
    const manifestItem = sanitizedTree.find(f => manifestCandidates.includes(f.path.toLowerCase()));
    if (manifestItem) {
      manifestContent = await fetchRawFile(manifestItem.path);
    }

    // 4. Use Gemini to perform intelligence analysis
    const ai = getGeminiClient();

    const analysisPrompt = `
You are the AI Engine of "RepoSpace", an ultra-advanced AI repository intelligence system.
Analyze this scanned GitHub repository metadata, file tree, readme, and manifest content.
Repository Name: "${repoInfo.name}"
Owner: "${repoInfo.owner}"
Primary Detected Language: "${repoInfo.language}"
Description: "${repoInfo.description}"

Manifest content snippet (if any):
\`\`\`
${manifestContent}
\`\`\`

README content snippet (if any):
\`\`\`
${readmeContent}
\`\`\`

Here is the filtered list of files (first 300 files maximum) from the repository tree:
${JSON.stringify(sanitizedTree.slice(0, 150), null, 2)}

Based on the structure, technologies, readme, and file tree:
Perform a deep technical architecture analysis and output a structured JSON response conforming exactly to the following properties:
1. "summary": A highly concise, professional 3-sentence summary of what this application/library is and its core functionality.
2. "techStack": An array of strings representing the primary detected frameworks, libraries, technologies, databases, and programming languages.
3. "architecture": A detailed description (1-2 paragraphs) of the codebase design pattern, folder organization, state/logic management, and how the main modules interact.
4. "keyModules": An array of objects, where each object has "path" (the actual file/folder path from the tree) and "description" (a quick technical description of its role in the system). Select 4-6 most critical entry points, configs, or component files.
5. "improvements": An array of 3-4 concrete, highly technical, constructive improvement recommendations (e.g. refactoring code, adding type safety, modularization, caching, test suites, rate limiters, etc.).
6. "suggestedQuestions": An array of exactly 3 highly specific technical questions that are relevant to this exact codebase structure that the user might want to click to ask.
7. "initialGreeting": An interactive, enthusiastic greeting written in a futuristic, intelligent tone, summarizing your findings in 2 sentences, welcoming the user, and encouraging them to dive deep.

Ensure you respond in valid, parseable JSON and nothing else. No markdown wrappers around the JSON, just pure JSON.
`;

    const geminiRes = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: analysisPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const textOutput = geminiRes.text;
    if (!textOutput) {
      throw new Error("Failed to get response text from Gemini.");
    }

    const analysis = JSON.parse(textOutput.trim());

    return res.json({
      success: true,
      repoInfo,
      tree: sanitizedTree,
      analysis
    });

  } catch (error: any) {
    console.error("Deep scanning failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred while analyzing the repository. Ensure the URL is valid."
    });
  }
});

// Chat with Gemini about the scanned repository
app.post("/api/chat", async (req, res) => {
  const { repoInfo, tree, analysis, messages } = req.body;

  if (!repoInfo || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, error: "Invalid request payload. Missing repoInfo or messages." });
  }

  try {
    const ai = getGeminiClient();

    // Build standard system instructions based on repository context
    const fileTreeSummary = tree && Array.isArray(tree)
      ? tree.slice(0, 100).map((f: any) => `- ${f.path} (${f.type})`).join("\n")
      : "File tree not scanned or unavailable.";

    const systemInstruction = `
You are the interactive AI resident intelligence agent at RepoSpace, an advanced AI Repository Intelligence platform.
You are helping a developer explore, understand, and build upon the following repository:
Name: ${repoInfo.owner}/${repoInfo.name}
Description: ${repoInfo.description}
Detected Languages: ${repoInfo.language}

Architectural Context:
${analysis?.architecture || "No architecture summary provided."}

Primary Tech Stack:
${analysis?.techStack?.join(", ") || "No stack detected."}

Codebase Core Improvements:
${analysis?.improvements?.map((imp: string) => `- ${imp}`).join("\n") || "No suggestions."}

First 100 files of the codebase structure:
${fileTreeSummary}

Rules for your responses:
1. Provide extremely technical, accurate, clear, and context-aware responses.
2. If the user asks for feature enhancements or refactoring, provide clean, production-ready, beautiful code snippets using TypeScript, React, Python, or whatever matching tech stack the repo employs.
3. Be conversational, direct, and helpful. Use markdown formatting beautifully (headers, bold key terms, blockquotes, styled bullet points).
4. If a file path from the user exists in the file tree, discuss it with deep structural understanding of where it sits.
5. Maintain a futuristic, professional, clean tech personality.
`;

    // Feed in previous messages as conversation context
    // Since we're stateless, we reconstruct the chat history.
    // The history property format: array of { role: 'user' | 'model', parts: [{ text: '...' }] }
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: msg.content }]
    }));

    // Map messages payload to Gemini SDK format with initial history
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      history: history,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // Send the last message in history
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      throw new Error("No user message found to process.");
    }

    const chatResponse = await chat.sendMessage({
      message: lastMessage.content
    });

    return res.json({
      success: true,
      reply: chatResponse.text
    });

  } catch (error: any) {
    console.error("Chat routine failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred during chat reasoning."
    });
  }
});

// Serve frontend assets
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[RepoSpace Server] running on http://localhost:${PORT}`);
  });
}

startServer();
