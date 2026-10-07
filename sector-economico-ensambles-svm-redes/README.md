# Predicción del Sector Económico: Ensambles, SVM y Redes Neuronales (ENOE)

**Autor:** Arturo Vargas Espinosa

## Índice

| Archivo | Descripción |
|---|---|
| [`ensambles_svm_redes_sector.ipynb`](ensambles_svm_redes_sector.ipynb) | Notebook con el análisis completo: modelos de referencia, Random Forest, Gradient Boosting, SVM, red neuronal y comparación final. |
| [`ensambles_svm_redes_sector.html`](ensambles_svm_redes_sector.html) | Reporte exportado en HTML, listo para leer sin ejecutar código. |
| [`Datos/enoe_2026_1t_limpio.csv`](Datos/enoe_2026_1t_limpio.csv) | Microdatos de la ENOE ya integrados y filtrados, usados directamente en el análisis. |

## Objetivo

Determinar si modelos más complejos predicen mejor que los modelos sencillos el **sector de actividad económica** de una persona ocupada en México (primario, secundario o terciario), y si la mejora justifica su costo en tiempo de entrenamiento e interpretabilidad. Es una continuación del proyecto [LDA vs. árboles de decisión](../sector-economico-lda-arboles/README.md): mismo problema, mismas variables y misma partición de entrenamiento y prueba, para que la comparación sea justa.

Modelos evaluados:

- **Random Forest:** *bagging* de árboles con selección aleatoria de variables en cada separación. El tamaño mínimo de hoja se elige con el error *out-of-bag*.
- **Gradient Boosting:** árboles pequeños entrenados de forma secuencial, con *early stopping*.
- **Support Vector Machine:** comparación de kernel lineal contra RBF y búsqueda de C con validación cruzada.
- **Red neuronal *feedforward*:** construida con Keras (2 capas ocultas, *early stopping*).
- **Referencias:** regresión logística multinomial, LDA con priors uniformes y árbol de decisión podado.

Todas las decisiones de hiperparámetros se toman solo con el conjunto de entrenamiento (OOB, validación cruzada o una fracción de validación). El conjunto de prueba se usa una sola vez por modelo.

## Datos

- **Fuente:** INEGI (2026). *Encuesta Nacional de Ocupación y Empleo (ENOE), primer trimestre de 2026*. Microdatos. Instituto Nacional de Estadística y Geografía. https://www.inegi.org.mx/programas/enoe/15ymas/
- **`enoe_2026_1t_limpio.csv`:** 126,226 observaciones y 30 columnas (una fila por persona ocupada con ingreso reportado). Es el resultado de integrar y filtrar las tablas crudas de la ENOE en el proyecto de [regresión del ingreso laboral](../regresion-caso-real-enoe/README.md).
- **Variable de respuesta:** `rama_est1`, el sector de actividad (1 = primario, 2 = secundario, 3 = terciario). Tras la limpieza quedan 120,430 observaciones: 65.6% terciario, 26.9% secundario y 7.5% primario.
- **Variables explicativas:** edad, años de escolaridad, horas trabajadas por semana, ingreso mensual (en logaritmo y estandarizado para SVM y la red), sexo y tipo de localidad (urbana o rural).

## Estructura del análisis

1. **Preparación:** limpieza, revisión de valores faltantes y escalas, partición estratificada 80/20 y estandarización ajustada solo con entrenamiento.
2. **Modelos de referencia:** regresión logística, LDA y árbol podado.
3. **Random Forest:** selección de `min_samples_leaf` por OOB, evaluación e importancia de variables comparada con el árbol individual.
4. **Gradient Boosting:** *early stopping*, curvas de pérdida y F1 por iteración, e importancia de variables.
5. **SVM:** búsqueda de kernel y C sobre una submuestra; el modelo final se entrena con 40,000 observaciones.
6. **Red neuronal:** arquitectura, pesos por clase, curvas de entrenamiento y evaluación.
7. **Comparación:**
   - Métricas en prueba y sensibilidad/precisión por clase.
   - Estabilidad con validación cruzada de 5 folds.
   - Brecha entre entrenamiento y prueba.
   - Complejidad contra desempeño.

## Resultados principales

| Modelo | Exactitud | F1-score macro (prueba) | F1 macro (validación cruzada) |
|---|---|---|---|
| Regresión logística | — | 0.488 | — |
| LDA (priors uniformes) | 0.493 | 0.434 | — |
| Árbol de decisión podado | 0.593 | 0.542 | 0.531 |
| **Random Forest** | **0.673** | **0.594** | **0.588** |
| Gradient Boosting | 0.641 | 0.573 | 0.566 |
| SVM (kernel RBF) | 0.597 | 0.534 | 0.523 |
| Red neuronal | 0.613 | 0.550 | 0.531 |

- **Los métodos de ensamble sí mejoran de forma clara:** Random Forest (+0.05 en F1 macro) y Gradient Boosting (+0.03) superan al árbol podado, con diferencias varias veces mayores que la variación entre folds.
- **Más complejidad no siempre es mejor:** la SVM, que es el modelo más costoso de entrenar, no supera al árbol podado. La red neuronal le gana en prueba por solo 0.007 y en validación cruzada empatan.
- El salto más grande se da al pasar de modelos **lineales** a **no lineales**: la frontera entre sectores no es lineal.
- En todos los modelos de árboles, las variables más importantes son el **tipo de localidad (rural/urbana)** y el **ingreso**.
- Ningún modelo pasa de 0.60 de F1 macro. El límite parece estar en la información disponible, porque con estas 6 variables los sectores secundario y terciario son muy parecidos.

## Cómo ejecutar el notebook

1. Clona el repositorio; el archivo `.csv` debe quedar en `Datos/`, relativo al notebook.
2. Instala las dependencias necesarias:

   ```bash
   pip install pandas numpy matplotlib seaborn scipy scikit-learn tensorflow
   ```

3. Abre `ensambles_svm_redes_sector.ipynb` en Jupyter Notebook, JupyterLab, VS Code o Google Colab, y ejecuta las celdas en orden. La SVM y la red neuronal tardan varios minutos en entrenar.

## Limitaciones

- Por costo computacional, la SVM se entrena con una submuestra de 40,000 observaciones, y la comparación de estabilidad se hace con una submuestra de 20,000.
- Los tiempos de entrenamiento dependen del equipo; lo relevante es la diferencia relativa entre modelos.
- El Random Forest tiene una brecha grande entre entrenamiento y prueba (0.72 contra 0.59). No afecta su desempeño en datos nuevos, pero hace que su desempeño en entrenamiento no sirva para evaluarlo.
