const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'OpenCode';
pptx.company = 'OpenAI';
pptx.subject = 'Email Intelligence System Presentation';
pptx.title = 'Email Intelligence System';
pptx.lang = 'en-US';

const W = 13.333;
const H = 7.5;

const C = {
  navy: '0F172A',
  blue: '2563EB',
  cyan: '06B6D4',
  slate: '475569',
  gray: 'E2E8F0',
  light: 'F8FAFC',
  white: 'FFFFFF',
  success: '16A34A',
  amber: 'D97706',
  rose: 'E11D48',
};

const assets = {
  slide1: '/home/vatsal/me/final-year/email/slide1_render.png',
  gmailSummary: '/home/vatsal/me/final-year/email/email/gmail_summary.png',
  gmailDraft: '/home/vatsal/me/final-year/email/email/gmail_draft_reply.png',
  memory: '/home/vatsal/me/final-year/email/email/memory_personalization.png',
  dashboard: '/home/vatsal/me/final-year/email/email/dashboard.png',
  benchmark: '/home/vatsal/me/final-year/email/email/demo_bench_graph.png',
  actionLog: '/home/vatsal/me/final-year/email/email/extension_action_log.png',
  outlookDraft: '/home/vatsal/me/final-year/email/email/outlook_draftreply.png',
  outlookSummary: '/home/vatsal/me/final-year/email/email/outloook_summary.png',
};

const imageSizes = {
  [assets.slide1]: { w: 1600, h: 900 },
  [assets.gmailSummary]: { w: 1615, h: 859 },
  [assets.gmailDraft]: { w: 1551, h: 954 },
  [assets.memory]: { w: 1860, h: 878 },
  [assets.dashboard]: { w: 1882, h: 754 },
  [assets.benchmark]: { w: 1603, h: 837 },
  [assets.actionLog]: { w: 1883, h: 862 },
  [assets.outlookDraft]: { w: 1491, h: 880 },
  [assets.outlookSummary]: { w: 1545, h: 901 },
};

function contain(path, x, y, w, h) {
  const size = imageSizes[path];
  const imgRatio = size.w / size.h;
  const boxRatio = w / h;
  let finalW = w;
  let finalH = h;
  if (imgRatio > boxRatio) {
    finalH = w / imgRatio;
  } else {
    finalW = h * imgRatio;
  }
  return {
    path,
    x: x + (w - finalW) / 2,
    y: y + (h - finalH) / 2,
    w: finalW,
    h: finalH,
  };
}

function addBg(slide) {
  slide.background = { color: C.white };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, line: { color: C.white }, fill: { color: C.white } });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.18, line: { color: C.blue }, fill: { color: C.blue } });
}

function addTitle(slide, title, subtitle = '') {
  addBg(slide);
  slide.addText(title, {
    x: 0.6, y: 0.38, w: 8.6, h: 0.48,
    fontFace: 'Aptos Display', fontSize: 24, bold: true, color: C.navy,
  });
  slide.addShape(pptx.ShapeType.line, { x: 0.62, y: 0.95, w: 1.5, h: 0, line: { color: C.cyan, width: 2.2 } });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.6, y: 1.0, w: 11.8, h: 0.28,
      fontFace: 'Aptos', fontSize: 9.5, color: C.slate,
    });
  }
}

function addBulletText(slide, items, x, y, w, h, opts = {}) {
  const runs = [];
  items.forEach((item) => {
    runs.push({
      text: item,
      options: {
        bullet: { indent: 14 },
        hanging: 3,
        breakLine: true,
      },
    });
  });
  slide.addText(runs, {
    x, y, w, h,
    fontFace: 'Aptos',
    fontSize: opts.fontSize || 16,
    color: opts.color || C.navy,
    paraSpaceAfterPt: opts.spaceAfter || 10,
    valign: 'top',
    margin: opts.margin || 0.04,
  });
}

