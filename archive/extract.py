import pdfplumber
import sqlite3
import re
import os

def setup_database():
    # Nos conectamos (o creamos) la DB temporal
    conn = sqlite3.connect("youcat.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY,
            question TEXT,
            answer TEXT
        )
    ''')
    conn.commit()
    return conn, cursor

def save_to_db(cursor, conn, q_num, q_text, a_text):
    # Limpiamos el carácter raro  y espacios extra antes de guardar
    q_text = q_text.replace('', '').replace('\xad', '').strip()
    a_text = a_text.replace('', '').replace('\xad', '').strip()
    
    # Eliminamos saltos de línea internos y dejamos un espacio limpio
    q_text = re.sub(r'\s+', ' ', q_text)
    a_text = re.sub(r'\s+', ' ', a_text)
    
    cursor.execute(
        "INSERT OR REPLACE INTO questions (id, question, answer) VALUES (?, ?, ?)",
        (q_num, q_text, a_text)
    )
    conn.commit()

def extract_youcat(pdf_path):
    if not os.path.exists(pdf_path):
        print(f"❌ Error: No se encontró el archivo en {pdf_path}")
        return

    conn, cursor = setup_database()
    
    # Expresión para detectar el número de inicio y capturar el resto de la línea
    re_num_pregunta = re.compile(r'^(\d+)\.?\s*(.*)')
    
    # Regex brutal para eliminar los pies de página tipo "I (1-165), II (166-278)..."
    re_basura_romana = re.compile(r'^[IVX]+\s*\(\d+-\d+\)')

    current_q_num = None
    current_q_text = ""
    current_a_text = ""
    state = "SEARCHING"

    print("🚀 Iniciando extracción mejorada...")

    with pdfplumber.open(pdf_path) as pdf:
        # Iniciamos en la página 14 (Ajustar si el índice del PDF cambia)
        for i in range(14, len(pdf.pages)): 
            page_text = pdf.pages[i].extract_text()
            if not page_text: continue

            lines = page_text.split('\n')
            for line in lines:
                line = line.strip()
                
                # Ignoramos líneas vacías, la basura romana y los títulos de sección
                if not line or re_basura_romana.match(line):
                    continue
                if any(line.startswith(ign) for ign in ["Capítulo", "YOUCAT", "ESPAÑOL", "Lo que creemos", "PRIMERA PARTE", "SEGUNDA PARTE", "TERCERA PARTE", "CUARTA PARTE"]):
                    continue

                # Intentamos detectar si la línea empieza con un número
                match = re_num_pregunta.match(line)
                
                if match:
                    num_str = match.group(1)
                    resto_linea = match.group(2)
                    new_q_num = int(num_str)
                    
                    # Validación clave: Asegurarnos que es el número SIGUIENTE (o el mismo)
                    # Esto evita que un párrafo cualquiera que empiece con un número rompa el código
                    if 1 <= new_q_num <= 527 and (current_q_num is None or new_q_num == current_q_num + 1 or new_q_num == current_q_num):
                        
                        # Si ya veníamos armando una pregunta, la guardamos en la DB
                        if current_q_num is not None and current_q_num != new_q_num:
                            save_to_db(cursor, conn, current_q_num, current_q_text, current_a_text)
                        
                        current_q_num = new_q_num
                        
                        # Lógica para dividir pregunta y respuesta en la misma línea
                        if current_q_num <= 10:
                            # Del 1 al 10 (Mandamientos), la "pregunta" termina con un punto '.'
                            split_pto = resto_linea.split('.', 1)
                            if len(split_pto) > 1:
                                current_q_text = split_pto[0] + "."
                                current_a_text = split_pto[1]
                                state = "CAPTURING_ANSWER"
                            else:
                                current_q_text = resto_linea
                                current_a_text = ""
                                state = "CAPTURING_QUESTION"
                        else:
                            # Las demás preguntas terminan con '?'
                            if '?' in resto_linea:
                                split_q = resto_linea.split('?', 1)
                                current_q_text = split_q[0] + "?"
                                current_a_text = split_q[1]
                                state = "CAPTURING_ANSWER"
                            else:
                                current_q_text = resto_linea
                                current_a_text = ""
                                state = "CAPTURING_QUESTION"
                        continue

                # Si la línea no es un número nuevo, acumulamos el texto según el estado actual
                if state == "CAPTURING_QUESTION":
                    # Chequeo especial para los mandamientos que pudieron quedar cortados
                    if current_q_num and current_q_num <= 10:
                        if '.' in line:
                            split_pto = line.split('.', 1)
                            current_q_text += " " + split_pto[0] + "."
                            current_a_text += " " + split_pto[1]
                            state = "CAPTURING_ANSWER"
                        else:
                            current_q_text += " " + line
                    else:
                        if '?' in line:
                            split_q = line.split('?', 1)
                            current_q_text += " " + split_q[0] + "?"
                            current_a_text += " " + split_q[1]
                            state = "CAPTURING_ANSWER"
                        else:
                            current_q_text += " " + line
                            
                elif state == "CAPTURING_ANSWER":
                    current_a_text += " " + line

    # Al finalizar el PDF, guardamos la última pregunta atrapada (debería ser la 527)
    if current_q_num:
        save_to_db(cursor, conn, current_q_num, current_q_text, current_a_text)
    
    conn.close()
    print(f"✅ ¡Extracción completada! Base de datos 'youcat.db' limpia y lista.")

if __name__ == "__main__":
    path_del_pdf = "YOUCAT.pdf" 
    extract_youcat(path_del_pdf)