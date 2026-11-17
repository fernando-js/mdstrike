"""Build PDF-backed exercises from official answer keys; never invent clinical explanations.

Requires pypdf for this maintenance command only. Application runtime needs PHP, not Python.
ENARE access-direct 2024 is intentionally excluded: its key has later rectifications.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import urlopen, Request
from urllib.parse import urljoin, quote, unquote
import re, json, unicodedata, logging
from pypdf import PdfReader

logging.getLogger('pypdf').setLevel(logging.ERROR)
ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / 'assets' / 'documents'
DOCS.mkdir(exist_ok=True)
TMP = Path('/private/tmp') if Path('/private/tmp').exists() else Path('/tmp')
BASE = 'https://mapa-vagas-enare-ebserh.conhecimento.fgv.br/'
KEY_ENAMED = 'https://download.inep.gov.br/enamed/provas_e_gabaritos/2025_gabarito_caderno_1_v2.pdf'
PDF_ENAMED = 'https://download.inep.gov.br/enamed/provas_e_gabaritos/2025_caderno_1_preliminar.pdf'
KEY_ENARE = BASE + 'provas-gabaritos/medica/ENARE%202024%20Gabarito%20Definitivo%20-%20Medica.pdf'

def slug(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def fetch(url, path):
    if path.exists(): return path
    encoded = quote(unquote(url), safe=':/?=&')
    with urlopen(Request(encoded, headers={'User-Agent':'MDStrike-source-import/2.0'}), timeout=45) as response:
        path.write_bytes(response.read())
    return path

def pages_for(path, total, enamed=False):
    pages = {}
    for i, page in enumerate(PdfReader(path).pages):
        text = page.extract_text()
        matches = re.findall(r'QUEST[ÃA]O\s*(\d+)',text) if enamed else re.findall(r'(?m)^\s*(\d{1,3})\s*$',text)
        for value in matches:
            n = int(value)
            if 1 <= n <= total and n not in pages: pages[n]=i+1
    return pages

def exercise(exam, number, answer, page):
    return {'id':f"{exam['id']}-q{number}",'area':exam['area'],'specialties':[exam['specialty']] if exam['specialty'] else [],'prompt':f"Questão {number} · {exam['title']}",'options':list('ABCD' if exam['exam']=='ENAMED' else 'ABCDE'),'answer':answer,'explanation':'Correção pelo gabarito definitivo da banca. O documento original está disponível no caderno; não há comentário clínico validado para esta questão.','source':exam['source'],'kind':'official','reviewed':True,'exam':exam['id'],'number':number,'pdf':exam['pdf'],'page':page,'key':exam['key']}

questions=[]; exams=[]
key = PdfReader(fetch(KEY_ENAMED, TMP/'mdstrike-enamed2025-key.pdf'))
answers={}
for page in key.pages:
    for n, value in re.findall(r'\b(\d{1,3})\s+(Anulada|Excluída\*?|[ABCD])\b',page.extract_text()):
        answers[int(n)]='ABCD'.index(value) if value in list('ABCD') else None
assert set(answers)==set(range(1,101)), 'ENAMED key must contain all 100 numbered entries'
source_pdf=fetch(PDF_ENAMED,DOCS/'enamed-2025-caderno-1.pdf')
fetch(KEY_ENAMED,DOCS/'enamed-2025-gabarito.pdf')
page_map=pages_for(source_pdf,100,True)
assert len(page_map)==100, 'Every ENAMED question must map to an original PDF page'
exam={'id':'enamed-2025','title':'ENAMED 2025 · Caderno 1','exam':'ENAMED','year':'2025','area':'GERAL','specialty':'','source':'Inep · ENAMED 2025 · Caderno 1 · gabarito definitivo v2','pdf':'assets/documents/enamed-2025-caderno-1.pdf','originalUrl':PDF_ENAMED,'key':KEY_ENAMED,'total':100,'valid':sum(v is not None for v in answers.values()),'keyStatus':'Definitivo v2','cancelled':[n for n,v in answers.items() if v is None],'description':'Prova oficial consultável no caderno original, com respostas corrigidas pelo gabarito definitivo. Itens anulados ou excluídos não entram na partida.'}
exams.append(exam)
questions.extend(exercise(exam,n,answers[n],page_map[n]) for n in range(1,101))

keytext='\n'.join(p.extract_text() for p in PdfReader(fetch(KEY_ENARE,TMP/'mdstrike-enare2024-key.pdf')).pages)
headers=list(re.finditer(r'(?m)^\s*(Pré-Requisito\s*-\s*.+?)\s*-\s*TIPO\s*1\s*$',keytext))
keys={}
for i, header in enumerate(headers):
    end = headers[i+1].start() if i+1<len(headers) else len(keytext)
    section=keytext[header.end():end]
    name=re.sub(r'^Pré-Requisito\s*-\s*','',header.group(1))
    result={}
    lines=section.splitlines()
    for j,line in enumerate(lines[:-1]):
        nums=line.strip().split(); vals=lines[j+1].strip().split()
        if nums and all(re.fullmatch(r'\d+',n) for n in nums) and len(nums)==len(vals) and all(v in 'ABCDE*' and len(v)==1 for v in vals):
            for n,v in zip(nums,vals): result[int(n)]='ABCDE'.index(v) if v!='*' else None
    if len(result)==80:keys[slug(name)]=result

listing=fetch(BASE+'provas-gabaritos-medica.html',TMP/'mdstrike-enare2024.html').read_text()
links=[x for x in re.findall(r'href=[\"\x27]([^\"\x27]+)',listing) if '/pre-requisito/' in x and x.endswith('.pdf')]
surgical={'urologia','mastologia','coloproctologia','cirurgia-da-mao','cirurgia-de-cabeca-e-pescoco','cirurgia-do-aparelho-digestivo','cirurgia-oncologica','cirurgia-pediatrica','cirurgia-plastica','cirurgia-toracica','cirurgia-vascular'}

def import_enare(link):
    title=re.sub(r'\s*\(.+','',link.split('/')[-1].replace('PRE-REQUISITO - ',''))
    specialty=slug(title)
    assert specialty in keys, f'Missing exact key for {title}'
    answer_map=keys[specialty]
    path=fetch(urljoin(BASE,link),DOCS/f'enare-2024-{specialty}.pdf')
    pages=pages_for(path,80)
    assert len(pages)==80, f'Missing page mappings for {title}: {len(pages)}/80'
    e={'id':f'enare-2024-{specialty}','title':f'ENARE 2024/25 · {title.title()}','exam':'ENARE R+','year':'2024/2025','area':'CIR' if specialty in surgical else 'CM','specialty':specialty,'source':f'FGV / Ebserh · ENARE 2024/2025 · Pré-requisito · {title.title()} · Tipo 1','pdf':f'assets/documents/enare-2024-{specialty}.pdf','originalUrl':quote(urljoin(BASE,link),safe=':/'),'key':KEY_ENARE,'total':80,'valid':sum(v is not None for v in answer_map.values()),'keyStatus':'Definitivo','cancelled':[n for n,v in answer_map.items() if v is None],'description':'Caderno de pré-requisito da FGV. A leitura acontece no PDF original, com correção pelo gabarito definitivo e exclusão dos itens anulados.'}
    return e,[exercise(e,n,answer_map[n],pages[n]) for n in range(1,81)]

with ThreadPoolExecutor(max_workers=4) as pool:
    for e,items in pool.map(import_enare,links):
        exams.append(e); questions.extend(items)
        print(e['id'],e['valid'],flush=True)

(ROOT/'app/official-exams.json').write_text(json.dumps(exams,ensure_ascii=False,indent=2)+'\n')
(ROOT/'app/official-questions.json').write_text(json.dumps(questions,ensure_ascii=False,indent=2)+'\n')
print(f'{len(exams)} official booklets; {len(questions)} question references, including cancelled items.')
