# Regresión Lineal Múltiple y Selección de Características: Predicción de Calificaciones Escolares

**Autor:** Arturo Vargas Espinosa

## Índice

| Archivo | Descripción |
|---|---|
| [`regresion_lineal_multiple.ipynb`](regresion_lineal_multiple.ipynb) | Notebook con el análisis completo (código, gráficas y explicación). |
| [`regresion_lineal_multiple.html`](regresion_lineal_multiple.html) | Reporte exportado en HTML, listo para leer sin ejecutar código. |
| [`Datos/calificaciones_estudiantes.csv`](Datos/calificaciones_estudiantes.csv) | Subconjunto de 10 variables usado en el análisis. |

## Objetivo

Construir un modelo de regresión lineal múltiple para predecir la calificación final (`G3`) de un grupo de estudiantes de secundaria, a partir de información demográfica, de hábitos de estudio y de calificaciones parciales. El énfasis del proyecto no está solo en el desempeño del modelo, sino en documentar y justificar cada decisión tomada durante la limpieza de datos, el análisis de colinealidad y la selección de características, de forma que el proceso completo sea reproducible.

## Datos

- **`calificaciones_estudiantes.csv`**: 395 observaciones y 10 variables (escuela, sexo, edad, horas de estudio semanales, materias reprobadas, acceso a internet, faltas, y las tres calificaciones `G1`, `G2` y `G3` en escala 0-20).
- Es un subconjunto de 10 variables del *Student Performance Data Set*, que originalmente contiene 33 variables recolectadas de estudiantes de matemáticas de dos escuelas secundarias portuguesas. Fuente: Cortez, P. & Silva, A. (2008). *Using Data Mining to Predict Secondary School Student Performance*. UCI Machine Learning Repository. https://archive.ics.uci.edu/dataset/320/student+performance

## Estructura del análisis

1. **Introducción y metodología** — planteamiento del problema, tipos de variable, y cómo se combinan regresión múltiple, limpieza de datos reales y selección de características.
2. **Exploración de los datos** — revisión de rangos, tipos de variable y estadística descriptiva.
3. **Preparación y limpieza** — verificación de nulos, codificación *dummy* de variables cualitativas (escuela, sexo, internet), y depuración de outliers con el método de Tukey.
4. **Análisis de relaciones entre variables** — división train/test (80/20) y matriz de correlación de Pearson, calculada únicamente sobre el subconjunto de entrenamiento para evitar fuga de datos.
5. **Selección de características** — selección hacia adelante rápida (ranking por correlación con `G3`) seguida de eliminación hacia atrás sobre el resultado, comparando siempre con R² ajustada.
6. **Entrenamiento y evaluación del modelo** — ajuste final con `statsmodels.OLS`, comparación de desempeño en entrenamiento y prueba, y gráfica de valores predichos contra reales.
7. **Reflexión y conclusiones** — interpretación de los resultados y limitaciones del análisis.

## Resultados principales

| Métrica | Modelo completo (9 variables) | Modelo final (6 variables) |
|---|---|---|
| R² ajustada (train) | 0.831 | 0.832 |
| R² (test) | — | 0.802 |
| RSE (train) | — | 1.879 |
| RSE (test) | — | 2.088 |

El modelo final conserva `G2`, `G1`, `Reprobadas`, `HorasDeEstudio`, `Edad` y `Faltas`. `G2` domina el modelo (cada punto adicional en la calificación del segundo periodo se asocia con +0.97 puntos en la calificación final, controlando por el resto de las variables). La diferencia moderada entre el desempeño en entrenamiento y en prueba respalda que la selección de características, hecha únicamente con el subconjunto de entrenamiento, no incurrió en fuga de datos.

## Cómo ejecutar el notebook

1. Clona el repositorio; el archivo `.csv` debe quedar en `Datos/`, relativo al notebook.
2. Instala las dependencias necesarias:

   ```bash
   pip install pandas numpy matplotlib seaborn scipy statsmodels scikit-learn
   ```

3. Abre `regresion_lineal_multiple.ipynb` en Jupyter Notebook, JupyterLab, VS Code o Google Colab, y ejecuta las celdas en orden.

## Limitaciones

- El modelo depende fuertemente de `G1` y `G2`; predecir `G3` sin las calificaciones parciales sería mucho más difícil, pero también más útil en la práctica (por ejemplo, para identificar a un estudiante en riesgo antes de que existan calificaciones parciales bajas).
- Al ser un modelo lineal, no captura bien el comportamiento de "todo o nada" de los estudiantes que abandonan la materia, que son precisamente los casos con mayor error de predicción.
- Este reporte usa solo 10 de las 33 variables originales del dataset.
