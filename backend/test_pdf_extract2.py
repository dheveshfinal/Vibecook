import sys
import os
sys.path.append('/app')
from document_processor import extract_text_from_pdf

pdf_path = "/app/uploads/documents/cf2f76a5-94d6-4b2e-bfbc-d30e91551154_Potatoes-Air-Fryer-French-Fries.pdf"
content = extract_text_from_pdf(pdf_path)
print("----- FULL EXTRACTED TEXT -----")
print(repr(content))
print("----- END EXTRACTED TEXT -----")

lines = [l.strip() for l in content.split('\n') if l.strip()]
print("----- LINES -----")
for i, l in enumerate(lines):
    print(f"{i}: {repr(l)}")
