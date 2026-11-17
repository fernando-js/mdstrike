"""Build the public institution/location picker from an official Inep ZIP.
Usage: python3 scripts/import-institutions.py /path/to/microdados_2024.zip
No student-level data or institution addresses are exported.
"""
import csv
import datetime
import hashlib
import io
import json
from pathlib import Path
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
archive_path = Path(sys.argv[1])
institutions, states, cities = {}, {}, {}

def location(uf, state, code, city, institution):
    if len(uf) != 2 or not code.isdigit() or len(code) != 7 or not city:
        return
    states[uf] = state
    key = (uf, code)
    record = cities.setdefault(key, {"id": code, "name": city, "institutions": set()})
    record["institutions"].add(institution)

with zipfile.ZipFile(archive_path) as archive:
    def rows(token):
        name = next(n for n in archive.namelist() if token in n)
        return csv.DictReader(io.TextIOWrapper(archive.open(name), encoding="cp1252"), delimiter=";")
    for row in rows("ED_SUP_IES_2024.CSV"):
        key = row["CO_IES"]
        institutions[key] = {"id": key, "name": row["NO_IES"], "acronym": row["SG_IES"]}
        location(row["SG_UF_IES"], row["NO_UF_IES"], row["CO_MUNICIPIO_IES"], row["NO_MUNICIPIO_IES"], key)
    for row in rows("CADASTRO_CURSOS_2024.CSV"):
        if row["CO_IES"] in institutions and row.get("TP_MODALIDADE_ENSINO") == "1":
            location(row["SG_UF"], row["NO_UF"], row["CO_MUNICIPIO"], row["NO_MUNICIPIO"], row["CO_IES"])

assert len(states) == 27 and len(institutions) > 2000
for record in cities.values():
    record["institutions"] = sorted(record["institutions"], key=lambda k: institutions[k]["name"])
data = {
    "version": "inep-2024",
    "referenceYear": 2024,
    "retrievedAt": datetime.date.today().isoformat(),
    "sourcePage": "https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior",
    "sourceFile": "https://download.inep.gov.br/microdados/microdados_censo_da_educacao_superior_2024.zip",
    "archiveSha256": hashlib.file_digest(archive_path.open("rb"), "sha256").hexdigest() if hasattr(hashlib, "file_digest") else hashlib.sha256(archive_path.read_bytes()).hexdigest(),
    "coverage": "Sedes de IES e municípios com oferta presencial informados ao Censo Superior 2024. Não comprova situação regulatória atual, campus específico ou vínculo individual.",
    "institutions": institutions,
    "states": [{"id": uf, "name": name, "cities": sorted([city for (region, _), city in cities.items() if region == uf], key=lambda c: c["name"])} for uf, name in sorted(states.items())],
}
content = json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n"
for path in [root / "app/institutions.json", root / "assets/data/institutions.json"]:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
print(f"{len(institutions)} institutions; {len(cities)} municipalities; {len(states)} states; {len(content.encode())} bytes")
