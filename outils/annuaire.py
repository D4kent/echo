"""Construit l'annuaire de radios de la version bureau (donnees/radios.json) depuis radio-browser.info.
Lancé chaque jour par GitHub : l'appli n'a plus besoin de joindre l'annuaire depuis le navigateur."""
import json, random, urllib.request, urllib.parse

SERVEURS = ["de1", "de2", "fi1", "at1", "nl1"]
CHAMPS = ("stationuuid", "name", "url_resolved", "favicon", "tags", "countrycode", "bitrate", "clickcount", "codec")

def demander(chemin):
    random.shuffle(SERVEURS)
    for s in SERVEURS:
        try:
            req = urllib.request.Request(f"https://{s}.api.radio-browser.info/json/{chemin}", headers={"User-Agent": "Echo-annuaire/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception as e:
            print("échec", s, e)
    raise SystemExit("Annuaire injoignable")

base = "hidebroken=true&order=clickcount&reverse=true"
lots = [
    demander(f"stations/search?countrycode=FR&limit=2500&{base}"),
    demander(f"stations/search?limit=2500&{base}"),
    demander(f"stations/search?countrycode=BE&limit=300&{base}"),
    demander(f"stations/search?countrycode=CH&limit=300&{base}"),
    demander(f"stations/search?countrycode=CA&language=french&limit=300&{base}"),
]
vus, radios = set(), []
for lot in lots:
    for r in lot:
        if not r.get("url_resolved") or r["stationuuid"] in vus:
            continue
        vus.add(r["stationuuid"])
        radios.append({
            "id": r["stationuuid"], "n": r["name"].strip(), "u": r["url_resolved"],
            "f": r.get("favicon") or "", "t": (r.get("tags") or "")[:120], "c": r.get("countrycode") or "",
            "b": r.get("bitrate") or 0, "k": r.get("clickcount") or 0,
        })
radios.sort(key=lambda r: -r["k"])
with open("donnees/radios.json", "w", encoding="utf-8") as f:
    json.dump(radios, f, ensure_ascii=False, separators=(",", ":"))
print(len(radios), "radios")