function addSectionTag(slide, text, x, y, w = 2.3) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h: 0.32,
    rectRadius: 0.08,
    line: { color: C.gray, width: 0.8 },
    fill: { color: 'EFF6FF' },
  });
  slide.addText(text, {
    x: x + 0.08, y: y + 0.06, w: w - 0.16, h: 0.18,
    fontFace: 'Aptos', fontSize: 8.5, bold: true, color: C.blue, align: 'center',
  });
}

function addCard(slide, { x, y, w, h, title, body, color }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.08,
    line: { color: color || C.gray, width: 1 },
    fill: { color: C.light },
    shadow: { type: 'outer', color: 'CBD5E1', blur: 1, angle: 45, distance: 1, opacity: 0.18 },
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.16, y: y + 0.18, w: 0.42, h: 0.42,
    rectRadius: 0.08,
    line: { color: color || C.blue, width: 0.5 },
    fill: { color: color || C.blue },
  });
  slide.addText(title, {
    x: x + 0.7, y: y + 0.17, w: w - 0.9, h: 0.32,
    fontFace: 'Aptos', fontSize: 14, bold: true, color: C.navy,
  });
  slide.addText(body, {
    x: x + 0.18, y: y + 0.72, w: w - 0.36, h: h - 0.9,
    fontFace: 'Aptos', fontSize: 10.5, color: C.slate, valign: 'top', margin: 0.04,
  });
}

function addImageFrame(slide, path, x, y, w, h, caption = '') {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.08,
    line: { color: C.gray, width: 1 },
    fill: { color: C.white },
  });
  slide.addImage(contain(path, x + 0.08, y + 0.08, w - 0.16, h - (caption ? 0.42 : 0.16)));
  if (caption) {
    slide.addText(caption, {
      x: x + 0.1, y: y + h - 0.27, w: w - 0.2, h: 0.14,
      fontFace: 'Aptos', fontSize: 8.5, color: C.slate, align: 'center',
    });
  }
}

function addPipeline(slide, labels, x, y, w, h) {
  const gap = 0.18;
  const stepW = (w - gap * (labels.length - 1)) / labels.length;
  labels.forEach((label, idx) => {
    const left = x + idx * (stepW + gap);
    slide.addShape(pptx.ShapeType.roundRect, {
      x: left, y, w: stepW, h,
      rectRadius: 0.06,
      line: { color: idx % 2 === 0 ? C.blue : C.cyan, width: 1.2 },
      fill: { color: idx % 2 === 0 ? 'EFF6FF' : 'ECFEFF' },
    });
    slide.addText(label, {
      x: left + 0.08, y: y + 0.18, w: stepW - 0.16, h: h - 0.36,
      fontFace: 'Aptos', fontSize: 12, bold: true, color: C.navy, align: 'center', valign: 'mid',
    });
    if (idx < labels.length - 1) {
      slide.addShape(pptx.ShapeType.chevron, {
        x: left + stepW + 0.03, y: y + h / 2 - 0.12, w: 0.12, h: 0.24,
        line: { color: C.slate, width: 0.8 },
        fill: { color: C.slate },
      });
    }
  });
}

function addFooter(slide, page) {
  slide.addText(`Email Intelligence System  |  Slide ${page}`, {
    x: 10.1, y: 7.12, w: 2.55, h: 0.16,
    fontFace: 'Aptos', fontSize: 7.5, color: '64748B', align: 'right',
  });
}

// Slide 1: preserve exact look as a full-slide render.
{
  const slide = pptx.addSlide();
  slide.addImage({ path: assets.slide1, x: 0, y: 0, w: W, h: H });
}

