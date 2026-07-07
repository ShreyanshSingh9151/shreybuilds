from __future__ import annotations

import io
import math
import os
import shutil
import tempfile
import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path('/home/vatsal/me/final-year/email')
SRC_PPTX = ROOT / 'PPT _Project.pptx'
IMG_DIR = ROOT / 'email'
OUT_PPTX = ROOT / 'final_PPT.pptx'
TMP_DIR = ROOT / '_final_ppt_build'

EMU_PER_INCH = 914400
SLIDE_W_IN = 13.333333
SLIDE_H_IN = 7.5
SLIDE_W = 1920
SLIDE_H = 1080

BG = '#F6F8FB'
PANEL = '#FFFFFF'
TEXT = '#10233E'
MUTED = '#50627A'
ACCENT = '#0F6CBD'
ACCENT_2 = '#1F9D8A'
ACCENT_3 = '#7A4CC2'
LINE = '#D8E0EA'
WARN = '#D97706'

FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_ITAL = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf'


def font(size: int, bold: bool = False, italic: bool = False):
    path = FONT_BOLD if bold else FONT_ITAL if italic else FONT_REG
    return ImageFont.truetype(path, size=size)


def wrap_lines(draw: ImageDraw.ImageDraw, text: str, fnt, max_width: int):
    words = text.split()
    lines = []
    cur = ''
    for word in words:
        test = word if not cur else cur + ' ' + word
        if draw.textbbox((0, 0), test, font=fnt)[2] <= max_width:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def draw_text_box(draw, xy, text, fnt, fill, max_width, spacing=8):
    x, y = xy
    lines = []
    for paragraph in text.split('\n'):
        if not paragraph.strip():
            lines.append('')
            continue
        lines.extend(wrap_lines(draw, paragraph, fnt, max_width))
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + spacing
    return y


