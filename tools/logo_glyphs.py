"""Turn text in a brand font into SVG path data (shaped with HarfBuzz: kerning + ligatures)."""
import io, math, re
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

_cache = {}
def load(path):
    if path not in _cache:
        tt = TTFont(path); buf = io.BytesIO(); tt.flavor = None; tt.save(buf)
        data = buf.getvalue(); tt = TTFont(io.BytesIO(data))
        face = hb.Face(data); font = hb.Font(face)
        _cache[path] = (tt, font, tt['head'].unitsPerEm)
    return _cache[path]

def text_path(path, text, size, x=0, y=0, tracking=0):
    """Returns (svg path d, width, bounds) with baseline at y, starting at x, font-size `size`."""
    tt, font, upm = load(path)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    s = size / upm; pen = SVGPathPen(gs); bp = BoundsPen(gs)
    cx = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        t = (s, 0, 0, -s, x + (cx + pos.x_offset) * s, y - pos.y_offset * s)
        gs[name].draw(TransformPen(pen, t)); gs[name].draw(TransformPen(bp, t))
        cx += pos.x_advance + tracking / s
    # 1 decimal is far below a pixel at any logo size and keeps the files small
    d = re.sub(r"-?\d+\.\d+", lambda m: f"{float(m.group()):.1f}".rstrip("0").rstrip("."), pen.getCommands())
    return d, cx * s, bp.bounds

def arc(cx, cy, r, a0, a1):
    """SVG arc path from angle a0 to a1 (degrees, counter-clockwise, 0 = 3 o'clock)."""
    p = lambda a: (cx + r * math.cos(math.radians(a)), cy - r * math.sin(math.radians(a)))
    (x0, y0), (x1, y1) = p(a0), p(a1)
    large = 1 if (a1 - a0) % 360 > 180 else 0
    return f"M{x0:.2f} {y0:.2f}A{r} {r} 0 {large} 0 {x1:.2f} {y1:.2f}"

def spark(cx, cy, r):
    """Four-point star (a light glint)."""
    k = r * 0.22
    return (f"M{cx} {cy - r}C{cx + k * .3} {cy - k}  {cx + k} {cy - k * .3} {cx + r} {cy}"
            f"C{cx + k} {cy + k * .3} {cx + k * .3} {cy + k} {cx} {cy + r}"
            f"C{cx - k * .3} {cy + k} {cx - k} {cy + k * .3} {cx - r} {cy}"
            f"C{cx - k} {cy - k * .3} {cx - k * .3} {cy - k} {cx} {cy - r}Z")
