import sqlite3

# Ruta a tu base de datos
db_path = "biblia_pueblo_dios.db"

try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Buscamos el ID del libro problemático
    cur.execute("SELECT id FROM libros WHERE nombre = 'Ester_Suplementos'")
    row = cur.fetchone()

    if row:
        libro_id = row[0]
        # 2. Borramos sus versículos
        cur.execute("DELETE FROM versiculos WHERE libro_id = ?", (libro_id,))
        # 3. Borramos el libro de la tabla libros
        cur.execute("DELETE FROM libros WHERE id = ?", (libro_id,))
        
        conn.commit()
        print(f"✅ Limpieza exitosa. Se borró 'Ester_Suplementos' (ID: {libro_id})")
    else:
        print("ℹ️ No se encontró el libro 'Ester_Suplementos', nada que borrar.")

except Exception as e:
    print(f"❌ Error: {e}")
finally:
    if conn:
        conn.close()