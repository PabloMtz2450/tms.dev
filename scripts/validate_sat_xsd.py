from pathlib import Path
import sys
import xmlschema

CFDI_XSD = 'https://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd'
CCP_NS = 'http://www.sat.gob.mx/CartaPorte31'
CCP_XSD = 'https://www.sat.gob.mx/sitio_internet/cfd/CartaPorte/CartaPorte31.xsd'
FIXTURE = Path(__file__).resolve().parent.parent / 'testdata' / 'fiscal' / 'traslado-carta-porte-31.xml'

if not FIXTURE.exists():
    raise SystemExit(f'Fixture missing: {FIXTURE}')

print('Loading official SAT CFDI 4.0 + Carta Porte 3.1 schemas...')
schema = xmlschema.XMLSchema(CFDI_XSD, allow='all', locations={CCP_NS: CCP_XSD})
errors = list(schema.iter_errors(str(FIXTURE)))
if errors:
    print(f'SAT XSD validation failed with {len(errors)} error(s):')
    for err in errors[:30]:
        print('-', err.reason)
        print('  path:', err.path)
    sys.exit(1)
print('SAT XSD validation OK: CFDI 4.0 + Carta Porte 3.1')
