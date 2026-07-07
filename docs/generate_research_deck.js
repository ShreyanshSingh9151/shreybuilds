const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';

const W = 13.333;
const H = 7.5;

const C = {
  black: '000000',
  white: 'FFFFFF',
  gray: 'D9D9D9',
  light: 'F8F8F8',
  muted: '666666',
};

const assets = {
  title: '/home/vatsal/me/final-year/email/slide1_render.png',
  logo: '/home/vatsal/me/final-year/email/email/gniot_logo.png',
  gmailSummary: '/home/vatsal/me/final-year/email/email/gmail_summary.png',
  gmailDraft: '/home/vatsal/me/final-year/email/email/gmail_draft_reply.png',
  memory: '/home/vatsal/me/final-year/email/email/memory_personalization.png',
  dashboard: '/home/vatsal/me/final-year/email/email/dashboard.png',
  actionLog: '/home/vatsal/me/final-year/email/email/extension_action_log.png',
  proposedModel: '/home/vatsal/me/final-year/email/email/proposed_model.png',
  processingPipeline: '/home/vatsal/me/final-year/email/email/processing_pipeline.png',
};

const sizes = {
  [assets.title]: { w: 1600, h: 900 },
  [assets.logo]: { w: 717, h: 76 },
  [assets.gmailSummary]: { w: 1615, h: 859 },
  [assets.gmailDraft]: { w: 1551, h: 954 },
  [assets.memory]: { w: 1860, h: 878 },
  [assets.dashboard]: { w: 1882, h: 754 },
  [assets.actionLog]: { w: 1883, h: 862 },
  [assets.proposedModel]: { w: 1174, h: 453 },
  [assets.processingPipeline]: { w: 986, h: 204 },
};

function contain(path, x, y, w, h) {
  const s = sizes[path];
  const r = s.w / s.h;
  const b = w / h;
  let fw = w;
  let fh = h;
  if (r > b) fh = w / r;
  else fw = h * r;
  return { path, x: x + (w - fw) / 2, y: y + (h - fh) / 2, w: fw, h: fh };
}

function addLogo(slide) {
  slide.addImage({
    path: assets.logo,
    x: 1.05,
    y: 0.08,
    w: 11.25,
    h: 11.25 / (717 / 76),
  });
}

function setupSlide(slide, title, subtitle = '') {
  slide.background = { color: C.white };
  slide.addText(title, {
    x: 0.0,
    y: 1.95,
    w: W,
    h: 0.32,
    fontFace: 'Times New Roman',
    fontSize: 22,
    bold: true,
    color: C.black,
    align: 'center',
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.85,
      y: 2.28,
      w: 11.6,
      h: 0.16,
      fontFace: 'Times New Roman',
      fontSize: 9.5,
      color: C.muted,
      align: 'center',
    });
  }
  addLogo(slide);
}

function addFooter(slide, n) {
  slide.addText(`Slide ${n}`, {
    x: 12.0,
    y: 7.06,
    w: 0.9,
    h: 0.12,
    fontFace: 'Times New Roman',
    fontSize: 7.5,
    color: C.muted,
    align: 'right',
  });
}

function addImageFrame(slide, path, x, y, w, h) {
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h,
    line: { color: C.gray, width: 0.8 },
    fill: { color: C.white },
  });
  slide.addImage(contain(path, x + 0.04, y + 0.04, w - 0.08, h - 0.08));
}

function addBullet(slide, text, x, y, w, h, size = 14) {
  slide.addText([{ text, options: { bullet: { indent: 14 } } }], {
    x, y, w, h,
    fontFace: 'Times New Roman',
    fontSize: size,
    color: C.black,
    margin: 0.02,
    valign: 'top',
  });
}

function addParagraph(slide, text, x, y, w, h, size = 14, align = 'left') {
  slide.addText(text, {
    x, y, w, h,
    fontFace: 'Times New Roman',
    fontSize: size,
    color: C.black,
    align,
    margin: 0.02,
    valign: 'top',
  });
}

function addPlainBox(slide, x, y, w, h, text, size = 13, bold = true) {
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h,
    line: { color: C.gray, width: 0.7 },
    fill: { color: C.white },
  });
  slide.addText(text, {
    x: x + 0.12, y: y + 0.1, w: w - 0.24, h: h - 0.2,
    fontFace: 'Times New Roman',
    fontSize: size,
    bold,
    color: C.black,
    align: 'center',
    valign: 'mid',
  });
}

