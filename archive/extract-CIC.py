import pdfplumber
import sqlite3
import re
import os

def setup_database():
    conn = sqlite3.connect("catecismo.db")
    cursor = conn.cursor()
    # NO usamos DROP TABLE para no borrar tus 2600 registros buenos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS numerales (
            id INTEGER PRIMARY KEY,
            texto TEXT
        )
    ''')
    conn.commit()
    return conn, cursor

def save_to_db(cursor, conn, num, texto):
    # Solo guardamos si es de los que te faltaban (1 al 202)
    if 1 <= num <= 202:
        texto = re.sub(r'\s+', ' ', texto).strip()
        # Limpieza de superíndices (ej: Dios9 -> Dios)
        texto = re.sub(r'(?<=[a-zA-Záéíóú])\d+', '', texto) 
        
        cursor.execute("INSERT OR IGNORE INTO numerales (id, texto) VALUES (?, ?)", (num, texto))
        conn.commit()

def extract_missing_parts(pdf_path):
    if not os.path.exists(pdf_path):
        print(f"❌ No se encontró el archivo: {pdf_path}")
        return

    conn, cursor = setup_database()
    re_numeral = re.compile(r'^(\d{1,4})\.?\s+(.*)')
    
    current_num = None
    current_text = ""

    print("🚀 Buscando exclusivamente numerales del 1 al 202...")

    with pdfplumber.open(pdf_path) as pdf:
        # El Catecismo suele tener el numeral 1 después de la intro. 
        # Vamos a escanear las primeras 100 páginas que es donde está el hueco.
        for i in range(0, 100): 
            page_text = pdf.pages[i].extract_text()
            if not page_text: continue

            lines = page_text.split('\n')
            for line in lines:
                line = line.strip()
                if not line: continue

                match = re_numeral.match(line)
                if match:
                    new_num = int(match.group(1))
                    contenido = match.group(2)
                    
                    # Filtro de seguridad: solo nos interesa el rango faltante
                    # Y que sea texto largo (para ignorar las citas que viste antes)
                    if 1 <= new_num <= 202 and len(contenido) > 30:
                        if current_num is not None:
                            save_to_db(cursor, conn, current_num, current_text)
                        
                        current_num = new_num
                        current_text = contenido
                        continue

                if current_num is not None:
                    current_text += " " + line

    if current_num:
        save_to_db(cursor, conn, current_num, current_text)
    
    conn.close()
    print(f"✅ ¡Parche completado! Los numerales 1-202 deberían estar ahora junto a los demás.")

if __name__ == "__main__":
    extract_missing_parts("catecismoDeLaIglesia.pdf")