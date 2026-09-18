/**
 * Career Command Center data.
 * Everything editable by hand lives here. Trackers that the user edits in the UI
 * are persisted to localStorage and seeded from these defaults.
 *
 * Nothing in this file may claim achievements, credentials, statistics or
 * experience that has not actually happened.
 */

export interface SkillGroup {
  category: string;
  skills: { name: string; level: number }[];
}

export interface RoadmapPhase {
  id: string;
  years: string;
  stage: string;
  title: string;
  focus: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tech: string[];
  status: "Built" | "In progress" | "Exploring";
  github: string | null;
  demo: string | null;
  details: string[];
}

export interface LearningItem {
  id: string;
  topic: string;
  status: "Learning" | "Active" | "Planned" | "Future" | "Completed";
  progress: number;
  startDate: string;
  notes: string;
  resources: string;
}

export interface TreeNode {
  id: string;
  label: string;
  why: string;
  prerequisites: string[];
  learn: string[];
  project: string;
  status: "Not started" | "In progress" | "Comfortable";
}

export interface Milestone {
  id: string;
  label: string;
  done: boolean;
}

export interface Scoreboard {
  label: string;
  value: number;
}

export const careerData = {
  currentStage: "Class 9",
  target: "AI/ML Engineer",
  nextMilestone: "Strong programming + mathematics foundation",

  mission: [
    { key: "now", label: "Now", value: "Class 9 student" },
    { key: "next", label: "Next", value: "Strong programmer + strong mathematics foundation" },
    { key: "then", label: "Then", value: "AI/ML specialization" },
    { key: "target", label: "Target", value: "B.Tech CSE" },
    { key: "destination", label: "Destination", value: "AI/ML Engineer" },
  ],

  missionStatement:
    "I don't want to collect technologies. I want to understand how they work, build real systems, and create a body of work that proves my ability.",

  roadmap: [
    {
      id: "r1",
      years: "2026–2027",
      stage: "Class 9",
      title: "Foundation",
      focus: ["Python", "Mathematics", "Programming fundamentals", "Git/GitHub", "HTML/CSS/JavaScript", "Linux basics", "Small-to-medium projects"],
    },
    {
      id: "r2",
      years: "2027–2028",
      stage: "Class 10",
      title: "Strong Programmer",
      focus: ["Advanced Python", "C++", "DSA", "SQL", "OOP", "APIs", "Linux", "Docker", "Networking basics", "First serious ML experiments"],
    },
    {
      id: "r3",
      years: "2028–2029",
      stage: "Class 11",
      title: "AI/ML Foundations",
      focus: ["Probability", "Statistics", "Linear algebra", "Calculus", "NumPy", "Pandas", "scikit-learn", "Machine learning algorithms", "Model evaluation"],
    },
    {
      id: "r4",
      years: "2029–2030",
      stage: "Class 12",
      title: "Deep Learning",
      focus: ["PyTorch", "Neural networks", "Deep learning", "Computer vision", "NLP", "Transformers", "LLM fundamentals", "AI engineering"],
    },
    {
      id: "r5",
      years: "2030–2034",
      stage: "B.Tech CSE",
      title: "Engineering + Specialization",
      focus: ["DSA", "Algorithms", "Operating Systems", "DBMS", "Computer Networks", "Software Engineering", "ML/AI", "Internships", "Open source", "Research", "Production systems"],
    },
    {
      id: "r6",
      years: "2034+",
      stage: "Career",
      title: "AI/ML Engineer",
      focus: ["Production AI systems", "Advanced ML", "Model optimization", "Distributed systems", "MLOps", "Research/engineering", "Real-world impact"],
    },
  ] as RoadmapPhase[],

  /** Self-assessment only. 0–100. */
  skills: [
    {
      category: "Programming",
      skills: [
        { name: "Python", level: 55 },
        { name: "C++", level: 35 },
        { name: "JavaScript", level: 50 },
        { name: "HTML/CSS", level: 60 },
      ],
    },
    {
      category: "AI/ML",
      skills: [
        { name: "Machine Learning", level: 10 },
        { name: "Deep Learning", level: 5 },
        { name: "PyTorch", level: 5 },
        { name: "NumPy", level: 15 },
        { name: "Pandas", level: 15 },
        { name: "Transformers", level: 5 },
      ],
    },
    {
      category: "Computer Science",
      skills: [
        { name: "DSA", level: 15 },
        { name: "Algorithms", level: 15 },
        { name: "OOP", level: 30 },
        { name: "DBMS", level: 15 },
        { name: "Operating Systems", level: 20 },
        { name: "Networking", level: 25 },
      ],
    },
    {
      category: "Engineering",
      skills: [
        { name: "Git", level: 40 },
        { name: "Docker", level: 35 },
        { name: "Linux", level: 45 },
        { name: "APIs", level: 40 },
        { name: "Testing", level: 15 },
        { name: "Cloud", level: 20 },
        { name: "MLOps", level: 5 },
      ],
    },
    {
      category: "Hardware",
      skills: [
        { name: "Arduino", level: 50 },
        { name: "Raspberry Pi", level: 45 },
        { name: "ESP", level: 45 },
        { name: "Sensors", level: 40 },
        { name: "IoT", level: 45 },
      ],
    },
  ] as SkillGroup[],

  projects: [
    {
      id: "p1",
      name: "Self-Hosted Cloud File Server",
      description:
        "Built a self-hosted cloud/file-sharing system supporting uploads, password protection, and remote access.",
      tech: ["Python", "Flask", "Docker", "Tailscale", "Nextcloud"],
      status: "Built",
      github: null,
      demo: null,
      details: [
        "File uploads with password-protected shares",
        "Remote access over a private network",
        "Runs in containers on self-hosted hardware",
      ],
    },
    {
      id: "p2",
      name: "Office Machine Monitoring Dashboard",
      description:
        "Interactive dashboard for machine metrics and spreadsheet-based data visualization.",
      tech: ["HTML", "CSS", "JavaScript", "Chart.js", "SheetJS"],
      status: "Built",
      github: null,
      demo: null,
      details: [
        "Reads spreadsheet data in the browser",
        "Charts machine metrics interactively",
        "No backend required",
      ],
    },
    {
      id: "p3",
      name: "Smart Hardware IoT Clock & Access Control",
      description:
        "RFID access-control system combined with real-time clock and OLED display functionality.",
      tech: ["C++", "Arduino", "ESP", "DS3231", "SSD1306", "MFRC522"],
      status: "Built",
      github: null,
      demo: null,
      details: [
        "RFID card reading for access control",
        "DS3231 real-time clock",
        "SSD1306 OLED interface",
      ],
    },
    {
      id: "p4",
      name: "Aarav AI Chatbot",
      description:
        "AI conversational application with web interface and API-based AI functionality.",
      tech: ["Python", "HTML", "REST APIs"],
      status: "Built",
      github: null,
      demo: null,
      details: [
        "Web chat interface",
        "Calls AI APIs for responses",
        "Python backend",
      ],
    },
    {
      id: "p5",
      name: "3D Browser Games & Voxel Engine",
      description:
        "3D browser prototypes exploring custom physics, collision systems, chunk-based rendering, and voxel environments.",
      tech: ["JavaScript", "Three.js", "WebGL"],
      status: "In progress",
      github: null,
      demo: null,
      details: [
        "Custom physics and collision handling",
        "Chunk-based voxel rendering",
        "Runs entirely in the browser",
      ],
    },
  ] as Project[],

  learning: [
    { id: "l1", topic: "Python", status: "Learning", progress: 55, startDate: "", notes: "", resources: "" },
    { id: "l2", topic: "Mathematics", status: "Active", progress: 40, startDate: "", notes: "", resources: "" },
    { id: "l3", topic: "Git/GitHub", status: "Active", progress: 40, startDate: "", notes: "", resources: "" },
    { id: "l4", topic: "DSA", status: "Planned", progress: 10, startDate: "", notes: "", resources: "" },
    { id: "l5", topic: "Machine Learning", status: "Future", progress: 0, startDate: "", notes: "", resources: "" },
  ] as LearningItem[],

  tree: [
    { id: "t1", label: "Mathematics", why: "Every ML idea is maths in disguise. Without it you can only copy code.", prerequisites: [], learn: ["Algebra", "Functions & graphs", "Basic calculus intuition"], project: "Plot functions and their derivatives with code.", status: "In progress" },
    { id: "t2", label: "Python", why: "The working language of machine learning.", prerequisites: ["Mathematics"], learn: ["Syntax", "Data structures", "Functions & OOP", "Virtual environments"], project: "A command-line tool you actually use.", status: "In progress" },
    { id: "t3", label: "NumPy / Pandas", why: "Data handling is most of the job before any model exists.", prerequisites: ["Python"], learn: ["Arrays & broadcasting", "DataFrames", "Cleaning & joining data"], project: "Clean a messy public dataset and answer 5 questions with it.", status: "Not started" },
    { id: "t4", label: "Statistics", why: "Tells you whether a result is real or noise.", prerequisites: ["Mathematics", "NumPy / Pandas"], learn: ["Distributions", "Mean/variance", "Correlation", "Hypothesis testing"], project: "Statistical report on a dataset you care about.", status: "Not started" },
    { id: "t5", label: "Machine Learning", why: "The core toolkit: learning patterns from data.", prerequisites: ["Statistics", "NumPy / Pandas"], learn: ["Regression", "Classification", "Train/test split", "Evaluation metrics", "Overfitting"], project: "End-to-end scikit-learn model with honest evaluation.", status: "Not started" },
    { id: "t6", label: "Deep Learning", why: "Where modern AI performance comes from.", prerequisites: ["Machine Learning"], learn: ["Neurons & layers", "Backpropagation", "Loss functions", "Optimisers"], project: "Train a small neural net from scratch, then with a framework.", status: "Not started" },
    { id: "t7", label: "PyTorch", why: "The framework most research and production DL is written in.", prerequisites: ["Deep Learning"], learn: ["Tensors", "autograd", "nn.Module", "Training loops"], project: "Reimplement a paper's small model.", status: "Not started" },
    { id: "t8", label: "Computer Vision / NLP", why: "The two domains where deep learning proved itself.", prerequisites: ["PyTorch"], learn: ["CNNs", "Image augmentation", "Tokenisation", "Embeddings"], project: "An image classifier and a text classifier.", status: "Not started" },
    { id: "t9", label: "Transformers", why: "The architecture behind nearly all current AI systems.", prerequisites: ["Computer Vision / NLP"], learn: ["Attention", "Positional encoding", "Encoder/decoder"], project: "Build a tiny transformer from scratch.", status: "Not started" },
    { id: "t10", label: "LLMs", why: "Understanding them beats merely calling their APIs.", prerequisites: ["Transformers"], learn: ["Pretraining vs fine-tuning", "Tokenizers", "Evaluation", "Limitations"], project: "Fine-tune a small open model on your own data.", status: "Not started" },
    { id: "t11", label: "AI Engineering", why: "Turning models into things people can use.", prerequisites: ["LLMs"], learn: ["Serving models", "Latency & cost", "Retrieval", "Guardrails"], project: "Ship an AI feature with monitoring.", status: "Not started" },
    { id: "t12", label: "Production ML Systems", why: "The difference between a notebook and a real product.", prerequisites: ["AI Engineering"], learn: ["Data pipelines", "MLOps", "Monitoring & drift", "Scaling"], project: "A deployed system that retrains and monitors itself.", status: "Not started" },
  ] as TreeNode[],

  milestones: [
    "Strengthen Python fundamentals",
    "Learn Git properly",
    "Build a serious Python project",
    "Learn DSA fundamentals",
    "Improve mathematical foundations",
    "Build first ML project",
    "Learn NumPy",
    "Learn Pandas",
    "Learn scikit-learn",
    "Learn PyTorch",
    "Build an end-to-end ML system",
    "Make an open-source contribution",
    "Publish a technical article",
    "Build an impressive AI project",
    "Get first internship",
    "Contribute to research",
    "Become an AI/ML Engineer",
  ].map((label, i): Milestone => ({ id: `m${i + 1}`, label, done: false })),

  scoreboard: [
    { label: "Programming", value: 60 },
    { label: "Mathematics", value: 50 },
    { label: "Computer Science", value: 30 },
    { label: "AI/ML", value: 20 },
    { label: "Projects", value: 60 },
    { label: "Open Source", value: 10 },
    { label: "Research", value: 0 },
    { label: "Communication", value: 40 },
  ] as Scoreboard[],

  principles: [
    "Build more than I consume.",
    "Understand fundamentals before chasing frameworks.",
    "Don't confuse API usage with AI expertise.",
    "Measure projects instead of making vague claims.",
    "Document what I build.",
    "Learn mathematics instead of avoiding it.",
    "Build fewer, better projects.",
    "Contribute to real software.",
    "Stay curious.",
    "Let results update the resume.",
  ],

  resume: {
    profile:
      "Class 9 student in India building toward B.Tech Computer Science and a career in AI/ML engineering. Self-taught across software, hardware and self-hosted systems; focused on understanding how things work rather than collecting tools.",
    skills: [
      "Python, JavaScript, C++, HTML/CSS",
      "Flask, Three.js, Chart.js",
      "Git, Docker, Linux, Tailscale, Nextcloud",
      "Arduino, Raspberry Pi, ESP hardware, sensors, IoT",
      "REST APIs, AI APIs",
    ],
    projects: [
      "Self-Hosted Cloud File Server — Python, Flask, Docker, Tailscale, Nextcloud",
      "Office Machine Monitoring Dashboard — JavaScript, Chart.js, SheetJS",
      "Smart Hardware IoT Clock & Access Control — C++, Arduino, ESP",
      "Aarav AI Chatbot — Python, REST APIs",
      "3D Browser Games & Voxel Engine — JavaScript, Three.js, WebGL",
    ],
    education: "Class 9 (2026–2027) · Target: B.Tech Computer Science",
    interests: [
      "Machine learning and deep learning",
      "Self-hosted infrastructure",
      "Embedded systems and IoT",
      "3D graphics and game engines",
    ],
    /** Set this to a real file URL when a PDF exists. Keep null until then. */
    pdfUrl: null as string | null,
  },

  github: {
    /** Fill in when ready; the panel fetches public data only once this is set. */
    username: null as string | null,
  },

  vision: {
    text:
      "From building small systems in Class 9 to engineering intelligent systems professionally. The objective isn't to look advanced early. It's to become genuinely capable over time.",
    progression: ["Student", "Builder", "Programmer", "CS Engineer", "ML Engineer", "AI/ML Engineer"],
  },
};

export type CareerData = typeof careerData;
