from pathlib import Path
p=Path('work/planet-v2/app.js');s=p.read_text(encoding='utf-8').replace('direction(.30,.23)','direction(.38,.06)').replace('camera.position.set(1.85,5.45,3.25)','camera.position.set(1.2,5.75,1.65)');p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/world.js');s=p.read_text(encoding='utf-8');s=s.replace('const stones = [], grasses = [], stems = []','const grasses = [], stems = []')
a=s.index("  // A ring of stepping stones");b=s.index('  for (let i = 0; i < 460;',a);s=s[:a]+s[b:]
s=s.replace("  instances(ico, '#d0c8aa', stones); instances(cyl", "  instances(cyl")
p.write_text(s,encoding='utf-8')
