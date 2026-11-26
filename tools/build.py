#!/usr/bin/env python3
"""Compila el proyecto modular a UN solo HTML autocontenido (como el v119 original).

Uso:  python3 tools/build.py [salida.html]      (por defecto dist/BOIS_IO.html)

- css/*.css            -> <style> inline
- js/ui/*.js           -> un <script> inline cada uno (igual que el original)
- data/*.js + js/NN-*  -> UN solo <script> (en el orden de index.html). Así el hoisting de funciones
                          es idéntico al del archivo original de 3.700 líneas.
- three.js             -> si existe vendor/three.min.js se INCRUSTA (sin depender del CDN); si no, se deja el <script> del CDN
                          (con respaldo a jsDelivr y aviso en pantalla, ver index.html) y se avisa por consola
- otros http(s)        -> se dejan como están
"""
import re, sys, os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(ROOT,'dist','BOIS_IO.html')
rd=lambda p: open(os.path.join(ROOT,p),encoding='utf-8').read()

def minify_js(src):
    tokens = []
    i = 0
    n = len(src)
    while i < n:
        if src[i:i+2] == '/*':
            end = src.find('*/', i+2)
            if end == -1:
                tokens.append(('CODE', src[i:])); i = n
            else:
                tokens.append(('CMT', src[i:end+2])); i = end + 2
        elif src[i:i+2] == '//':
            end = src.find('\n', i+2)
            if end == -1:
                tokens.append(('CMT', src[i:])); i = n
            else:
                tokens.append(('CMT', src[i:end+1])); i = end + 1
        elif src[i] == '`':
            j = i + 1
            while j < n:
                if src[j] == '\\': j += 2
                elif src[j] == '`': j += 1; break
                else: j += 1
            tokens.append(('STR', src[i:j])); i = j
        elif src[i] in ('"', "'"):
            q = src[i]; j = i + 1
            while j < n:
                if src[j] == '\\': j += 2
                elif src[j] == q: j += 1; break
                else: j += 1
            tokens.append(('STR', src[i:j])); i = j
        else:
            j = i
            while j < n and src[j:j+2] not in ('//', '/*') and src[j] not in ('"', "'", '`'):
                j += 1
            if j > i: tokens.append(('CODE', src[i:j]))
            i = j

    def min_code(code):
        o = re.sub(r'[ \t\r\n]+', ' ', code)
        o = re.sub(r' ?([=+\-*/%&|^~<>!?:,;()\[\]{}]) ?', r'\1', o)
        o = re.sub(r'\b(return|typeof|instanceof|void|delete|throw|new|in|of|var|let|const|if|else|for|while|do|switch|case|break|continue|function)\b(?=[a-zA-Z_$0-9({\[])', r'\1 ', o)
        return o

    parts = [' ' if t == 'CMT' else (min_code(txt) if t == 'CODE' else txt) for t, txt in tokens]
    return re.sub(r'  +', ' ', ''.join(parts)).strip()

html=rd('index.html')

html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>\n'+rd(m.group(1)).rstrip('\n')+'\n</style>',html)

merged=[]; placed=[False]; THREE_INLINE=[False]
def script(m):
    src=m.group(1)
    if src.startswith(('http://','https://')):
        if 'three' in src.lower() and os.path.exists(os.path.join(ROOT,'vendor','three.min.js')):
            code=rd('vendor/three.min.js').rstrip('\n')
            if '</script' in code.lower(): raise SystemExit('vendor/three.min.js contiene "</script"')
            THREE_INLINE[0]=True
            return '<script>\n'+code+'\n</script>'
        return m.group(0)
    if src == 'vendor/three.min.js':
        THREE_INLINE[0]=True
    code=rd(src).rstrip('\n')
    if '</script' in code.lower(): raise SystemExit(f'{src}: contiene "</script"; escápalo como <\\/script')
    if src.startswith('js/ui/'): return '<script>\n'+minify_js(code)+'\n</script>'
    if src.startswith('js/') and not src.endswith('.min.js'):
        code=minify_js(code)
    merged.append(f'/* ===== {src} ===== */\n'+code)
    if placed[0]: return ''
    placed[0]=True; return '@@MAIN@@'
html=re.sub(r'<script src="([^"]+)"></script>',script,html)
html=html.replace('@@MAIN@@','<script>\n'+'\n'.join(merged)+'\n</script>')
html=re.sub(r'\n{3,}','\n\n',html)
os.makedirs(os.path.dirname(out),exist_ok=True)
open(out,'w',encoding='utf-8',newline='\n').write(html)
if not THREE_INLINE[0]: print('AVISO: three.js se carga desde el CDN. Para incrustarlo: python3 tools/fetch_three.py y vuelve a compilar.')
print(f'OK → {out}  ({os.path.getsize(out)/1e6:.2f} MB, {len(merged)} archivos fusionados en un script)')
