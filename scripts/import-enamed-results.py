"""Generate the public course aggregates from the two official Inep releases."""

import argparse
import csv
import hashlib
import io
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

INDICATORS_PAGE = "https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais/indicadores-de-qualidade-da-educacao-superior/{year}"
INDICATORS_FILE = "https://download.inep.gov.br/educacao_superior/indicadores/resultados/{year}/conceito_enade_medicina_{year}.xlsx"
MICRODATA_PAGE = "https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enamed"
MICRODATA_FILE = "https://download.inep.gov.br/microdados/microdados_enamed_{year}.zip"
METHODOLOGY_2025 = "https://download.inep.gov.br/educacao_superior/enade/notas_tecnicas/2025/nota_tecnica_40_calculo_conceito_enade_medicina.pdf"
BANDS = ["Abaixo de 50", "50 a <60", "60 a <70", "70 a <80", "80 a <90", "90 a 100"]
MIN_GROUP = 10
HEADERS = {
    "A": "Ano",
    "E": "Código da IES",
    "F": "Nome da IES*",
    "G": "Sigla da IES*",
    "H": "Organização Acadêmica",
    "I": "Categoria Administrativa**",
    "J": "Código do Curso",
    "K": "Modalidade de Ensino",
    "L": "Código do Município",
    "M": "Município do Curso",
    "N": "Sigla da UF",
    "O": "Nº de Concluintes Inscritos",
    "P": "Nº de Concluintes Participantes",
    "Q": "Total Concluinte Acima do Padrão",
    "R": "Percentual Concluintes Acima do Padrão",
    "S": "Conceito Enade (Faixa)",
    "T": "CEBAS",
}


def sheet_rows(book, number):
    string_file = "xl/sharedStrings.xml"
    strings = []
    if string_file in book.namelist():
        strings = ["".join(node.itertext()) for node in ET.fromstring(book.read(string_file)).findall("{*}si")]
    tree = ET.fromstring(book.read(f"xl/worksheets/sheet{number}.xml"))
    for row in tree.findall(".//{*}row"):
        values = {}
        for cell in row.findall("{*}c"):
            kind, value = cell.get("t"), cell.findtext("{*}v") or ""
            if kind == "s":
                value = strings[int(value)]
            if kind == "inlineStr":
                value = "".join(cell.find("{*}is").itertext())
            column = re.sub(r"\d", "", cell.attrib["r"])
            values[column] = " ".join(value.split())
        yield values


def number(value, minimum, maximum):
    if not value or value == ".":
        return None
    parsed = float(value.replace(",", "."))
    if not minimum <= parsed <= maximum:
        raise ValueError(f"Numeric field outside its documented scale: {value}")
    return parsed


def integer(value):
    return int(value) if value else None


def official_courses(path, year):
    with ZipFile(path) as book:
        rows = iter(sheet_rows(book, 1))
        headers = next(row for row in rows if row.get("J") == HEADERS["J"])
        if any(headers.get(column) != name for column, name in HEADERS.items()):
            raise ValueError("Unexpected layout in the official indicators table")
        history = [row for row in sheet_rows(book, 2) if row.get("A", "").isdigit()]
        updated = (date(1899, 12, 30) + timedelta(days=int(history[-1]["A"]))).isoformat()
        suspended = {
            code
            for row in history
            if "suspende-se" in row.get("B", "").lower()
            for code in re.findall(r"e-MEC nº\s*(\d+)", row["B"], flags=re.IGNORECASE)
        }
        courses = {}
        for row in rows:
            code = row.get("J", "")
            if not code.isdigit():
                continue
            if code in courses or int(row["A"]) != year:
                raise ValueError(f"Duplicated course code or unexpected year: {code}")
            concept = row.get("S", "")
            if concept not in {"", "SC", "1", "2", "3", "4", "5"}:
                raise ValueError(f"Unrecognized concept: {concept}")
            status = "published" if concept.isdigit() else "suspended" if code in suspended else "without_concept" if concept == "SC" else "unavailable"
            percentage = number(row.get("R"), 0, 1)
            above = integer(row.get("Q"))
            participants = integer(row.get("P"))
            if above is not None and (participants is None or above > participants):
                raise ValueError(f"Invalid official proficiency counts: {code}")
            courses[code] = {
                "id": code, "institutionId": row["E"], "institution": row["F"],
                "initials": row.get("G", ""), "organization": row["H"], "category": row["I"],
                "modality": row["K"], "cityId": row["L"], "city": row["M"], "uf": row["N"],
                "registered": integer(row.get("O")), "participants": participants,
                "above": above, "percentage": round(100 * percentage, 2) if percentage is not None else None,
                "concept": int(concept) if concept.isdigit() else None, "status": status,
                "cebas": row.get("T", ""),
            }
        if len(courses) < 300 or not suspended.issubset(courses):
            raise ValueError("Unexpected number of courses or missing courses referred to by the release history")
    return courses, updated


