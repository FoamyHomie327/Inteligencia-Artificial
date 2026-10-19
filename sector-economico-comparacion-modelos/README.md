# Predicción del Sector Económico: Comparación de Modelos de Clasificación (ENOE)

**Autor:** Arturo Vargas Espinosa

**Tablero interactivo:** https://foamyhomie327.github.io/Inteligencia-Artificial/sector-economico-comparacion-modelos/app/

## Índice

| Archivo | Descripción |
|---|---|
| [`app/`](app/) | Tablero interactivo (HTML, CSS y JavaScript), publicado con GitHub Pages. |
| [`comparacion_modelos_sector.ipynb`](comparacion_modelos_sector.ipynb) | Notebook con el análisis completo: exploración, preparación, construcción de los 7 modelos, comparación con validación cruzada, selección del modelo final y evaluación en prueba. |
| [`comparacion_modelos_sector.html`](comparacion_modelos_sector.html) | Reporte exportado en HTML, listo para leer sin ejecutar código. |
| [`Datos/enoe_2026_1t_limpio.csv`](Datos/enoe_2026_1t_limpio.csv) | Microdatos de la ENOE ya integrados y filtrados, usados directamente en el análisis. |

## Objetivo

Predecir el **sector de actividad económica** (primario, secundario o terciario) de una persona ocupada en México a partir de su perfil sociodemográfico, y elegir el mejor modelo de clasificación considerando no solo sus métricas, sino también su estabilidad, su interpretabilidad y su costo. Es el proyecto final de la unidad de clasificación y junta lo que se hizo en los proyectos de [LDA vs. árboles de decisión](../sector-economico-lda-arboles/README.md) y [ensambles, SVM y redes neuronales](../sector-economico-ensambles-svm-redes/README.md), pero con un protocolo más estricto:

1. El conjunto de prueba (20%) se aparta desde el inicio y no se usa para ninguna decisión.
2. Los hiperparámetros se eligen solo con el entrenamiento (error *out-of-bag*, validación cruzada o una fracción de validación).
3. Los 7 modelos se comparan con **los mismos 5 folds** de validación cruzada estratificada sobre el entrenamiento completo, guardando métricas por fold, F1 en entrenamiento (sobreajuste), tiempo y predicciones fuera de fold.
4. Se elige un solo modelo final, se reentrena con todo el entrenamiento y se evalúa **una sola vez** en prueba.

Modelos comparados: regresión logística multinomial, LDA, árbol de decisión podado, Random Forest, Gradient Boosting, SVM (kernel RBF) y una red neuronal *feedforward* (Keras), más un modelo de referencia que siempre predice "terciario".

## Datos

- **Fuente:** INEGI (2026). *Encuesta Nacional de Ocupación y Empleo (ENOE), primer trimestre de 2026*. Microdatos. Instituto Nacional de Estadística y Geografía. https://www.inegi.org.mx/programas/enoe/15ymas/
- **`enoe_2026_1t_limpio.csv`:** 126,226 observaciones y 30 columnas (una fila por persona ocupada con ingreso reportado). Es el resultado de integrar y filtrar las tablas crudas de la ENOE en el proyecto de [regresión del ingreso laboral](../regresion-caso-real-enoe/README.md).
- **Variable de respuesta:** `rama_est1`, el sector de actividad (1 = primario, 2 = secundario, 3 = terciario). Tras la limpieza quedan 120,430 observaciones: 65.6% terciario, 26.9% secundario y 7.5% primario.
- **Variables explicativas:** edad, años de escolaridad, horas trabajadas por semana, ingreso mensual (en logaritmo y estandarizado para los modelos sensibles a la escala), sexo y tipo de localidad (urbana o rural). `ambito2` y `tue1` se excluyen por fuga de datos.

## Estructura del análisis

1. **Planteamiento y metodología:** relevancia social del problema, protocolo experimental y teoría de los 7 modelos.
2. **Exploración:** diccionario de datos, balance de clases, códigos de no respuesta y detección de fuga de datos.
3. **Preparación:** limpieza, selección de variables, partición estratificada 80/20 y relación de cada variable con el sector (solo entrenamiento).
4. **Construcción de modelos:** selección de hiperparámetros de cada modelo (poda por validación cruzada, `min_samples_leaf` por OOB, *early stopping*, kernel y C de la SVM, arquitectura de la red) y validación cruzada de 5 folds.
5. **Comparación:** métricas promedio, sensibilidad y precisión por clase, estabilidad fold por fold, sobreajuste, costo computacional, y ventajas y limitaciones de cada modelo.
6. **Modelo final:** Gradient Boosting, evaluado una sola vez en prueba, con intervalo de confianza por *bootstrap*, matriz de confusión, importancia por impureza y por permutación, y ejemplos de perfiles.
7. **Conclusiones:** aprendizajes sobre el problema, limitaciones y trabajo futuro.

