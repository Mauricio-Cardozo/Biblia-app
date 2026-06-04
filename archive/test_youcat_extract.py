import pdfplumber
import os

# Asegúrate de que el nombre coincida con tu archivo PDF
PDF_PATH = "youcat.pdf" 

def probar_lectura(inicio, fin):
    if not os.path.exists(PDF_PATH):
        print(f"❌ Error: No se encuentra el archivo {PDF_PATH} en el directorio actual.")
        print(f"Archivos disponibles: {os.listdir('.')}")
        return

    try:
        with pdfplumber.open(PDF_PATH) as pdf:
            total_paginas = len(pdf.pages)
            print(f"📘 PDF abierto con éxito. Total de páginas: {total_paginas}")
            
            rango_fin = min(fin, total_paginas)
            for i in range(inicio, rango_fin):
                full_page = pdf.pages[i]
                
                # Definimos el recorte: (x0, top, x1, bottom)
                # Ajusta x0 (izq) y x1 (der) para ignorar las columnas laterales
                # x0=80 y x1=500 es un buen punto de partida para contenido central
                area_central = (80, 0, 500, full_page.height)
                page = full_page.crop(area_central)

                print(f"\n--- CONTENIDO PÁGINA {i} (Índice 0) ---")
                text = page.extract_text()
                if text:
                    # Imprimimos líneas individuales para ver si se coló ruido lateral
                    lineas = text.split('\n')
                    for line in lineas[:15]: # Primeras 15 líneas
                        print(f"| {line}")
                else:
                    print("[Página sin texto detectable - Podría ser una imagen o escaneo]")
                print("-" * 40)
    except Exception as e:
        print(f"❌ Error al procesar el PDF: {e}")

if __name__ == "__main__":
    # Probamos un rango donde usualmente comienza el contenido tras el prólogo e índice
    probar_lectura(15, 25)