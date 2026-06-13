import sys, requests, json, re, time, html as html_mod

BASE = "https://www.vaticannews.va/es/oraciones"

PRAYERS = [
    ("acordaos", "Acordaos"),
    ("acto-de-caridad", "Acto de caridad"),
    ("acto-de-consagracion-al-corazon-inmaculado-de-maria", "Consagración al Corazón Inmaculado de María"),
    ("acto-de-contricion", "Acto de Contrición"),
    ("alma-de-cristo", "Alma de Cristo"),
    ("angel-de-dios", "Ángel de Dios"),
    ("angelus", "Ángelus"),
    ("ave-maria", "Ave María"),
    ("bajo-tu-amparo", "Bajo tu amparo"),
    ("benedictus", "Benedictus"),
    ("comunion-espiritual", "Comunión espiritual"),
    ("simbolo-de-los-apostoles", "Credo"),
    ("el-eterno-reposo", "El eterno reposo"),
    ("gloria-al-padre", "Gloria al Padre"),
    ("magnificat", "Magnificat"),
    ("oracion-a-la-sagrada-familia", "Oración a la Sagrada Familia"),
    ("oracion-a-san-jose", "Oración a San José"),
    ("padre-nuestro", "Padre nuestro"),
    ("salve-regina", "Salve Regina"),
    ("san-miguel-arcangel", "San Miguel Arcángel"),
    ("te-deum", "Te Deum"),
    ("ven-santo-espiritu", "Ven Santo Espíritu"),
    ("veni-creator", "Veni Creator"),
]

results = {}
for slug, title in PRAYERS:
    url = f"{BASE}/{slug}.html"
    print(f"Fetching {slug}...", file=sys.stderr)
    try:
        resp = requests.get(url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0 (compatible; IglesiaDigitalBot/1.0)"
        })
        if resp.status_code != 200:
            print(f"  FAIL {resp.status_code}", file=sys.stderr)
            continue
        html = resp.content.decode("utf-8")

        # Extract the JSON-LD block
        m = re.search(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.DOTALL)
        if not m:
            print(f"  No JSON-LD found", file=sys.stderr)
            continue

        ld = json.loads(m.group(1).strip())
        text = ld.get("articleBody", "")
        if not text:
            print(f"  No articleBody", file=sys.stderr)
            continue

        # Decode HTML entities
        text = html_mod.unescape(text)
        text = re.sub(r'\s+', ' ', text).strip()

        results[slug] = {"titulo": title, "texto": text}
        print(f"  OK ({len(text)} chars)", file=sys.stderr)
    except Exception as e:
        print(f"  ERROR {slug}: {e}", file=sys.stderr)
    time.sleep(0.5)

print(json.dumps(results, ensure_ascii=False, indent=2))
