# 📖 App Biblia Católica & YOUCAT (Proyecto TUP - UTN)

App móvil diseñada para la formación católica, integrando el texto sagrado con el catecismo joven (YOUCAT). Enfocada en la soberanía de datos y el uso de herramientas Open Source.

## 🚀 Objetivo
Crear una aplicación móvil multiplataforma que funcione offline, permitiendo consultar la liturgia diaria, la Biblia del Pueblo de Dios y el YOUCAT de forma integrada.

## 🛠 Stack Técnico
- **Lenguajes:** JavaScript (React Native), Python (Scraping/Backend).
- **Base de Datos:** SQLite (archivo local `biblia_pueblo_dios.db`).
- **Entorno:** Nobara Linux, Cursor Editor, Tailscale Private Network.
- **Herramientas de Datos:** DBeaver para gestión SQL.

## 📊 Estructura de la Base de Datos (Esquema SQL)
```sql
-- Estructura para SQLite
CREATE TABLE libros (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    testamento TEXT -- Antiguo/Nuevo
);

CREATE TABLE versiculos (
    id INTEGER PRIMARY KEY,
    libro_id INTEGER,
    capitulo INTEGER,
    numero INTEGER,
    texto TEXT,
    FOREIGN KEY (libro_id) REFERENCES libros(id)
);

CREATE TABLE youcat (
    id INTEGER PRIMARY KEY,
    pregunta_nro INTEGER,
    pregunta_texto TEXT,
    respuesta_texto TEXT
);

CREATE TABLE relaciones_biblia_youcat (
    id INTEGER PRIMARY KEY,
    versiculo_id INTEGER,
    youcat_id INTEGER,
    FOREIGN KEY (versiculo_id) REFERENCES versiculos(id),
    FOREIGN KEY (youcat_id) REFERENCES youcat(id)
);
