import sqlite3
import os

# Rutas a las bases de datos
SOURCE_DB_PATH = "biblia_pueblo_dios.db"
TARGET_DB_PATH = "iglesia_digital.db" # Asumiendo este es el nombre de tu nueva DB unificada

def migrate_bible_data():
    """
    Migra los datos de libros y versículos desde biblia_pueblo_dios.db (tablas 'libros' y 'versiculos')
    a la tabla unificada 'biblia_pueblo_dios' en iglesia_digital.db.
    """
    if not os.path.exists(SOURCE_DB_PATH):
        print(f"❌ Error: La base de datos de origen '{SOURCE_DB_PATH}' no se encontró.")
        print("Asegúrate de haber ejecutado los scrapers de la Biblia primero.")
        return
    
    if not os.path.exists(TARGET_DB_PATH):
        print(f"❌ Error: La base de datos de destino '{TARGET_DB_PATH}' no se encontró.")
        print("Asegúrate de que 'iglesia_digital.db' haya sido creada con sus tablas.")
        return

    conn_source = None
    conn_target = None
    try:
        conn_source = sqlite3.connect(SOURCE_DB_PATH)
        cursor_source = conn_source.cursor()

        conn_target = sqlite3.connect(TARGET_DB_PATH)
        cursor_target = conn_target.cursor()

        print(f"🚀 Iniciando migración de datos de '{SOURCE_DB_PATH}' a la tabla 'biblia_pueblo_dios' en '{TARGET_DB_PATH}'...")

        # Opcional: Limpiar la tabla de destino antes de insertar si se desea una migración "limpia"
        # cursor_target.execute("DELETE FROM biblia_pueblo_dios")
        # conn_target.commit()
        # print("Tabla 'biblia_pueblo_dios' en destino limpiada (si existía).")

        # Paso 1: Realizar JOIN en la base de datos de origen para obtener todos los datos necesarios
        print("Consultando datos combinados de libros y versículos en la base de datos de origen...")
        cursor_source.execute("""
            SELECT
                l.nombre,       -- Corresponde a la columna 'libro' en destino
                v.capitulo,
                v.numero,       -- Corresponde a la columna 'versiculo' en destino
                v.texto,
                l.testamento
            FROM
                versiculos v
            JOIN
                libros l ON v.libro_id = l.id
            ORDER BY
                l.id, v.capitulo, v.numero
        """)
        source_data = cursor_source.fetchall()
        print(f"✅ {len(source_data)} versículos encontrados en la base de datos de origen.")

        if not source_data:
            print("⚠️ No hay datos para migrar.")
            return

        # Paso 2: Insertar los datos combinados en la nueva tabla unificada usando executemany
        print("Insertando datos en la tabla 'biblia_pueblo_dios' de la base de datos de destino...")
        
        # La consulta de inserción debe coincidir con el orden de las columnas seleccionadas
        # y las columnas de la tabla de destino (excluyendo 'id' que es auto-incrementable)
        insert_query = """
            INSERT INTO biblia_pueblo_dios (libro, capitulo, versiculo, texto, testamento)
            VALUES (?, ?, ?, ?, ?)
        """
        
        cursor_target.executemany(insert_query, source_data)
        conn_target.commit()
        
        print(f"✅ Migración de {len(source_data)} versículos completada en la tabla 'biblia_pueblo_dios'.")
        print("🎊 ¡Migración de datos de la Biblia finalizada con éxito! 🎊")

    except sqlite3.Error as e:
        print(f"❌ Error de SQLite durante la migración: {e}")
        if conn_target:
            conn_target.rollback() # Deshacer cambios en caso de error
    except Exception as e:
        print(f"❌ Ocurrió un error inesperado: {e}")
    finally:
        if conn_source:
            conn_source.close()
        if conn_target:
            conn_target.close()

if __name__ == "__main__":
    migrate_bible_data()