def records(archive, basename, columns):
    matches = [part for part in archive.namelist() if part.rsplit("/", 1)[-1] == basename]
    if len(matches) != 1:
        raise ValueError(f"Expected one microdata member named {basename}")
    with archive.open(matches[0]) as raw:
        reader = csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8-sig"), delimiter=";")
        if not set(columns).issubset(reader.fieldnames or []):
            raise ValueError(f"Missing columns in {basename}")
        for row in reader:
            yield tuple(row[column] for column in columns)


@dataclass
class Scores:
    count: int = 0
    total: float = 0
    bands: list = field(default_factory=lambda: [0] * len(BANDS))

    def add(self, score):
        self.count += 1
        self.total += score
        self.bands[min(5, max(0, int(score // 10) - 4))] += 1

    def summary(self):
        if self.count < MIN_GROUP:
            return None
        return {"count": self.count, "average": round(self.total / self.count, 3), "bands": self.bands}


def summarize(courses, score):
    totals = Counter(c["concept"] for c in courses if c["concept"] is not None)
    reported = [c for c in courses if c["status"] == "published" and c["above"] is not None and c["participants"]]
    denominator = sum(c["participants"] for c in reported)
    numerator = sum(c["above"] for c in reported)
    return {
        "courses": len(courses), "withConcept": sum(totals.values()),
        "concepts": [totals[i] for i in range(1, 6)],
        "participants": denominator, "above": numerator,
        "percentage": round(numerator / denominator * 100, 2) if denominator else None,
        "scores": score.summary(),
    }


def aggregate(courses, archive_path, year):
    course_scores, state_scores, feedback = defaultdict(Scores), defaultdict(Scores), defaultdict(Counter)
    national, other = Scores(), Scores()
    with ZipFile(archive_path) as archive:
        for code, presence, value in records(archive, f"microdados_enade_{year}_arq3.txt", ["CO_CURSO", "TP_PRES", "NT_GER"]):
            course = courses.get(code)
            if presence != "555" or not course or course["status"] != "published":
                continue
            score = number(value, 0, 100)
            if score is not None:
                course_scores[code].add(score)
                state_scores[course["uf"]].add(score)
                national.add(score)
        for presence, value in records(archive, f"microdados_demais_part_{year}_arq1.txt", ["TP_PRES", "NT_GER"]):
            score = number(value, 0, 100) if presence == "555" else None
            if score is not None:
                other.add(score)
        for code, value in records(archive, f"microdados_enade_{year}_arq4.txt", ["CO_CURSO", "QE_I57"]):
            if value.isdigit() and 0 <= int(value) <= 10 and code in courses and courses[code]["status"] == "published":
                feedback[code][int(value)] += 1
    for code, course in courses.items():
        course["scores"] = course_scores[code].summary()
        counts = feedback[code]
        count = sum(counts.values())
        course["recommendation"] = None
        if count >= MIN_GROUP:
            promoters, detractors = counts[9] + counts[10], sum(counts[i] for i in range(7))
            course["recommendation"] = {"count": count, "nps": round((promoters - detractors) / count * 100, 1)}

    by_state = defaultdict(list)
    for course in courses.values():
        by_state[course["uf"]].append(course)
    return {
        "national": summarize(list(courses.values()), national),
        "states": {state: summarize(by_state[state], state_scores[state]) for state in sorted(by_state)},
        "otherParticipants": other.summary(),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("xlsx", type=Path, help="Conceito Enade Medicina (planilha oficial)")
    parser.add_argument("microdata", type=Path, help="Microdados Enamed (ZIP oficial)")
    parser.add_argument("--year", type=int, default=2025, choices=[2025])
    parser.add_argument("--output", type=Path, default=Path("app/enamed-results.json"))
    args = parser.parse_args()
    courses, updated = official_courses(args.xlsx, args.year)
    summaries = aggregate(courses, args.microdata, args.year)
    data = {
        "year": args.year, "bands": BANDS, "minimumGroup": MIN_GROUP,
        "sources": {
            "indicators": {
                "page": INDICATORS_PAGE.format(year=args.year), "file": INDICATORS_FILE.format(year=args.year),
                "updated": updated, "sha256": hashlib.sha256(args.xlsx.read_bytes()).hexdigest(),
            },
            "microdata": {
                "page": MICRODATA_PAGE, "file": MICRODATA_FILE.format(year=args.year),
                "sha256": hashlib.sha256(args.microdata.read_bytes()).hexdigest(),
            },
            "methodology": METHODOLOGY_2025,
        },
        "courses": list(courses.values()),
        **summaries,
    }
    args.output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(courses)} cursos, {summaries['national']['withConcept']} com conceito; fonte oficial de {updated}")


if __name__ == "__main__":
    main()
