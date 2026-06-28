#!/usr/bin/env python3
"""
SportyKore — campaign flyer generator (1080×1920, 9:16).

Reads campaign definitions from campaigns.json (mirrors CANVA_CAMPAIGNS.md).
Pass a campaign id and optional overrides; output is brand-consistent every time.

Layout (top → bottom):
  headline → subline → vector slot → iPhone mockup + screenshot → CTA → footer

Optional local graphics:
  --vector path/to/art.png          use a pre-made illustration
  --generate-vector                 call Ollama image model (e.g. flux) locally
  --enhance-vector-prompt           ask a local text LLM to expand the vector prompt

Fonts: place Pacifico, Open Sans Variable, Playfair Display Variable in ./fonts/
  (same files as the waitlist flyer kit).

Usage:
  python make_flyer.py --campaign 7
  python make_flyer.py --campaign 1 --screen player-profile.png
  python make_flyer.py --campaign 3 --generate-vector --ollama-model flux
  python make_flyer.py --list
"""

from __future__ import annotations

import argparse
import base64
import json
import math
import sys
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFont

try:
    import requests
except ImportError:  # pragma: no cover — only needed for --generate-vector
    requests = None  # type: ignore

HERE = Path(__file__).resolve().parent
FONTS = HERE / "fonts"
CAMPAIGNS_FILE = HERE / "campaigns.json"
DEFAULT_OUTPUT_DIR = HERE / "output"

W, H = 1080, 1920

# Brand tokens — CANVA_CAMPAIGNS.md / tailwind.config.js
DARK = (18, 18, 18)  # #121212
GOLD_TINT = (230, 168, 23)  # #E6A817
GOLD = (230, 168, 23)  # wordmark / accents
GOLD_CTA = (242, 169, 0)  # #F2A900 — CTA pill
GOLD_DEEP = (230, 168, 23)
PURPLE = (74, 20, 140)  # #4A148C
PURPLE_DEEP = (44, 12, 84)  # #2C0C54
WHITE = (255, 255, 255)
OFFWHITE = (232, 227, 219)
DARK_LABEL = (23, 23, 23)  # #171717 on gold CTA
MUTED_FOOTER = (197, 191, 181)

SAFE_TOP = 120
SAFE_BOTTOM = 200
SAFE_SIDE = 72

# iPhone 17 Pro simulator capture (native @3x)
SCREEN_NATIVE_W, SCREEN_NATIVE_H = 1206, 2622

# Layout zones (y ranges are approximate anchors)
VECTOR_H = 360
PHONE_MAX_W = 520
PHONE_MAX_H = 920


# ---------------------------------------------------------------------------
# Fonts
# ---------------------------------------------------------------------------


# macOS system fallbacks when ./fonts/ is not set up yet
_FONT_FALLBACKS: dict[str, list[str]] = {
    "Pacifico-Regular.ttf": [
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/Library/Fonts/Arial.ttf",
    ],
    "OpenSans-Variable.ttf": [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
    ],
    "PlayfairDisplay-Variable.ttf": [
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
    ],
}


def _font(path: str, size: int) -> ImageFont.FreeTypeFont:
    candidates = [FONTS / path, *[Path(p) for p in _FONT_FALLBACKS.get(path, [])]]
    for full in candidates:
        if full.exists():
            font = ImageFont.truetype(str(full), size)
            if path.endswith("Variable.ttf") and hasattr(font, "set_variation_by_name"):
                try:
                    if "OpenSans" in path:
                        font.set_variation_by_name("Regular")
                    elif "Playfair" in path:
                        font.set_variation_by_name("Bold")
                except OSError:
                    pass
            return font
    raise FileNotFoundError(
        f"Missing font {path}. Add brand fonts to screens-images/fonts/ "
        "(Pacifico-Regular.ttf, OpenSans-Variable.ttf, PlayfairDisplay-Variable.ttf)."
    )


def pacifico(size: int) -> ImageFont.FreeTypeFont:
    return _font("Pacifico-Regular.ttf", size)


def open_sans(size: int, weight: str = "Regular") -> ImageFont.FreeTypeFont:
    f = _font("OpenSans-Variable.ttf", size)
    if hasattr(f, "set_variation_by_name"):
        try:
            f.set_variation_by_name(weight)
        except OSError:
            pass
    return f


def playfair(size: int, weight: str = "Bold") -> ImageFont.FreeTypeFont:
    f = _font("PlayfairDisplay-Variable.ttf", size)
    if hasattr(f, "set_variation_by_name"):
        try:
            f.set_variation_by_name(weight)
        except OSError:
            pass
    return f


