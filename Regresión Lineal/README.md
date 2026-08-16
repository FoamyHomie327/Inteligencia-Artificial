# A1.2 – Regresión Lineal: Felicidad y GDP

Proyecto de la actividad **A1.2** para el curso **SC3314 – Inteligencia Artificial** (Universidad de Monterrey, Dr. Antonio Martínez Torteya).

**Autor:** Arturo Vargas Espinosa (611377)

## Objetivo

Estudiar la relación entre el nivel de felicidad de un país y distintas variables económicas, sociales y de salud, usando dos enfoques:

1. **Regresión lineal simple** — una sola variable explicativa.
2. **Regresión lineal múltiple** — varias variables explicativas al mismo tiempo.

La meta es evaluar si agregar más variables mejora de forma significativa la capacidad del modelo para explicar la felicidad de un país, más allá de lo que explica el GDP por sí solo.

## Contenido del repositorio

| Archivo | Descripción |
|---|---|
| `A1_2_611377.ipynb` | Notebook con todo el análisis: exploración de datos, regresión simple, regresión múltiple, y conclusiones. Incluye código, gráficas y explicación en celdas de markdown. |
| `A1_2_611377.pdf` | Versión exportada del notebook en PDF, para lectura sin necesidad de ejecutar código. |
| `A1.2 Felicidad y GDP.csv` | Dataset original de la actividad: nivel de felicidad (2022) y GDP (2020) para 141 países. |
| `world_happiness_2024.csv` | Dataset complementario del *World Happiness Report*, usado para obtener las variables explicativas de los modelos (Freedom to make life choices, Healthy life expectancy, Generosity, Perceptions of corruption). |

## Estructura del análisis

1. **Introducción y Metodología** — contexto del problema y descripción de las variables disponibles.
2. **Exploración de los datos** — revisión inicial del dataset original; la relación entre Felicidad y GDP no muestra un patrón lineal claro a simple vista.
3. **Regresión lineal simple** — se utiliza **Freedom to make life choices** como variable explicativa, calculando los coeficientes, el error estándar, el estadístico t, el p-value, el RSE y la R² paso a paso (sin librerías de regresión, siguiendo las ecuaciones vistas en clase).
4. **Extensión del conjunto de datos** — se agregan tres variables adicionales: **Healthy life expectancy**, **Generosity** y **Perceptions of corruption**.
5. **Regresión lineal múltiple** — se ajusta el modelo con las 4 variables usando `statsmodels.OLS`, y se interpreta cada coeficiente y su significancia.
6. **Conclusión** — comparación entre ambos modelos, limitaciones del análisis y posibles líneas de trabajo futuro.

## Resultados principales

| Métrica | Modelo simple (Freedom) | Modelo múltiple (4 variables) |
|---|---|---|
| R² | 0.415 | 0.720 |
| R² ajustada | — | 0.711 |
| RSE | 0.906 | — |
| F-statistic | — | 86.61 (p ≈ 0) |

El modelo múltiple explica una proporción considerablemente mayor de la variabilidad en el nivel de felicidad entre países. De las variables agregadas, **Healthy life expectancy** resultó ser el predictor más fuerte y significativo, mientras que **Generosity** no mostró una asociación estadísticamente significativa.

## Cómo ejecutar el notebook

1. Clona el repositorio y asegúrate de que ambos archivos `.csv` estén en la misma carpeta que el notebook (o ajusta las rutas de `read_csv` según corresponda).
2. Instala las dependencias necesarias:

   ```bash
   pip install pandas numpy matplotlib scipy statsmodels
   ```

3. Abre `A1_2_611377.ipynb` en Jupyter Notebook, JupyterLab, VS Code o Google Colab, y ejecuta las celdas en orden.

## Fuentes de datos

- Espinoza, Y. (2026). *World Happiness 2015-2024 Dataset*. Kaggle. https://www.kaggle.com/datasets/yadiraespinoza/world-happiness-2015-2024?select=world_happiness_2024.csv
- Helliwell, J. F. et al. (2026). *International evidence on happiness and social media*. World Happiness Report. https://www.worldhappiness.report/ed/2026/international-evidence-on-happiness-and-social-media/

## Limitaciones

- Las variables adicionales provienen del mismo dataset que conforma el índice oficial del WHR, por lo que no son estrictamente externas a la construcción de la felicidad reportada.
- El análisis es correlacional y transversal (un solo corte en el tiempo); no permite establecer causalidad.
- La muestra se limita a los países con datos disponibles en el WHR, lo que puede sesgar los resultados hacia naciones con mayor capacidad estadística institucional.