def rounded_panel(draw, box, radius=24, fill=PANEL, outline=None, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def badge(draw, xy, text, fill, text_fill='white', fnt=None):
    if fnt is None:
        fnt = font(24, bold=True)
    x, y = xy
    pad_x, pad_y = 18, 10
    tb = draw.textbbox((0, 0), text, font=fnt)
    w = tb[2] - tb[0] + pad_x * 2
    h = tb[3] - tb[1] + pad_y * 2
    draw.rounded_rectangle((x, y, x + w, y + h), radius=18, fill=fill)
    draw.text((x + pad_x, y + pad_y - 2), text, font=fnt, fill=text_fill)
    return w, h


def add_heading(draw, title, subtitle=None):
    draw.text((88, 56), title, font=font(42, bold=True), fill=TEXT)
    draw.rectangle((88, 118, 290, 124), fill=ACCENT)
    if subtitle:
        draw.text((88, 140), subtitle, font=font(20), fill=MUTED)


def fit_cover(im: Image.Image, size):
    return ImageOps.fit(im, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def fit_contain(im: Image.Image, size, bg='#FFFFFF'):
    canvas = Image.new('RGBA', size, bg)
    inner = ImageOps.contain(im, size, method=Image.Resampling.LANCZOS)
    canvas.paste(inner, ((size[0]-inner.width)//2, (size[1]-inner.height)//2))
    return canvas


def load_img(name):
    return Image.open(IMG_DIR / name).convert('RGBA')


def crop_focus(im, top=0.0, bottom=1.0, left=0.0, right=1.0):
    w, h = im.size
    return im.crop((int(w*left), int(h*top), int(w*right), int(h*bottom)))


def slide2():
    img = Image.new('RGBA', (SLIDE_W, SLIDE_H), BG)
    d = ImageDraw.Draw(img)
    add_heading(d, 'Table of Contents', 'Research workflow and system evaluation outline')
    items = [
        'Introduction', 'Research Objectives and Scope', 'Related Work and Research Gap',
        'System Architecture and Workflow', 'Methodology and Implementation', 'Demonstration and Evaluation',
        'Conclusion and Future Work', 'References'
    ]
    x0, y0, cols = 110, 230, 2
    box_w, box_h = 780, 160
    gap_x, gap_y = 28, 26
    for idx, item in enumerate(items):
        col = idx % cols
        row = idx // cols
        x = x0 + col * (box_w + gap_x)
        y = y0 + row * (box_h + gap_y)
        rounded_panel(d, (x, y, x + box_w, y + box_h), radius=28, fill='white', outline=LINE)
        badge(d, (x + 24, y + 24), f'{idx+1:02d}', ACCENT)
        d.text((x + 120, y + 40), item, font=font(30, bold=True), fill=TEXT)
        d.text((x + 120, y + 88), 'Section overview', font=font(18), fill=MUTED)
    return img


def slide3():
    img = Image.new('RGBA', (SLIDE_W, SLIDE_H), BG)
    d = ImageDraw.Draw(img)
    add_heading(d, 'Introduction', 'Inbox-native email intelligence for context-preserving assistance')
    panel = (76, 186, 885, 958)
    rounded_panel(d, panel, radius=28, fill='white', outline=LINE)
    intro = (
        'Email remains a high-volume, latency-sensitive communication channel, yet most users still perform '
        'reading, prioritization, and drafting manually.\n\n'
        'Existing assistance tools are often shallow, disconnected from the inbox workflow, or opaque in how '
        'they manage context and cost.\n\n'
        'This project proposes an inbox-native email intelligence system that performs thread understanding, '
        'summarization, reply synthesis, rewriting, classification, and urgency estimation.\n\n'
        'The system is designed around context preservation, preference-aware generation, and OpenRouter-backed '
        'model routing for efficient and explainable inference.'
    )
    draw_text_box(d, (110, 244), intro, font(25), TEXT, 720, spacing=10)
    ss = fit_cover(load_img('gmail_summary.png'), (900, 700))
    ss = crop_focus(ss, top=0.05, bottom=0.92, left=0.02, right=0.98)
    ss = fit_cover(ss, (860, 660))
    img.paste(ss, (965, 235))
    d.rounded_rectangle((965, 235, 1825, 895), radius=22, outline=LINE, width=2)
    d.text((965, 910), 'Gmail thread with extension panel', font=font(18), fill=MUTED)
    return img


def slide4():
    img = Image.new('RGBA', (SLIDE_W, SLIDE_H), BG)
    d = ImageDraw.Draw(img)
    add_heading(d, 'Research Objectives and Scope', 'Design goals for the email orchestration system')
    cards = [
        ('01', 'Inbox-native capture', 'Captures active conversation context from webmail clients.'),
        ('02', 'Context preservation', 'Uses token budgeting, caching, and task-aware routing.'),
        ('03', 'Personalization', 'Supports tone control, signature reuse, and policy memory.'),
        ('04', 'Observability', 'Tracks latency, tokens, estimated cost, and routing efficiency.'),
        ('05', 'Resilience', 'Provides fallback inference and rate-limit-tolerant handling.'),
    ]
    positions = [(90, 210), (664, 210), (1238, 210), (332, 525), (906, 525)]
    icon_colors = [ACCENT, ACCENT_2, ACCENT_3, WARN, ACCENT]
    for (num, title, body), (x, y), color in zip(cards, positions, icon_colors):
        rounded_panel(d, (x, y, x + 500, y + 250), radius=28, fill='white', outline=LINE)
        d.ellipse((x + 26, y + 26, x + 104, y + 104), fill=color)
        d.text((x + 50, y + 46), num, font=font(24, bold=True), fill='white')
        d.text((x + 136, y + 42), title, font=font(28, bold=True), fill=TEXT)
        draw_text_box(d, (x + 136, y + 92), body, font(20), MUTED, 320, spacing=7)
    return img


def slide5():
    img = Image.new('RGBA', (SLIDE_W, SLIDE_H), BG)
    d = ImageDraw.Draw(img)
    add_heading(d, 'Related Work and Research Gap', 'Comparison of common email assistance approaches')
    x0, y0, widths = 70, 220, [340, 240, 280, 1030]
    headers = ['Existing Approach', 'Strength', 'Limitation', 'Why Our System Is Different']
    for i, (xw, h) in enumerate(zip(widths, [70]*4)):
        x = x0 + sum(widths[:i])
        rounded_panel(d, (x, y0, x + widths[i], y0 + 76), radius=16, fill=ACCENT if i == 0 else '#EAF1FB', outline=ACCENT if i == 0 else LINE)
        d.text((x + 18, y0 + 22), headers[i], font=font(22, bold=True), fill='white' if i == 0 else TEXT)
    rows = [
        ('Smart compose systems', 'Fast completion', 'No full-thread reasoning', 'Understands entire conversation context and urgency'),
        ('Manual LLM use', 'Flexible prompts', 'Workflow breaks on copy-paste', 'Keeps the user inside the inbox with embedded controls'),
        ('Enterprise copilots', 'Integrated UX', 'Opaque routing and cost', 'Shows route reason, latency, and estimated cost'),
        ('Template-based systems', 'Deterministic', 'Weak semantic adaptation', 'Preserves tone, memory, and action-specific generation'),
    ]
    y = 310
    row_h = 150
    for r in rows:
        x = x0
        for j, text in enumerate(r):
            rounded_panel(d, (x, y, x + widths[j], y + row_h), radius=14, fill='white', outline=LINE)
            draw_text_box(d, (x + 18, y + 20), text, font(20 if j != 3 else 19, bold=(j == 0)), TEXT if j in (0, 3) else MUTED, widths[j] - 36, spacing=6)
            x += widths[j]
        y += row_h + 16
    rounded_panel(d, (70, 930, 1850, 1030), radius=18, fill='#F0F7FF', outline='#B9D7F5')
    d.text((100, 960), 'Research gap: a browser-native, context-preserving, cost-aware, and provider-flexible email orchestration system with explicit telemetry and evaluation.', font=font(24, bold=True), fill=TEXT)
    return img


def slide6():
    img = Image.new('RGBA', (SLIDE_W, SLIDE_H), BG)
    d = ImageDraw.Draw(img)
    add_heading(d, 'System Architecture and Proposed Model', 'Three-layer architecture with observability')
    # left explanation
    rounded_panel(d, (74, 185, 590, 1000), radius=24, fill='white', outline=LINE)
    sections = [
        ('Presentation Layer', ['Gmail and Outlook Web', 'Thread capture and result rendering'], ACCENT),
        ('Orchestration Layer', ['Context normalization', 'Memory retrieval and preference cache', 'Task-aware routing', 'Prompt assembly and policy checks'], ACCENT_2),
        ('Inference Layer', ['OpenRouter-backed model profiles', 'Summarization, reply generation, rewriting, and classification'], ACCENT_3),
        ('Observability Layer', ['Action history', 'Latency', 'Token usage', 'Estimated cost', 'Routing savings'], WARN),
    ]
    y = 230
    for title, lines, color in sections:
        d.rounded_rectangle((104, y, 540, y + 34), radius=10, fill=color)
        d.text((120, y + 6), title, font=font(19, bold=True), fill='white')
        y += 48
        for line in lines:
            d.ellipse((112, y + 8, 122, y + 18), fill=color)
            d.text((136, y), line, font=font(19), fill=TEXT)
            y += 34
        y += 16
    # right diagram
    panel = (620, 185, 1850, 845)
    rounded_panel(d, panel, radius=24, fill='white', outline=LINE)
    d.text((650, 210), 'Architecture Flow', font=font(24, bold=True), fill=TEXT)
    flow = [
        ('Capture thread', ACCENT), ('Normalize context', ACCENT_2), ('Resolve memory', ACCENT_3),
        ('Route model', ACCENT), ('Generate output', ACCENT_2), ('Log metrics', WARN), ('Show result', ACCENT)
    ]
    x = 665
    y = 345
    bw = 145
    bh = 90
    gap = 22
    for i, (label, color) in enumerate(flow):
        d.rounded_rectangle((x, y, x + bw, y + bh), radius=18, fill=color)
        tb = d.textbbox((0, 0), label, font=font(18, bold=True))
        d.text((x + (bw - (tb[2]-tb[0]))/2, y + 34), label, font=font(18, bold=True), fill='white')
        if i < len(flow) - 1:
            d.polygon([(x + bw + 6, y + 38), (x + bw + 28, y + 45), (x + bw + 6, y + 52)], fill=MUTED)
        x += bw + gap
        if i == 3:
            x = 665
            y += 140
    d.text((650, 675), 'Mermaid: capture -> normalize -> memory -> routing -> inference -> post-processing -> telemetry', font=font(18), fill=MUTED)
    # diagram cards and screenshot row
    pm = fit_contain(load_img('proposed_model.png'), (540, 210), bg='#FFFFFF')
    pp = fit_contain(load_img('processing_pipeline.png'), (540, 150), bg='#FFFFFF')
    img.paste(pm, (650, 745))
    img.paste(pp, (1215, 760))
    d.rounded_rectangle((650, 745, 1190, 955), radius=18, outline=LINE, width=2)
    d.rounded_rectangle((1215, 760, 1755, 910), radius=18, outline=LINE, width=2)
    return img


def slide7():
    img = Image.new('RGBA', (SLIDE_W, SLIDE_H), BG)
    d = ImageDraw.Draw(img)
    add_heading(d, 'Methodology and Algorithm', 'Execution pipeline for the inbox-native assistant')
    steps = [
        'Extract the active thread and assemble a bounded conversation context.',
        'Normalize the thread by removing UI noise and unnecessary text fragments.',
        'Resolve user memory, tone, signature, and default profile.',
        'Route the task to the appropriate OpenRouter-backed profile.',
        'Generate the output with task-specific prompts and context constraints.',
        'Parse structured metadata such as confidence, priority, and action items.',
        'Record telemetry including route reason, latency, token usage, and estimated cost.',
        'Render the result in the interface and persist the action history.',
    ]
    rounded_panel(d, (76, 190, 1100, 760), radius=24, fill='white', outline=LINE)
    y = 250
    for i, step in enumerate(steps, 1):
        d.ellipse((110, y + 6, 148, y + 44), fill=ACCENT)
        d.text((121, y + 11), str(i), font=font(18, bold=True), fill='white')
        draw_text_box(d, (170, y), step, font(22), TEXT, 850, spacing=6)
        y += 60
    # pipeline diagram
    rounded_panel(d, (1160, 190, 1848, 630), radius=24, fill='white', outline=LINE)
    d.text((1190, 210), 'Processing Pipeline', font=font(24, bold=True), fill=TEXT)
    boxes = [('Extract Thread', ACCENT), ('Apply Memory', ACCENT_2), ('Route Model', ACCENT_3), ('Generate Output', ACCENT), ('Log Metrics', WARN), ('Show Result', ACCENT)]
    x = 1190
    y = 350
    bw = 96
    bh = 96
    for i, (label, color) in enumerate(boxes):
        d.rounded_rectangle((x, y, x + bw, y + bh), radius=16, fill=color)
        tb = d.textbbox((0, 0), label, font=font(16, bold=True))
        lx = x + (bw - (tb[2]-tb[0])) / 2
        ly = y + 35
        for line in wrap_lines(d, label, font(16, bold=True), bw - 12):
            d.text((x + 6, ly), line, font=font(16, bold=True), fill='white')
            ly += 18
        if i < len(boxes) - 1:
            d.polygon([(x + bw + 8, y + 42), (x + bw + 26, y + 48), (x + bw + 8, y + 54)], fill=MUTED)
        x += 110
    # small screenshot
    ss = fit_contain(load_img('gmail_draft_reply.png'), (620, 240), bg='#FFFFFF')
    img.paste(ss, (1190, 670))
    d.rounded_rectangle((1190, 670, 1810, 910), radius=18, outline=LINE, width=2)
    d.text((1190, 930), 'Extension result card example', font=font(18), fill=MUTED)
    return img


def slide8():
    img = Image.new('RGBA', (SLIDE_W, SLIDE_H), BG)
    d = ImageDraw.Draw(img)
    add_heading(d, 'Demonstration and Implementation', 'Implementation evidence from Gmail, memory, and evaluation pages')
    rounded_panel(d, (74, 186, 1848, 1004), radius=24, fill='white', outline=LINE)
    d.text((104, 220), 'The implementation demonstrates:', font=font(24, bold=True), fill=TEXT)
    demo_items = ['Browser-embedded thread analysis', 'Memory-aware generation', 'Explainable model routing', 'Observability and evaluation', 'Demo-safe fallback handling']
    y = 270
    for item in demo_items:
        d.rounded_rectangle((104, y, 760, y + 64), radius=18, fill='#F5F9FF', outline='#CFE0F4')
        d.ellipse((130, y + 18, 148, y + 36), fill=ACCENT)
        d.text((170, y + 18), item, font=font(21), fill=TEXT)
        y += 78
    imgs = [
        ('gmail_summary.png', (820, 250, 1240, 500), 'Gmail thread + assistant panel'),
        ('gmail_draft_reply.png', (1260, 250, 1790, 500), 'Generated reply with route reason'),
        ('memory_personalization.png', (820, 560, 1240, 850), 'Memory settings and tone control'),
        ('extension_action_log.png', (1260, 560, 1790, 850), 'Actions and evaluation log'),
    ]
    for name, box, caption in imgs:
        x1, y1, x2, y2 = box
        im = fit_contain(load_img(name), (x2 - x1, y2 - y1), bg='#FFFFFF')
        img.paste(im, (x1, y1))
        d.rounded_rectangle(box, radius=18, outline=LINE, width=2)
        d.text((x1, y2 + 10), caption, font=font(16), fill=MUTED)
    d.text((104, 760), 'How to use your two Gmail IDs: sender and receiver accounts, professional display names, a 3-message thread, and a second thread for reply generation.', font=font(18), fill=MUTED)
    d.text((104, 804), 'Best thread template: final project review, demo readiness, and concise action items.', font=font(18), fill=MUTED)
    return img


def slide9():
    img = Image.new('RGBA', (SLIDE_W, SLIDE_H), BG)
    d = ImageDraw.Draw(img)
    add_heading(d, 'Demonstration, Evaluation, and Results', 'Benchmarking across summarization, reply generation, rewriting, and classification')
    rounded_panel(d, (74, 186, 1100, 1002), radius=24, fill='white', outline=LINE)
    graph = fit_contain(load_img('demo_bench_graph.png'), (980, 560), bg='#FFFFFF')
    img.paste(graph, (110, 250))
    d.rounded_rectangle((110, 250, 1090, 810), radius=18, outline=LINE, width=2)
    d.text((110, 830), 'Evaluation chart and KPI overview', font=font(18), fill=MUTED)
    x0 = 1140
    y0 = 220
    w = 690
    h = 120
    metrics = [
        ('Cost', 'Higher', 'Lower', 'Improved efficiency'),
        ('Latency', 'Stable', 'Comparable', 'Acceptable for demo use'),
        ('Thread Fidelity', 'Moderate', 'Higher', 'Better context retention'),
        ('Explainability', 'None', 'Route reason + metadata', 'Stronger transparency'),
    ]
    headers = ['Metric', 'Fixed Baseline', 'Routed System', 'Observation']
    widths = [170, 170, 180, 170]
    x = x0
    for i, head in enumerate(headers):
        rounded_panel(d, (x, y0, x + widths[i], y0 + 60), radius=12, fill=ACCENT if i == 0 else '#EAF1FB', outline=ACCENT if i == 0 else LINE)
        d.text((x + 12, y0 + 18), head, font=font(18, bold=True), fill='white' if i == 0 else TEXT)
        x += widths[i]
    y = y0 + 76
    for r in metrics:
        x = x0
        for i, cell in enumerate(r):
            rounded_panel(d, (x, y, x + widths[i], y + 56), radius=12, fill='white', outline=LINE)
            d.text((x + 12, y + 16), cell, font=font(16, bold=(i == 0)), fill=TEXT if i != 3 else MUTED)
            x += widths[i]
        y += 66
    rounded_panel(d, (1140, 640, 1830, 1002), radius=18, fill='#F8FBFF', outline='#D8E9FA')
    evaluation = (
        'Benchmark methodology:\n'
        '- Curated Gmail and Outlook threads with varying length, intent, and urgency\n'
        '- Action-specific evaluation across summarization, reply generation, rewriting, and classification\n'
        '- Telemetry recorded for latency, token usage, estimated cost, baseline cost, and routing savings\n\n'
        'Key findings:\n'
        '- Task-aware routing improves cost efficiency relative to a fixed-profile baseline\n'
        '- Longer threads benefit from context-strong routing profiles\n'
        '- Memory improves tone alignment, signature consistency, and response relevance\n'
        '- The system provides explainability through route reason, priority reason, and structured metadata\n\n'
        'Insert measured values from the evaluation page if needed.'
    )
    draw_text_box(d, (1168, 668), evaluation, font(18), TEXT, 620, spacing=6)
    return img


def slide10():
    img = Image.new('RGBA', (SLIDE_W, SLIDE_H), BG)
    d = ImageDraw.Draw(img)
    add_heading(d, 'Conclusion and Future Work', 'Summary of the research contribution and next steps')
    rounded_panel(d, (74, 186, 1848, 1002), radius=24, fill='white', outline=LINE)
    d.text((108, 228), 'Conclusion', font=font(28, bold=True), fill=TEXT)
    conclusion = (
        'The project shows that email automation becomes substantially more effective when generation is combined '
        'with thread context, model routing, and preference memory.\n\n'
        'The system shifts email handling from manual drafting to an intelligent orchestration workflow with '
        'visible cost and latency trade-offs.'
    )
    draw_text_box(d, (108, 280), conclusion, font(23), TEXT, 760, spacing=8)
    d.text((108, 560), 'Future Work', font=font(28, bold=True), fill=TEXT)
    future = ['Stronger Outlook parsing and layout stabilization', 'Attachment-aware summarization', 'Multilingual support', 'Persistent storage for long-term memory', 'Controlled user studies and quality scoring']
    y = 618
    for item in future:
        d.rounded_rectangle((108, y, 860, y + 56), radius=14, fill='#F5F9FF', outline='#D2E3F3')
        d.ellipse((132, y + 18, 146, y + 32), fill=ACCENT)
        d.text((164, y + 16), item, font=font(20), fill=TEXT)
        y += 68
    # roadmap cards
    x = 930
    roadmap = [('Parsing', ACCENT), ('Memory', ACCENT_2), ('Multilingual', ACCENT_3), ('Studies', WARN)]
    for i, (label, color) in enumerate(roadmap):
        rounded_panel(d, (x, 300, x + 205, 610), radius=22, fill='#F8FBFF', outline=LINE)
        d.rounded_rectangle((x + 26, 330, x + 179, 410), radius=18, fill=color)
        tb = d.textbbox((0, 0), label, font=font(22, bold=True))
        d.text((x + 26 + (153 - (tb[2]-tb[0]))/2, 437), label, font=font(22, bold=True), fill=TEXT)
        d.text((x + 26, 480), 'Future work card', font=font(16), fill=MUTED)
        x += 230
    d.text((930, 690), 'A simple roadmap can also be used here for presentation polish.', font=font(18), fill=MUTED)
    return img


SLIDE_BUILDERS = [None, None, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9, slide10]


def make_slide_pngs(tmp: Path):
    imgs = {}
    for idx in range(2, 11):
        img = SLIDE_BUILDERS[idx]()
        path = tmp / f'slide{idx}.png'
        img.convert('RGB').save(path, quality=95)
        imgs[idx] = path
    return imgs


def emu(v):
    return str(int(v))


def build_pptx():
    tmp = TMP_DIR
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True)
    pngs = make_slide_pngs(tmp)
    with zipfile.ZipFile(SRC_PPTX, 'r') as zin:
        zin.extractall(tmp / 'src')

    src = tmp / 'src'
    media = src / 'ppt' / 'media'
    media.mkdir(exist_ok=True)

    # write fresh images for slides 2-10, keeping slide1 untouched
    for idx in range(2, 11):
        target = media / f'final_slide{idx}.png'
        shutil.copy2(pngs[idx], target)

    ns = {
        'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    }
    ET.register_namespace('p', ns['p'])
    ET.register_namespace('a', ns['a'])
    ET.register_namespace('r', ns['r'])

    # Modify rels + slide xml for slides 2-10
    for idx in range(2, 11):
        slide_xml = src / 'ppt' / 'slides' / f'slide{idx}.xml'
        rel_xml = src / 'ppt' / 'slides' / '_rels' / f'slide{idx}.xml.rels'
        root = ET.fromstring(slide_xml.read_text(encoding='utf-8'))
        rels = ET.fromstring(rel_xml.read_text(encoding='utf-8'))

        # keep only slide layout rel + make one image rel
        for rel in list(rels):
            if rel.attrib.get('Type', '').endswith('/image'):
                rels.remove(rel)
        img_rel_id = 'rId2'
        ET.SubElement(rels, '{%s}Relationship' % 'http://schemas.openxmlformats.org/package/2006/relationships', {
            'Id': img_rel_id,
            'Type': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
            'Target': f'../media/final_slide{idx}.png',
        })

        # clear shapes and add a single full-slide image
        spTree = root.find('.//p:spTree', ns)
        for child in list(spTree):
            if child.tag != '{%s}nvGrpSpPr' % ns['p'] and child.tag != '{%s}grpSpPr' % ns['p']:
                spTree.remove(child)

        pic = ET.Element('{%s}pic' % ns['p'])
        nvPicPr = ET.SubElement(pic, '{%s}nvPicPr' % ns['p'])
        ET.SubElement(nvPicPr, '{%s}cNvPr' % ns['p'], {'id': '2', 'name': f'FullSlideImage{idx}'})
        ET.SubElement(nvPicPr, '{%s}cNvPicPr' % ns['p'])
        ET.SubElement(nvPicPr, '{%s}nvPr' % ns['p'])
        blipFill = ET.SubElement(pic, '{%s}blipFill' % ns['p'])
        blip = ET.SubElement(blipFill, '{%s}blip' % ns['a'], { '{%s}embed' % ns['r']: img_rel_id })
        ET.SubElement(blipFill, '{%s}srcRect' % ns['a'])
        stretch = ET.SubElement(blipFill, '{%s}stretch' % ns['a'])
        ET.SubElement(stretch, '{%s}fillRect' % ns['a'])
        spPr = ET.SubElement(pic, '{%s}spPr' % ns['p'])
        xfrm = ET.SubElement(spPr, '{%s}xfrm' % ns['a'])
        ET.SubElement(xfrm, '{%s}off' % ns['a'], {'x': '0', 'y': '0'})
        ET.SubElement(xfrm, '{%s}ext' % ns['a'], {'cx': emu(12192000), 'cy': emu(6858000)})
        prstGeom = ET.SubElement(spPr, '{%s}prstGeom' % ns['a'], {'prst': 'rect'})
        ET.SubElement(prstGeom, '{%s}avLst' % ns['a'])
        spTree.append(pic)
        slide_xml.write_text(ET.tostring(root, encoding='unicode'), encoding='utf-8')
        rel_xml.write_text(ET.tostring(rels, encoding='unicode'), encoding='utf-8')

    # package back up
    if OUT_PPTX.exists():
        OUT_PPTX.unlink()
    with zipfile.ZipFile(OUT_PPTX, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for file in src.rglob('*'):
            if file.is_file():
                zout.write(file, file.relative_to(src))


if __name__ == '__main__':
    build_pptx()
