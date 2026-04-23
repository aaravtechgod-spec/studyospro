// 24-week (168-day) AI/ML Engineer roadmap.
// Each week = one phase. Each day has a focused 2-4h target you can tick off.
// Designed to take you from zero to job-ready ML engineer.

export type Phase = {
  id: number;
  weeks: [number, number]; // inclusive
  title: string;
  goal: string;
  color: "primary" | "info" | "warning" | "xp" | "success";
  resources: { label: string; url: string }[];
};

export type DayTask = {
  day: number;        // 1..168
  week: number;       // 1..24
  phaseId: number;
  title: string;
  detail: string;
  hours: number;      // recommended focus hours
};

export const PHASES: Phase[] = [
  {
    id: 1, weeks: [1, 2], title: "Python Foundations", color: "primary",
    goal: "Write fluent, idiomatic Python. The language of ML.",
    resources: [
      { label: "Python Crash Course (Eric Matthes)", url: "https://ehmatthes.github.io/pcc/" },
      { label: "Real Python", url: "https://realpython.com/" },
    ],
  },
  {
    id: 2, weeks: [3, 4], title: "Math for ML", color: "info",
    goal: "Linear algebra, calculus, probability — just enough to read papers.",
    resources: [
      { label: "3Blue1Brown — Linear Algebra", url: "https://www.3blue1brown.com/topics/linear-algebra" },
      { label: "Mathematics for Machine Learning (book)", url: "https://mml-book.github.io/" },
    ],
  },
  {
    id: 3, weeks: [5, 6], title: "Data Wrangling & Viz", color: "primary",
    goal: "NumPy, Pandas, Matplotlib/Seaborn. Be dangerous with messy data.",
    resources: [
      { label: "Pandas Docs — 10 minutes to pandas", url: "https://pandas.pydata.org/docs/user_guide/10min.html" },
      { label: "Kaggle Learn — Pandas", url: "https://www.kaggle.com/learn/pandas" },
    ],
  },
  {
    id: 4, weeks: [7, 9], title: "Classical ML", color: "warning",
    goal: "scikit-learn end-to-end: regression, trees, ensembles, evaluation.",
    resources: [
      { label: "Hands-On ML (Géron) — Part 1", url: "https://www.oreilly.com/library/view/hands-on-machine-learning/9781098125967/" },
      { label: "Andrew Ng — ML Specialization", url: "https://www.coursera.org/specializations/machine-learning-introduction" },
    ],
  },
  {
    id: 5, weeks: [10, 13], title: "Deep Learning", color: "info",
    goal: "PyTorch + neural nets: MLPs, CNNs, RNNs, training tricks.",
    resources: [
      { label: "PyTorch — 60-min Blitz", url: "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html" },
      { label: "fast.ai — Practical DL", url: "https://course.fast.ai/" },
    ],
  },
  {
    id: 6, weeks: [14, 16], title: "NLP & Transformers", color: "xp",
    goal: "Tokenizers, embeddings, attention, fine-tuning Hugging Face models.",
    resources: [
      { label: "HF — NLP Course", url: "https://huggingface.co/learn/nlp-course" },
      { label: "Karpathy — Let's build GPT", url: "https://www.youtube.com/watch?v=kCc8FmEb1nY" },
    ],
  },
  {
    id: 7, weeks: [17, 19], title: "LLMs, RAG & Agents", color: "primary",
    goal: "Prompt engineering, RAG, vector DBs, function calling, agents.",
    resources: [
      { label: "LangChain Docs", url: "https://python.langchain.com/docs/get_started/introduction" },
      { label: "OpenAI Cookbook", url: "https://github.com/openai/openai-cookbook" },
    ],
  },
  {
    id: 8, weeks: [20, 22], title: "MLOps & Deployment", color: "warning",
    goal: "Docker, FastAPI, MLflow, CI/CD, model serving on cloud.",
    resources: [
      { label: "Made With ML — MLOps", url: "https://madewithml.com/" },
      { label: "Full Stack Deep Learning", url: "https://fullstackdeeplearning.com/" },
    ],
  },
  {
    id: 9, weeks: [23, 24], title: "Capstone & Job Prep", color: "success",
    goal: "Portfolio project, GitHub polish, resume, interview drills.",
    resources: [
      { label: "Chip Huyen — ML Interviews Book", url: "https://huyenchip.com/ml-interviews-book/" },
      { label: "Papers With Code", url: "https://paperswithcode.com/" },
    ],
  },
];

