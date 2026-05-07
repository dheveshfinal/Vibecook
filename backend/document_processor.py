"""
Document processing utilities for extracting text from various file types.
Supports PDF, DOCX, TXT, and image files (OCR via Ollama Vision).
"""

import os
from pathlib import Path
from typing import Optional, Tuple
import io

import PyPDF2
from docx import Document
from PIL import Image
import base64

# ── PDF Processing ──────────────────────────────────────────────────────────

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file."""
    try:
        text = []
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text.append(page.extract_text())
        return "\n".join(text)
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""

# ── DOCX Processing ─────────────────────────────────────────────────────────

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file."""
    try:
        doc = Document(file_path)
        text = []
        for para in doc.paragraphs:
            if para.text.strip():
                text.append(para.text)
        return "\n".join(text)
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
        return ""

# ── Text File Processing ────────────────────────────────────────────────────

def extract_text_from_txt(file_path: str) -> str:
    """Extract text from TXT file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        print(f"Error extracting text from TXT: {e}")
        return ""

# ── Image Processing ────────────────────────────────────────────────────────

def extract_image_metadata(file_path: str) -> str:
    """Extract metadata and basic info from image."""
    try:
        img = Image.open(file_path)
        info = f"Image: {Path(file_path).name}\nDimensions: {img.size[0]}x{img.size[1]}\nFormat: {img.format}"
        
        # Try to extract EXIF data if available
        if hasattr(img, '_getexif') and img._getexif():
            info += "\nMetadata: Image contains EXIF data"
        
        return info
    except Exception as e:
        print(f"Error extracting image metadata: {e}")
        return ""

def image_to_base64(file_path: str) -> Optional[str]:
    """Convert image to base64 for Ollama Vision model."""
    try:
        with open(file_path, 'rb') as img_file:
            return base64.b64encode(img_file.read()).decode('utf-8')
    except Exception as e:
        print(f"Error converting image to base64: {e}")
        return None

# ── Main Document Processing ────────────────────────────────────────────────

def process_document(file_path: str) -> Tuple[str, str]:
    """
    Process any supported document type and extract text.
    Returns (content, document_type).
    """
    file_path = str(file_path)
    ext = Path(file_path).suffix.lower()
    
    if ext == '.pdf':
        content = extract_text_from_pdf(file_path)
        return content, "pdf"
    elif ext == '.docx':
        content = extract_text_from_docx(file_path)
        return content, "docx"
    elif ext == '.txt':
        content = extract_text_from_txt(file_path)
        return content, "txt"
    elif ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
        content = extract_image_metadata(file_path)
        return content, "image"
    else:
        return "", "unknown"

def get_document_summary(content: str, max_length: int = 200) -> str:
    """Generate a short summary of document content."""
    if not content:
        return "No content"
    
    # Simple truncation for now
    if len(content) > max_length:
        return content[:max_length].rsplit(' ', 1)[0] + "..."
    return content