// Slide 2: table of contents.
{
  const slide = pptx.addSlide();
  addTitle(slide, 'Table of Contents', 'Research presentation structure for the proposed inbox-native email intelligence system.');
  const items = [
    'Introduction',
    'Research Objectives and Scope',
    'Related Work and Research Gap',
    'System Architecture and Workflow',
    'Methodology and Implementation',
    'Demonstration and Evaluation',
    'Conclusion and Future Work',
    'References',
  ];
  items.forEach((item, idx) => {
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    const x = col === 0 ? 0.9 : 6.9;
    const y = 1.5 + row * 1.18;
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 5.3, h: 0.8,
      rectRadius: 0.06,
      line: { color: idx < 4 ? C.blue : C.cyan, width: 1.2 },
      fill: { color: idx < 4 ? 'EFF6FF' : 'ECFEFF' },
    });
    slide.addText(`${idx + 1}`, {
      x: x + 0.22, y: y + 0.18, w: 0.46, h: 0.28,
      fontFace: 'Aptos', fontSize: 18, bold: true, color: idx < 4 ? C.blue : C.cyan, align: 'center',
    });
    slide.addText(item, {
      x: x + 0.82, y: y + 0.18, w: 4.2, h: 0.28,
      fontFace: 'Aptos', fontSize: 18, bold: true, color: C.navy,
    });
  });
  addFooter(slide, 2);
}

// Slide 3: introduction.
{
  const slide = pptx.addSlide();
  addTitle(slide, 'Introduction', 'Email remains high-volume and latency-sensitive, yet assistance still often sits outside the inbox workflow.');
  addSectionTag(slide, 'Problem Context', 0.62, 1.28, 1.7);
  addBulletText(slide, [
    'Email remains a high-volume, latency-sensitive communication channel, yet most users still perform reading, prioritization, and drafting manually.',
    'Existing assistance tools are often shallow, disconnected from the inbox workflow, or opaque in how they manage context and cost.',
    'This project proposes an inbox-native email intelligence system that performs thread understanding, summarization, reply synthesis, rewriting, classification, and urgency estimation.',
    'The system is designed around context preservation, preference-aware generation, and OpenRouter-backed model routing for efficient and explainable inference.',
  ], 0.72, 1.62, 5.3, 4.95, { fontSize: 14, spaceAfter: 12 });
  addImageFrame(slide, assets.gmailSummary, 6.35, 1.4, 6.35, 5.45, 'Gmail thread view with the assistant panel visible for context-aware analysis.');
  addFooter(slide, 3);
}

// Slide 4: objectives.
{
  const slide = pptx.addSlide();
  addTitle(slide, 'Research Objectives and Scope', 'The system is positioned as a resilient orchestration layer rather than a single-prompt demo.');
  const cards = [
    ['Inbox-Native Capture', 'Capture active conversation context directly from webmail clients without interrupting the user workflow.', C.blue],
    ['Context Orchestration', 'Preserve context using token budgeting, preference caching, and task-aware routing.', C.cyan],
    ['Personalization Memory', 'Apply tone control, signature reuse, and sender-specific response policy.', C.success],
    ['Observability', 'Track latency, token consumption, estimated cost, and routing efficiency.', C.amber],
    ['Resilience', 'Support fallback inference, graceful degradation, and rate-limit-tolerant request handling.', C.rose],
  ];
  const positions = [
    [0.7, 1.55, 3.95, 2.0],
    [4.69, 1.55, 3.95, 2.0],
    [8.68, 1.55, 3.95, 2.0],
    [2.7, 3.82, 3.95, 2.0],
    [6.69, 3.82, 3.95, 2.0],
  ];
  cards.forEach(([title, body, color], idx) => {
    const [x, y, w, h] = positions[idx];
    addCard(slide, { x, y, w, h, title, body, color });
  });
  addFooter(slide, 4);
}

