#!/usr/bin/env python3
"""把 Google 試算表目前的內容寫回 index.html 的內建快照（#gf-data）。
用法：python3 tools/update-snapshot.py   （會讀 assets/js/config.js 的 sheetId）"""
import csv, io, json, re, sys, urllib.request, urllib.parse, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
cfg = (ROOT / 'assets/js/config.js').read_text(encoding='utf-8')
get = lambda k, d='': (re.search(rf'{k}:\s*"([^"]*)"', cfg) or [None, d])[1]
sheet_id, s_name, l_name = get('sheetId'), get('settingsSheet', '設定'), get('linksSheet', '連結')
if not sheet_id: sys.exit('config.js 的 sheetId 是空的')
def fetch(name):
    url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={urllib.parse.quote(name)}'
    text = urllib.request.urlopen(url, timeout=30).read().decode('utf-8')
    if text.lstrip().startswith('<'): sys.exit(f'「{name}」回傳的不是 CSV，請確認試算表已設為「知道連結的任何人可檢視」')
    rows = list(csv.reader(io.StringIO(text)))
    head = [h.strip() for h in rows[0]]
    return [dict(zip(head, [c.strip() for c in r])) for r in rows[1:] if any(c.strip() for c in r)]
settings = {r.get('項目', '').strip(): r.get('內容', '').strip() for r in fetch(s_name) if r.get('項目', '').strip()}
cols = ['順序', '類型', '標題', '連結', '圖片', '顯示方式', '顯示']
links = [{c: r.get(c, '') for c in cols} for r in fetch(l_name)]
snap = json.dumps({'settings': settings, 'links': links}, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
html_path = ROOT / 'index.html'; html = html_path.read_text(encoding='utf-8')
new = re.sub(r'(<script type="application/json" id="gf-data">).*?(</script>)', lambda m: m.group(1) + snap + m.group(2), html, count=1, flags=re.S)
html_path.write_text(new, encoding='utf-8')
print(f'已更新快照：設定 {len(settings)} 項、連結 {len(links)} 列')
