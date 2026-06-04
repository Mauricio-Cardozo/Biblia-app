import sqlite3
import requests
from bs4 import BeautifulSoup

DB_PATH = "biblia_pueblo_dios.db"
URLS_AGEO = [
    (1, "https://www.vatican.va/archive/ESL0506/__PFN.HTM"),
    (2, "https://www.vatican.va/archive/ESL0506/__PFO.HTM")
]

def scrapear_ageo():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT id FROM libros WHERE nombre = 'Ageo' OR nombre = 'Hageo'")
    row = cur.fetchone()
    
    if row:
        libro_id = row[0]
        cur.execute("UPDATE libros SET nombre = 'Ageo' WHERE id = ?", (libro_id,))
    else:
        cur.execute("INSERT INTO libros (nombre, testamento) VALUES ('Ageo', 'Antiguo')")
        libro_id = cur.lastrowid
    
    print(f"🚀 Procesando Ageo (ID: {libro_id})...")

    for capitulo, url in URLS_AGEO:
        try:
            r = requests.get(url)
            r.encoding = 'utf-8'
            soup = BeautifulSoup(r.text, 'html.parser')
            parrafos = soup.find_all('p')
            
            for p in parrafos:
                texto = p.get_text().strip()
                if texto and texto[0].isdigit():
                    partes = texto.split(' ', 1)
                    if len(partes) > 1:
                        num_ver = partes[0].replace('.', '').strip()
                        contenido = partes[1].strip()
                        
                        if num_ver.isdigit():
                            # CORRECCIÓN AQUÍ: 'numero' en lugar de 'versiculo'
                            cur.execute("""
                                INSERT INTO versiculos (libro_id, capitulo, numero, texto)
                                VALUES (?, ?, ?, ?)
                            """, (libro_id, capitulo, int(num_ver), contenido))
            print(f"✅ Capítulo {capitulo} guardado.")
        except Exception as e:
            print(f"❌ Error en capítulo {capitulo}: {e}")

    conn.commit()
    conn.close()
    print("¡Ageo cargado!")

if __name__ == "__main__":
    scrapear_ageo()