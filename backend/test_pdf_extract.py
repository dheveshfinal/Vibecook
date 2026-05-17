import sys
import os
sys.path.append('/app')
from document_processor import extract_text_from_pdf
from tasks.document_tasks import rule_based_extract

pdf_path = "/app/uploads/documents/cf2f76a5-94d6-4b2e-bfbc-d30e91551154_Potatoes-Air-Fryer-French-Fries.pdf"
if os.path.exists(pdf_path):
    print(f"Reading PDF from {pdf_path}")
    content = extract_text_from_pdf(pdf_path)
    print("----- EXTRACTED TEXT -----")
    print(repr(content[:500]))
    print("----- END EXTRACTED TEXT -----")
    
    out = rule_based_extract(content)
    print(f"INGREDIENTS EXTRACTED: {len([l for l in out['ingredients'].split(chr(10)) if l.strip()])}")
    print(repr(out["ingredients"]))
    print(f"STEPS EXTRACTED: {len([l for l in out['steps'].split(chr(10)) if l.strip()])}")
    print(repr(out["steps"][:200]))
else:
    print(f"File not found: {pdf_path}")
    import glob
    print(glob.glob("/app/uploads/documents/*"))