// Slide 5: related work.
{
  const slide = pptx.addSlide();
  addTitle(slide, 'Related Work and Research Gap', 'Existing approaches each solve part of the workflow, but none combine native integration, flexible routing, and explicit telemetry.');
  const rows = [
    [
      { text: 'Existing Approach', options: { bold: true, color: C.white } },
      { text: 'Strength', options: { bold: true, color: C.white } },
      { text: 'Limitation', options: { bold: true, color: C.white } },
      { text: 'Why Our System Is Different', options: { bold: true, color: C.white } },
    ],
    ['Smart compose systems', 'Fast short-form completion', 'Do not reason over the full conversation context', 'Understands complete threads before generating assistance'],
    ['Manual LLM use', 'Flexible prompting', 'Breaks workflow continuity and requires repeated context transfer', 'Operates directly inside Gmail and Outlook Web'],
    ['Enterprise copilots', 'Strong product integration', 'Often opaque in routing, personalization, and cost structure', 'Makes routing logic, cost signals, and telemetry visible'],
    ['Template-based systems', 'Deterministic outputs', 'Lack semantic adaptability and tone control', 'Combines structure with context-aware generation'],
  ];
  slide.addTable(rows, {
    x: 0.55, y: 1.45, w: 12.2, h: 3.9,
    border: { type: 'solid', color: C.gray, pt: 1 },
    fill: C.white,
    color: C.navy,
    fontFace: 'Aptos',
    fontSize: 10.5,
    rowH: 0.72,
    colW: [2.2, 2.1, 3.45, 4.45],
    margin: 0.06,
    autoFit: false,
    valign: 'mid',
    fillHeader: C.navy,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 5.75, w: 11.75, h: 0.9,
    rectRadius: 0.08,
    line: { color: C.blue, width: 1.2 },
    fill: { color: 'EFF6FF' },
  });
  slide.addText('Research gap: A browser-native, context-preserving, cost-aware, and provider-flexible email orchestration system with explicit telemetry and evaluation.', {
    x: 1.0, y: 6.0, w: 11.35, h: 0.3,
    fontFace: 'Aptos', fontSize: 15, bold: true, color: C.navy, align: 'center',
  });
  addFooter(slide, 5);
}

// Slide 6: architecture.
{
  const slide = pptx.addSlide();
  addTitle(slide, 'System Architecture and Proposed Model', 'Three primary layers coordinate capture, orchestration, inference, and observability across webmail clients.');

  const layerY = 1.45;
  const layerW = 2.35;
  const gap = 0.2;
  const layers = [
    { title: 'Presentation Layer', lines: ['Gmail and Outlook Web', 'Thread capture', 'Result rendering'], color: C.blue },
    { title: 'Orchestration Layer', lines: ['Context normalization', 'Memory retrieval', 'Task-aware routing', 'Prompt assembly and policy checks'], color: C.cyan },
    { title: 'Inference Layer', lines: ['OpenRouter-backed profiles', 'Summarization', 'Reply generation', 'Rewriting and classification'], color: C.blue },
    { title: 'Observability Layer', lines: ['Action history', 'Latency', 'Token usage', 'Estimated cost and routing savings'], color: C.cyan },
  ];
  layers.forEach((layer, idx) => {
    const x = 0.55 + idx * (layerW + gap);
    addCard(slide, {
      x, y: layerY, w: layerW, h: 2.3,
      title: layer.title,
      body: layer.lines.join('\n'),
      color: layer.color,
    });
  });

  addPipeline(slide, [
    'Capture Thread',
    'Normalize Context',
    'Resolve Memory',
    'Route Model',
    'Generate Output',
    'Log Metrics',
    'Show Result',
  ], 0.55, 4.35, 12.25, 0.9);

  slide.addShape(pptx.ShapeType.line, { x: 7.8, y: 5.52, w: 1.7, h: 0.6, line: { color: C.rose, width: 1.2, dash: 'dash' } });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 9.25, y: 5.92, w: 2.0, h: 0.44,
    rectRadius: 0.05,
    line: { color: C.rose, width: 1 },
    fill: { color: 'FFF1F2' },
  });
  slide.addText('Fallback Demo Sample Thread', {
    x: 9.35, y: 6.05, w: 1.8, h: 0.16,
    fontFace: 'Aptos', fontSize: 9, bold: true, color: C.rose, align: 'center',
  });
  addFooter(slide, 6);
}

