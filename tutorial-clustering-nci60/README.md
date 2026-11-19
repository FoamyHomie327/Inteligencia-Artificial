# Tutorial de Clustering: K-means y Clustering Jerárquico (NCI60)

**Autor:** Arturo Vargas Espinosa

## Índice

| Archivo | Descripción |
|---|---|
| [`tutorial_clustering_nci60.ipynb`](tutorial_clustering_nci60.ipynb) | Notebook tutorial: K-means programado desde cero, K-means con PCA sobre NCI60 y clustering jerárquico con distintas métricas y métodos de linkage. |
| [`tutorial_clustering_nci60.html`](tutorial_clustering_nci60.html) | Reporte exportado en HTML, listo para leer sin ejecutar código. |

> No hay carpeta `Datos/`: el dataset sintético se genera con `make_blobs()` y NCI60 se carga directamente de la librería `ISLP`.

## Objetivo

Explicar paso a paso cómo funciona el **aprendizaje no supervisado** con dos técnicas de clustering, de forma que cualquier persona pueda reproducir el tutorial y entender qué se hace, por qué se hace y qué demuestra cada resultado:

1. **K-means desde cero** con datos sintéticos, para ver cada paso del algoritmo (asignación aleatoria, centroides, actualización) y por qué el resultado depende de la asignación inicial.
2. **K-means con datos reales** de expresión génica de líneas celulares de cáncer, usando PCA como preprocesamiento.
3. **Clustering jerárquico** sobre los mismos datos, comparando métricas de disimilitud (euclideana y correlación) y métodos de linkage (complete y average).

## Datos

- **Sintéticos:** 1,000 observaciones con 2 variables y 3 grupos, generadas con `make_blobs()` de scikit-learn (`cluster_std=1.5`).
- **NCI60:** expresión de **6,830 genes** medida con microarreglos en **64 líneas celulares de cáncer** del Instituto Nacional del Cáncer de Estados Unidos, con su tipo de cáncer (14 etiquetas, incluidas 4 réplicas). Fuente: librería `ISLP`, de James, G., Witten, D., Hastie, T., Tibshirani, R. y Taylor, J. (2023). *An Introduction to Statistical Learning with Applications in Python*. Springer.

## Estructura del análisis

1. **Introducción y metodología:** qué es clustering, K-means, PCA como preprocesamiento y clustering jerárquico.
2. **Parte 1, K-means desde cero:** dataset sintético, asignación aleatoria, centroides, actualización iterativa y estocasticidad (con y sin semilla).
3. **Parte 2, K-means con NCI60:** K-means sobre los genes originales, PCA, varianza explicada, número de clusters (codo y silueta), K-means sobre los componentes, tabla de tipo de cáncer contra cluster y heatmap de los genes más relevantes.
4. **Parte 3, clustering jerárquico con NCI60:** dendrograma con método complete y distancia euclideana, cortes en 2, 3 y 4 clusters, distancia de correlación y método average.

## Resultados principales

- **K-means desde cero** convergió en 4 iteraciones: el número de observaciones que cambian de cluster baja de 661 a 234, 16 y 0, y la variación dentro de los clusters nunca sube. Con otra semilla llega a la misma solución, porque en este dataset los grupos están bien separados.
- **En NCI60 los genes sueltos no muestran los clusters**, pero con PCA sí: PC1 explica 11.4% de la varianza, hay un codo alrededor del componente 7 (38.5% acumulado) y la silueta tiene un máximo local en K = 4 (0.318).
- **K-means con 7 componentes encuentra grupos con sentido biológico** sin haber visto el tipo de cáncer: un cluster puro con las 6 leucemias y las réplicas K562, y otro con 7 de los 8 melanomas.
- **El clustering jerárquico** con complete y distancia euclideana separa primero un grupo de 17 líneas (leucemias, colon y las réplicas de MCF7) del resto, y en el corte de 3 clusters las leucemias quedan solas; con distancia de correlación agrupa por patrón de expresión, y con average aparece el efecto de encadenamiento (un grupo grande que va absorbiendo observaciones una por una).

## Cómo ejecutar el notebook

1. Instala las dependencias necesarias:

   ```bash
   pip install pandas numpy matplotlib seaborn scipy scikit-learn ISLP
   ```

2. Abre `tutorial_clustering_nci60.ipynb` en Jupyter Notebook, JupyterLab, VS Code o Google Colab, y ejecuta las celdas en orden. Si `ISLP` no está instalada, el notebook la instala.

## Limitaciones

- NCI60 tiene solo 64 líneas celulares y muchísimas más variables que observaciones, así que los clusters son sensibles al preprocesamiento y al número de componentes.
- Las líneas celulares son cultivos de laboratorio, no tumores de pacientes, y varios tipos de cáncer tienen muy pocas muestras.
- El número de clusters de K-means se eligió dentro del rango de 3 a 5 que pedía el taller; la silueta no marca un número claramente mejor.
