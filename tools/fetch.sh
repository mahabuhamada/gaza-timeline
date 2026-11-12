#!/usr/bin/env bash
# يسحب محتوى initiativesbank.ps (WordPress) إلى مجلد عمل، ثم يبني data/site-data.js وينزّل الصور.
# الاستخدام: tools/fetch.sh <مجلد-عمل>
set -euo pipefail
W="${1:?work dir}"; REPO="$(cd "$(dirname "$0")/.." && pwd)"; API=https://initiativesbank.ps/wp-json/wp/v2
mkdir -p "$W/raw/init" "$W/raw/pages"
for t in posts pages sdf_initiative categories media; do
  p=1; while :; do
    code=$(curl -sS -o "$W/raw/$t.$p.json" -w "%{http_code}" "$API/$t?per_page=100&page=$p"); [ "$code" = 200 ] || { rm -f "$W/raw/$t.$p.json"; break; }
    [ "$(python3 -I -c "import json,sys;print(len(json.load(open(sys.argv[1]))))" "$W/raw/$t.$p.json")" -lt 100 ] && break; p=$((p+1))
  done
done
python3 -I -c "import json,sys;[print(x['id'],x['link']) for x in json.load(open(sys.argv[1]))]" "$W/raw/sdf_initiative.1.json" |
  while read -r id url; do curl -sSL -A "Mozilla/5.0" "$url" -o "$W/raw/init/$id.html"; done
for s in home privacy-policy terms-and-conditions; do curl -sSL -A "Mozilla/5.0" "https://initiativesbank.ps/${s/home/}" -o "$W/raw/pages/$s.html"; done
python3 -I "$REPO/tools/parse_init.py" "$W/raw" "$W/initiatives.json"
python3 -I "$REPO/tools/build_data.py" "$W" "$REPO"
python3 -I -c "import json,sys;[print(u+'\t'+p) for u,p in json.load(open(sys.argv[1])).items()]" "$W/images.json" |
  while IFS=$'\t' read -r u p; do mkdir -p "$REPO/$(dirname "$p")"; [ -s "$REPO/$p" ] || curl -sSfL -A "Mozilla/5.0" "$u" -o "$REPO/$p"; done
echo "تم. راجع data/site-data.js"
