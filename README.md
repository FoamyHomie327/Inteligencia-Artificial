# Portafolio de Proyectos: Inteligencia Artificial y Ciencia de Datos

Colección de proyectos de modelado estadístico y machine learning, con énfasis en regresión lineal, limpieza de datos reales, selección de características e inferencia estadística. Cada proyecto incluye su análisis en Jupyter Notebook, un reporte en HTML, y los datos utilizados (o el enlace a su fuente original).

**Autor:** Arturo Vargas Espinosa ([arturovargasesp@gmail.com](mailto:arturovargasesp@gmail.com))

## Proyectos

| Proyecto | Descripción | Técnicas |
|---|---|---|
| [Regresión Múltiple con Datos Reales: Predicción de Ingreso Laboral en México (ENOE)](regresion-caso-real-enoe/README.md) | Proyecto integral: predicción del ingreso mensual a partir de microdatos oficiales de la ENOE (INEGI), con limpieza de una encuesta real de más de 120,000 observaciones, selección de características e inferencia estadística. | Regresión lineal múltiple, random forest, selección de características, inferencia (OLS robusto), limpieza de datos reales |
| [Regresión Lineal Múltiple y Selección de Características: Predicción de Calificaciones Escolares](regresion-lineal-multiple/README.md) | Predicción de la calificación final de estudiantes de secundaria a partir de datos demográficos y académicos, con selección de características hacia adelante y hacia atrás. | Regresión lineal múltiple, selección de subconjuntos, análisis de colinealidad |
| [Regresión Lineal: Felicidad y PIB per cápita](regresion-lineal-simple/README.md) | Modelos de regresión simple y múltiple para explicar el nivel de felicidad reportado por país en función de indicadores económicos y sociales. | Regresión lineal simple, regresión lineal múltiple |

## Estructura del repositorio

Cada carpeta de proyecto es autocontenida e incluye:

- Un `README.md` propio con el objetivo, la fuente y características de los datos, la estructura del análisis y los resultados principales.
- El notebook (`.ipynb`) con el análisis completo.
- Un reporte exportado en `.html`, para revisar el análisis sin necesidad de ejecutar código.
- Los datos utilizados, en una subcarpeta `Datos/` (o el enlace a la fuente original cuando el archivo es muy grande para incluirse directamente).

## Herramientas

Python (pandas, numpy, matplotlib, seaborn), statsmodels, scikit-learn.
