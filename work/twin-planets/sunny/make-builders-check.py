from pathlib import Path
s=Path('work/planet-v2/check-meadow.js').read_text(encoding='utf-8')
s=s.replace('createWorld(3)','createWorld(3,48)').replace('direction(.38,.06)','direction(.59,.48)')
s=s.replace("const scene=new THREE.Scene();", "for(let i=0;i<180;i++)world.update(1/30,14+i/30,{rain:0,snow:0,cloud:.2,wind:.35,night:0,mist:0});\nconst scene=new THREE.Scene();")
s=s.replace('composition-meadow','composition-builders')
Path('work/planet-v2/check-builders.js').write_text(s,encoding='utf-8')
