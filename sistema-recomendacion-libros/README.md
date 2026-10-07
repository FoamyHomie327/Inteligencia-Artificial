# Sistema de Recomendación de Libros con PCA

**Autor:** Arturo Vargas Espinosa

**Aplicación:** https://foamyhomie327.github.io/Inteligencia-Artificial/sistema-recomendacion-libros/app/

## Índice

| Archivo | Descripción |
|---|---|
| [`app/`](app/) | Aplicación web *Estantería* (HTML, CSS y JavaScript), publicada con GitHub Pages. |
| [`sistema_recomendacion_pca.ipynb`](sistema_recomendacion_pca.ipynb) | Notebook tutorial: exploración de datos, PCA, interpretación de cargas, evaluación y exportación del modelo para la app. |
| [`sistema_recomendacion_pca.html`](sistema_recomendacion_pca.html) | Reporte exportado en HTML, listo para leer sin ejecutar código. |
| [`Datos/books.csv`](Datos/books.csv) | Metadatos de los 10,000 libros. |

> `Datos/ratings.csv` (~72 MB, 6 millones de calificaciones) no se incluye en el repositorio. Se descarga del repositorio de goodbooks-10k (ver sección de Datos).

## Objetivo

Construir una aplicación de recomendación de libros que no requiera instalar nada. El usuario califica con estrellas (de ½ a 5) los libros que ha leído y el sistema le recomienda otros. Las recomendaciones salen de un modelo de **Análisis de Componentes Principales (PCA)** entrenado sobre las calificaciones reales de más de 50 mil lectores.

## La aplicación

- **Descubrir:** al entrar por primera vez, la app pregunta por libros conocidos, uno por uno. Si lo leíste, lo calificas con estrellas (con medias estrellas y animación al pasar el mouse); si no, eliges *no lo he leído*. Con 10 libros calificados ya se pueden ver recomendaciones.
- **Inicio:** recomendaciones personalizadas con su porcentaje de afinidad, una fila de "Porque te gustó…" y populares que el usuario todavía no ha calificado.
- **Buscar:** por título o autor, para calificar libros directamente desde los resultados.
- **Libro:** detalle del libro, botones para calificarlo, una explicación de por qué se recomienda (qué libros que te gustaron lo empujan) y libros parecidos.
- **Mis libros:** los libros calificados, ordenados por fecha o por estrellas, con un histograma de tus calificaciones.
- **¿Cómo funciona?:** explicación del modelo, con los libros en los extremos de los primeros componentes.

Las calificaciones se guardan en el `localStorage` del navegador. No hay cuentas, sesiones ni servidor.

### Arquitectura

GitHub Pages solo sirve archivos estáticos, así que el modelo se divide en dos partes:

1. **Entrenamiento (Python, una sola vez):** el notebook calcula el PCA y exporta las cargas de cada libro (`app/datos/vectores.bin`, 10,000 × 50 cuantizado a `int8`, 500 KB) y los metadatos (`app/datos/modelo.json`, 1.1 MB).
2. **Recomendación (JavaScript, en el navegador):** con cada calificación se proyecta al usuario sobre los componentes ($z = V_k r$, con $r_i$ = estrellas − 3) y se reconstruye su fila ($\hat r = V_k^\top z$). Son dos multiplicaciones de matrices que tardan milisegundos.

## Datos

- **Fuente:** Zając, Z. (2017). *goodbooks-10k: a new dataset for book recommendations*. GitHub. https://github.com/zygmuntz/goodbooks-10k
- **`ratings.csv`:** 5,976,479 calificaciones (1 a 5 estrellas) de 53,424 usuarios de Goodreads sobre 10,000 libros.
- **`books.csv`:** título, autores, año, ISBN, promedio, número de calificaciones y URL de la portada de cada libro.

## Estructura del análisis (notebook)

1. **Importar y revisar los datos:** tamaño, densidad de la matriz (1.1%), distribución de calificaciones y popularidad.
2. **Separar usuarios:** se apartan 2,000 usuarios completos para simular usuarios nuevos de la app.
3. **Matriz usuario × libro y centrado:** se compara el centrado por usuario contra el centrado en el punto neutro de la escala (restar 3).
4. **PCA con `TruncatedSVD`:** sobre la matriz dispersa, con la curva de varianza explicada.
5. **Interpretación de las cargas:** qué libros quedan en los extremos de cada componente, más una visualización de los libros en el plano de los componentes 2 y 3.
6. **Evaluación:** precisión@20 en usuarios de prueba, usando 15 calificaciones de cada uno convertidas a +1 (4–5★) o −1 (1–2★), contra un baseline de popularidad, para distintos valores de k.
7. **Ejemplos:** recomendaciones para un lector ficticio y libros parecidos por similitud coseno.
8. **Exportación del modelo:** cuantización `int8` y selección de los libros del onboarding.

## Resultados principales

| Modelo | Precisión@20 |
|---|---|
| Baseline: recomendar los más populares | 0.201 |
| PCA, centrado por usuario (k = 50) | 0.231 |
| **PCA, centrado en 3 (k = 50)** | **0.341** |

- Con solo 15 libros calificados, alrededor de 1 de cada 3 recomendaciones es un libro que el usuario efectivamente leyó y calificó con 4 o 5 estrellas: un 70% más que el baseline.
- Los componentes tienen interpretación clara. El 1 mide popularidad; el 2 separa *Harry Potter* de las lecturas escolares (*To Kill a Mockingbird*, *1984*); el 3 separa la ficción contemporánea (*The Help*, *Twilight*) de la fantasía y ciencia ficción clásicas (Tolkien, *Hitchhiker's Guide*); el 4 separa la fantasía adulta (*A Game of Thrones*) de la literatura infantil.
- La precisión deja de mejorar arriba de ~50 componentes: los componentes adicionales capturan ruido.

## Cómo ejecutar

**La app:** abre el enlace de arriba. Para correrla localmente, sirve la carpeta `app/` con cualquier servidor estático (abrir `index.html` directamente no funciona porque el navegador bloquea `fetch` de archivos locales):

```bash
cd app && python -m http.server 8000
# abrir http://localhost:8000
```

**El notebook:**

1. Descarga `ratings.csv` de [goodbooks-10k](https://github.com/zygmuntz/goodbooks-10k) y colócalo en `Datos/`.
2. Instala las dependencias: `pip install pandas numpy scipy scikit-learn matplotlib`.
3. Ejecuta `sistema_recomendacion_pca.ipynb` en orden. La última sección regenera `app/datos/`.

## Limitaciones

- El catálogo son los 10,000 libros más populares de Goodreads hasta 2017, casi todos en inglés.
- Con pocos libros calificados, o con gustos poco comunes, las recomendaciones se parecen a las populares (arranque en frío).
- Unas 3,300 portadas no están en Goodreads. Para esas se busca la portada en Open Library por ISBN y, si tampoco está, se dibuja una portada con el título.
