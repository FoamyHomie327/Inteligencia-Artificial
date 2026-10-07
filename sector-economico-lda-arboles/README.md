# Predicción del Sector Económico: LDA vs. Árboles de Decisión (ENOE)

**Autor:** Arturo Vargas Espinosa

## Índice

| Archivo | Descripción |
|---|---|
| [`lda_arboles_sector.ipynb`](lda_arboles_sector.ipynb) | Notebook con el análisis completo: revisión de supuestos, LDA, árbol de decisión con poda y comparación de modelos. |
| [`lda_arboles_sector.html`](lda_arboles_sector.html) | Reporte exportado en HTML, listo para leer sin ejecutar código. |
| [`Datos/enoe_2026_1t_limpio.csv`](Datos/enoe_2026_1t_limpio.csv) | Microdatos de la ENOE ya integrados y filtrados, usados directamente en el análisis. |

## Objetivo

Predecir en qué **sector de actividad económica** trabaja una persona ocupada en México (primario, secundario o terciario) a partir de su edad, escolaridad, ingreso, horas trabajadas, sexo y tipo de localidad. Para ello se comparan dos metodologías de clasificación que construyen la frontera de decisión de forma muy distinta:

- **Linear Discriminant Analysis (LDA):** modelo probabilístico basado en el teorema de Bayes, que supone normalidad y una matriz de covarianza común a todas las clases. Con 3 clases genera 2 funciones discriminantes, que permiten visualizar la separación en un plano.
- **Árbol de decisión:** divide el espacio de las variables con reglas binarias, sin supuestos de distribución. Se poda con *cost-complexity pruning* para controlar el sobreajuste.

## Datos

- **Fuente:** INEGI (2026). *Encuesta Nacional de Ocupación y Empleo (ENOE), primer trimestre de 2026*. Microdatos. Instituto Nacional de Estadística y Geografía. https://www.inegi.org.mx/programas/enoe/15ymas/
- **`enoe_2026_1t_limpio.csv`:** 126,226 observaciones y 30 columnas (una fila por persona ocupada con ingreso reportado). Es el resultado de integrar y filtrar las tablas crudas de la ENOE en el proyecto de [regresión del ingreso laboral](../regresion-caso-real-enoe/README.md).
- **Variable de respuesta:** `rama_est1`, el sector de actividad del trabajo principal: 1 = primario (agricultura, ganadería, pesca), 2 = secundario (industria, construcción, minería), 3 = terciario (comercio y servicios). Se descarta el código 4 (no especificado).
- **Clases desbalanceadas:** terciario 65.6%, secundario 26.9% y primario 7.5%.
- **Variables explicativas:** `eda` (edad), `anios_esc` (años de escolaridad), `hrsocup` (horas trabajadas por semana), `ingocup` (ingreso mensual; en LDA se usa su logaritmo), `sex` (sexo) y `ur` (localidad urbana o rural).

## Estructura del análisis

1. **Definición del problema y balance de clases.**
2. **Limpieza:** mismos criterios que en el proyecto de [clasificación de prestaciones laborales](../clasificacion-prestaciones-enoe/README.md). Quedan 120,430 observaciones.
3. **Partición estratificada 80/20,** validada con una prueba ji-cuadrada.
4. **LDA:**
   - Revisión de los supuestos de normalidad y homocedasticidad.
   - Proyección sobre las funciones discriminantes LD1 y LD2 e interpretación de sus coeficientes.
   - Efecto de las probabilidades a priori: las del dataset contra priors uniformes.
5. **Árbol de decisión:**
   - Árbol sin podar como referencia.
   - Selección del parámetro de poda α con validación cruzada (F1 macro).
   - Árbol podado y su visualización.
   - Importancia de variables.
6. **Comparación de ambos modelos,** y cómo los supuestos de cada método explican la diferencia de desempeño.

## Resultados principales

| Modelo | Exactitud | F1-score macro |
|---|---|---|
| LDA con priors del dataset | 0.653 | 0.335 |
| LDA con priors uniformes | 0.493 | 0.434 |
| Árbol sin podar (37,424 hojas) | 0.619 | 0.513 |
| **Árbol podado (39 hojas)** | 0.593 | **0.542** |

- Con los priors del dataset, LDA casi siempre predice "terciario": su exactitud es alta, pero detecta solo ~7% del sector primario. Con priors uniformes la exactitud baja, pero las tres clases se detectan de forma mucho más pareja.
- La poda reduce el árbol de 37,424 a 39 hojas (y de 41 a 9 niveles) y **mejora** el F1 macro en prueba, porque el árbol completo estaba sobreajustado.
- El árbol supera a LDA en las cuatro métricas. La razón principal es que la variable más informativa, **vivir en una localidad rural o urbana**, es binaria y LDA no puede usarla por sus supuestos.
- La confusión más grande en ambos modelos está entre los sectores secundario y terciario, que tienen perfiles muy parecidos de escolaridad e ingreso.

## Cómo ejecutar el notebook

1. Clona el repositorio; el archivo `.csv` debe quedar en `Datos/`, relativo al notebook.
2. Instala las dependencias necesarias:

   ```bash
   pip install pandas numpy matplotlib seaborn scipy scikit-learn
   ```

3. Abre `lda_arboles_sector.ipynb` en Jupyter Notebook, JupyterLab, VS Code o Google Colab, y ejecuta las celdas en orden.

## Limitaciones

- Con solo 6 variables sociodemográficas, los sectores secundario y terciario se traslapan mucho; ningún modelo los separa bien.
- Los supuestos de LDA se cumplen solo de forma aproximada (la dispersión de la edad y de las horas trabajadas cambia entre clases).
- La búsqueda del parámetro de poda se hizo sobre una submuestra estratificada de 25,000 observaciones por costo computacional; el árbol final sí usa todo el conjunto de entrenamiento.
