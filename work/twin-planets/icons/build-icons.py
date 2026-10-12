"""Original, maskable-safe Little Bloom home-screen icons; requires Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw
import math

S = 4
im = Image.new("RGB", (512*S, 512*S), "#edf0dc")
d = ImageDraw.Draw(im)

def line(points, fill, width=4):
    d.line([(round(x*S), round(y*S)) for x, y in points], fill=fill, width=round(width*S), joint="curve")

def ellipse(box, fill, outline=None, width=1):
    d.ellipse(tuple(round(v*S) for v in box), fill=fill, outline=outline, width=round(width*S))

def polygon(points, fill, outline=None, width=3):
    d.polygon([(round(x*S), round(y*S)) for x, y in points], fill=fill)
    if outline:
        line(points+[points[0]], outline, width)

def curve(points, fill, width=4):
    a,b,c,e=points
    line([((1-t)**3*a[0]+3*(1-t)**2*t*b[0]+3*(1-t)*t*t*c[0]+t**3*e[0],
           (1-t)**3*a[1]+3*(1-t)**2*t*b[1]+3*(1-t)*t*t*c[1]+t**3*e[1])
          for t in [i/48 for i in range(49)]], fill, width)

ink = "#365f53"
# The complete emblem stays inside the maskable circle (center 256, radius 204.8).
ellipse((102,118,320,336), "#a9b96f", ink, 6)
ellipse((113,129,309,325), "#d4dba4")
polygon([(121,262),(142,238),(158,240),(177,220),(190,227),(207,200),(226,217),(239,208),(273,236),(302,263),(281,302),(243,325),(188,324),(145,298)], "#819d61")
curve([(124,262),(170,243),(228,276),(292,263)], "#f4e6b4", 12)
curve([(127,262),(165,249),(228,279),(290,264)], "#b79d69", 2)
# Tiny sunny tree and warm sun.
line([(175,244),(175,196)], "#6d6b47", 8)
line([(175,217),(158,207)], "#6d6b47", 5)
ellipse((144,165,189,211), "#568366", ink, 3)
ellipse((167,154,211,200), "#739c68", ink, 3)
ellipse((174,180,216,217), "#8aab6c", ink, 3)
ellipse((237,154,270,187), "#eeb56b")
for i in range(8):
    ang=i*math.pi/4
    line([(253.5+23*math.cos(ang),170.5+23*math.sin(ang)),(253.5+28*math.cos(ang),170.5+28*math.sin(ang))], "#e1ab63", 3)
# Second planet: turquoise ocean, island, little lighthouse.
ellipse((211,204,413,406), "#72abb0", ink, 6)
ellipse((224,217,400,393), "#97c8c0")
polygon([(232,286),(259,270),(280,279),(298,256),(320,260),(335,283),(372,290),(387,311),(368,330),(270,325)], "#dccc95")
polygon([(243,285),(263,277),(283,284),(300,264),(318,266),(331,291),(368,295),(376,310),(350,316),(275,314)], "#7f9c68")
polygon([(298,277),(318,277),(324,316),(291,316)], "#fcf0ce", ink, 3)
polygon([(295,272),(321,272),(321,282),(295,282)], "#f0c579", ink, 3)
polygon([(292,271),(308,257),(324,271)], "#d98464", ink, 3)
line([(308,258),(308,250)], ink, 3)
ellipse((305,246,311,252), "#d98464")
polygon([(303,300),(312,300),(312,316),(303,316)], "#637e6d")
line([(306,275),(306,281)], ink, 2)
line([(314,275),(314,281)], ink, 2)
for y, x in [(339,246),(354,292),(373,260)]:
    curve([(x,y),(x+10,y-7),(x+18,y+6),(x+29,y)], "#eef0dc", 4)
curve([(347,338),(359,331),(371,345),(385,338)], "#eef0dc", 4)
# Two drifting blossom petals connect the planets.
ellipse((340,168,351,182), "#d99c8c")
ellipse((355,157,367,171), "#edb4a0")

target = Path(__file__).resolve().parent
for size, name in [(192,"icon-192.png"),(512,"icon-512.png"),(180,"apple-touch-icon.png")]:
    im.resize((size,size), Image.Resampling.LANCZOS).save(target/name, optimize=True)
    print(f"{name}: {size}x{size}, {(target/name).stat().st_size} bytes")