# ---------------------------------------------------------------------------
# Drawing helpers (shared brand language)
# ---------------------------------------------------------------------------


def diagonal_stripe_background(w: int, h: int) -> Image.Image:
    yy, xx = np.mgrid[0:h, 0:w]
    period = 20
    band = (xx + yy) % period
    stripe_mask = band >= 18

    base = np.zeros((h, w, 3), dtype=np.float32)
    base[:, :] = DARK
    tint = np.array(GOLD_TINT, dtype=np.float32)
    alpha = 0.10
    blended = base * (1 - alpha) + tint * alpha
    out = np.where(stripe_mask[..., None], blended, base).astype(np.uint8)
    return Image.fromarray(out, mode="RGB")


def add_vignette(
    img: Image.Image,
    color: tuple[int, int, int],
    strength: float = 0.35,
    center: tuple[float, float] = (0.5, 0.30),
    radius: float = 0.55,
) -> Image.Image:
    w, h = img.size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = center[0] * w, center[1] * h
    r = radius * max(w, h)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    mask = np.clip(1 - dist, 0, 1) ** 2 * strength

    base = np.array(img, dtype=np.float32)
    tint = np.array(color, dtype=np.float32)
    out = base * (1 - mask[..., None]) + tint * mask[..., None]
    return Image.fromarray(out.astype(np.uint8), mode="RGB")


def wrap_to_width(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for word in words:
        trial = (cur + " " + word).strip()
        bbox = draw.textbbox((0, 0), trial, font=font)
        if bbox[2] - bbox[0] <= max_width or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def draw_centered_line(draw, cx: int, y: int, text: str, font, fill) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    draw.text((cx - w / 2, y), text, font=font, fill=fill)
    return bbox[3] - bbox[1]


def rounded_rect(draw, box, radius: int, **kwargs) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=kwargs.get("fill"), outline=kwargs.get("outline"), width=kwargs.get("width", 1))


