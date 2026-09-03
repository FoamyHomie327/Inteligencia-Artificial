# Regresión Múltiple con Datos Reales: Predicción de Ingreso Laboral en México (ENOE)

**Autor:** Arturo Vargas Espinosa

## Índice

| Archivo | Descripción |
|---|---|
| [`regresion_caso_real.ipynb`](regresion_caso_real.ipynb) | Notebook con el análisis completo: limpieza, selección de características, modelado y evaluación. |
| [`regresion_caso_real.html`](regresion_caso_real.html) | Reporte exportado en HTML, listo para leer sin ejecutar código. |
| [`limpieza_datos.ipynb`](limpieza_datos.ipynb) | Notebook auxiliar que integra las tablas crudas de la ENOE en el dataset limpio usado en el análisis. |
| [`limpieza_datos.html`](limpieza_datos.html) | Versión HTML del notebook de limpieza. |
| [`Datos/enoe_2026_1t_limpio.csv`](Datos/enoe_2026_1t_limpio.csv) | Dataset ya integrado y filtrado, usado directamente en el análisis principal. |

> Las tablas crudas de microdatos (`ENOE_SDEMT126.csv`, `ENOE_COE2T126.csv`), insumo de `limpieza_datos.ipynb`, no se incluyen en este repositorio por exceder el límite de tamaño de archivo de GitHub (~110 MB cada una). Se descargan directamente del INEGI en el enlace de la sección de Datos.

## Objetivo

Construir modelos de regresión para predecir el **ingreso mensual** (`ingocup`) de personas ocupadas en México, a partir de información sociodemográfica y laboral, usando los microdatos de la Encuesta Nacional de Ocupación y Empleo (ENOE) del primer trimestre de 2026. A diferencia de un dataset ya preparado, esta base presenta los retos típicos de una encuesta real: códigos numéricos de no respuesta que se leen como valores válidos, variables que solo aplican a un subconjunto de la muestra, y variables que miden esencialmente lo mismo bajo otro nombre (colinealidad). El objetivo no es solo lograr un modelo que prediga bien, sino documentar y justificar cada decisión tomada durante la limpieza, el análisis de relaciones entre variables y la selección de características.

## Datos

- **Fuente:** INEGI (2026). *Encuesta Nacional de Ocupación y Empleo (ENOE), primer trimestre de 2026*. Microdatos. Instituto Nacional de Estadística y Geografía. https://www.inegi.org.mx/programas/enoe/15ymas/
- **`ENOE_SDEMT126.csv`** (módulo sociodemográfico) y **`ENOE_COE2T126.csv`** (ocupación y empleo, segunda parte) son las tablas crudas descargadas del INEGI. `limpieza_datos.ipynb` las une mediante la llave primaria de ocho campos documentada por el INEGI, aplica los filtros oficiales de calidad (entrevista completa, residentes habituales, población de 12 años y más) y conserva únicamente a quienes reportan ingreso por ocupación.
- **`enoe_2026_1t_limpio.csv`**: resultado de ese proceso — **126,226 observaciones** y 29 variables, documentadas a detalle en la sección de exploración del notebook principal. Es el archivo que usa `regresion_caso_real.ipynb`.

## Estructura del análisis

1. **Introducción, planteamiento y metodología** — contexto del problema, y cómo se combinan regresión lineal múltiple, limpieza de datos reales, selección de características, inferencia estadística y un modelo no lineal (random forest) de comparación.
2. **Exploración y comprensión del dataset** — diccionario de datos y primeras observaciones.
3. **Preparación y limpieza** — tratamiento de variables cualitativas mal tipadas, códigos de no respuesta, outliers (método de Tukey) y valores estructuralmente ausentes.
4. **Colinealidad** — matriz de correlación de Pearson (solo sobre el subconjunto de entrenamiento) para detectar y eliminar variables redundantes (por ejemplo, `imssissste` y `p6d`, que resultaron ser la misma información).
5. **Codificación de variables cualitativas** — variables dummy, con categorías de referencia documentadas.
6. **Selección de características** — selección hacia adelante rápida por bloques de variable, seguida de eliminación hacia atrás.
7. **Construcción y comparación de modelos** — regresión lineal múltiple (`statsmodels.OLS`) contra un bosque aleatorio (*random forest*).
8. **Evaluación del desempeño** — RSS, RMSE, RSE, R² y MAE en entrenamiento y prueba.
9. **Análisis de inferencia** — modelo OLS con errores robustos HC3 sobre `log(ingocup)`, para interpretar cada coeficiente como un efecto porcentual con su intervalo de confianza.
10. **Reflexión y conclusiones** — hallazgos principales, limitaciones y líneas de trabajo futuro.

## Resultados principales

| Modelo | R² test | RMSE test | MAE test |
|---|---|---|---|
| Regresión lineal | 0.266 | $7,819 | $4,401 |
| Bosque aleatorio | 0.323 | $7,509 | $4,078 |

El bosque aleatorio predice mejor (captura relaciones no lineales, como la de la edad, que el modelo lineal no puede), pero el modelo lineal en escala logarítmica es el que se usa para inferencia, porque permite cuantificar el efecto de cada variable con un margen de error. El hallazgo principal: controlando por escolaridad, horas trabajadas, formalidad, sector y posición en la ocupación, **ser mujer se asocia con un ingreso 19.24% menor** (intervalo de confianza 95%: -18.54% a -19.91%), una brecha que no se explica por las características observables incluidas en el modelo.

## Cómo ejecutar los notebooks

1. Clona el repositorio; los archivos `.csv` deben quedar en `Datos/`, relativo a cada notebook.
2. Instala las dependencias necesarias:

   ```bash
   pip install pandas numpy matplotlib seaborn scipy statsmodels scikit-learn
   ```

3. (Opcional) Ejecuta primero `limpieza_datos.ipynb` para regenerar `Datos/enoe_2026_1t_limpio.csv` a partir de las tablas crudas.
4. Abre `regresion_caso_real.ipynb` en Jupyter Notebook, JupyterLab, VS Code o Google Colab, y ejecuta las celdas en orden.

## Limitaciones

- El modelo final explica el 42.8% de la variabilidad del log-ingreso; más de la mitad de las diferencias de ingreso entre personas se debe a factores fuera de este dataset (ocupación específica, calidad de la escuela, antigüedad, habilidades no observables, negociación individual).
- La ENOE es una encuesta transversal de un solo trimestre: los resultados son asociaciones dentro de esa fotografía, no relaciones necesariamente causales ni estables en el tiempo.
- El ingreso es autorreportado, lo cual introduce un margen de error de medición que no se puede corregir con las herramientas usadas en este análisis.

## Referencias

- INEGI (2026). *Encuesta Nacional de Ocupación y Empleo (ENOE), primer trimestre de 2026*. Microdatos. https://www.inegi.org.mx/programas/enoe/15ymas/
- INEGI. *Encuesta Nacional de Ocupación y Empleo. Diccionario de datos, SDEMT225*. https://www.inegi.org.mx/rnm/index.php/catalog/1121/data-dictionary/F42?file_name=SDEMT225
- Breiman, L. (2001). Random Forests. *Machine Learning*, 45(1), 5-32.
- Pedregosa, F. et al. (2011). Scikit-learn: Machine Learning in Python. *Journal of Machine Learning Research*, 12, 2825-2830.
