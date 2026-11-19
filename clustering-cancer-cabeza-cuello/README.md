# Subtipos Moleculares del Cáncer de Cabeza y Cuello: PCA y Clustering (TCGA-HNSC)

**Autor:** Arturo Vargas Espinosa

## Índice

| Archivo | Descripción |
|---|---|
| [`clustering_cancer_cabeza_cuello.ipynb`](clustering_cancer_cabeza_cuello.ipynb) | Notebook con el análisis completo: exploración, preparación, PCA, K-means, clustering jerárquico, análisis de genes, análisis clínico y discusión. |
| [`clustering_cancer_cabeza_cuello.html`](clustering_cancer_cabeza_cuello.html) | Reporte exportado en HTML, listo para leer sin ejecutar código. |
| [`Datos/hnsc_fenotipo.tsv`](Datos/hnsc_fenotipo.tsv) | Variables clínicas y demográficas de cada muestra. |
| [`Datos/hnsc_supervivencia.tsv`](Datos/hnsc_supervivencia.tsv) | Supervivencia global: días de seguimiento y si el paciente falleció. |
| [`Datos/mapeo_genes_gencode_v36.tsv`](Datos/mapeo_genes_gencode_v36.tsv) | ID de Ensembl de cada gen con su nombre y cromosoma. |

> La matriz de expresión génica (`hnsc_expresion_star_tpm.tsv`, ~403 MB) no se incluye en el repositorio porque excede el límite de tamaño de archivo de GitHub. Se descarga de UCSC Xena (ver sección de Datos).

## Objetivo

Descubrir si los tumores de cabeza y cuello forman grupos naturales según su expresión génica, usando solo aprendizaje no supervisado, y después revisar si esos grupos tienen sentido clínico. El PCA y el clustering se hacen únicamente con la expresión génica; las variables clínicas (sitio del tumor, sexo, edad, etapa, tabaco, alcohol y supervivencia) se cruzan con los clusters hasta el final, para interpretarlos.

## Datos

- **Fuente:** The Cancer Genome Atlas (TCGA), cohorte **GDC TCGA Head and Neck Cancer (HNSC)**, descargada de UCSC Xena: https://xenabrowser.net/datapages/?cohort=GDC%20TCGA%20Head%20and%20Neck%20Cancer%20(HNSC)
- **Expresión génica (STAR - TPM):** 60,660 genes × 566 muestras en escala log2(TPM + 1). Archivo original `TCGA-HNSC.star_tpm.tsv.gz`; para correr el notebook se descomprime y se guarda como `Datos/hnsc_expresion_star_tpm.tsv`.
- **Mapeo de genes:** `gencode.v36.annotation.gtf.gene.probemap` (en Xena aparece como *ID/Gene Mapping* dentro del dataset de STAR - TPM), guardado como `Datos/mapeo_genes_gencode_v36.tsv`.
- **Fenotipo y supervivencia:** `TCGA-HNSC.clinical.tsv.gz` y `TCGA-HNSC.survival.tsv.gz`, guardados como `Datos/hnsc_fenotipo.tsv` y `Datos/hnsc_supervivencia.tsv`.
- Se usan los **520 tumores primarios** (uno por paciente); se excluyen 44 muestras de tejido normal y 2 metástasis.

## Estructura del análisis

1. **Planteamiento y metodología:** el cáncer de cabeza y cuello, sus factores de riesgo (tabaco, alcohol y VPH) y la teoría de PCA, K-means, clustering jerárquico y las pruebas estadísticas.
2. **Exploración:** tipos de muestra, valores faltantes, distribución de la expresión, variables clínicas y valores atípicos.
3. **Preparación:** solo tumores primarios, genes con TPM ≥ 1 en al menos 10% de los tumores, sin genes del cromosoma Y, mitocondriales ni XIST, y los 5,000 genes más variables estandarizados.
4. **PCA:** varianza explicada, selección de 10 componentes (51.2% de la varianza) e interpretación de las cargas.
5. **Clustering:** K-means (K elegido con la silueta) y clustering jerárquico con linkage complete, average y Ward; comparación de los dos métodos y selección del modelo final.
6. **Análisis de genes:** prueba t de Welch de cada cluster contra el resto, corrección de Benjamini-Hochberg, heatmap y panel de genes de referencia.
7. **Análisis clínico:** ji-cuadrada (sitio, sexo, etapa, alcohol), Kruskal-Wallis (edad, paquetes-año) y supervivencia con Kaplan-Meier y log-rank.
8. **Discusión y conclusiones:** comparación con el artículo de TCGA sobre este cáncer (Nature, 2015), limitaciones y trabajo futuro.

## Resultados principales

K-means con K = 4 sobre 10 componentes principales (silueta de 0.181, la más alta entre K = 2 y 8). Los 4 clusters coinciden con los 4 subtipos de expresión descritos por TCGA:

| Cluster | Tumores | Genes que lo definen | Sitio principal | Supervivencia a 5 años |
|---|---|---|---|---|
| C1 Mesenquimal | 164 | Músculo, estroma y matriz extracelular | Cavidad oral (60%) | 47% |
| C2 Basal | 163 | Queratinización y KRT14; pocas células inmunes | Cavidad oral (63%) | 49% |
| C3 Clásico | 124 | Metabolismo de tóxicos y estrés oxidativo (AKR1C, GPX2) | Laringe (52%) | 40% |
| C4 Atípico | 69 | p16 (CDKN2A), SYCP2 y linfocitos B | Orofaringe (70%) | 62% |

- Sin ver ninguna variable clínica, el clustering separó el **cáncer de orofaringe con perfil de VPH** (C4: 70% de amígdala y base de lengua, 91% hombres, los más jóvenes y la mejor supervivencia, log-rank p = 0.0003 contra el resto) y el **cáncer de laringe del fumador** (C3: 52% laringe y la mediana más alta de paquetes-año, 50).
- El clustering jerárquico con Ward encuentra los mismos grupos C4, C3 y C1 (ARI de 0.468 con K-means), pero junta en un solo cluster a los tumores basales con parte de los mesenquimales; K-means separa mejor (silueta 0.181 contra 0.149).
- Los primeros componentes del PCA reflejan sobre todo la composición de cada muestra (tumor contra tejido de alrededor, fibroblastos y linfocitos), así que los tumores forman un continuo con 4 regiones más que grupos totalmente separados.

## Cómo ejecutar el notebook

1. Clona el repositorio y descarga `TCGA-HNSC.star_tpm.tsv.gz` de la cohorte de Xena (enlace arriba). Descomprímelo y guárdalo como `Datos/hnsc_expresion_star_tpm.tsv`, junto a los otros 3 archivos.
2. Instala las dependencias necesarias:

   ```bash
   pip install pandas numpy matplotlib seaborn scipy scikit-learn
   ```

3. Abre `clustering_cancer_cabeza_cuello.ipynb` en Jupyter Notebook, JupyterLab, VS Code o Google Colab, y ejecuta las celdas en orden. Todo el notebook corre en menos de un minuto.

## Limitaciones

- El fenotipo de Xena no trae el estado de VPH, así que la relación del cluster C4 con el virus se infiere con evidencia indirecta (sitio, p16, edad, sexo y supervivencia).
- Las muestras no son tumor puro: parte del cluster C1 se explica por músculo de la lengua y parte de C4 por tejido linfoide de la amígdala.
- 43% de los pacientes no tiene paquetes-año, las etapas usan la clasificación AJCC de 7.ª edición, no hay información de tratamiento y la mitad de los pacientes tiene menos de 2 años de seguimiento.
- La comparación de supervivencia no está ajustada por edad, etapa ni sitio.
