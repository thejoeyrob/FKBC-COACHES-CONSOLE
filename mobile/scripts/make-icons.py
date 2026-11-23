"""Generates store icons + splash screens for the native projects (iOS and Android) from the app artwork.
Run:  python3 scripts/make-icons.py      (needs Pillow)"""
import os, glob
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
HERE = os.path.dirname(os.path.abspath(__file__)); M = os.path.dirname(HERE); R = os.path.dirname(M)
ART = os.path.join(R, 'assets', 'img'); BG = '#0a0e14'
FONT = '/usr/share/fonts/truetype/freefont/FreeSansBoldOblique.ttf'

def base(size=1024):
    bg = Image.open(os.path.join(ART, 'bg-arena.webp')).convert('RGB')
    s = max(size / bg.width, size / bg.height); bg = bg.resize((int(bg.width * s) + 1, int(bg.height * s) + 1), Image.LANCZOS)
    bg = bg.crop(((bg.width - size) // 2, (bg.height - size) // 2, (bg.width - size) // 2 + size, (bg.height - size) // 2 + size)).filter(ImageFilter.GaussianBlur(size / 90))
    bg = ImageEnhance.Brightness(bg).enhance(.38)
    ov = Image.new('RGBA', (size, size)); d = ImageDraw.Draw(ov)
    for y in range(size):
        a = int(150 * (y / size) ** 1.4 + 40); d.line([(0, y), (size, y)], fill=(5, 7, 11, a))
    bg = Image.alpha_composite(bg.convert('RGBA'), ov)
    return bg

def mark(size=1024, scale=1.0):
    """Transparent FKBC mark (red slashes + wordmark) centred in a size x size canvas."""
    c = Image.new('RGBA', (size, size), (0, 0, 0, 0)); d = ImageDraw.Draw(c); u = size / 1024 * scale; cx = size / 2
    def para(x0, y0, w, h, sk, col):
        d.polygon([(cx + (x0 + sk) * u, size / 2 + y0 * u), (cx + (x0 + sk + w) * u, size / 2 + y0 * u), (cx + (x0 + w) * u, size / 2 + (y0 + h) * u), (cx + x0 * u, size / 2 + (y0 + h) * u)], fill=col)
    para(-285, -225, 540, 95, 80, (240, 41, 75, 255)); para(-255, 130, 540, 95, 80, (176, 14, 40, 255))
    f = ImageFont.truetype(FONT, int(268 * u)); w = d.textlength('FKBC', font=f)
    sh = Image.new('RGBA', (size, size), (0, 0, 0, 0)); ImageDraw.Draw(sh).text((cx - w / 2 + 8 * u, size / 2 - 140 * u + 10 * u), 'FKBC', font=f, fill=(0, 0, 0, 170)); sh = sh.filter(ImageFilter.GaussianBlur(10 * u)); c.alpha_composite(sh)
    ImageDraw.Draw(c).text((cx - w / 2, size / 2 - 140 * u), 'FKBC', font=f, fill=(255, 255, 255, 255))
    return c

icon = base(); icon.alpha_composite(mark()); icon = icon.convert('RGB')
os.makedirs(os.path.join(M, 'store'), exist_ok=True)
icon.save(os.path.join(M, 'store', 'app-icon-1024.png'))
icon.resize((512, 512), Image.LANCZOS).save(os.path.join(M, 'store', 'play-icon-512.png'))

# ---- iOS
ios = os.path.join(M, 'ios', 'App', 'App', 'Assets.xcassets')
if os.path.isdir(ios):
    icon.save(os.path.join(ios, 'AppIcon.appiconset', 'AppIcon-512@2x.png'))
    sp = Image.new('RGB', (2732, 2732), (5, 7, 11)); logo = Image.open(os.path.join(ART, 'fkbc-logo-light.png')).convert('RGBA'); k = 1500 / logo.width
    logo = logo.resize((1500, int(logo.height * k)), Image.LANCZOS); sp.paste(logo, ((2732 - logo.width) // 2, (2732 - logo.height) // 2), logo)
    for f in glob.glob(os.path.join(ios, 'Splash.imageset', '*.png')): sp.save(f)

# ---- Android
res = os.path.join(M, 'android', 'app', 'src', 'main', 'res')
if os.path.isdir(res):
    dens = {'mdpi': (48, 108), 'hdpi': (72, 162), 'xhdpi': (96, 216), 'xxhdpi': (144, 324), 'xxxhdpi': (192, 432)}
    for name, (ic, fg) in dens.items():
        d = os.path.join(res, 'mipmap-' + name)
        sq = icon.resize((ic, ic), Image.LANCZOS); sq.save(os.path.join(d, 'ic_launcher.png'))
        m = Image.new('L', (ic, ic), 0); ImageDraw.Draw(m).ellipse((0, 0, ic - 1, ic - 1), fill=255); rd = sq.convert('RGBA'); rd.putalpha(m); rd.save(os.path.join(d, 'ic_launcher_round.png'))
        f = mark(fg, 0.62); f.save(os.path.join(d, 'ic_launcher_foreground.png'))
    open(os.path.join(res, 'values', 'ic_launcher_background.xml'), 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0A0E14</color>\n</resources>\n')
    logo = Image.open(os.path.join(ART, 'fkbc-logo-light.png')).convert('RGBA')
    for f in glob.glob(os.path.join(res, 'drawable*', 'splash.png')):
        w, h = Image.open(f).size; im = Image.new('RGB', (w, h), (5, 7, 11)); lw = int(min(w, h) * .62); lg = logo.resize((lw, int(logo.height * lw / logo.width)), Image.LANCZOS); im.paste(lg, ((w - lw) // 2, (h - lg.height) // 2), lg); im.save(f)

# ---- Play feature graphic
fg = base(1024).resize((1024, 1024)).crop((0, 262, 1024, 762)).resize((1024, 500)); lg = Image.open(os.path.join(ART, 'fkbc-logo-light.png')).convert('RGBA'); lw = 520; lg = lg.resize((lw, int(lg.height * lw / lg.width)), Image.LANCZOS)
fg.alpha_composite(lg, (60, 60)); d = ImageDraw.Draw(fg); t = ImageFont.truetype(FONT, 78); d.text((60, 270), 'Plan it. Time it.', font=t, fill=(255, 255, 255, 255)); d.text((60, 360), 'Coach it.', font=t, fill=(240, 41, 75, 255))
fg.convert('RGB').save(os.path.join(M, 'store', 'play-feature-graphic-1024x500.png'))
print('icons and splash generated')
