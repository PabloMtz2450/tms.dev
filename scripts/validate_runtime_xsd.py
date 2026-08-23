import json
import sys
import xmlschema

CFDI_XSD = 'https://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd'
CCP_NS = 'http://www.sat.gob.mx/CartaPorte31'
CCP_XSD = 'https://www.sat.gob.mx/sitio_internet/cfd/CartaPorte/CartaPorte31.xsd'
MAX_BYTES = 1_000_000

raw = sys.stdin.buffer.read(MAX_BYTES + 1)
if len(raw) > MAX_BYTES:
    print(json.dumps({'valid': False, 'messages': [{'message': 'XML excede 1 MB'}]}))
    raise SystemExit(0)

try:
    text = raw.decode('utf-8')
except UnicodeDecodeError:
    print(json.dumps({'valid': False, 'messages': [{'message': 'XML no es UTF-8 válido'}]}))
    raise SystemExit(0)

if '<!DOCTYPE' in text.upper() or '<!ENTITY' in text.upper():
    print(json.dumps({'valid': False, 'messages': [{'message': 'DTD/ENTITY prohibido'}]}))
    raise SystemExit(0)

try:
    schema = xmlschema.XMLSchema(CFDI_XSD, allow='remote', locations={CCP_NS: CCP_XSD})
    errors = list(schema.iter_errors(text))
    payload = {
        'valid': not errors,
        'messages': [
            {
                'message': str(err.reason),
                'line': getattr(getattr(err, 'elem', None), 'sourceline', None),
            }
            for err in errors[:50]
        ],
    }
    print(json.dumps(payload, ensure_ascii=False))
except Exception as exc:
    # Fail closed: infrastructure/schema failure is not treated as valid XML.
    print(json.dumps({'valid': False, 'messages': [{'message': f'XSD_RUNTIME_UNAVAILABLE:{type(exc).__name__}'}]}))