def pitch_motif_placeholder(size: int, color=GOLD_DEEP, alpha: int = 46) -> Image.Image:
    """Fallback when no vector art is supplied."""
    scale = 3
    big = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    s = size * scale
    stroke = 5 * scale
    rgba = (*color, alpha)
    d.ellipse([stroke, stroke, s - stroke, s - stroke], outline=rgba, width=stroke)
    d.line([(0, s // 2), (s, s // 2)], fill=rgba, width=stroke)
    dot_r = 7 * scale
    d.ellipse(
        [s // 2 - dot_r, s // 2 - dot_r, s // 2 + dot_r, s // 2 + dot_r],
        fill=(*color, min(alpha + 40, 255)),
    )
    return big.resize((size, size), Image.LANCZOS)


# ---------------------------------------------------------------------------
# Phone mockup + screenshot
# ---------------------------------------------------------------------------


def _center_crop_to_aspect(img: Image.Image, target_aspect: float) -> Image.Image:
    w, h = img.size
    current = w / h
    if current > target_aspect:
        new_w = int(h * target_aspect)
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    new_h = int(w / target_aspect)
    top = (h - new_h) // 2
    return img.crop((0, top, w, top + new_h))


def compose_phone_mockup(screenshot_path: Path, frame_w: int, frame_h: int) -> Image.Image:
    """Simple iPhone-style bezel; screenshot is center-cropped then scaled."""
    bezel = 14
    corner = 48
    island_w, island_h = int(frame_w * 0.28), 28

    shot = Image.open(screenshot_path).convert("RGB")
    inner_w = frame_w - bezel * 2
    inner_h = frame_h - bezel * 2 - island_h // 2
    inner_aspect = inner_w / inner_h
    shot = _center_crop_to_aspect(shot, inner_aspect)
    shot = shot.resize((inner_w, inner_h), Image.LANCZOS)

    frame = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)

    outer = (0, 0, frame_w, frame_h)
    draw.rounded_rectangle(outer, radius=corner, fill=(30, 30, 34, 255), outline=(90, 90, 98, 255), width=3)

    inner_box = (bezel, bezel + island_h // 2, frame_w - bezel, frame_h - bezel)
    frame.paste(shot, (inner_box[0], inner_box[1]))

    # Dynamic Island
    ix0 = frame_w // 2 - island_w // 2
    iy0 = bezel + 8
    draw.rounded_rectangle(
        (ix0, iy0, ix0 + island_w, iy0 + island_h),
        radius=island_h // 2,
        fill=(12, 12, 14, 255),
    )

    # Home indicator
    bar_w = int(frame_w * 0.36)
    bar_h = 5
    bx0 = frame_w // 2 - bar_w // 2
    by0 = frame_h - bezel + 6
    draw.rounded_rectangle((bx0, by0, bx0 + bar_w, by0 + bar_h), radius=3, fill=(200, 200, 205, 180))

    return frame


def fit_vector_art(path: Path, max_w: int, max_h: int) -> Image.Image:
    art = Image.open(path).convert("RGBA")
    art.thumbnail((max_w, max_h), Image.LANCZOS)
    return art


# ---------------------------------------------------------------------------
# Campaign data
# ---------------------------------------------------------------------------


def load_campaigns() -> dict[str, Any]:
    with CAMPAIGNS_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def resolve_campaign(
    campaign_id: str,
    *,
    headline: str | None = None,
    subline: str | None = None,
    cta: str | None = None,
    footer: str | None = None,
    screen: str | None = None,
    vector_prompt: str | None = None,
) -> dict[str, Any]:
    data = load_campaigns()
    key = str(campaign_id)
    if key not in data["campaigns"]:
        known = ", ".join(sorted(data["campaigns"]))
        raise KeyError(f"Unknown campaign {campaign_id!r}. Choose from: {known}")

    camp = dict(data["campaigns"][key])
    defaults = data.get("defaults", {})
    camp["headline"] = headline or camp["headline"]
    camp["subline"] = subline or camp["subline"]
    camp["cta"] = cta or camp["cta"]
    camp["footer"] = footer or defaults.get("footer", "sportykore.com")
    camp["wordmark"] = defaults.get("wordmark", "SportyKore")
    camp["screen_file"] = screen or camp["screen"]
    camp["vector_prompt"] = vector_prompt or camp.get("vector_prompt", "")
    camp["screens_dir"] = HERE / defaults.get("screens_dir", ".")
    return camp


# ---------------------------------------------------------------------------
# Optional local LLM / image backends
# ---------------------------------------------------------------------------


def _require_requests() -> None:
    if requests is None:
        raise RuntimeError("Install requests: pip install -r requirements-flyer.txt")


def ollama_available(base_url: str) -> bool:
    _require_requests()
    try:
        r = requests.get(f"{base_url.rstrip('/')}/api/tags", timeout=3)
        return r.ok
    except requests.RequestException:
        return False


def enhance_vector_prompt_ollama(prompt: str, base_url: str, model: str) -> str:
    """Use a local text LLM to expand the Canva-style vector brief."""
    _require_requests()
    payload = {
        "model": model,
        "prompt": (
            "You write concise image-generation prompts for flat vector marketing art. "
            "Expand the brief below in one paragraph. Keep brand colors purple #4A148C "
            "and gold #E6A817. No photorealism. Leave space at top for headline. "
            "Output only the prompt.\n\nBrief:\n" + prompt
        ),
        "stream": False,
    }
    r = requests.post(f"{base_url.rstrip('/')}/api/generate", json=payload, timeout=120)
    r.raise_for_status()
    return r.json().get("response", prompt).strip()


def generate_vector_ollama(prompt: str, out_path: Path, base_url: str, model: str) -> Path:
    """
    Generate vector-style art via Ollama image-capable models (e.g. flux, sd).

    Requires: ollama pull flux  (or another image model your Ollama build supports)
    """
    _require_requests()
    payload = {"model": model, "prompt": prompt, "stream": False}
    r = requests.post(f"{base_url.rstrip('/')}/api/generate", json=payload, timeout=600)
    r.raise_for_status()
    body = r.json()

    if "image" in body and body["image"]:
        raw = base64.b64decode(body["image"])
        out_path.write_bytes(raw)
        return out_path

    raise RuntimeError(
        f"Model {model!r} did not return an image. "
        "Use an Ollama image model (e.g. flux) or pass --vector path/to/art.png"
    )


# ---------------------------------------------------------------------------
# Main render
# ---------------------------------------------------------------------------


def new_canvas() -> Image.Image:
    img = diagonal_stripe_background(W, H)
    return add_vignette(img, PURPLE, strength=0.38, center=(0.5, 0.22), radius=0.55)


def render_campaign_flyer(
    camp: dict[str, Any],
    *,
    screen_path: Path | None,
    vector_path: Path | None,
    out_path: Path,
    show_badge: bool = True,
) -> Path:
    img = new_canvas()
    draw = ImageDraw.Draw(img)
    cx = W // 2
    y = SAFE_TOP
    max_w = W - 2 * SAFE_SIDE

    # Optional small audience badge
    if show_badge and camp.get("audience"):
        badge_font = open_sans(22, "SemiBold")
        badge = camp["audience"].split(",")[0].strip()[:28]
        bbox = draw.textbbox((0, 0), badge, font=badge_font)
        bw = bbox[2] - bbox[0]
        pad_x, pad_y = 22, 10
        box = (cx - bw / 2 - pad_x, y, cx + bw / 2 + pad_x, y + (bbox[3] - bbox[1]) + pad_y * 2)
        rounded_rect(draw, box, radius=999, outline=GOLD, width=2)
        draw.text((cx - bw / 2, y + pad_y), badge, font=badge_font, fill=GOLD)
        y = box[3] + 28

    # Wordmark
    wm_font = pacifico(72)
    y += draw_centered_line(draw, cx, y, camp.get("wordmark", "SportyKore"), wm_font, GOLD)
    y += 36

    # Headline
    head_font = playfair(68, "Bold")
    for line in wrap_to_width(draw, camp["headline"], head_font, max_w):
        y += draw_centered_line(draw, cx, y, line, head_font, WHITE) + 10
    y += 16

    # Subline (~80% white)
    sub_font = open_sans(34, "Regular")
    sub_fill = (OFFWHITE[0], OFFWHITE[1], OFFWHITE[2])
    for line in wrap_to_width(draw, camp["subline"], sub_font, max_w - 20):
        y += draw_centered_line(draw, cx, y, line, sub_font, sub_fill) + 12
    y += 24

    # Vector slot
    vector_top = y
    vector_w = W - 2 * SAFE_SIDE
    if vector_path and vector_path.exists():
        art = fit_vector_art(vector_path, vector_w, VECTOR_H)
        ax = cx - art.width // 2
        img.paste(art, (ax, vector_top), art)
        y = vector_top + art.height + 20
    else:
        motif_size = min(vector_w, VECTOR_H - 20)
        motif = pitch_motif_placeholder(motif_size)
        img.paste(motif, (cx - motif_size // 2, vector_top + (VECTOR_H - motif_size) // 2), motif)
        y = vector_top + VECTOR_H

    # Phone + screenshot — fit between vector and CTA safe zone
    cta_zone_top = H - SAFE_BOTTOM - 200
    available_h = max(280, cta_zone_top - y - 32)

    if screen_path and screen_path.exists():
        frame_h = min(PHONE_MAX_H, available_h)
        frame_w = int(frame_h * SCREEN_NATIVE_W / SCREEN_NATIVE_H)
        frame_w = min(frame_w, PHONE_MAX_W)
        frame_h = int(frame_w * SCREEN_NATIVE_H / SCREEN_NATIVE_W)

        phone = compose_phone_mockup(screen_path, frame_w, frame_h)
        px = cx - phone.width // 2
        py = y + 8
        if py + phone.height > cta_zone_top - 16:
            py = cta_zone_top - phone.height - 16
        # Soft gold glow behind phone
        glow = Image.new("RGBA", (phone.width + 80, phone.height + 80), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.rounded_rectangle((20, 20, glow.width - 20, glow.height - 20), radius=40, fill=(230, 168, 23, 35))
        img.paste(glow, (px - 40, py - 40), glow)
        img.paste(phone, (px, py), phone)
        y = py + phone.height + 24
    else:
        # Placeholder frame
        ph = int(PHONE_MAX_H * 0.55)
        pw = int(ph * SCREEN_NATIVE_W / SCREEN_NATIVE_H)
        box = (cx - pw // 2, y, cx + pw // 2, y + ph)
        rounded_rect(draw, box, radius=36, outline=(100, 80, 130), width=2, fill=(26, 22, 34))
        hint = open_sans(26, "SemiBold")
        missing = f"Add {camp['screen_file']}"
        draw_centered_line(draw, cx, y + ph // 2 - 14, missing, hint, MUTED_FOOTER)
        y = box[3] + 24

    draw = ImageDraw.Draw(img)

    # CTA + footer (fixed bottom safe zone)
    cta_y = cta_zone_top
    btn_w, btn_h = 640, 120
    btn_box = (cx - btn_w // 2, cta_y, cx + btn_w // 2, cta_y + btn_h)
    rounded_rect(draw, btn_box, radius=28, fill=GOLD_CTA)
    cta_font = open_sans(36, "Bold")
    text_bbox = draw.textbbox((0, 0), camp["cta"], font=cta_font)
    text_h = text_bbox[3] - text_bbox[1]
    draw_centered_line(draw, cx, cta_y + (btn_h - text_h) / 2 - 4, camp["cta"], cta_font, DARK_LABEL)

    rule_y = btn_box[3] + 40
    draw.line([(cx - 60, rule_y), (cx + 60, rule_y)], fill=GOLD_DEEP, width=2)
    foot_font = open_sans(24, "SemiBold")
    draw_centered_line(draw, cx, rule_y + 20, camp["footer"], foot_font, MUTED_FOOTER)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "PNG")
    return out_path


def build_flyer(
    campaign_id: str,
    *,
    screen: str | None = None,
    vector: str | None = None,
    generate_vector: bool = False,
    enhance_vector_prompt: bool = False,
    ollama_url: str = "http://127.0.0.1:11434",
    ollama_text_model: str = "llama3.2",
    ollama_image_model: str = "flux",
    headline: str | None = None,
    subline: str | None = None,
    cta: str | None = None,
    footer: str | None = None,
    output: str | None = None,
) -> Path:
    camp = resolve_campaign(
        campaign_id,
        headline=headline,
        subline=subline,
        cta=cta,
        footer=footer,
        screen=screen,
    )

    screen_path = camp["screens_dir"] / camp["screen_file"]
    vector_path = Path(vector).resolve() if vector else None

    if generate_vector:
        if not ollama_available(ollama_url):
            raise RuntimeError(
                f"Ollama not reachable at {ollama_url}. Start Ollama or pass --vector."
            )
        prompt = camp["vector_prompt"]
        if enhance_vector_prompt:
            prompt = enhance_vector_prompt_ollama(prompt, ollama_url, ollama_text_model)
        vector_path = HERE / "output" / f"{camp['id']}_vector.png"
        generate_vector_ollama(prompt, vector_path, ollama_url, ollama_image_model)

    slug = camp["id"]
    out = Path(output) if output else DEFAULT_OUTPUT_DIR / f"campaign_{campaign_id}_{slug}.png"

    result = render_campaign_flyer(
        camp,
        screen_path=screen_path if screen_path.exists() else None,
        vector_path=vector_path,
        out_path=out,
    )

    caption_path = out.with_suffix(".caption.txt")
    caption_path.write_text(camp.get("whatsapp_caption", ""), encoding="utf-8")
    return result


def list_campaigns() -> None:
    data = load_campaigns()
    for num, camp in sorted(data["campaigns"].items(), key=lambda x: int(x[0])):
        print(f"{num:>2}. [{camp['id']}] {camp['name']}")
        print(f"    screen: {camp['screen']}")
        print(f"    headline: {camp['headline']}")
        print()


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate SportyKore WhatsApp/IG campaign flyers.")
    p.add_argument("--campaign", "-c", help="Campaign number 1–7 (see --list)")
    p.add_argument("--list", action="store_true", help="List campaigns from campaigns.json")
    p.add_argument("--screen", help="Screenshot filename or path (overrides campaign default)")
    p.add_argument("--vector", help="Pre-made vector/illustration PNG")
    p.add_argument("--generate-vector", action="store_true", help="Generate vector via local Ollama image model")
    p.add_argument("--enhance-vector-prompt", action="store_true", help="Expand vector prompt with local text LLM first")
    p.add_argument("--ollama-url", default="http://127.0.0.1:11434")
    p.add_argument("--ollama-text-model", default="llama3.2")
    p.add_argument("--ollama-image-model", default="flux")
    p.add_argument("--headline")
    p.add_argument("--subline")
    p.add_argument("--cta")
    p.add_argument("--footer")
    p.add_argument("--output", "-o", help="Output PNG path")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    if args.list:
        list_campaigns()
        return 0
    if not args.campaign:
        print("Pass --campaign N or --list", file=sys.stderr)
        return 2

    try:
        out = build_flyer(
            args.campaign,
            screen=args.screen,
            vector=args.vector,
            generate_vector=args.generate_vector,
            enhance_vector_prompt=args.enhance_vector_prompt,
            ollama_url=args.ollama_url,
            ollama_text_model=args.ollama_text_model,
            ollama_image_model=args.ollama_image_model,
            headline=args.headline,
            subline=args.subline,
            cta=args.cta,
            footer=args.footer,
            output=args.output,
        )
    except (FileNotFoundError, KeyError, RuntimeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    caption = out.with_suffix(".caption.txt")
    print(f"Wrote {out}")
    if caption.exists():
        print(f"Caption → {caption}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
