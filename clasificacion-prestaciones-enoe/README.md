# Clasificación de Prestaciones Laborales con Regresión Logística (ENOE)

**Autor:** Arturo Vargas Espinosa

## Índice

| Archivo | Descripción |
|---|---|
| [`regresion_logistica_prestaciones.ipynb`](regresion_logistica_prestaciones.ipynb) | Notebook con el análisis completo: definición del problema, limpieza, validación cruzada, evaluación, umbrales e inferencia. |
| [`regresion_logistica_prestaciones.html`](regresion_logistica_prestaciones.html) | Reporte exportado en HTML, listo para leer sin ejecutar código. |
| [`Datos/enoe_2026_1t_limpio.csv`](Datos/enoe_2026_1t_limpio.csv) | Microdatos de la ENOE ya integrados y filtrados, usados directamente en el análisis. |

## Objetivo

Construir y evaluar un modelo de clasificación que prediga si una persona ocupada en México cuenta con **prestaciones laborales** (aguinaldo, vacaciones pagadas, reparto de utilidades, etc.) a partir de sus características sociodemográficas y de su empleo. Las prestaciones son uno de los indicadores más usados para medir la **formalidad del empleo**, así que el modelo también sirve para entender qué factores se asocian con trabajar en la formalidad.

El análisis combina tres bloques:

1. **Clasificación** con regresión logística (`scikit-learn`), con pesos balanceados por clase.
2. **Evaluación** con validación cruzada estratificada, matriz de confusión, curva ROC y análisis de umbrales de decisión.
3. **Inferencia** sobre los coeficientes con `statsmodels`: significancia, odds ratios e intervalos de confianza.

## Datos

- **Fuente:** INEGI (2026). *Encuesta Nacional de Ocupación y Empleo (ENOE), primer trimestre de 2026*. Microdatos. Instituto Nacional de Estadística y Geografía. https://www.inegi.org.mx/programas/enoe/15ymas/
- **`enoe_2026_1t_limpio.csv`:** 126,226 observaciones y 30 columnas (una fila por persona ocupada con ingreso reportado). Es el resultado de integrar y filtrar las tablas crudas de la ENOE en el proyecto de [regresión del ingreso laboral](../regresion-caso-real-enoe/README.md), donde se documenta ese proceso.
- **Variable de respuesta:** `TienePrestaciones`, derivada de `pre_asa`. Solo se define para personas subordinadas y remuneradas (`pos_ocu` = 1) con respuesta válida: 1 = con prestaciones, 0 = sin prestaciones.
- **Variables explicativas:** sexo, edad, estado civil, años de escolaridad, horas trabajadas, ingreso mensual, tipo de localidad (urbana/rural), zona, sector de actividad, tipo de unidad económica y tipo de empleador. Las categóricas se codifican con variables *dummy*, y en total quedan 23 variables explicativas.

## Estructura del análisis

1. **Definición del problema:** por qué `pre_asa` no se puede usar tal cual (mezcla "no aplica" y "no especificado" con las dos clases de interés) y cómo se acota la población de estudio.
2. **Preparación y limpieza:** eliminación de identificadores, códigos de "no especificado", jornadas inconsistentes y variables que son casi una copia de la respuesta (fuga de datos) o redundantes entre sí. Quedan 89,100 observaciones.
3. **Partición estratificada 80/20,** validada con una prueba ji-cuadrada.
4. **Validación cruzada de 7 folds** sobre el conjunto de entrenamiento.
5. **Evaluación en prueba:** matriz de confusión, métricas, análisis de umbrales (0.3 a 0.7) y curva ROC.
6. **Interpretación:** odds ratios del modelo predictivo y significancia estadística con un modelo logit sin ponderar, comparando ambos modelos.

## Resultados principales

| Métrica | Validación cruzada (umbral 0.5) | Prueba (umbral 0.6) |
|---|---|---|
| Exactitud | 0.816 | 0.793 |
| Precisión | 0.913 | 0.933 |
| Sensibilidad | 0.813 | 0.757 |
| F1-score | 0.860 | 0.836 |
| AUC | 0.891 | 0.891 |

- El modelo tiene **buena capacidad discriminativa** (AUC de 0.89) y es estable entre folds (desviación estándar menor a 0.002).
- Se eligió un umbral de **0.6** para priorizar identificar correctamente a las personas **sin** prestaciones, a cambio de una sensibilidad menor en la clase con prestaciones.
- Lo que más pesa no son las características de la persona, sino **dónde trabaja**. Trabajar en un establecimiento grande multiplica los momios de tener prestaciones por ~7.5, y trabajar en un micronegocio sin establecimiento fijo los reduce en ~85%. En cambio, cada año de escolaridad los sube apenas ~4%.
- El pseudo-R² de McFadden es 0.384 y 18 de las 23 variables son significativas al 5%. Los coeficientes del modelo balanceado y del modelo sin ponderar coinciden en signo en las 23 variables.

## Cómo ejecutar el notebook

1. Clona el repositorio; el archivo `.csv` debe quedar en `Datos/`, relativo al notebook.
2. Instala las dependencias necesarias:

   ```bash
   pip install pandas numpy matplotlib seaborn scipy statsmodels scikit-learn
   ```

3. Abre `regresion_logistica_prestaciones.ipynb` en Jupyter Notebook, JupyterLab, VS Code o Google Colab, y ejecuta las celdas en orden.

## Limitaciones

- La ENOE es una encuesta transversal de un solo trimestre: los coeficientes describen asociaciones, no efectos causales. Por ejemplo, el coeficiente positivo de ser mujer refleja en qué sectores se concentran las mujeres ocupadas, no un efecto directo del sexo.
- El modelo solo aplica a personas subordinadas y remuneradas; no dice nada sobre empleadores ni trabajadores por cuenta propia.
- Se descartaron variables muy predictivas (seguridad social, tipo de empleo formal) porque miden prácticamente lo mismo que la respuesta. El modelo resultante es menos preciso, pero más útil para entender el fenómeno.
