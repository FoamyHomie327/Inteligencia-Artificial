# Aprendizaje por Refuerzo: Aterrizaje en la Luna con PPO (Lunar Lander)

**Autor:** Arturo Vargas Espinosa

## Índice

| Archivo | Descripción |
|---|---|
| [`aprendizaje_refuerzo_lunar_lander.ipynb`](aprendizaje_refuerzo_lunar_lander.ipynb) | Notebook con el entrenamiento completo: ambiente, agente aleatorio, entrenamiento por partes con gifs, curva de aprendizaje y evaluación. |
| [`aprendizaje_refuerzo_lunar_lander.html`](aprendizaje_refuerzo_lunar_lander.html) | Reporte exportado en HTML, con los gifs de cada etapa del entrenamiento, listo para leer sin ejecutar código. |
| [`aprendizaje_refuerzo_lunar_lander.mp4`](aprendizaje_refuerzo_lunar_lander.mp4) | Video (53 segundos) del agente durante el entrenamiento, desde que se estrella hasta que aterriza. |

<video src="aprendizaje_refuerzo_lunar_lander.mp4" controls width="600"></video>

## Objetivo

Entrenar a un agente para que aprenda a **aterrizar una nave en la luna** entre dos banderas, sin estrellarse, solo con prueba y error y la recompensa que le da el ambiente. El entrenamiento se hace por partes, y en cada parte se guarda un gif de lo que ya sabe hacer el agente, para ver cómo va aprendiendo.

## Ambiente

- **`LunarLander-v3` de Gymnasium:** el agente recibe **8 variables** (posición, velocidad, ángulo, velocidad angular y si cada pata toca el suelo) y tiene **4 acciones** (no hacer nada, motor izquierdo, motor principal y motor derecho).
- **Recompensa:** sube si la nave se acerca a la plataforma despacio y derecha, baja si gasta combustible, y al final da −100 si se estrella o +100 si aterriza. Un episodio es exitoso con 200 puntos o más.
- No usa datos externos: los episodios se generan al simular el ambiente.

## Estructura del análisis

1. **Ambiente:** instalación, observación inicial, primer frame y acciones manuales.
2. **Línea base:** agente aleatorio y 1,000 episodios al azar con su histograma de recompensas.
3. **Entrenamiento con PPO** (`stable-baselines3`): 16 ambientes en paralelo e hiperparámetros recomendados por RL Zoo, entrenando por partes y guardando gifs de los episodios 1, 500, 1,000, 1,400, 1,950, 2,300, 2,575 y 2,825.
4. **Historial y curva de aprendizaje:** recompensa y pasos de cada episodio con promedio móvil, y las 4 etapas del aprendizaje.
5. **Evaluación:** 100 episodios nuevos del agente entrenado contra el agente aleatorio, y un gif del agente final.

## Resultados principales

| Agente | Recompensa promedio | Episodios exitosos |
|---|---|---|
| Aleatorio (1,000 episodios) | −181 | 0 |
| **PPO entrenado (100 episodios)** | **260** | **99 de 100** |

- El agente aprendió por etapas: primero a no dar vueltas, luego a atinarle a la plataforma, luego a no estrellarse y hasta el final a quedarse quieto para que le den los +100 de aterrizar.
- Entre los episodios ~1,700 y ~2,600 aprendió a evitar el castigo de estrellarse antes de descubrir el premio de aterrizar, y se quedaba flotando sobre la plataforma hasta que se acababa el tiempo. Los primeros aterrizajes exitosos aparecieron después del episodio 2,000.
- El entrenamiento usó un poco más de 1 millón de pasos (2,857 episodios) y tardó unos 5 minutos con 16 ambientes en paralelo.

## Cómo ejecutar el notebook

1. Instala las dependencias necesarias:

   ```bash
   pip install "gymnasium[box2d]" stable-baselines3 numpy pandas matplotlib seaborn pillow
   ```

2. Abre `aprendizaje_refuerzo_lunar_lander.ipynb` en Jupyter Notebook, JupyterLab, VS Code o Google Colab, y ejecuta las celdas en orden. El notebook instala `gymnasium` y `stable-baselines3` si no están.

## Limitaciones

- Los resultados dependen de la semilla: otra corrida puede tardar más o menos episodios en aprender a aterrizar.
- La evaluación es en el mismo ambiente en el que se entrenó (el terreno cambia en cada episodio, pero la física es la misma).
- PPO necesita muchísimos intentos: los primeros episodios exitosos aparecieron hasta después del episodio 2,000.
