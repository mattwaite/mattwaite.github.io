"""Turn the photos in source-images/ into small pixel-art sprites for the game.

Run from this folder:  python3 make_sprites.py [preview_dir]

Writes sprites.js, which the game loads. Each sprite is stored as a small
palette plus rows of palette indexes ('.' = transparent), so the game can do
per-pixel collisions.

Inputs:
  row1.png .. row5.png  formation rows (row5 is drawn at the top)
  defender.png          the player
  bonus.png             optional bonus ship; if it's missing, the game uses a
                        built-in placeholder. Drop the file in and rerun.
"""
import json
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "source-images")
OUT = os.path.join(HERE, "sprites.js")

# name: (file, target height in px, colors, background mode)
# Ellipse modes carry (cx, cy, rx, ry) as fractions of the photo size.
SPRITES = {
    "row1": ("row1.png", 24, 10, "flood"),
    "row2": ("row2.png", 24, 10, "flood"),
    "row3": ("row3.png", 24, 10, "flood"),
    "row4": ("row4.png", 24, 10, "flood"),
    "row5": ("row5.png", 22, 3, "flood_all"),
    "defender": ("defender.png", 26, 10, ("ellipse", 0.50, 0.44, 0.40, 0.42)),
    "bonus": ("bonus.png", 22, 10, ("ellipse", 0.50, 0.43, 0.36, 0.41)),
}
# keep only the top part of each cutout so the face gets more of the pixels
KEEP_TOP = 0.88


def flood_mask(rgb, seed_frac=0.65, tol=38, all_edges=False):
    """Background = pixels connected to the border that are close to the
    border color. Seeds come from the top edge and the upper part of the side
    edges, so suits touching the bottom edge are kept."""
    h, w, _ = rgb.shape
    rgb = rgb.astype(np.int32)
    seeds = [(0, x) for x in range(w)]
    ylim = h if all_edges else int(h * seed_frac)
    seeds += [(y, 0) for y in range(ylim)] + [(y, w - 1) for y in range(ylim)]
    if all_edges:
        seeds += [(h - 1, x) for x in range(w)]
    ref = np.median(np.array([rgb[y, x] for y, x in seeds]), axis=0)
    close = np.sqrt(((rgb - ref) ** 2).sum(axis=2)) < tol
    bg = np.zeros((h, w), bool)
    q = deque()
    for y, x in seeds:
        if close[y, x] and not bg[y, x]:
            bg[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and close[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                q.append((ny, nx))
    return ~bg


def ellipse_mask(h, w, fcx, fcy, frx, fry):
    """Hand-built head-and-shoulders mask for a photo with a busy backdrop."""
    yy, xx = np.mgrid[0:h, 0:w]
    cx, cy = w * fcx, h * fcy
    head = ((xx - cx) / (w * frx)) ** 2 + ((yy - cy) / (h * fry)) ** 2 <= 1
    t = np.clip((yy - h * 0.70) / (h * 0.30), 0, 1)
    half = w * (0.30 + 0.22 * t)
    shoulders = (yy >= h * 0.70) & (np.abs(xx - w * 0.5) <= half)
    return head | shoulders


def convert(name, fname, th, ncolors, mode):
    img = Image.open(os.path.join(SRC, fname)).convert("RGB")
    rgb = np.array(img)
    if mode == "flood":
        mask = flood_mask(rgb)
    elif mode == "flood_all":
        mask = flood_mask(rgb, all_edges=True, tol=30)
    else:
        mask = ellipse_mask(*rgb.shape[:2], *mode[1:])
    # crop to the mask's bounding box
    ys, xs = np.where(mask)
    y0, y1 = ys.min(), ys.max() + 1
    if mode != "flood_all":
        y1 = y0 + int((y1 - y0) * KEEP_TOP)
    mask[y1:] = False
    ys, xs = np.where(mask)
    x0, x1 = xs.min(), xs.max() + 1
    img = img.crop((x0, y0, x1, y1))
    mask = mask[y0:y1, x0:x1]
    # punch up color and contrast so features survive the shrink
    img = ImageEnhance.Contrast(img).enhance(1.25)
    img = ImageEnhance.Color(img).enhance(1.3)
    tw = max(1, round(th * img.width / img.height))
    small = img.resize((tw, th), Image.LANCZOS)
    if mode != "flood_all":
        small = small.filter(ImageFilter.UnsharpMask(radius=1, percent=60, threshold=2))
    a = Image.fromarray((mask * 255).astype(np.uint8)).resize((tw, th), Image.BOX)
    alpha = np.array(a) >= 128
    # build the palette from opaque pixels only, so the backdrop doesn't
    # steal colors, then map every pixel onto it
    if mode == "flood_all":
        # the donkey logo is flat art: pin it to its three real colors
        palimg = Image.new("P", (1, 1))
        palimg.putpalette([18, 40, 170, 230, 40, 35, 250, 250, 250] + [0] * 759)
        ncolors = 3
    else:
        px = np.array(small)[alpha].reshape(1, -1, 3)
        palimg = Image.fromarray(px.astype(np.uint8)).quantize(
            colors=ncolors, method=Image.MEDIANCUT, kmeans=4)
    pal = palimg.getpalette()[: ncolors * 3]
    q = small.quantize(palette=palimg, dither=Image.NONE)
    idx = np.array(q)
    used = sorted(set(idx[alpha].tolist()))
    remap = {old: i for i, old in enumerate(used)}
    palette = ["#%02x%02x%02x" % tuple(pal[i * 3 : i * 3 + 3]) for i in used]
    rows = []
    for y in range(th):
        rows.append("".join(str(remap[idx[y, x]]) if alpha[y, x] else "." for x in range(tw)))
    # drop empty rows/cols left by the threshold
    while rows and set(rows[0]) == {"."}:
        rows.pop(0)
    while rows and set(rows[-1]) == {"."}:
        rows.pop()
    while all(r[0] == "." for r in rows):
        rows = [r[1:] for r in rows]
    while all(r[-1] == "." for r in rows):
        rows = [r[:-1] for r in rows]
    return {"w": len(rows[0]), "h": len(rows), "palette": palette, "rows": rows}


def preview(sprites, path, scale=12):
    pad = 4
    total_w = sum(s["w"] + pad for s in sprites.values()) * scale
    max_h = max(s["h"] for s in sprites.values()) * scale
    sheet = Image.new("RGB", (total_w, max_h), (12, 12, 20))
    x = 0
    for s in sprites.values():
        for yy, row in enumerate(s["rows"]):
            for xx, c in enumerate(row):
                if c != ".":
                    col = tuple(int(s["palette"][int(c)][i : i + 2], 16) for i in (1, 3, 5))
                    sheet.paste(col, (x + xx * scale, yy * scale, x + (xx + 1) * scale, (yy + 1) * scale))
        x += (s["w"] + pad) * scale
    sheet.save(path)


def main():
    out = {}
    for name, (fname, th, nc, mode) in SPRITES.items():
        if not os.path.exists(os.path.join(SRC, fname)):
            print(f"skip {name}: {fname} not found")
            continue
        out[name] = convert(name, fname, th, nc, mode)
        print(f"{name}: {out[name]['w']}x{out[name]['h']}, {len(out[name]['palette'])} colors")
    with open(OUT, "w") as f:
        f.write("// Generated by make_sprites.py. Don't edit by hand.\n")
        f.write("window.SPRITES = " + json.dumps(out, indent=1) + ";\n")
    if len(sys.argv) > 1:
        preview(out, os.path.join(sys.argv[1], "preview.png"))


if __name__ == "__main__":
    main()
