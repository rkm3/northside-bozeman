import sys
from PIL import Image
from tracer import render

DARK = '#2c351f'


def compare(svg_path, src_png, out_prefix, width=1400):
    svg = open(svg_path).read()
    src = Image.open(src_png).convert('RGBA')
    h = round(src.height * width / src.width)
    src = src.resize((width, h), Image.LANCZOS)
    r = render(svg, width)
    r = r.resize((width, h), Image.LANCZOS) if r.size != (width, h) else r
    white = Image.new('RGBA', (width, h), '#f7f4ea'); white.alpha_composite(r)
    side = Image.new('RGB', (width * 2 + 20, h), '#888888')
    side.paste(src.convert('RGB'), (0, 0)); side.paste(white.convert('RGB'), (width + 20, 0))
    side.save(f'{out_prefix}-side-by-side.png')
    dark = Image.new('RGBA', (width, h), DARK); dark.alpha_composite(r)
    dark.convert('RGB').save(f'{out_prefix}-on-dark.png')
    return r


def crop_zoom(svg_path, src_png, box, out, scale_to=1024):
    """box in src_png pixel coords; renders svg at src_png resolution."""
    svg = open(svg_path).read()
    src = Image.open(src_png).convert('RGBA')
    r = render(svg, src.width)
    a = src.crop(box)
    b = Image.new('RGBA', a.size, '#f7f4ea'); b.alpha_composite(r.crop(box))
    c = Image.new('RGBA', a.size, DARK); c.alpha_composite(r.crop(box))
    w = Image.new('RGB', (a.width * 3 + 20, a.height), '#888888')
    for i, im in enumerate((a, b, c)):
        w.paste(im.convert('RGB'), (i * (a.width + 10), 0))
    if w.width > scale_to:
        w = w.resize((scale_to, round(w.height * scale_to / w.width)), Image.LANCZOS)
    w.save(out)


if __name__ == '__main__':
    compare(*sys.argv[1:4])