// 7 daily targets per week. Each phase repeats its weekly pattern.
const PHASE_DAYS: Record<number, string[][]> = {
  1: [
    // Week 1
    [
      "Install Python 3.12 + VS Code; run hello world.|Set up venv, pip, ruff, black. Print 'Hello, AI'.|2",
      "Variables, types, f-strings, basic I/O.|Build a tip-calculator CLI.|2",
      "Lists, tuples, dicts, sets — operations & comprehensions.|Solve 5 easy problems on HackerRank.|3",
      "Control flow: if/elif/else, for, while, range.|Write FizzBuzz + prime sieve.|2",
      "Functions, *args/**kwargs, default & keyword args.|Refactor week-1 scripts into functions.|2",
      "Modules, imports, virtualenvs.|Split your CLI into multiple .py files; add requirements.txt.|2",
      "Mini project: build a 'todo list' CLI saved to JSON.|Add/list/delete tasks; persist between runs.|3",
    ],
    // Week 2
    [
      "OOP: classes, __init__, methods, inheritance.|Model a `BankAccount` class with deposit/withdraw.|3",
      "Exceptions, context managers (`with`), file I/O.|Read/write CSV without pandas.|2",
      "Iterators, generators, decorators.|Write a `@timer` decorator and a Fibonacci generator.|3",
      "Type hints, dataclasses, enums, pathlib.|Convert prior project to typed dataclasses.|2",
      "stdlib tour: itertools, collections, functools, datetime.|Solve 5 LeetCode 'Easy' tagged 'array'.|3",
      "Async basics: asyncio, await, aiohttp.|Fetch 10 URLs concurrently and time it.|3",
      "Test & polish: pytest + coverage on todo CLI.|Add 5 unit tests; reach 80% coverage.|3",
    ],
  ],
  2: [
    // Week 3 — Linear Algebra
    [
      "Vectors, dot product, geometric intuition.|Watch 3B1B Ep.1–2; do 5 paper problems.|2",
      "Matrices & matrix multiplication.|Implement matmul with nested loops, then NumPy.|3",
      "Linear transformations, basis change, determinant.|Watch 3B1B Ep.3–6; visualize 2x2 transforms.|2",
      "Eigenvalues, eigenvectors, diagonalization.|Compute eigenvectors of a 3x3 by hand + NumPy.|3",
      "SVD intuition.|Decompose a small image with `np.linalg.svd`.|3",
      "Norms, distances, projections.|Code L1, L2 norms; project vector onto plane.|2",
      "Recap quiz + Anki cards for week's terms.|Make 20 flashcards (use Studyspring).|2",
    ],
    // Week 4 — Calculus + Probability
    [
      "Derivatives, chain rule, partial derivatives.|Differentiate 10 functions by hand.|3",
      "Gradient, gradient descent intuition.|Plot loss surface of MSE for `y = wx`.|3",
      "Implement gradient descent from scratch.|Fit `y = 2x + 1` using only NumPy.|3",
      "Probability basics: events, conditional, Bayes.|Solve 5 Bayes problems.|2",
      "Distributions: Bernoulli, Binomial, Normal.|Plot all three with matplotlib.|2",
      "Expectation, variance, MLE intuition.|Derive MLE for Bernoulli on paper.|3",
      "Mini project: code linear regression by hand on housing data.|No sklearn allowed. Compare vs NumPy least-squares.|3",
    ],
  ],
  3: [
    // Week 5 — NumPy + Pandas
    [
      "NumPy: arrays, dtypes, shapes, reshape, axis.|Solve 20 NumPy puzzles from Nicolas Rougier.|3",
      "Broadcasting, vectorization, fancy indexing.|Replace a Python loop with vectorized NumPy.|2",
      "Pandas: Series, DataFrame, indexing, dtypes.|Load Titanic CSV; explore .info(), .describe().|2",
      "GroupBy, merge, join, pivot.|Compute survival rate by class & gender.|3",
      "Time series in pandas: resample, rolling.|Plot rolling 7-day mean of any stock.|2",
      "Cleaning: missing values, dtypes, outliers.|Clean Titanic; produce a tidy CSV.|3",
      "Practice: 1 Kaggle dataset EDA notebook.|Publish notebook to Kaggle.|3",
    ],
    // Week 6 — Visualization + EDA
    [
      "Matplotlib basics: figure, axes, subplots.|Recreate 3 charts from a news article.|2",
      "Seaborn: relplot, catplot, pairplot, heatmap.|Pairplot Iris; correlation heatmap on Titanic.|2",
      "Plotly basics & interactive charts.|Build an interactive scatter with hover info.|2",
      "Storytelling with data: principles.|Read 'Storytelling with Data' Ch.1–3.|2",
      "EDA template: missingness, distributions, target leakage.|Run template on a fresh Kaggle dataset.|3",
      "Feature engineering basics.|Create 5 derived features for Titanic.|3",
      "Mini project: full EDA + writeup as Markdown.|Publish to GitHub Pages or HF Spaces.|3",
    ],
  ],
  4: [
    // Week 7 — sklearn basics
    [
      "Train/test split, cross-validation, leakage.|Build a CV harness reusable across notebooks.|3",
      "Linear & logistic regression in sklearn.|Predict Titanic survival; report accuracy.|3",
      "Decision trees, overfitting, pruning.|Tune max_depth; plot train vs val curve.|2",
      "Random forests, bagging.|Beat your tree score; track in a leaderboard table.|3",
      "Gradient boosting: XGBoost, LightGBM, CatBoost.|Train all three; compare AUC.|3",
      "Hyperparameter search: GridSearchCV, Optuna.|Run 50-trial Optuna study on LightGBM.|3",
      "Pipelines, ColumnTransformer, custom transformers.|Refactor week's code into a single Pipeline.|3",
    ],
    // Week 8 — Eval & unsupervised
    [
      "Classification metrics: precision, recall, F1, ROC, PR.|Plot all curves on Titanic predictions.|2",
      "Regression metrics: MAE, RMSE, R², MAPE.|Predict house prices; report all four.|2",
      "Imbalanced data: SMOTE, class_weight, threshold tuning.|Fix imbalance on Credit Card Fraud dataset.|3",
      "Clustering: K-Means, DBSCAN, hierarchical.|Cluster customer segments; visualize with PCA.|3",
      "Dimensionality reduction: PCA, t-SNE, UMAP.|Compare all three on MNIST.|3",
      "Anomaly detection: IsolationForest, OneClassSVM.|Detect fraud anomalies; compare to supervised.|3",
      "Mini project: end-to-end Kaggle competition entry.|Submit to a 'Getting Started' competition.|4",
    ],
    // Week 9 — Productionizable ML
    [
      "Feature stores & data versioning (DVC intro).|Track Titanic data with DVC.|2",
      "Experiment tracking with MLflow.|Log 10 runs; compare in MLflow UI.|3",
      "Model persistence: joblib, ONNX intro.|Save & reload your best model.|2",
      "Build a FastAPI inference endpoint.|POST features → JSON predictions.|3",
      "Test the API: pytest + httpx.|Add 5 endpoint tests; run in CI.|3",
      "Dockerize the API.|`docker run` your model locally on port 8000.|3",
      "Capstone: deploy classifier to HF Spaces or Render.|Share a live URL.|4",
    ],
  ],
  5: [
    // Week 10 — PyTorch fundamentals
    [
      "Tensors: creation, ops, broadcasting, GPU move.|Port 5 NumPy snippets to torch.|2",
      "Autograd: requires_grad, backward, .grad.|Differentiate `y = x^3` at x=2 with autograd.|2",
      "nn.Module: layers, forward, parameters.|Build an MLP for MNIST (no training yet).|3",
      "Loss functions, optimizers, training loop.|Train MNIST MLP to >95% test acc.|3",
      "DataLoaders, Datasets, transforms.|Write a custom Dataset for a CSV.|3",
      "Saving/loading models, eval mode, no_grad.|Checkpoint best epoch; reload & predict.|2",
      "Recap: rewrite Day 4 model with type hints + tests.|Add pytest for forward shape.|3",
    ],
    // Week 11 — CNNs
    [
      "Convolutions, kernels, padding, stride.|Visualize 3 conv kernels on a sample image.|2",
      "Pooling, batchnorm, dropout.|Add BN+Dropout to MNIST CNN.|2",
      "Build a CNN for CIFAR-10.|Train to >70% test acc.|4",
      "Data augmentation with torchvision.|Add random crop + flip; measure gain.|3",
      "Transfer learning: ResNet18 fine-tune.|Beat your scratch CNN on CIFAR-10.|4",
      "Visualizing activations & saliency maps.|Plot Grad-CAM on 3 images.|3",
      "Mini project: classify a custom 5-class image dataset.|Collect ~100 images/class; reach >85% acc.|4",
    ],
    // Week 12 — RNNs & sequences
    [
      "Sequence data, embeddings, padding/masking.|Tokenize IMDB reviews into integer IDs.|2",
      "RNN, LSTM, GRU intuition.|Train an LSTM on IMDB sentiment.|3",
      "Teacher forcing, seq2seq architecture.|Build a tiny char-level seq2seq.|4",
      "Attention mechanism (Bahdanau).|Add attention to your seq2seq.|3",
      "Train/val/test discipline, early stopping.|Add early stopping callback to training loop.|2",
      "Profiling & speeding up training.|Use torch.profiler; cut epoch time 30%.|3",
      "Mini project: time-series forecasting with LSTM.|Forecast next 7 days of any series.|4",
    ],
    // Week 13 — Training mastery
    [
      "Loss landscapes, learning-rate finder.|Use the LR-finder pattern on CIFAR-10.|2",
      "Schedulers: cosine, OneCycle, warmup.|Train ResNet with OneCycleLR; beat baseline.|3",
      "Mixed precision training (AMP).|Halve memory on a CNN run.|2",
      "Distributed/data-parallel basics.|Run torch DDP on 2 GPUs (or Colab's TPU).|3",
      "Reproducibility: seeds, deterministic ops.|Make 3 runs identical to 4 decimal places.|2",
      "Weights & Biases experiment tracking.|Log 10 runs; share a report.|3",
      "Capstone: image classifier deployed via FastAPI + Docker.|Live URL + README with metrics.|4",
    ],
  ],
  6: [
    // Week 14 — NLP basics
    [
      "Text preprocessing: tokenization, stemming, lemmatization.|Build a custom WordPiece-ish tokenizer.|2",
      "Bag-of-words, TF-IDF.|Classify 20 Newsgroups with sklearn + TF-IDF.|3",
      "Word2Vec & GloVe embeddings.|Visualize embeddings with t-SNE.|3",
      "Subword tokenization: BPE, WordPiece, SentencePiece.|Train a BPE tokenizer on a text corpus.|3",
      "Sequence labeling: NER with sklearn-crfsuite.|Tag entities in 100 news headlines.|3",
      "Eval metrics for NLP: BLEU, ROUGE, perplexity.|Compute all three on your seq2seq output.|2",
      "Mini project: spam classifier with FastAPI endpoint.|Deploy locally; curl-test it.|3",
    ],
    // Week 15 — Transformers from scratch
    [
      "Attention is All You Need — read the paper.|Take 1 page of notes per section.|3",
      "Self-attention math by hand.|Compute QKV attention on a 4-token toy example.|3",
      "Karpathy 'Let's build GPT' Part 1.|Code along; commit each step.|4",
      "Karpathy 'Let's build GPT' Part 2.|Train tiny GPT on Shakespeare.|4",
      "Positional encodings: sin/cos vs learned vs RoPE.|Swap encodings; compare loss curves.|3",
      "Decoder vs encoder vs encoder-decoder.|Write a 1-page comparison with examples.|2",
      "Sample from your tiny GPT; analyze outputs.|Tune temperature & top-p; document findings.|3",
    ],
    // Week 16 — Hugging Face
    [
      "transformers: AutoTokenizer, AutoModel.|Run inference with 3 pretrained models.|2",
      "datasets: loading, mapping, splitting.|Load IMDB; tokenize; cache.|2",
      "Fine-tune BERT on a classification task.|Beat your TF-IDF baseline.|4",
      "Fine-tune T5 on a summarization task.|Use CNN/DailyMail subset.|4",
      "PEFT: LoRA & QLoRA basics.|Fine-tune a 1B model on a single GPU/Colab.|4",
      "Push model + dataset card to the HF Hub.|Make it public; share the link.|2",
      "Capstone: a fine-tuned model with Gradio demo on HF Spaces.|Live shareable URL.|4",
    ],
  ],
  7: [
    // Week 17 — Prompting + LLM APIs
    [
      "LLM landscape: open vs closed; pricing.|Build a comparison table for 6 models.|2",
      "Prompt engineering patterns: role, few-shot, CoT.|Solve 10 reasoning problems with CoT prompts.|3",
      "Structured outputs (JSON mode, function calling).|Extract structured data from 20 emails.|3",
      "Streaming responses with OpenAI-compatible APIs.|Stream tokens to a CLI in real time.|3",
      "Token costs, rate limits, retries, backoff.|Implement exponential backoff wrapper.|2",
      "Eval LLMs: golden sets, LLM-as-judge.|Build a 50-prompt eval harness.|3",
      "Mini project: a CLI 'AI assistant' with memory.|Persist convo to SQLite; resume threads.|4",
    ],
    // Week 18 — RAG
    [
      "Embeddings: text-embedding models, similarity.|Compute cosine sim across 100 docs.|2",
      "Vector DBs: FAISS, Chroma, pgvector.|Build a FAISS index over Wikipedia subset.|3",
      "Chunking strategies: fixed, recursive, semantic.|Compare 3 strategies on retrieval recall@5.|3",
      "Hybrid search: BM25 + dense.|Add BM25 fusion; measure improvement.|3",
      "Re-ranking with cross-encoders.|Add a re-ranker to your pipeline.|3",
      "RAG evaluation: faithfulness, context precision.|Use RAGAS or custom metrics.|3",
      "Mini project: 'chat with your PDFs' app (Gradio).|Upload PDF, ask questions; cite sources.|4",
    ],
    // Week 19 — Agents & tools
    [
      "Tool use & function calling deep dive.|Build a calculator + web-search tool.|3",
      "ReAct, Plan-and-Execute patterns.|Implement ReAct from scratch (no framework).|4",
      "LangChain or LlamaIndex tour.|Recreate prior agent in LangChain.|3",
      "Multi-agent: Autogen / CrewAI overview.|Build a 'researcher + writer' duo.|3",
      "Guardrails: input/output validation, jailbreak defense.|Add Pydantic schemas + safety checks.|3",
      "Memory: short-term, long-term, vector memory.|Add long-term memory to your assistant.|3",
      "Capstone: deployable agent with web UI + tools.|Deploy to HF Spaces; record demo video.|4",
    ],
  ],
  8: [
    // Week 20 — Engineering foundations
    [
      "Git deep dive: branches, rebase, PR hygiene.|Open a PR on a friend's repo with 3 commits.|2",
      "Docker fundamentals + multi-stage builds.|Shrink your model image by 50%.|3",
      "FastAPI advanced: dependencies, BackgroundTasks.|Add async DB writes to your inference API.|3",
      "Postgres + SQLAlchemy basics.|Persist predictions + feedback loop.|3",
      "Logging, metrics, tracing (OpenTelemetry).|Add structured logs + Prometheus metrics.|3",
      "Unit + integration testing for ML systems.|Reach 70% coverage on the API repo.|3",
      "GitHub Actions CI: lint, test, build image.|Green CI badge on README.|3",
    ],
    // Week 21 — MLOps
    [
      "Model registries: MLflow Model Registry / W&B Artifacts.|Promote a model from staging → prod.|3",
      "Feature stores: Feast intro.|Define 1 feature view; serve online.|3",
      "Batch inference with Airflow or Prefect.|Schedule a daily prediction job.|3",
      "Online inference: BentoML or KServe.|Serve a model via BentoML on localhost.|3",
      "Monitoring: data drift, concept drift (Evidently).|Generate a drift report on a tabular model.|3",
      "A/B testing & shadow deployments.|Plan a fake A/B test on paper.|2",
      "Cost optimization: GPU choice, batching, quantization.|Quantize a model with bitsandbytes.|3",
    ],
    // Week 22 — Cloud deploy
    [
      "AWS / GCP / Azure overview for ML.|Pick one; create free-tier account.|2",
      "Object storage (S3/GCS): upload datasets & models.|Programmatic upload + signed URLs.|3",
      "Container registry + serverless containers.|Deploy your image to Cloud Run / App Runner.|4",
      "Managed inference: SageMaker / Vertex AI / Azure ML.|Deploy & invoke a model endpoint.|4",
      "Secrets, IAM, env vars, cost alerts.|Lock down keys; set a $5 budget alert.|2",
      "End-to-end: GitHub push → CI → deploy.|Auto-deploy on merge to main.|4",
      "Capstone: production-style ML service with monitoring.|Documented architecture diagram.|4",
    ],
  ],
  9: [
    // Week 23 — Capstone
    [
      "Pick a capstone idea; write a 1-page spec.|Problem, data, model, deployment plan.|2",
      "Collect & clean data; commit dataset card.|Reproducible loader script.|4",
      "Baseline model + eval harness.|Track everything in W&B/MLflow.|4",
      "Iterate: feature eng, better architectures.|Ship 3 measurable improvements.|4",
      "Build the user-facing app (Streamlit/Gradio/Next).|Polish UX; add examples.|4",
      "Deploy + write the README like a product page.|Demo GIF + architecture diagram.|3",
      "Record a 3-min demo video; post on LinkedIn/X.|Tag #buildinpublic.|2",
    ],
    // Week 24 — Job prep
    [
      "Polish GitHub: pin top 6 repos with READMEs.|Each README ≥ 5 sections w/ screenshots.|3",
      "Resume rewrite: 1 page, results-driven bullets.|Get 2 peer reviews.|3",
      "LinkedIn overhaul + 'open to work'.|New headline, banner, About section.|2",
      "Interview prep: 20 ML system-design Qs.|Use Chip Huyen's book as the spine.|4",
      "Coding drills: 3 LeetCode mediums on arrays/graphs.|Aim for 25-min solves.|3",
      "Mock interview (peer or AI Coach).|Record yourself; review for filler words.|3",
      "Apply to 10 jobs; track in a kanban.|Tailor resume for top 3.|3",
    ],
  ],
};