async function main() {
  // 1. Title slide preserved as original image.
  {
    const slide = pptx.addSlide();
    slide.addImage({ path: assets.title, x: 0, y: 0, w: W, h: H });
    addLogo(slide);
  }

  // 2. TOC.
  {
    const slide = pptx.addSlide();
    setupSlide(slide, 'Table of Contents');
    const items = [
      '1. Introduction',
      '2. Research Objectives',
      '3. Literature Survey',
      '4. Proposed Model',
      '5. Discussion About Methodology & Algorithm',
      '6. Conclusion & Future Work',
      '7. Research Paper Progress',
      '8. References',
    ];
    items.forEach((t, i) => addParagraph(slide, t, 1.0, 2.4 + i * 0.52, 11.2, 0.18, 18));
    addFooter(slide, 2);
  }

  // 3. Introduction.
  {
    const slide = pptx.addSlide();
    setupSlide(slide, '1.Introduction');
    addBullet(slide, 'Email remains one of the most widely used communication channels globally, with over 300 billion emails sent daily across professional and personal domains.', 1.0, 2.85, 11.2, 0.52, 18);
    addBullet(slide, 'Manual email drafting is time-consuming, repetitive, and often lacks personalization, leading to reduced productivity in enterprise environments.', 1.0, 3.85, 11.2, 0.52, 18);
    addBullet(slide, 'Recent advances in Large Language Models (LLMs) offer a transformative approach to intelligent email automation, enabling context-aware generation, summarization, and personalized communication at scale.', 1.0, 4.85, 11.2, 0.65, 18);
    addBullet(slide, 'This project proposes an AI-powered email automation platform that leverages LLM capabilities to generate professional email drafts, summarize threads, rewrite content in different tones, classify emails, and detect priority levels.', 1.0, 5.98, 11.2, 0.78, 18);
    addFooter(slide, 3);
  }

  // 4. Research Objectives.
  {
    const slide = pptx.addSlide();
    setupSlide(slide, '2.Research Objectives');
    const objs = [
      'Develop an inbox-native interaction layer that captures active conversation context from webmail clients without interrupting the user workflow.',
      'Design a context-preserving orchestration layer with token budgeting, preference caching, and task-aware routing.',
      'Incorporate memory-aware personalization for tone control, signature reuse, and sender-specific response policy.',
      'Introduce observability for latency, token consumption, estimated cost, and routing efficiency.',
      'Ensure resilience through fallback inference, graceful degradation, and rate-limit-tolerant request handling under upstream service constraints.',
    ];
    objs.forEach((t, i) => addPlainBox(slide, 0.95, 2.55 + i * 0.78, 11.45, 0.56, `${i + 1}. ${t}`, 12.2, false));
    addFooter(slide, 4);
  }

  // 5. Literature Survey.
  {
    const slide = pptx.addSlide();
    setupSlide(slide, '3.Literature Survey');
    const rows = [
      ['Existing Approach', 'Strength', 'Limitation', 'Why Our System Is Different'],
      ['Smart compose systems', 'Fast completion', 'No full-thread reasoning', 'Handles complete conversation context'],
      ['Manual LLM use', 'Flexible prompting', 'Workflow breaks on context transfer', 'Embedded in inbox workflow'],
      ['Enterprise copilots', 'Strong integration', 'Opaque routing/cost', 'Explicit telemetry and routing'],
      ['Template-based systems', 'Deterministic', 'Weak tone adaptation', 'Context-aware generation'],
    ];
    const colX = [0.8, 3.15, 4.9, 7.65];
    const widths = [2.3, 1.7, 2.7, 4.45];
    rows.forEach((r, rowIdx) => {
      const y = 2.55 + rowIdx * 0.7;
      r.forEach((cell, colIdx) => {
        slide.addShape(pptx.ShapeType.rect, {
          x: colX[colIdx], y, w: widths[colIdx], h: 0.58,
          line: { color: C.gray, width: 0.6 },
          fill: { color: C.white },
        });
        slide.addText(cell, {
          x: colX[colIdx] + 0.06, y: y + 0.08, w: widths[colIdx] - 0.12, h: 0.2,
          fontFace: 'Times New Roman',
          fontSize: rowIdx === 0 ? 11.5 : 10.2,
          bold: rowIdx === 0,
          color: C.black,
          align: 'center',
        });
      });
    });
    addPlainBox(slide, 0.95, 5.55, 11.45, 0.58, 'Research gap: A browser-native, context-preserving, cost-aware, and provider-flexible email orchestration system with explicit telemetry and evaluation.', 11.5, false);
    addFooter(slide, 5);
  }

  // 6. Proposed Model.
  {
    const slide = pptx.addSlide();
    setupSlide(slide, '4.Proposed Model');
    addImageFrame(slide, assets.proposedModel, 0.82, 2.75, 11.7, 3.5);
    addFooter(slide, 6);
  }

  // 7. Discussion About Methodology & Algorithm.
  {
    const slide = pptx.addSlide();
    setupSlide(slide, '5.Discussion About Methodology & Algorithm');
    addImageFrame(slide, assets.processingPipeline, 1.0, 2.4, 11.3, 1.8);
    const left = [
      '1. Extract the active thread and assemble a bounded conversation context.',
      '2. Normalize the thread by removing UI noise and unnecessary fragments.',
      '3. Resolve user memory, tone, signature, and default profile.',
      '4. Route the task to the appropriate OpenRouter-backed profile.',
    ];
    const right = [
      '5. Generate the output with task-specific prompts and context constraints.',
      '6. Parse structured metadata such as confidence, priority, and action items.',
      '7. Record telemetry including route reason, latency, token usage, and estimated cost.',
      '8. Render the result in the interface and persist the action history.',
    ];
    addParagraph(slide, left.join('\n'), 0.95, 4.55, 5.7, 1.6, 12);
    addParagraph(slide, right.join('\n'), 6.45, 4.55, 5.7, 1.6, 12);
    addImageFrame(slide, assets.gmailDraft, 9.2, 5.35, 2.9, 1.5);
    addFooter(slide, 7);
  }

  // 8. Conclusion & Future Work.
  {
    const slide = pptx.addSlide();
    setupSlide(slide, '6.Conclusion & Future Work');
    addParagraph(slide, 'Conclusion', 0.95, 2.55, 2.0, 0.18, 16);
    addBullet(slide, 'The project shows that email automation becomes substantially more effective when generation is combined with thread context, model routing, and preference memory.', 0.95, 2.88, 5.8, 0.55, 14);
    addBullet(slide, 'The system shifts email handling from manual drafting to an intelligent orchestration workflow with visible cost and latency trade-offs.', 0.95, 3.55, 5.8, 0.55, 14);
    addBullet(slide, 'The architecture also improves explainability through route reason, structured metadata, and telemetry.', 0.95, 4.2, 5.8, 0.45, 14);
    addParagraph(slide, 'Future Work', 7.1, 2.55, 2.0, 0.18, 16);
    const fw = [
      'Stronger Outlook parsing and layout stabilization',
      'Attachment-aware summarization',
      'Multilingual support',
      'Persistent long-term memory storage',
      'Controlled user studies and quality scoring',
    ];
    fw.forEach((t, i) => addPlainBox(slide, 7.0, 2.9 + i * 0.62, 5.1, 0.42, t, 10.5, false));
    addFooter(slide, 8);
  }

  // 9. Research Paper Progress.
  {
    const slide = pptx.addSlide();
    setupSlide(slide, '7.Research Paper Progress');
    const steps = [
      'Problem definition', 'Literature survey', 'System implementation', 'Evaluation tuning', 'Final writing',
    ];
    steps.forEach((t, i) => addPlainBox(slide, 0.95 + i * 2.45, 2.6, 2.2, 0.6, t, 10.5, true));
    addImageFrame(slide, assets.gmailSummary, 0.95, 3.5, 4.0, 2.2);
    addImageFrame(slide, assets.memory, 5.0, 3.5, 3.9, 2.2);
    addImageFrame(slide, assets.dashboard, 9.0, 3.5, 3.4, 2.2);
    addFooter(slide, 9);
  }

  // 10. References.
  {
    const slide = pptx.addSlide();
    setupSlide(slide, '8.References');
    const refs = [
      '1. Vaswani, A. et al. Attention Is All You Need. NeurIPS, 2017.',
      '2. Lewis, M. et al. BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension. ACL, 2020.',
      '3. Google. Gmail API Documentation. https://developers.google.com/gmail',
      '4. Microsoft. Microsoft Graph and Outlook Add-in Documentation. https://learn.microsoft.com/graph',
      '5. OpenRouter. API Documentation and Model Routing Reference. https://openrouter.ai/docs',
    ];
    refs.forEach((r, i) => addPlainBox(slide, 0.95, 2.55 + i * 0.7, 11.4, 0.5, r, 10.5, false));
    addFooter(slide, 10);
  }

  await pptx.writeFile({ fileName: '/home/vatsal/me/final-year/email/PPT_Project_Research_updated.pptx' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
