#!/usr/bin/env python3
"""
Генератор болванок внешности.

Рисует простые плоские слои 224 x 319 (прозрачный фон) в папку assets/.
Запуск из корня репозитория:  python tools/make_placeholders.py
Нужна библиотека Pillow:      pip install pillow

Свои картинки можно просто положить поверх с теми же именами.
"""
import os
from PIL import Image, ImageDraw

W, H, S = 224, 319, 4          # S — суперсэмплинг для гладких краёв
SKIN = (242, 196, 168, 255)
HAIR = (98, 82, 60, 255)
BEARD = (80, 66, 48, 255)
CLEAR = (0, 0, 0, 0)

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')


def new():
    im = Image.new('RGBA', (W * S, H * S), CLEAR)
    return im, ImageDraw.Draw(im)


def b(*box):
    return [v * S for v in box]


def pts(*points):
    return [(x * S, y * S) for x, y in points]


def save(im, folder, name):
    path = os.path.join(ROOT, folder)
    os.makedirs(path, exist_ok=True)
    im.resize((W, H), Image.LANCZOS).save(os.path.join(path, name))


# ---------------- головы ----------------
HEADS = {
    1: ('ellipse', (54, 92, 170, 228)),
    2: ('round',   (46, 98, 178, 224)),
    3: ('ellipse', (62, 82, 162, 240)),
}


def make_head(i):
    im, d = new()
    kind, (x0, y0, x1, y1) = HEADS[i]
    d.ellipse(b(x0 - 14, 126, x0 + 6, 172), fill=SKIN)       # уши
    d.ellipse(b(x1 - 6, 126, x1 + 14, 172), fill=SKIN)
    d.rectangle(b(88, 196, 136, 252), fill=SKIN)              # шея
    if kind == 'ellipse':
        d.ellipse(b(x0, y0, x1, y1), fill=SKIN)
    else:
        d.rounded_rectangle(b(x0, y0, x1, y1), radius=46 * S, fill=SKIN)
    save(im, 'head', f'head-{i}.png')


# ---------------- причёски ----------------
def make_hair(i):
    im, d = new()
    if i == 1:    # классическая короткая
        d.ellipse(b(44, 50, 180, 150), fill=HAIR)
        d.ellipse(b(62, 90, 162, 240), fill=CLEAR)
    elif i == 2:  # с пробором
        d.ellipse(b(44, 48, 180, 152), fill=HAIR)
        d.ellipse(b(58, 96, 166, 250), fill=CLEAR)
        d.polygon(pts((44, 90), (96, 56), (110, 60), (60, 108)), fill=HAIR)
    elif i == 3:  # очень коротко
        d.ellipse(b(50, 66, 174, 146), fill=HAIR)
        d.ellipse(b(58, 84, 166, 260), fill=CLEAR)
    elif i == 4:  # длинные
        d.ellipse(b(36, 46, 188, 214), fill=HAIR)
        d.ellipse(b(54, 92, 170, 300), fill=CLEAR)
    else:         # зачёс назад, повыше
        d.ellipse(b(48, 38, 176, 150), fill=HAIR)
        d.ellipse(b(60, 80, 164, 260), fill=CLEAR)
    save(im, 'hair', f'hair-{i}.png')


# ---------------- усы ----------------
def make_mustache(i):
    im, d = new()
    if i == 1:    # обычные
        d.ellipse(b(76, 198, 114, 214), fill=BEARD)
        d.ellipse(b(110, 198, 148, 214), fill=BEARD)
    elif i == 2:  # тонкие с загнутыми концами
        d.line(pts((64, 198), (84, 208), (112, 203), (140, 208), (160, 198)),
               fill=BEARD, width=6 * S, joint='curve')
    else:         # густая щёточка
        d.rounded_rectangle(b(88, 197, 136, 213), radius=7 * S, fill=BEARD)
    save(im, 'mustache', f'mustache-{i}.png')


# ---------------- бороды ----------------
def make_beard(i):
    im, d = new()
    if i == 1:    # эспаньолка
        d.ellipse(b(89, 222, 135, 252), fill=BEARD)
    elif i == 2:  # полная
        d.ellipse(b(50, 120, 174, 250), fill=BEARD)
        d.ellipse(b(58, 96, 166, 212), fill=CLEAR)
    else:         # длинная клинышком
        d.ellipse(b(86, 214, 138, 238), fill=BEARD)
        d.polygon(pts((84, 224), (140, 224), (128, 262), (112, 286), (96, 262)), fill=BEARD)
    save(im, 'beard', f'beard-{i}.png')


# ---------------- одежда ----------------
# (основной цвет, кант/детали, галстук, погоны)
CLOTHES = {
    1:  ((24, 24, 26),    (150, 50, 50),   False, False),   # как на образце
    2:  ((92, 100, 78),   (62, 68, 52),    False, False),
    3:  ((38, 48, 72),    (180, 170, 130), False, False),
    4:  ((98, 74, 52),    (60, 44, 30),    False, False),
    5:  ((104, 108, 70),  (70, 74, 46),    False, True),
    6:  ((58, 60, 64),    (150, 150, 140), False, False),
    7:  ((110, 44, 48),   (214, 190, 150), False, False),
    8:  ((228, 224, 210), (40, 40, 44),    True,  False),
    9:  ((178, 156, 118), (120, 100, 70),  False, False),
    10: ((84, 104, 124),  (200, 190, 150), False, True),
}


def make_clothes(i):
    im, d = new()
    main, trim, tie, epaulets = CLOTHES[i]
    main += (255,)
    trim += (255,)

    d.rounded_rectangle(b(-24, 264, 248, 380), radius=62 * S, fill=main)    # плечи
    d.rectangle(b(84, 242, 140, 272), fill=main)                           # воротник-стойка
    d.line(pts((84, 244), (84, 272)), fill=trim, width=3 * S)
    d.line(pts((140, 244), (140, 272)), fill=trim, width=3 * S)

    if tie:
        d.polygon(pts((104, 262), (120, 262), (124, 282), (112, 312), (100, 282)), fill=trim)
    else:
        d.line(pts((112, 270), (112, 320)), fill=trim, width=2 * S)
        for y in (268, 291, 314):
            r = 3
            d.ellipse(b(112 - r, y - r, 112 + r, y + r), fill=(205, 200, 185, 255))

    if epaulets:
        d.polygon(pts((26, 272), (66, 260), (72, 274), (34, 288)), fill=trim)
        d.polygon(pts((198, 272), (158, 260), (152, 274), (190, 288)), fill=trim)

    save(im, 'clothes', f'clothes-{i}.png')


if __name__ == '__main__':
    for n in HEADS:
        make_head(n)
    for n in range(1, 6):
        make_hair(n)
    for n in range(1, 4):
        make_mustache(n)
        make_beard(n)
    for n in CLOTHES:
        make_clothes(n)
    print('Готово: болванки лежат в assets/')