## Resultados principales

| Modelo | F1 macro (CV) | Desv. est. | Exactitud (CV) | Brecha entren.–valid. |
|---|---|---|---|---|
| Siempre "terciario" | 0.264 | 0.000 | 0.656 | 0.000 |
| Regresión logística | 0.490 | 0.003 | 0.555 | 0.000 |
| LDA (priors uniformes) | 0.436 | 0.005 | 0.495 | 0.000 |
| Árbol de decisión podado | 0.541 | 0.009 | 0.596 | 0.002 |
| Random Forest | 0.575 | 0.002 | 0.658 | 0.358 |
| **Gradient Boosting** | **0.580** | 0.004 | 0.647 | 0.010 |
| SVM (kernel RBF) | 0.525 | 0.005 | 0.588 | 0.019 |
| Red neuronal | 0.543 | 0.012 | 0.606 | 0.004 |

**Modelo final en prueba (24,086 personas):** F1 macro de **0.573** (IC 95%: 0.566 a 0.581) y exactitud de 64.1%. Identifica al 80% de las personas del sector primario, al 55% del secundario y al 66% del terciario.

- El salto más grande se da al pasar de modelos **lineales** a **árboles**, y juntar muchos árboles (Random Forest y Boosting) da otra mejora real.
- **Más complejidad no siempre es mejor:** la SVM queda abajo del árbol podado y la red neuronal queda prácticamente empatada con él.
- El Gradient Boosting le gana al Random Forest en 4 de los 5 folds; su ventaja en F1 es marginal, pero es mucho más equilibrado entre sectores (detecta al 81% del primario contra 56% del Random Forest).
- Las variables más importantes para el modelo final son el **tipo de localidad**, el **sexo**, las **horas trabajadas** y el **ingreso**. La edad casi no aporta.
- Ningún modelo pasa de 0.60 de F1 macro: con estas 6 variables, la industria y los servicios tienen perfiles demasiado parecidos.

## Tablero interactivo

Componente adicional para comunicar los resultados a un público no técnico. No cambia la metodología ni el modelo; solo presenta los resultados del notebook:

- **Los datos:** balance de clases, perfil de cada sector, distribución de cada variable por sector y composición por sexo y tipo de localidad.
- **Los modelos:** comparación de los 7 modelos por métrica (con cada fold), detalle de cada modelo con su matriz de confusión fuera de fold y sus ventajas y limitaciones, complejidad contra desempeño y sobreajuste.
- **Simulador:** se arma el perfil de una persona y se ve qué sector predicen el modelo final y otros cuatro modelos, cómo cambian las probabilidades al mover una sola variable, y un mapa de decisión de escolaridad contra ingreso que muestra la forma de las fronteras de cada modelo.
- **Resultado final:** desempeño en prueba, explicado en "de cada 10 personas", matriz de confusión e importancia de variables.

### Arquitectura

GitHub Pages solo sirve archivos estáticos, así que el notebook exporta todo lo necesario:

1. **Resultados (`app/datos/resultados.json`):** métricas por fold de cada modelo, matrices de confusión fuera de fold, resultados en prueba, importancias y distribuciones del set de entrenamiento.
2. **Modelos (`app/datos/modelos.json`):** los 249 árboles de cada clase del Gradient Boosting, el árbol podado, los coeficientes de la regresión logística y de LDA (con su estandarización) y los pesos de la red neuronal. `app/modelos.js` los evalúa en el navegador y da las mismas probabilidades que sklearn y Keras (diferencias menores a 0.0001 en 400 casos de prueba). El Random Forest y la SVM no se incluyen porque son demasiado pesados para el navegador.

Para abrir el tablero localmente hay que usar un servidor, por ejemplo `python -m http.server` desde la carpeta del repositorio, y entrar a `http://localhost:8000/sector-economico-comparacion-modelos/app/`.

## Cómo ejecutar el notebook

1. Clona el repositorio; el archivo `.csv` debe quedar en `Datos/`, relativo al notebook.
2. Instala las dependencias necesarias:

   ```bash
   pip install pandas numpy matplotlib seaborn scipy scikit-learn tensorflow
   ```

3. Abre `comparacion_modelos_sector.ipynb` en Jupyter Notebook, JupyterLab, VS Code o Google Colab, y ejecuta las celdas en orden. Todo el notebook tarda alrededor de 8 minutos; la SVM, el Gradient Boosting y la red neuronal son lo más tardado.

## Limitaciones

- Solo se usan 6 variables sociodemográficas, y los datos son de un solo trimestre (el trabajo agrícola es estacional).
- No se usan los factores de expansión de la ENOE, así que los porcentajes describen a la muestra.
- Por costo computacional, la SVM se entrena con 20,000 observaciones por fold.
- Los resultados del Random Forest y del Boosting pueden variar ligeramente según la versión de scikit-learn.
