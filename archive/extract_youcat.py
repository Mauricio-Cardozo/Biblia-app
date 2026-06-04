import pdfplumber
import sqlite3
import re
import os

PDF_PATH = "youcat.pdf"
DB_PATH = "iglesia_digital.db"

# BBox ajustado: Ignoramos márgenes y columnas laterales (sidebars)
# Basado en el texto de ejemplo, el centro está entre x=70 y x=470
X0, Y0, X1, Y1 = 70, 50, 470, 780 

def limpiar(t):
    return re.sub(r'\s+', ' ', t).strip()

def extraer_youcat():
    if not os.path.exists(PDF_PATH):
        print("❌ Archivo PDF no encontrado.")
        return

    preguntas_extraidas = []
    
    # Regex: Busca número al inicio de línea
    re_inicio = re.compile(r'^(\d+)\s*')
    # Regex: Busca el ancla de fin de respuesta [54-64]
    re_ancla = re.compile(r'\[\d+.*\]')

    with pdfplumber.open(PDF_PATH) as pdf:
        curr_nro = 0
        curr_preg = ""
        curr_resp = ""
        estado = "BUSCANDO" # BUSCANDO, PREGUNTA, RESPUESTA

        print(f"⏳ Procesando {len(pdf.pages)} páginas...")

        for i in range(15, len(pdf.pages)):
            page = pdf.pages[i]
            # Recortamos para matar el ruido de las columnas laterales
            recorte = page.crop((X0, Y0, X1, Y1))
            texto = recorte.extract_text()
            
            if not texto: continue

            for linea in texto.split('\n'):
                linea = linea.strip()
                if not linea: continue

                match_num = re_inicio.match(linea)
                
                # Detectar posible nueva pregunta
                if match_num:
                    n_tmp = int(match_num.group(1))
                    # Validar que sea un número de YOUCAT (1-527) y sea ascendente
                    if curr_nro < n_tmp <= 527:
                        # Guardar la anterior antes de empezar nueva
                        if curr_nro > 0:
                            preguntas_extraidas.append((curr_nro, limpiar(curr_preg), limpiar(curr_resp)))
                        
                        curr_nro = n_tmp
                        # El resto de la línea podría ser el inicio de la pregunta
                        resto = linea[match_num.end():].strip()
                        curr_preg = resto
                        curr_resp = ""
                        estado = "PREGUNTA"
                        if "¿" in linea or "?" in linea: # A veces es corta
                            estado = "RESPUESTA"
                        continue

                # Flujo de captura
                if estado == "PREGUNTA":
                    curr_preg += " " + linea
                    if "?" in linea:
                        estado = "RESPUESTA"
                elif estado == "RESPUESTA":
                    curr_resp += " " + linea

        # Guardar última pregunta
        if curr_nro > 0:
            preguntas_extraidas.append((curr_nro, limpiar(curr_preg), limpiar(curr_resp)))

    # Carga en DB
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM youcat") # Limpieza total
        cursor.executemany(
            "INSERT INTO youcat (pregunta_nro, pregunta_texto, respuesta_texto) VALUES (?, ?, ?)",
            preguntas_extraidas
        )
        conn.commit()
        
        # Reporte de gaps
        encontrados = {p[0] for p in preguntas_extraidas}
        faltantes = [n for n in range(1, 528) if n not in encontrados]
        
        print(f"✅ Éxito: {len(preguntas_extraidas)} preguntas cargadas.")
        if faltantes:
            print(f"⚠️ Faltan {len(faltantes)} números: {faltantes[:15]}...")
    except Exception as e:
        print(f"❌ Error DB: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    extraer_youcat()