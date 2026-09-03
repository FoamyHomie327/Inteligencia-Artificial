# Regresión Lineal: Felicidad y PIB per cápita

**Autor:** Arturo Vargas Espinosa

## Índice

| Archivo | Descripción |
|---|---|
| [`regresion_lineal.ipynb`](regresion_lineal.ipynb) | Notebook con el análisis completo (código, gráficas y explicación). |
| [`regresion_lineal.html`](regresion_lineal.html) | Reporte exportado en HTML, listo para leer sin ejecutar código. |
| [`Datos/felicidad_gdp_2022.csv`](Datos/felicidad_gdp_2022.csv) | Dataset base: nivel de felicidad (2022) y PIB (2020) para 141 países. |
| [`Datos/world_happiness_2024.csv`](Datos/world_happiness_2024.csv) | Dataset complementario del *World Happiness Report*, usado para obtener variables explicativas adicionales. |

## Objetivo

Estudiar la relación entre el nivel de felicidad de un país y distintas variables económicas, sociales y de salud, usando dos enfoques:

1. **Regresión lineal simple** — una sola variable explicativa.
2. **Regresión lineal múltiple** — varias variables explicativas al mismo tiempo.

La meta es evaluar si agregar más variables mejora de forma significativa la capacidad del modelo para explicar la felicidad de un país, más allá de lo que explica el PIB por sí solo.

## Datos

- **`felicidad_gdp_2022.csv`**: nivel de felicidad (2022) y PIB per cápita (2020) para 141 países. Fuente: Espinoza, Y. (2026). *World Happiness 2015-2024 Dataset*. Kaggle. https://www.kaggle.com/datasets/yadiraespinoza/world-happiness-2015-2024?select=world_happiness_2024.csv
- **`world_happiness_2024.csv`**: dataset complementario del *World Happiness Report*, del cual se toman las variables explicativas adicionales de los modelos (Freedom to make life choices, Healthy life expectancy, Generosity, Perceptions of corruption). Fuente: Helliwell, J. F. et al. (2026). *International evidence on happiness and social media*. World Happiness Report. https://www.worldhappiness.report/ed/2026/international-evidence-on-happiness-and-social-media/

## Estructura del análisis

1. **Introducción y metodología** — contexto del problema y descripción de las variables disponibles.
2. **Exploración de los datos** — revisión inicial del dataset base; la relación entre Felicidad y PIB no muestra un patrón lineal claro a simple vista.
3. **Regresión lineal simple** — se utiliza **Freedom to make life choices** como variable explicativa, calculando los coeficientes, el error estándar, el estadístico t, el p-value, el RSE y la R² paso a paso (sin librerías de regresión, aplicando directamente las ecuaciones de mínimos cuadrados).
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

1. Clona el repositorio; los archivos `.csv` deben quedar en `Datos/`, relativo al notebook.
2. Instala las dependencias necesarias:

   ```bash
   pip install pandas numpy matplotlib scipy statsmodels
   ```

3. Abre `regresion_lineal.ipynb` en Jupyter Notebook, JupyterLab, VS Code o Google Colab, y ejecuta las celdas en orden.

## Limitaciones

- Las variables adicionales provienen del mismo dataset que conforma el índice oficial del WHR, por lo que no son estrictamente externas a la construcción de la felicidad reportada.
- El análisis es correlacional y transversal (un solo corte en el tiempo); no permite establecer causalidad.
- La muestra se limita a los países con datos disponibles en el WHR, lo que puede sesgar los resultados hacia naciones con mayor capacidad estadística institucional.
