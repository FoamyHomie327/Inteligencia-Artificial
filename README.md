# Portafolio de Proyectos: Inteligencia Artificial y Ciencia de Datos

Colección de proyectos de modelado estadístico y machine learning, con énfasis en regresión, clasificación, sistemas de recomendación, aprendizaje no supervisado, aprendizaje por refuerzo, limpieza de datos reales, selección de características e inferencia estadística. Cada proyecto incluye su análisis en Jupyter Notebook, un reporte en HTML, y los datos utilizados (o el enlace a su fuente original).

**Autor:** Arturo Vargas Espinosa ([arturovargasesp@gmail.com](mailto:arturovargasesp@gmail.com))

## Proyectos

| Proyecto | Descripción | Técnicas |
|---|---|---|
| [Subtipos Moleculares del Cáncer de Cabeza y Cuello: PCA y Clustering (TCGA-HNSC)](clustering-cancer-cabeza-cuello/README.md) | Proyecto final de aprendizaje no supervisado: agrupa 520 tumores de TCGA solo con su expresión génica y encuentra 4 subtipos; al cruzarlos con los datos clínicos, uno resulta ser el cáncer de orofaringe asociado al VPH, con la mejor supervivencia. | PCA, K-means, clustering jerárquico, coeficiente de silueta, prueba t de Welch con FDR, ji-cuadrada, Kaplan-Meier y log-rank |
| [Aprendizaje por Refuerzo: Aterrizaje en la Luna con PPO (Lunar Lander)](aprendizaje-refuerzo-lunar-lander/README.md) | Entrena a un agente para aterrizar una nave en el ambiente Lunar Lander, con gifs de cada etapa del entrenamiento; pasa de estrellarse siempre a aterrizar en 99 de 100 episodios. | Aprendizaje por refuerzo, PPO (stable-baselines3), Gymnasium, curva de aprendizaje |
| [Tutorial de Clustering: K-means y Clustering Jerárquico (NCI60)](tutorial-clustering-nci60/README.md) | Tutorial paso a paso: K-means programado desde cero con datos sintéticos, y K-means y clustering jerárquico sobre la expresión génica de 64 líneas celulares de cáncer. | K-means, PCA, clustering jerárquico, métricas de disimilitud, métodos de linkage |
| [Predicción del Sector Económico: Comparación de Modelos de Clasificación (ENOE)](sector-economico-comparacion-modelos/README.md) · [**App**](https://foamyhomie327.github.io/Inteligencia-Artificial/sector-economico-comparacion-modelos/app/) | Proyecto final de clasificación: compara 7 modelos con los mismos 5 folds de validación cruzada para predecir el sector económico de una persona ocupada en México, elige un modelo final (Gradient Boosting) y lo evalúa una sola vez en prueba. Incluye un tablero interactivo con un simulador que corre los modelos en el navegador. | Regresión logística, LDA, árboles, Random Forest, Gradient Boosting, SVM, redes neuronales (Keras), validación cruzada, bootstrap, importancia por permutación |
| [Sistema de Recomendación de Libros con PCA](sistema-recomendacion-libros/README.md) · [**App**](https://foamyhomie327.github.io/Inteligencia-Artificial/sistema-recomendacion-libros/app/) | Aplicación web que recomienda libros a partir de los que el usuario marca como leídos, usando PCA entrenado con 6 millones de calificaciones de Goodreads (goodbooks-10k). Corre completa en el navegador. | PCA (SVD truncada), interpretación de cargas, proyección de usuarios nuevos, similitud coseno, evaluación precisión@k |
| [Predicción del Sector Económico: Ensambles, SVM y Redes Neuronales (ENOE)](sector-economico-ensambles-svm-redes/README.md) | Compara Random Forest, Gradient Boosting, SVM y una red neuronal contra modelos sencillos para predecir el sector económico (primario, secundario o terciario) de una persona ocupada en México, y evalúa si la complejidad adicional se traduce en mejores predicciones. | Random Forest, Gradient Boosting, SVM, redes neuronales (Keras), validación cruzada, error out-of-bag |
| [Predicción del Sector Económico: LDA vs. Árboles de Decisión (ENOE)](sector-economico-lda-arboles/README.md) | Clasificación multiclase del sector económico con dos enfoques distintos: LDA (con revisión de supuestos y funciones discriminantes) y árboles de decisión con poda. | LDA, árboles de decisión, cost-complexity pruning, probabilidades a priori, clases desbalanceadas |
| [Clasificación de Prestaciones Laborales con Regresión Logística (ENOE)](clasificacion-prestaciones-enoe/README.md) | Predicción de si una persona ocupada en México cuenta con prestaciones laborales, con validación cruzada, análisis de umbrales e inferencia sobre los factores asociados a la formalidad del empleo. | Regresión logística, validación cruzada, curva ROC/AUC, umbrales de decisión, odds ratios, inferencia (statsmodels) |
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

Python (pandas, numpy, scipy, matplotlib, seaborn), statsmodels, scikit-learn, TensorFlow/Keras, Gymnasium y stable-baselines3. HTML, CSS y JavaScript para la app de recomendación y el tablero interactivo.
