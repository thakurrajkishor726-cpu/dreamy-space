"""Derive the site's logo assets from public/images/logo/logo.jpeg.

Produces, next to the source:

    logo.png         cropped, background knocked out to transparency
    logo-light.png   same, with the navy relit for dark backgrounds
    logo.svg         the PNG embedded, for anywhere an .svg is expected
    logo-mark.png    the DS monogram alone, for the header
    logo-mark-light.png
    favicon-*.png    tab icons, derived from the monogram

The supplied lockup stacks the wordmark under the monogram, which makes it
nearly square. In a 58px-tall header that leaves "DREAMY SPACE" about 8px
tall — a smudge — and setting the two side by side instead gives a 5:1 strip
too wide for a nav bar. So the header takes the monogram on its own and sets
the name in the site's display face beside it, which stays crisp at any size.
The full lockup is used where it has room: the footer, and the admin.

On the SVG: the source is a shaded illustration — soft lamp glow, a gradient
on the armchair, a drop shadow. That is not something an autotracer turns into
clean paths; it would come back as thousands of blobby shapes, larger than the
bitmap and worse looking. So logo.svg wraps the bitmap rather than pretending
to vectorise it. It scales in layout like any SVG. A true vector needs the
logo redrawn from its source file.

Run: .venv/bin/python scripts/build_logo.py
"""

import base64
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LOGO_DIR = ROOT / "public" / "images" / "logo"
SOURCE = LOGO_DIR / "logo.jpeg"

# Anything within this distance of the sampled background is knocked out.
# Below it, alpha ramps up — which keeps the antialiased type edges and the
# lamp's glow soft instead of jagged.
BG_TOLERANCE = 26
BG_FEATHER = 46

# Navy is a dark, blue-dominant cluster. Gold is left alone: it already reads
# well on the dark ink the footer uses.
NAVY_MAX_LUMA = 130
NAVY_MIN_BLUE_LEAD = 12
LIGHT_TARGET = (244, 241, 235)  # --ds-on-dark

# The lockup is never shown taller than ~70px, so the source's 598px is far
# more than needed. This is comfortably past 2x for every use and keeps the
# header off a quarter-megabyte download.
MAX_HEIGHT = 360


def sample_background(image: Image.Image) -> tuple[int, int, int]:
    px = image.load()
    w, h = image.size
    corners = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    return tuple(sum(c[i] for c in corners) // len(corners) for i in range(3))


def knockout(image: Image.Image, background: tuple[int, int, int]) -> Image.Image:
    """Alpha from distance to the background colour."""
    out = image.convert("RGBA")
    src = image.convert("RGB").load()
    dst = out.load()
    br, bg_, bb = background
    w, h = image.size

    for y in range(h):
        for x in range(w):
            r, g, b = src[x, y]
            distance = ((r - br) ** 2 + (g - bg_) ** 2 + (b - bb) ** 2) ** 0.5
            if distance <= BG_TOLERANCE:
                alpha = 0
            elif distance >= BG_FEATHER:
                alpha = 255
            else:
                alpha = int(255 * (distance - BG_TOLERANCE) / (BG_FEATHER - BG_TOLERANCE))
            dst[x, y] = (r, g, b, alpha)
    return out


def relight_navy(image: Image.Image) -> Image.Image:
    """Swap the navy for the palette's light ink, so the mark survives on a
    dark ground. Navy on deep green is close to unreadable."""
    out = image.copy()
    px = out.load()
    w, h = out.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
            if luma < NAVY_MAX_LUMA and b > r + NAVY_MIN_BLUE_LEAD:
                # Keep the shading: darker navy stays slightly darker cream.
                t = min(1.0, luma / NAVY_MAX_LUMA)
                shade = 0.72 + 0.28 * t
                px[x, y] = (
                    int(LIGHT_TARGET[0] * shade),
                    int(LIGHT_TARGET[1] * shade),
                    int(LIGHT_TARGET[2] * shade),
                    a,
                )
    return out


def write_svg(png_path: Path, svg_path: Path, size: tuple[int, int]) -> None:
    encoded = base64.b64encode(png_path.read_bytes()).decode("ascii")
    width, height = size
    svg_path.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'viewBox="0 0 {width} {height}" width="{width}" height="{height}" '
        f'role="img" aria-label="Dreamy Space">\n'
        f"  <title>Dreamy Space</title>\n"
        f'  <image href="data:image/png;base64,{encoded}" '
        f'width="{width}" height="{height}"/>\n'
        f"</svg>\n",
        encoding="utf-8",
    )


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"Not found: {SOURCE}")

    original = Image.open(SOURCE).convert("RGB")
    background = sample_background(original)
    print(f"source     {original.size[0]}x{original.size[1]}  background rgb{background}")

    knocked = knockout(original, background)

    box = knocked.getbbox()
    cropped = knocked.crop(box)
    print(f"cropped    {cropped.size[0]}x{cropped.size[1]}  (trimmed {box})")

    if cropped.height > MAX_HEIGHT:
        ratio = MAX_HEIGHT / cropped.height
        cropped = cropped.resize(
            (round(cropped.width * ratio), MAX_HEIGHT), Image.LANCZOS
        )
        print(f"resized    {cropped.size[0]}x{cropped.size[1]}  (cap {MAX_HEIGHT}px tall)")

    png = LOGO_DIR / "logo.png"
    cropped.save(png, "PNG", optimize=True)
    print(f"wrote      {png.relative_to(ROOT)}  {png.stat().st_size // 1024} KB")

    light = LOGO_DIR / "logo-light.png"
    relight_navy(cropped).save(light, "PNG", optimize=True)
    print(f"wrote      {light.relative_to(ROOT)}  {light.stat().st_size // 1024} KB")

    svg = LOGO_DIR / "logo.svg"
    write_svg(png, svg, cropped.size)
    print(f"wrote      {svg.relative_to(ROOT)}  {svg.stat().st_size // 1024} KB  (embeds the PNG)")

    # The monogram is the left ~62% of the lockup, above the wordmark.
    w, h = cropped.size
    mark = cropped.crop((0, 0, w, int(h * 0.78)))
    mark = mark.crop(mark.getbbox())
    mark_path = LOGO_DIR / "logo-mark.png"
    mark.save(mark_path, "PNG", optimize=True)
    print(f"wrote      {mark_path.relative_to(ROOT)}  {mark.size[0]}x{mark.size[1]}  "
          f"{mark_path.stat().st_size // 1024} KB")

    mark_light_path = LOGO_DIR / "logo-mark-light.png"
    relight_navy(mark).save(mark_light_path, "PNG", optimize=True)
    print(f"wrote      {mark_light_path.relative_to(ROOT)}  "
          f"{mark_light_path.stat().st_size // 1024} KB")

    write_favicons(mark)