// Build the full task list once.
export const ROADMAP: DayTask[] = (() => {
  const out: DayTask[] = [];
  let day = 1;
  for (const phase of PHASES) {
    const weeks = phase.weeks[1] - phase.weeks[0] + 1;
    const phaseDays = PHASE_DAYS[phase.id] ?? [];
    for (let w = 0; w < weeks; w++) {
      const week = phase.weeks[0] + w;
      const days = phaseDays[w] ?? phaseDays[phaseDays.length - 1] ?? [];
      for (let d = 0; d < 7; d++) {
        const raw = days[d] ?? "Practice + review.|Revisit the hardest concept of the week.|2";
        const [title, detail, hours] = raw.split("|");
        out.push({
          day,
          week,
          phaseId: phase.id,
          title: title.trim(),
          detail: (detail ?? "").trim(),
          hours: parseFloat(hours ?? "2") || 2,
        });
        day++;
      }
    }
  }
  return out;
})();

export const TOTAL_DAYS = ROADMAP.length;
export const TOTAL_WEEKS = PHASES.reduce((s, p) => s + (p.weeks[1] - p.weeks[0] + 1), 0);

export function phaseFor(day: number) {
  const t = ROADMAP[day - 1];
  return PHASES.find(p => p.id === t.phaseId)!;
}
