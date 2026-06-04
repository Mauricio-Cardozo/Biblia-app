import sqlite3

db_path = "biblia_pueblo_dios.db"

# Orden oficial del Canon Católico (73 libros)
# Nota: La "Carta de Jeremías" suele ser el capítulo 6 de Baruc en muchas ediciones.
# Aquí la manejaremos según cómo la tengas estructurada.
canon_catolico = [
    "Génesis", "Éxodo", "Levítico", "Números", "Deuteronomio", "Josué", "Jueces", "Rut",
    "1 Samuel", "2 Samuel", "1 Reyes", "2 Reyes", "1 Crónicas", "2 Crónicas", "Esdras", "Nehemías",
    "Tobías", "Judit", "Ester", "1 Macabeos", "2 Macabeos", "Job", "Salmos", "Proverbios",
    "Eclesiastés", "Cantar de los Cantares", "Sabiduría", "Eclesiástico", "Isaías", "Jeremías",
    "Lamentaciones", "Baruc", "Ezequiel", "Daniel", "Oseas", "Joel", "Amós", "Abdías",
    "Jonás", "Miqueas", "Nahúm", "Habacuc", "Sofonías", "Ageo", "Zacarías", "Malaquías",
    "Mateo", "Marcos", "Lucas", "Juan", "Hechos de los Apóstoles", "Romanos", "1 Corintios",
    "2 Corintios", "Gálatas", "Efesios", "Filipenses", "Colosenses", "1 Tesalonicenses",
    "2 Tesalonicenses", "1 Timoteo", "2 Timoteo", "Tito", "Filemón", "Hebreos", "Santiago",
    "1 Pedro", "2 Pedro", "1 Juan", "2 Juan", "3 Juan", "Judas", "Apocalipsis"
]

def finalizar():
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    print("🚀 Iniciando unificación final...")

    # 1. Unificar Ester
    cur.execute("SELECT id FROM libros WHERE nombre = 'Ester'")
    id_ester = cur.fetchone()[0]
    cur.execute("SELECT id FROM libros WHERE nombre = 'Ester_Suplementos'")
    row_ester_sup = cur.fetchone()
    if row_ester_sup:
        cur.execute("UPDATE versiculos SET libro_id = ? WHERE libro_id = ?", (id_ester, row_ester_sup[0]))
        cur.execute("DELETE FROM libros WHERE id = ?", (row_ester_sup[0],))
        print("✅ Ester unificado.")

    # 2. Unificar Daniel
    cur.execute("SELECT id FROM libros WHERE nombre = 'Daniel'")
    id_daniel = cur.fetchone()[0]
    cur.execute("SELECT id FROM libros WHERE nombre = 'Daniel (Suplementos)'")
    row_dan_sup = cur.fetchone()
    if row_dan_sup:
        cur.execute("UPDATE versiculos SET libro_id = ? WHERE libro_id = ?", (id_daniel, row_dan_sup[0]))
        cur.execute("DELETE FROM libros WHERE id = ?", (row_dan_sup[0],))
        print("✅ Daniel unificado.")

    # 3. Unificar Carta de Jeremías a Baruc (Capítulo 6)
    # Opcional: Si quieres que sea el cap 6 de Baruc
    cur.execute("SELECT id FROM libros WHERE nombre = 'Baruc'")
    id_baruc = cur.fetchone()[0]
    cur.execute("SELECT id FROM libros WHERE nombre = 'Carta de Jeremías'")
    row_jer = cur.fetchone()
    if row_jer:
        cur.execute("UPDATE versiculos SET libro_id = ?, capitulo = 6 WHERE libro_id = ?", (id_baruc, row_jer[0]))
        cur.execute("DELETE FROM libros WHERE id = ?", (row_jer[0],))
        print("✅ Carta de Jeremías integrada como Baruc 6.")

    # 4. Reordenamiento total de IDs
    # Creamos una tabla temporal para no romper las FK
    cur.execute("CREATE TABLE libros_new (id INTEGER PRIMARY KEY, nombre TEXT, testamento TEXT)")
    
    for i, nombre in enumerate(canon_catolico, 1):
        # Buscamos los datos originales
        cur.execute("SELECT testamento, id FROM libros WHERE nombre = ?", (nombre,))
        row = cur.fetchone()
        if row:
            testamento, old_id = row
            cur.execute("INSERT INTO libros_new (id, nombre, testamento) VALUES (?, ?, ?)", (i, nombre, testamento))
            # Actualizamos los versículos al nuevo ID (usamos un offset para no colisionar)
            cur.execute("UPDATE versiculos SET libro_id = ? WHERE libro_id = ?", (i + 1000, old_id))

    # Bajamos el offset de los versículos
    cur.execute("UPDATE versiculos SET libro_id = libro_id - 1000")
    
    # Reemplazamos tabla
    cur.execute("DROP TABLE libros")
    cur.execute("ALTER TABLE libros_new RENAME TO libros")
    
    conn.commit()
    conn.close()
    print("🎊 ¡BIBLIA COMPLETADA Y ORDENADA! 🎊")

if __name__ == "__main__":
    finalizar()