// Slide 7: methodology.
{
  const slide = pptx.addSlide();
  addTitle(slide, 'Methodology and Algorithm', 'The processing pipeline keeps conversation context bounded, personalized, and observable from extraction through rendering.');
  addBulletText(slide, [
    'Extract the active thread and assemble a bounded conversation context.',
    'Normalize the thread by removing UI noise and unnecessary text fragments.',
    'Resolve user memory, tone, signature, and default profile.',
    'Route the task to the appropriate OpenRouter-backed profile.',
    'Generate the output with task-specific prompts and context constraints.',
    'Parse structured metadata such as confidence, priority, and action items.',
    'Record telemetry including route reason, latency, token usage, and estimated cost.',
    'Render the result in the interface and persist the action history.',
  ], 0.68, 1.35, 5.4, 4.95, { fontSize: 12.5, spaceAfter: 8 });
  addPipeline(slide, [
    'Extract Thread',
    'Apply Memory',
    'Route Model',
    'Generate Output',
    'Log Metrics',
    'Show Result',
  ], 6.25, 1.7, 6.45, 0.86);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 7.05, y: 2.95, w: 1.75, h: 0.5,
    rectRadius: 0.05,
    line: { color: C.cyan, width: 1 },
    fill: { color: 'ECFEFF' },
  });
  slide.addText('Preference Cache', { x: 7.18, y: 3.12, w: 1.48, h: 0.14, fontFace: 'Aptos', fontSize: 9, bold: true, color: C.navy, align: 'center' });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 9.15, y: 2.95, w: 1.75, h: 0.5,
    rectRadius: 0.05,
    line: { color: C.blue, width: 1 },
    fill: { color: 'EFF6FF' },
  });
  slide.addText('OpenRouter Profile', { x: 9.28, y: 3.12, w: 1.48, h: 0.14, fontFace: 'Aptos', fontSize: 9, bold: true, color: C.navy, align: 'center' });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 11.15, y: 2.95, w: 1.35, h: 0.5,
    rectRadius: 0.05,
    line: { color: C.amber, width: 1 },
    fill: { color: 'FFF7ED' },
  });
  slide.addText('Structured Parsing', { x: 11.22, y: 3.06, w: 1.2, h: 0.18, fontFace: 'Aptos', fontSize: 8.3, bold: true, color: C.navy, align: 'center' });
  addImageFrame(slide, assets.gmailDraft, 6.45, 3.75, 6.05, 2.45, 'Extension result card used for reply synthesis and structured output rendering.');
  addFooter(slide, 7);
}

// Slide 8: demonstration.
{
  const slide = pptx.addSlide();
  addTitle(slide, 'Demonstration and Implementation', 'The implementation showcases browser-embedded analysis, memory-aware generation, explainable routing, and fallback-safe evaluation.');
  const leftX = 0.62;
  const rightX = 6.78;
  addImageFrame(slide, assets.gmailSummary, leftX, 1.45, 5.75, 2.3, 'Gmail thread with assistant panel');
  addImageFrame(slide, assets.gmailDraft, rightX, 1.45, 5.75, 2.3, 'Generated summary, route reason, and savings');
  addImageFrame(slide, assets.memory, leftX, 4.0, 5.75, 2.3, 'Memory settings and personalization controls');
  addImageFrame(slide, assets.actionLog, rightX, 4.0, 5.75, 2.3, 'Action history and evaluation workflow');
  addFooter(slide, 8);
}