def split_lockup(image: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Separate the monogram from the wordmark on the transparent band
    between them, rather than a hardcoded fraction — so it still splits in the
    right place if the source art changes."""
    w, h = image.size
    alpha = image.getchannel("A").load()

    empty = []
    run = None
    for y in range(h):
        occupied = any(alpha[x, y] > 24 for x in range(0, w, 2))
        if not occupied:
            run = y if run is None else run
        elif run is not None:
            if y - run >= 4:
                empty.append((run, y))
            run = None

    # The widest band in the lower half is the gap under the monogram.
    candidates = [b for b in empty if b[0] > h * 0.4]
    if not candidates:
        raise SystemExit("Could not find the gap between monogram and wordmark.")
    start, end = max(candidates, key=lambda b: b[1] - b[0])

    mark = image.crop((0, 0, w, start))
    word = image.crop((0, end, w, h))
    return mark.crop(mark.getbbox()), word.crop(word.getbbox())


def write_favicons(mark: Image.Image) -> None:
    """Tab icons from the monogram.

    These were still the previous studio's mark, which meant their logo sat in
    the browser tab on every page of this site.

    The monogram is drawn on the site's canvas colour rather than left
    transparent: a dark navy mark on a browser's own dark tab strip is close
    to invisible, and iOS composites the touch icon onto white anyway.
    """
    FAVICON_DIR = ROOT / "public" / "images" / "favicon"
    FAVICON_DIR.mkdir(parents=True, exist_ok=True)
    CANVAS = (245, 241, 234, 255)  # --ds-canvas

    for size, name, pad in ((16, "favicon-16x16.png", 0.06), (32, "favicon-32x32.png", 0.06),
                            (180, "apple-touch-icon.png", 0.14)):
        inner = round(size * (1 - pad * 2))
        scaled = mark.copy()
        scaled.thumbnail((inner, inner), Image.LANCZOS)

        canvas = Image.new("RGBA", (size, size), CANVAS)
        canvas.alpha_composite(
            scaled, ((size - scaled.width) // 2, (size - scaled.height) // 2)
        )
        out = FAVICON_DIR / name
        canvas.save(out, "PNG", optimize=True)
        print(f"wrote      {out.relative_to(ROOT)}  {size}x{size}")


if __name__ == "__main__":
    main()
