"""Generate Shop Impact Windows logo SVGs with text converted to outlines."""
import os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

NAVY, SKY, SKY2, WHITE = "#0B2540", "#38BDF8", "#0EA5E9", "#FFFFFF"
F600 = TTFont(os.path.join(HERE, "fonts", "m600.ttf"))
F800 = TTFont(os.path.join(HERE, "fonts", "m800.ttf"))


def text_path(font, text, size, tracking=0.0, x=0.0, baseline=0.0):
    """Return (svg path d, width) for text drawn with baseline at y=baseline."""
    upm = font["head"].unitsPerEm
    s = size / upm
    cmap = font.getBestCmap()
    gs = font.getGlyphSet()
    hmtx = font["hmtx"]
    pen = SVGPathPen(gs)
    cx = 0.0
    for i, ch in enumerate(text):
        gname = cmap[ord(ch)]
        tp = TransformPen(pen, (s, 0, 0, -s, x + cx, baseline))
        gs[gname].draw(tp)
        cx += hmtx[gname][0] * s
        if i < len(text) - 1:
            cx += tracking * size
    return pen.getCommands(), cx


def cap_height(font, size):
    return font["OS/2"].sCapHeight / font["head"].unitsPerEm * size


SHIELD = "M50 3 C64 9 78 11 93 11 V52 C93 80 74 99 50 109 C26 99 7 80 7 52 V11 C22 11 36 9 50 3 Z"


def icon(body, glass, uid, tx=0, ty=0, scale=1.0):
    """Shield-window icon (100x112 units). Cross is true negative space."""
    return f'''<g transform="translate({tx:.2f} {ty:.2f}) scale({scale:.4f})">
  <defs>
    <clipPath id="{uid}c"><path d="{SHIELD}"/></clipPath>
    <mask id="{uid}m" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="112"><rect width="100" height="112" fill="#fff"/><path d="M50 0 V112 M0 54 H100" stroke="#000" stroke-width="7"/></mask>
  </defs>
  <g clip-path="url(#{uid}c)" mask="url(#{uid}m)">
    <rect width="100" height="112" fill="{body}"/>
    <rect x="50" width="50" height="54" fill="{glass}"/>
    <path d="M62 44 L82 24" stroke="#fff" stroke-opacity=".55" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M71 46 L84 33" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>
  </g>
</g>'''


def palette(kind):
    if kind == "color":
        return dict(body=NAVY, glass=SKY2, shop=NAVY, rule=SKY2, impact=NAVY, windows=SKY2)
    return dict(body=WHITE, glass=SKY, shop=WHITE, rule=SKY, impact=WHITE, windows=SKY)


SHOP_SIZE, MAIN_SIZE = 16.5, 40.0
SHOP_TRACK, MAIN_TRACK = 0.55, 0.0
RULE_W, RULE_H = 62.0, 3.6


def wordmark(p, x, top, align="left", center_x=None):
    """Draw wordmark; returns (svg, width, height)."""
    ch_s = cap_height(F600, SHOP_SIZE)
    ch_m = cap_height(F800, MAIN_SIZE)
    _, w_shop = text_path(F600, "SHOP", SHOP_SIZE, SHOP_TRACK)
    _, w_imp = text_path(F800, "IMPACT ", MAIN_SIZE, MAIN_TRACK)
    _, w_win = text_path(F800, "WINDOWS", MAIN_SIZE, MAIN_TRACK)
    w_main = w_imp + w_win
    width = max(w_shop, w_main)
    b_shop = top + ch_s
    rule_y = b_shop + 8.5
    b_main = rule_y + RULE_H + 10.5 + ch_m
    height = b_main - top
    if align == "center":
        xs = center_x - w_shop / 2
        xr = center_x - RULE_W / 2
        xm = center_x - w_main / 2
    else:
        xs = xr = xm = x
    d_shop, _ = text_path(F600, "SHOP", SHOP_SIZE, SHOP_TRACK, xs, b_shop)
    d_imp, _ = text_path(F800, "IMPACT ", MAIN_SIZE, MAIN_TRACK, xm, b_main)
    d_win, _ = text_path(F800, "WINDOWS", MAIN_SIZE, MAIN_TRACK, xm + w_imp, b_main)
    svg = (f'<path d="{d_shop}" fill="{p["shop"]}"/>'
           f'<rect x="{xr:.2f}" y="{rule_y:.2f}" width="{RULE_W}" height="{RULE_H}" rx="1.8" fill="{p["rule"]}"/>'
           f'<path d="{d_imp}" fill="{p["impact"]}"/>'
           f'<path d="{d_win}" fill="{p["windows"]}"/>')
    return svg, width, height


def doc(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" width="{w:.0f}" height="{h:.0f}">'
            f'<title>{title}</title>{body}</svg>\n')


PAD = 6
files = {}
for kind in ("color", "white"):
    p = palette(kind)
    # horizontal
    ch_s = cap_height(F600, SHOP_SIZE)
    block_h = ch_s + 8.5 + RULE_H + 10.5 + cap_height(F800, MAIN_SIZE)
    top = 56 - block_h / 2
    wm, ww, _ = wordmark(p, PAD + 100 + 24, top + PAD)
    W = PAD + 100 + 24 + ww + PAD
    H = 112 + 2 * PAD
    files[f"logo-horizontal-{kind}.svg"] = doc(W, H, icon(p["body"], p["glass"], f"h{kind}", PAD, PAD) + wm,
                                               "Shop Impact Windows")
    # stacked
    _, ww, wh = wordmark(p, 0, 0)
    W = max(ww, 100) + 2 * PAD
    cx = W / 2
    IS = 1.35
    wm, _, wh = wordmark(p, 0, PAD + 112 * IS + 20, "center", cx)
    H = PAD + 112 * IS + 20 + wh + PAD
    files[f"logo-stacked-{kind}.svg"] = doc(W, H, icon(p["body"], p["glass"], f"s{kind}", cx - 50 * IS, PAD, IS) + wm,
                                            "Shop Impact Windows")
    # icon only
    files[f"icon-{kind}.svg"] = doc(100 + 2 * PAD, 112 + 2 * PAD, icon(p["body"], p["glass"], f"i{kind}", PAD, PAD),
                                    "Shop Impact Windows icon")

# app icon: navy rounded tile with white icon
files["app-icon.svg"] = doc(512, 512, f'<rect width="512" height="512" rx="112" fill="{NAVY}"/>' +
                            icon(WHITE, SKY, "app", 256 - 50 * 2.9, 256 - 56 * 2.9, 2.9), "Shop Impact Windows")
# favicon: square, icon color, slight padding
files["favicon.svg"] = doc(112, 112, icon(NAVY, SKY2, "fav", 6, 0), "Shop Impact Windows")

for name, content in files.items():
    with open(os.path.join(OUT, name), "w") as f:
        f.write(content)
print("\n".join(sorted(files)))