// Slide 9: evaluation.
{
  const slide = pptx.addSlide();
  addTitle(slide, 'Demonstration, Evaluation, and Results', 'Evaluation tracks efficiency, latency, fidelity, and transparency across summarization, reply generation, rewriting, and classification.');
  addImageFrame(slide, assets.dashboard, 0.62, 1.42, 7.2, 4.1, 'Evaluation dashboard with KPI cards, charts, and compare mode.');
  slide.addText('Benchmark Methodology', {
    x: 8.1, y: 1.45, w: 2.7, h: 0.22,
    fontFace: 'Aptos', fontSize: 14, bold: true, color: C.navy,
  });
  addBulletText(slide, [
    'Curated Gmail and Outlook threads with varying length, intent, and urgency.',
    'Action-specific evaluation across summarization, reply generation, rewriting, and classification.',
    'Telemetry recorded for latency, token usage, estimated cost, baseline cost, and routing savings.',
  ], 8.05, 1.78, 4.6, 1.5, { fontSize: 10.5, spaceAfter: 7 });
  slide.addText('Key Findings', {
    x: 8.1, y: 3.15, w: 2.2, h: 0.22,
    fontFace: 'Aptos', fontSize: 14, bold: true, color: C.navy,
  });
  addBulletText(slide, [
    'Task-aware routing improves cost efficiency relative to a fixed-profile baseline.',
    'Longer threads benefit from context-strong routing profiles.',
    'Memory improves tone alignment, signature consistency, and response relevance.',
    'The system provides explainability through route reason, priority reason, and structured metadata.',
  ], 8.05, 3.45, 4.6, 1.8, { fontSize: 10.4, spaceAfter: 6 });
  const rows = [
    [
      { text: 'Metric', options: { bold: true, color: C.white } },
      { text: 'Fixed Baseline', options: { bold: true, color: C.white } },
      { text: 'Routed System', options: { bold: true, color: C.white } },
      { text: 'Observation', options: { bold: true, color: C.white } },
    ],
    ['Cost', 'Higher', 'Lower', 'Improved efficiency'],
    ['Latency', 'Stable', 'Comparable', 'Acceptable for demo use'],
    ['Thread Fidelity', 'Moderate', 'Higher', 'Better context retention'],
    ['Explainability', 'None', 'Route reason + metadata', 'Stronger transparency'],
  ];
  slide.addTable(rows, {
    x: 0.82, y: 5.78, w: 11.85, h: 1.1,
    border: { type: 'solid', color: C.gray, pt: 1 },
    fill: C.white,
    color: C.navy,
    fontFace: 'Aptos',
    fontSize: 9.5,
    rowH: 0.24,
    colW: [1.5, 1.7, 2.1, 2.7],
    margin: 0.05,
    autoFit: true,
    valign: 'mid',
    fillHeader: C.navy,
  });
  addFooter(slide, 9);
}

// Slide 10: conclusion.
{
  const slide = pptx.addSlide();
  addTitle(slide, 'Conclusion and Future Work', 'The system reframes email assistance as an observable orchestration workflow rather than isolated text generation.');
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.72, y: 1.45, w: 5.65, h: 2.1,
    rectRadius: 0.08,
    line: { color: C.blue, width: 1.2 },
    fill: { color: 'EFF6FF' },
  });
  slide.addText('Conclusion', {
    x: 0.95, y: 1.68, w: 2.0, h: 0.22,
    fontFace: 'Aptos', fontSize: 16, bold: true, color: C.navy,
  });
  addBulletText(slide, [
    'The project shows that email automation becomes substantially more effective when generation is combined with thread context, model routing, and preference memory.',
    'The system shifts email handling from manual drafting to an intelligent orchestration workflow with visible cost and latency trade-offs.',
  ], 0.95, 2.0, 5.15, 1.2, { fontSize: 12.5, spaceAfter: 10 });

  slide.addText('Future Work', {
    x: 6.85, y: 1.48, w: 2.0, h: 0.22,
    fontFace: 'Aptos', fontSize: 16, bold: true, color: C.navy,
  });
  const roadmap = [
    ['Outlook Parsing', 'Stronger Outlook parsing and layout stabilization'],
    ['Attachments', 'Attachment-aware summarization and richer context packaging'],
    ['Multilingual', 'Multilingual support for inbox understanding and generation'],
    ['Long-Term Memory', 'Persistent storage for durable user preferences and sender policies'],
    ['Controlled Studies', 'Formal user studies and quality scoring for comparative evaluation'],
  ];
  roadmap.forEach((item, idx) => {
    addCard(slide, {
      x: 6.72 + (idx % 2) * 2.95,
      y: 1.82 + Math.floor(idx / 2) * 1.5,
      w: 2.72,
      h: 1.18,
      title: item[0],
      body: item[1],
      color: idx % 2 === 0 ? C.cyan : C.blue,
    });
  });
  addFooter(slide, 10);
}

pptx.writeFile({ fileName: '/home/vatsal/me/final-year/email/PPT _Project_research_updated.pptx' });
