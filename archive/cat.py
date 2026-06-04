import sqlite3
import os

def get_metadata(numeral_id):
    """
    Define la estructura del CIC según el número de párrafo.
    Basado en la estructura oficial del Catecismo.
    """
    # Ejemplo de rangos (puedes ajustarlos según tu edición específica)
    if 1 <= numeral_id <= 1065:
        parte = "1. La Profesión de la Fe"
        if numeral_id <= 421: seccion = "1. 'Creo' - 'Creemos'"
        else: seccion = "2. La profesión de la fe cristiana"
    elif 1066 <= numeral_id <= 1690:
        parte = "2. La Celebración del Misterio Cristiano"
        seccion = "1. La economía sacramental" if numeral_id <= 1209 else "2. Los siete sacramentos"
    elif 1691 <= numeral_id <= 2557:
        parte = "3. La Vida en Cristo"
        seccion = "1. La vocación del hombre" if numeral_id <= 2051 else "2. Los diez mandamientos"
    elif 2558 <= numeral_id <= 2865:
        parte = "4. La Oración Cristiana"
        seccion = "1. La oración en la vida cristiana" if numeral_id <= 2758 else "2. La oración del Señor"
    else:
        parte, seccion = "Apéndice/Otros", ""
    
    return parte, seccion

def migrate_to_cic():
    source_db = 'catecismo.db'
    target_db = 'iglesia_digital.db'

    if not os.path.exists(source_db):
        print(f"❌ No se encontró la fuente: {source_db}")
        return

    try:
        conn_s = sqlite3.connect(source_db)
        conn_t = sqlite3.connect(target_db)
        cur_s = conn_s.cursor()
        cur_t = conn_t.cursor()

        # Leemos los datos limpios que ya tenés
        cur_s.execute("SELECT id, texto FROM numerales")
        rows = cur_s.fetchall()

        print(f"🔄 Procesando {len(rows)} numerales con estructura jerárquica...")

        data_to_insert = []
        for row in rows:
            num_id, texto = row
            parte, seccion = get_metadata(num_id)
            # Por ahora dejamos capitulo y articulo vacíos para llenarlos manualmente 
            # o con lógica más compleja si la necesitás después.
            data_to_insert.append((num_id, parte, seccion, "", "", texto))

        # Insertamos en la tabla catecismo_cic
        cur_t.executemany('''
            INSERT OR REPLACE INTO catecismo_cic (id, parte, seccion, capitulo, articulo, texto) 
            VALUES (?, ?, ?, ?, ?, ?)
        ''', data_to_insert)

        conn_t.commit()
        print(f"✅ Migración a 'catecismo_cic' finalizada.")

    except sqlite3.Error as e:
        print(f"❌ Error: {e}")
    finally:
        conn_s.close()
        conn_t.close()

if __name__ == "__main__":
    migrate_to_cic()