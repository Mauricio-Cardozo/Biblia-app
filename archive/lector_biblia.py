import pdfplumber

# Cambia 'archivo.pdf' por el nombre de tu PDF (ej. el YOUCAT o la Biblia)
pdf_path = "tu_archivo.pdf" 

try:
    with pdfplumber.open(pdf_path) as pdf:
        # Extraemos la primera página para probar
        primera_pagina = pdf.pages[0]
        texto = primera_pagina.extract_text()
        
        print("--- Contenido detectado ---")
        print(texto if texto else "No se pudo extraer texto de esta página.")
        print("---------------------------")
        print(f"Total de páginas en el documento: {len(pdf.pages)}")

except FileNotFoundError:
    print(f"Error: No se encontró el archivo '{pdf_path}'.")
except Exception as e:
    print(f"Ocurrió un error: {e}")