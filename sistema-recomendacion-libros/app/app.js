/* Estantería: recomendador de libros con PCA, 100% en el navegador.
 *
 * El modelo se entrena una sola vez en Python (ver sistema_recomendacion_pca.ipynb) y se exporta a:
 *   datos/modelo.json  -> metadatos de los libros y del modelo
 *   datos/vectores.bin -> cargas de cada libro en los k componentes principales (Int8)
 *
 * Recomendación para un usuario nuevo (proyección de PCA):
 *   z = Σ (e_i − 3) · v_i    (e_i = estrellas que le dio al libro i; v_i = cargas del libro i)
 *   score_j = z · v_j        (reconstrucción de su fila en el espacio de componentes)
 */
(() => {
  'use strict';

  const MIN_CALIFICACIONES = 10;
  const CLAVE = 'estanteria.v2';
  const CLAVE_V1 = 'estanteria.v1'; // versión anterior con ♥ (+1) / ✕ (−1)
  const ETIQUETAS = { 0.5: 'Lo odié', 1: 'Lo odié', 1.5: 'Muy malo', 2: 'No me gustó', 2.5: 'Meh', 3: 'Neutral', 3.5: 'Estuvo bien', 4: 'Me gustó', 4.5: 'Me gustó mucho', 5: '¡Me encantó!' };
  const app = document.getElementById('app');

  let M = null;          // modelo.json
  let L = [];            // libros
  let K = 0;             // número de componentes
  let V = null;          // Float32Array n×k con las cargas (para recomendar)
  let W = null;          // Float32Array n×k normalizado y ponderado (para "parecidos")
  let normas = null;     // norma de cada libro en el espacio ponderado
  let normaMediana = 1;
  let indiceBusqueda = [];

  // ---------------------------------------------------------------- estado local
  const estado = cargarEstado();
  const calif = new Map(estado.calif);       // id -> estrellas (0.5 a 5), en orden de captura
  const saltados = new Set(estado.saltados); // ids marcados como "no lo he leído"

  function cargarEstado() {
    const vacio = { calif: [], saltados: [], terminado: false };
    try {
      const s = JSON.parse(localStorage.getItem(CLAVE));
      if (s && Array.isArray(s.calif) && Array.isArray(s.saltados)) return { ...vacio, ...s };
      const v1 = JSON.parse(localStorage.getItem(CLAVE_V1));
      if (v1 && Array.isArray(v1.calif)) {
        // ♥ equivalía a +1 = 4 estrellas y ✕ a −1 = 2 estrellas
        return { ...vacio, ...v1, calif: v1.calif.map(([id, r]) => [id, r > 0 ? 4 : 2]) };
      }
    } catch (e) { /* almacenamiento no disponible: se usa memoria */ }
    return vacio;
  }
  function guardar() {
    estado.calif = [...calif];
    estado.saltados = [...saltados];
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* sin persistencia */ }
  }
  function calificar(id, estrellas) {
    calif.delete(id); // reinsertar al final para conservar el orden "más reciente"
    if (estrellas > 0) { calif.set(id, estrellas); saltados.delete(id); }
    guardar();
  }
  const peso = e => e - 3;   // mismo centrado que en el entrenamiento

  // ---------------------------------------------------------------- carga del modelo
  async function iniciar() {
    try {
      const [modelo, buffer] = await Promise.all([
        fetch('datos/modelo.json').then(r => { if (!r.ok) throw r; return r.json(); }),
        fetch('datos/vectores.bin').then(r => { if (!r.ok) throw r; return r.arrayBuffer(); }),
      ]);
      prepararModelo(modelo, buffer);
    } catch (e) {
      app.innerHTML = `<div class="vacio"><h2>No se pudo cargar el modelo</h2>
        <p>Si abriste el archivo directamente, sírvelo con un servidor local (por ejemplo <code>python -m http.server</code>).</p></div>`;
      console.error(e);
      return;
    }
    window.addEventListener('hashchange', render);
    render();
  }

  function prepararModelo(modelo, buffer) {
    M = modelo;
    K = M.k;
    L = M.libros.map((f, i) => {
      const [titulo, autor, anio, promedio, n, img, isbn, gid] = f;
      const m = titulo.match(/^(.*?)\s*\(([^()]*#[^()]*)\)\s*$/);
      return {
        i, tituloCompleto: titulo, titulo: m ? m[1] : titulo, serie: m ? m[2] : '',
        autor, anio, promedio, n, img, isbn, gid,
      };
    });
    const q = new Int8Array(buffer);
    const n = L.length;
    V = new Float32Array(n * K);
    W = new Float32Array(n * K);
    normas = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let s2 = 0;
      for (let c = 0; c < K; c++) {
        const v = q[i * K + c] * M.escala[c];
        V[i * K + c] = v;
        const w = v * M.valores_singulares[c];
        W[i * K + c] = w;
        s2 += w * w;
      }
      const nr = Math.sqrt(s2) || 1;
      normas[i] = nr;
      for (let c = 0; c < K; c++) W[i * K + c] /= nr;
    }
    normaMediana = [...normas].sort((a, b) => a - b)[n >> 1];
    indiceBusqueda = L.map(l => normalizar(`${l.tituloCompleto} ${l.autor}`));
  }

  // ---------------------------------------------------------------- álgebra del recomendador
  function vectorUsuario() {
    const z = new Float32Array(K);
    for (const [id, e] of calif) {
      const w = peso(e);
      if (w) for (let c = 0; c < K; c++) z[c] += w * V[id * K + c];
    }
    return z;
  }
  const perfilVacio = () => [...calif.values()].every(e => peso(e) === 0);
  function puntaje(z, j) {
    let s = 0;
    for (let c = 0; c < K; c++) s += z[c] * V[j * K + c];
    return s;
  }
  function recomendar(cuantos) {
    if (!calif.size || perfilVacio()) return [];
    const z = vectorUsuario();
    const res = [];
    for (let j = 0; j < L.length; j++) if (!calif.has(j)) res.push([j, puntaje(z, j)]);
    res.sort((a, b) => b[1] - a[1]);
    const max = res.length ? res[0][1] : 1;
    return res.slice(0, cuantos).map(([j, s]) => ({ j, afinidad: max > 0 ? s / max : 0 }));
  }
  // Similitud coseno en el espacio de componentes (ponderado por valores singulares).
  // Se castiga un poco a los libros con pocas cargas: su dirección es más ruidosa.
  function parecidos(i, cuantos) {
    const res = [];
    for (let j = 0; j < L.length; j++) {
      if (j === i) continue;
      let s = 0;
      for (let c = 0; c < K; c++) s += W[i * K + c] * W[j * K + c];
      const confianza = Math.min(1, normas[j] / normaMediana);
      res.push([j, s * Math.sqrt(confianza)]);
    }
    res.sort((a, b) => b[1] - a[1]);
    return res.slice(0, cuantos).map(([j]) => j);
  }
  // Qué libros bien calificados empujan más la recomendación del libro j
  function motivos(j, cuantos = 3) {
    const res = [];
    for (const [id, e] of calif) {
      const w = peso(e);
      if (w <= 0) continue;
      let s = 0;
      for (let c = 0; c < K; c++) s += V[id * K + c] * V[j * K + c];
      if (s > 0) res.push([id, w * s]);
    }
    res.sort((a, b) => b[1] - a[1]);
    return res.slice(0, cuantos).map(([id]) => id);
  }

  // ---------------------------------------------------------------- utilidades de vista
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normalizar = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const fmt = n => n.toLocaleString('es-MX');
  const autorCorto = a => a.split(',')[0];

  function urlPortada(l) {
    if (l.img) return `https://images.gr-assets.com/books/${l.img}.jpg`;
    if (l.isbn) return `https://covers.openlibrary.org/b/isbn/${l.isbn}-L.jpg?default=false`;
    return '';
  }
  // Si falla la portada de Goodreads se intenta Open Library; si también falla, se dibuja una portada tipográfica.
  document.addEventListener('error', e => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.libro) return;
    const l = L[+img.dataset.libro];
    if (img.src.includes('gr-assets') && l.isbn) {
      img.src = `https://covers.openlibrary.org/b/isbn/${l.isbn}-L.jpg?default=false`;
    } else {
      img.closest('.poster')?.classList.add('sin-imagen');
    }
  }, true);

  function poster(i) {
    const l = L[i];
    const src = urlPortada(l);
    return `<a class="poster${src ? '' : ' sin-imagen'}" href="#/libro/${i}" title="${esc(l.tituloCompleto)}">
      ${src ? `<img src="${src}" alt="" loading="lazy" data-libro="${i}">` : ''}
      <span class="poster-texto"><b>${esc(l.titulo)}</b><span>${esc(autorCorto(l.autor))}</span></span></a>`;
  }
  function tarjeta(i, extra = '') {
    const l = L[i];
    const e = calif.get(i);
    return `<div class="tarjeta">${poster(i)}
      <div class="tarjeta-info"><div class="t">${esc(l.titulo)}</div><div class="a">${esc(autorCorto(l.autor))}</div>
      ${e ? `<div class="mi-calif">${textoEstrellas(e)}</div>` : ''}${extra}</div></div>`;
  }
  function textoEstrellas(p) {
    const e = Math.round(p * 2) / 2;
    return '★'.repeat(Math.floor(e)) + (e % 1 ? '½' : '');
  }
  function aviso(texto) {
    const a = document.getElementById('aviso');
    a.textContent = texto;
    a.classList.add('visible');
    clearTimeout(aviso.t);
    aviso.t = setTimeout(() => a.classList.remove('visible'), 1800);
  }
  function rerender() {
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }

  // ---------------------------------------------------------------- calificador de estrellas
  // Cinco estrellas con medias estrellas: la mitad izquierda de cada estrella vale n − ½.
  const SVG_ESTRELLA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.9l-6.4 3.5 1.4-7.1-5.3-5 7.2-.9z"/></svg>';
  function calificador(i, { grande = false } = {}) {
    const e = calif.get(i) || 0;
    return `<div class="calificador${grande ? ' grande' : ''}" data-id="${i}" data-valor="${e}"
        role="slider" tabindex="0" aria-label="Calificación con estrellas" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${e}">
      <div class="estrellas-fila">${[1, 2, 3, 4, 5].map(n =>
        `<span class="estrella" data-n="${n}" style="--n:${n}">${SVG_ESTRELLA}<span class="relleno">${SVG_ESTRELLA}</span></span>`).join('')}</div>
      <span class="calificador-texto">${e ? `${e} · ${ETIQUETAS[e]}` : ''}</span>
    </div>`;
  }
  function pintarCalificador(el, valor, previa) {
    el.classList.toggle('previa', previa);
    el.querySelectorAll('.estrella').forEach(s => {
      const n = +s.dataset.n;
      const lleno = Math.max(0, Math.min(1, valor - (n - 1)));
      s.querySelector('.relleno').style.width = `${lleno * 100}%`;
      s.classList.toggle('encendida', lleno > 0);
      s.classList.toggle('actual', previa && valor > n - 1 && valor <= n);
    });
    const actual = +el.dataset.valor;
    const mostrar = previa ? valor : actual;
    el.querySelector('.calificador-texto').textContent = mostrar ? `${mostrar} · ${ETIQUETAS[mostrar]}` : (el.classList.contains('grande') ? 'Toca una estrella (la mitad izquierda vale media)' : '');
  }
  function valorEnPunto(estrella, x) {
    const r = estrella.getBoundingClientRect();
    return +estrella.dataset.n - (x - r.left < r.width / 2 ? 0.5 : 0);
  }
  function iniciarCalificadores() {
    app.querySelectorAll('.calificador').forEach(el => pintarCalificador(el, +el.dataset.valor, false));
  }
  app.addEventListener('mousemove', e => {
    const s = e.target.closest('.estrella');
    if (!s) return;
    pintarCalificador(s.closest('.calificador'), valorEnPunto(s, e.clientX), true);
  });
  app.addEventListener('mouseout', e => {
    const el = e.target.closest('.calificador');
    if (el && !el.contains(e.relatedTarget)) pintarCalificador(el, +el.dataset.valor, false);
  });
  app.addEventListener('click', e => {
    const s = e.target.closest('.estrella');
    if (!s) return;
    const el = s.closest('.calificador');
    const id = +el.dataset.id;
    let valor = valorEnPunto(s, e.clientX);
    if (valor === +el.dataset.valor) valor = 0; // volver a tocar la misma calificación la quita
    fijarCalificacion(el, id, valor);
  });
  app.addEventListener('keydown', e => {
    const el = e.target.closest?.('.calificador');
    if (!el || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const v = Math.max(0, Math.min(5, +el.dataset.valor + (e.key === 'ArrowRight' ? 0.5 : -0.5)));
    fijarCalificacion(el, +el.dataset.id, v);
  });

  let bloqueado = false;
  function fijarCalificacion(el, id, valor) {
    if (bloqueado) return;
    el.dataset.valor = valor;
    el.setAttribute('aria-valuenow', valor);
    pintarCalificador(el, valor, false);
    el.classList.remove('pulso');
    void el.offsetWidth; // reiniciar la animación
    el.classList.add('pulso');

    const enDescubrir = !!el.closest('.pregunta');
    if (enDescubrir) {
      if (!valor) return;
      bloqueado = true;
      setTimeout(() => { bloqueado = false; responder(id, valor); }, 520);
      return;
    }
    calificar(id, valor);
    aviso(valor ? `${textoEstrellas(valor)} “${L[id].titulo}”` : 'Calificación eliminada');
    // En búsqueda se actualiza en su lugar para no perder lo escrito; en las demás vistas se vuelve a pintar
    if (!location.hash.startsWith('#/buscar')) setTimeout(rerender, 520);
  }

  // Acciones con data-accion en cualquier vista
  app.addEventListener('click', e => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const accion = b.dataset.accion;
    if (accion === 'quitar') {
      calificar(+b.dataset.id, 0); aviso('Calificación eliminada'); rerender();
    } else if (accion === 'mas') {
      vistaInicio.mostrar += 24; rerender();
    } else if (accion === 'borrar-todo') {
      if (confirm('¿Borrar todas tus calificaciones? Esto no se puede deshacer.')) {
        calif.clear(); saltados.clear(); estado.terminado = false; guardar();
        try { localStorage.removeItem(CLAVE_V1); } catch (e) { /* nada */ }
        location.hash = '#/descubrir';
      }
    }
  });

  document.getElementById('buscador-mini').addEventListener('submit', e => {
    e.preventDefault();
    const inp = e.target.querySelector('input');
    location.hash = `#/buscar?q=${encodeURIComponent(inp.value.trim())}`;
    inp.value = '';
    inp.blur();
  });

  // ---------------------------------------------------------------- enrutador
  function render() {
    const [ruta, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
    const partes = ruta.split('/');
    const params = new URLSearchParams(query);
    document.removeEventListener('keydown', teclasDescubrir);

    const nombre = partes[0] || 'inicio';
    if (nombre === 'inicio' && !calif.size) { location.replace('#/descubrir'); return; }

    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('activo', a.dataset.ruta === nombre));
    const vistas = {
      inicio: vistaInicio, descubrir: vistaDescubrir, buscar: () => vistaBuscar(params.get('q') || ''),
      libro: () => vistaLibro(+partes[1]), 'mis-libros': () => vistaMisLibros(partes[1] || 'recientes'),
      'como-funciona': vistaComoFunciona,
    };
    (vistas[nombre] || vistaInicio)();
    iniciarCalificadores();
    if (nombre !== 'descubrir' && nombre !== 'libro') document.title = 'Estantería';
  }

  // ---------------------------------------------------------------- vistas
  function vistaInicio() {
    const valores = [...calif.values()];
    const promedio = valores.reduce((a, b) => a + b, 0) / (valores.length || 1);
    const favoritos = valores.filter(e => e >= 4).length;
    const recs = recomendar(vistaInicio.mostrar);

    let porque = '';
    const base = [...calif].filter(([, e]) => e >= 4).map(([id]) => id).pop();
    if (base !== undefined) {
      const lista = parecidos(base, 14).filter(j => !calif.has(j)).slice(0, 10);
      porque = `<section class="seccion">
        <h2 class="seccion-titulo"><span>Porque te gustó <a href="#/libro/${base}" style="font-size:13px;color:var(--blanco)">${esc(L[base].titulo)}</a></span></h2>
        <div class="fila">${lista.map(j => tarjeta(j)).join('')}</div></section>`;
    }
    const enPantalla = new Set(recs.map(r => r.j));
    const populares = M.populares.filter(j => !calif.has(j) && !enPantalla.has(j)).slice(0, 12);

    const seccionRecs = recs.length ? `
        <div class="rejilla">${recs.map(({ j, afinidad }) =>
          tarjeta(j, `<div class="coincidencia">${Math.round(afinidad * 100)}% afinidad</div>`)).join('')}</div>
        <div style="text-align:center;margin-top:20px"><button class="boton fantasma" data-accion="mas">Ver más</button></div>`
      : `<div class="vacio"><p>Todos tus libros tienen 3 estrellas, que es neutral: todavía no sabemos qué te gusta.</p>
          <a class="boton verde" href="#/descubrir">Calificar más libros</a></div>`;

    app.innerHTML = `
      <div class="resumen-usuario animar-entrada">
        <div><h1>Tus recomendaciones</h1>
          <div class="nota">${calif.size < MIN_CALIFICACIONES
            ? `Llevas ${calif.size} libros calificados; con al menos ${MIN_CALIFICACIONES} las recomendaciones mejoran bastante. <a class="enlace" style="font-size:13px;color:var(--verde)" href="#/descubrir">Seguir calificando →</a>`
            : 'Calculadas con PCA a partir de tus estrellas. <a class="enlace" style="font-size:13px" href="#/como-funciona">¿Cómo?</a>'}</div>
        </div>
        <div class="estadisticas">
          <div class="estadistica"><b>${calif.size}</b><span>Leídos</span></div>
          <div class="estadistica"><b style="color:var(--verde)">${promedio.toFixed(1)}★</b><span>Tu promedio</span></div>
          <div class="estadistica"><b style="color:var(--azul)">${favoritos}</b><span>De 4★ o más</span></div>
        </div>
      </div>
      <section class="seccion">
        <h2 class="seccion-titulo"><span>Recomendados para ti</span><a href="#/descubrir">Afinar mis gustos</a></h2>
        ${seccionRecs}
      </section>
      ${porque}
      <section class="seccion">
        <h2 class="seccion-titulo"><span>Populares que no has calificado</span></h2>
        <div class="fila">${populares.map(j => tarjeta(j)).join('')}</div>
      </section>`;
  }
  vistaInicio.mostrar = 24;

  // --- Descubrir: preguntas una por una para afinar los gustos
  let colaDescubrir = [];
  const historialDescubrir = [];

  function siguienteDescubrir() {
    colaDescubrir = colaDescubrir.filter(j => !calif.has(j) && !saltados.has(j));
    if (!colaDescubrir.length) {
      // Se acabó la lista curada: seguir con libros cercanos a sus gustos, o populares
      const extra = recomendar(60).map(r => r.j);
      colaDescubrir = (extra.length ? extra : M.populares).filter(j => !calif.has(j) && !saltados.has(j));
    }
    return colaDescubrir[0];
  }

  function vistaDescubrir() {
    if (!colaDescubrir.length) colaDescubrir = [...M.descubrir];
    const i = siguienteDescubrir();
    const n = calif.size;
    const listo = n >= MIN_CALIFICACIONES;
    const l = L[i];
    document.title = 'Descubrir · Estantería';

    app.innerHTML = `
      <div class="descubrir">
        <div class="descubrir-cabecera">
          <h1>${n === 0 ? 'Cuéntanos qué has leído' : listo ? '¡Ya te conocemos un poco!' : 'Sigue así'}</h1>
          <div class="nota">${listo
            ? 'Ya puedes ver tus recomendaciones. Mientras más libros califiques, más finas se vuelven.'
            : `Califica al menos ${MIN_CALIFICACIONES} libros que hayas leído para armar tu perfil de lector.`}</div>
          <div class="progreso"><div style="width:${Math.min(100, n / MIN_CALIFICACIONES * 100)}%"></div></div>
          <div class="nota">${listo ? `${n} libros calificados` : `${n} de ${MIN_CALIFICACIONES} libros calificados`}</div>
        </div>
        ${i === undefined ? '<div class="vacio">Ya no quedan libros por preguntar.</div>' : `
        <div class="pregunta animar-entrada">
          ${poster(i)}
          <div>
            <h2>${esc(l.titulo)}</h2>
            ${l.serie ? `<div class="nota">${esc(l.serie)}</div>` : ''}
            <div class="autor">${esc(l.autor)}${l.anio ? ` · ${l.anio}` : ''}</div>
            <div class="nota"><span class="estrellas">${textoEstrellas(l.promedio)}</span> ${l.promedio.toFixed(2)} · ${fmt(l.n)} calificaciones</div>
            <div class="opciones">
              <div class="opciones-titulo">¿Lo leíste? Califícalo</div>
              ${calificador(i, { grande: true })}
              <button class="boton fantasma" data-resp="0">No lo he leído <kbd>0</kbd></button>
            </div>
          </div>
        </div>`}
        <div class="descubrir-pie">
          <button class="boton fantasma" id="deshacer" ${historialDescubrir.length ? '' : 'disabled'}>↶ Deshacer</button>
          <a class="enlace" href="#/buscar" style="font-size:13px">¿Tienes uno en mente? Búscalo</a>
          <button class="boton ${listo ? 'verde' : ''}" id="terminar" ${n ? '' : 'disabled'}>Ver mis recomendaciones →</button>
        </div>
        <p class="nota" style="text-align:center;margin-top:18px">Atajos: teclas 1 a 5 para las estrellas, 0 si no lo has leído, Z para deshacer.</p>
      </div>`;

    app.querySelector('[data-resp="0"]')?.addEventListener('click', () => responder(i, 0));
    app.querySelector('#deshacer').addEventListener('click', deshacer);
    app.querySelector('#terminar').addEventListener('click', () => {
      estado.terminado = true; guardar(); location.hash = '#/';
    });
    document.addEventListener('keydown', teclasDescubrir);
  }
  function responder(i, estrellas) {
    historialDescubrir.push(i);
    if (estrellas === 0) { saltados.add(i); guardar(); } else calificar(i, estrellas);
    colaDescubrir = colaDescubrir.filter(j => j !== i);
    if (calif.size === MIN_CALIFICACIONES && estrellas) aviso('¡Listo! Ya puedes ver tus recomendaciones');
    vistaDescubrir();
    iniciarCalificadores();
  }
  function deshacer() {
    const i = historialDescubrir.pop();
    if (i === undefined) return;
    calificar(i, 0);
    saltados.delete(i);
    guardar();
    colaDescubrir.unshift(i);
    vistaDescubrir();
    iniciarCalificadores();
  }
  function teclasDescubrir(e) {
    if (e.target.matches('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    const el = app.querySelector('.pregunta .calificador');
    if (/^[1-5]$/.test(e.key) && el) fijarCalificacion(el, +el.dataset.id, +e.key);
    else if (e.key === '0') app.querySelector('[data-resp="0"]')?.click();
    else if (e.key === 'z' || e.key === 'Backspace') deshacer();
  }

  // --- Buscar
  function buscar(q) {
    const tokens = normalizar(q).split(/\s+/).filter(Boolean);
    if (!tokens.length) return M.populares.slice(0, 30);
    const res = [];
    for (let i = 0; i < L.length; i++) if (tokens.every(t => indiceBusqueda[i].includes(t))) res.push(i);
    return res.sort((a, b) => L[b].n - L[a].n).slice(0, 50);
  }
  function filaLista(i) {
    const l = L[i];
    return `<li>${poster(i)}
      <div><h3><a href="#/libro/${i}">${esc(l.titulo)}</a></h3>
        <div class="meta">${esc(l.autor)}${l.anio ? ` · ${l.anio}` : ''}${l.serie ? ` · ${esc(l.serie)}` : ''}</div>
        <div class="meta"><span class="estrellas">${textoEstrellas(l.promedio)}</span> ${l.promedio.toFixed(2)} · ${fmt(l.n)} calificaciones</div></div>
      ${calificador(i)}</li>`;
  }
  function vistaBuscar(q) {
    app.innerHTML = `
      <div class="buscador-grande"><input type="search" id="q" value="${esc(q)}" placeholder="Busca por título o autor…" autocomplete="off"></div>
      <div class="nota" id="q-nota" style="margin-top:10px"></div>
      <ul class="lista" id="resultados"></ul>`;
    const inp = app.querySelector('#q');
    const pintar = () => {
      const v = inp.value.trim();
      const res = buscar(v);
      app.querySelector('#q-nota').textContent = v
        ? `${res.length === 50 ? 'Más de 50' : res.length} resultado${res.length === 1 ? '' : 's'} para “${v}”`
        : 'Los más populares. Califica con estrellas los que ya leíste.';
      app.querySelector('#resultados').innerHTML = res.length ? res.map(filaLista).join('') : '<div class="vacio">Sin resultados. Prueba en inglés: el catálogo viene de Goodreads.</div>';
      iniciarCalificadores();
      history.replaceState(null, '', `#/buscar${v ? `?q=${encodeURIComponent(v)}` : ''}`);
    };
    inp.addEventListener('input', pintar);
    pintar();
    if (!q || matchMedia('(min-width: 761px)').matches) inp.focus({ preventScroll: true });
  }

  // --- Libro
  function vistaLibro(i) {
    const l = L[i];
    if (!l) { location.replace('#/'); return; }
    const e = calif.get(i);
    document.title = `${l.titulo} · Estantería`;

    let porque = '';
    if (!e && calif.size && !perfilVacio()) {
      const z = vectorUsuario();
      const s = puntaje(z, i);
      const mejor = recomendar(1)[0];
      const relativo = mejor ? s / puntaje(z, mejor.j) : 0;
      const ms = motivos(i);
      if (relativo > 0.2 && ms.length) {
        porque = `<div class="porque">Te podría gustar porque te gustó ${ms.map(m => `<a href="#/libro/${m}">${esc(L[m].titulo)}</a>`).join(', ').replace(/, ([^,]*)$/, ' y $1')}.</div>`;
      } else if (s < 0) {
        porque = `<div class="porque" style="border-color:var(--naranja);background:#ff80000d">Según tu perfil, probablemente no es para ti.</div>`;
      }
    }

    const similares = parecidos(i, 12);
    app.innerHTML = `
      <div class="libro animar-entrada">
        ${poster(i)}
        <div>
          <h1>${esc(l.titulo)}</h1>
          ${l.serie ? `<div class="serie">${esc(l.serie)}</div>` : ''}
          <div class="autor">de <b>${esc(l.autor)}</b>${l.anio ? ` · ${l.anio}` : ''}</div>
          <div class="datos">
            <div><span>Promedio</span><b>${l.promedio.toFixed(2)}</b> <span class="estrellas">${textoEstrellas(l.promedio)}</span></div>
            <div><span>Calificaciones</span><b>${fmt(l.n)}</b></div>
          </div>
          <div class="panel-acciones">
            <p>${e ? 'Tu calificación' : '¿Ya lo leíste? Califícalo'}</p>
            <div class="botones">
              ${calificador(i, { grande: true })}
              ${e ? `<button class="boton fantasma" data-accion="quitar" data-id="${i}">Quitar</button>` : ''}
            </div>
          </div>
          ${porque}
          ${l.gid ? `<p class="nota" style="margin-top:18px"><a class="enlace" style="font-size:13px" href="https://www.goodreads.com/book/show/${l.gid}" target="_blank" rel="noopener">Ver en Goodreads ↗</a></p>` : ''}
        </div>
      </div>
      <section class="seccion">
        <h2 class="seccion-titulo"><span>Libros parecidos</span><a href="#/como-funciona">¿Por qué estos?</a></h2>
        <div class="rejilla">${similares.map(j => tarjeta(j)).join('')}</div>
      </section>`;
  }

  // --- Mis libros: histograma de estrellas (como en Letterboxd) y rejilla ordenable
  function vistaMisLibros(orden) {
    const entradas = [...calif];
    const ids = orden === 'calificacion'
      ? [...entradas].reverse().sort((a, b) => b[1] - a[1]).map(([id]) => id)
      : entradas.map(([id]) => id).reverse();

    const conteo = Array(10).fill(0);
    for (const [, e] of entradas) conteo[e * 2 - 1]++;
    const maxConteo = Math.max(1, ...conteo);
    const histograma = `<div class="histograma" title="Distribución de tus calificaciones">
      <span class="extremo">★</span>
      <div class="barras">${conteo.map((c, k) =>
        `<div class="barra" style="height:${Math.max(2, c / maxConteo * 100)}%" title="${(k + 1) / 2}★: ${c} libro${c === 1 ? '' : 's'}"></div>`).join('')}</div>
      <span class="extremo">★★★★★</span></div>`;

    app.innerHTML = `
      <div class="resumen-usuario"><div><h1>Mis libros</h1><div class="nota">Guardados solo en este navegador, sin cuenta ni sesión.</div></div>
        <div class="estadisticas">${entradas.length ? histograma : ''}<button class="boton fantasma" data-accion="borrar-todo">Borrar todo</button></div></div>
      <div class="pestanas">
        <button class="${orden !== 'calificacion' ? 'activa' : ''}" onclick="location.hash='#/mis-libros/recientes'">Más recientes</button>
        <button class="${orden === 'calificacion' ? 'activa' : ''}" onclick="location.hash='#/mis-libros/calificacion'">Mejor calificados</button>
      </div>
      ${ids.length ? `<div class="rejilla">${ids.map(j => tarjeta(j)).join('')}</div>`
        : `<div class="vacio"><p>Todavía no has calificado libros.</p><a class="boton verde" href="#/descubrir">Calificar libros</a></div>`}`;
  }

  // --- Cómo funciona
  function vistaComoFunciona() {
    const comp = M.componentes.map(c => `
      <div class="componente"><h4>Componente ${c.c} · ${(c.varianza * 100).toFixed(2)}% de la varianza</h4>
        <div class="etiqueta" style="color:var(--verde)">Extremo positivo</div>
        <div class="polo">${c.pos.map(j => poster(j)).join('')}</div>
        <div class="etiqueta" style="color:var(--naranja)">Extremo negativo</div>
        <div class="polo">${c.neg.map(j => poster(j)).join('')}</div>
      </div>`).join('');
    app.innerHTML = `
      <div class="explicacion">
        <h1>¿Cómo se generan las recomendaciones?</h1>
        <p class="nota">Con Análisis de Componentes Principales (PCA) sobre ${fmt(M.n_calificaciones)} calificaciones reales de ${fmt(M.n_usuarios)} lectores de Goodreads.</p>
        <div class="paso"><div class="paso-num">1</div><div><h3>Matriz usuario × libro</h3>
          <p>Cada fila es un lector y cada columna uno de los ${fmt(L.length)} libros. El ${(M.densidad * 100).toFixed(1)}% de las celdas tiene una calificación; el resto está vacío.</p></div></div>
        <div class="paso"><div class="paso-num">2</div><div><h3>Centrar en el punto neutro</h3>
          <p>A cada calificación se le resta 3, el punto medio de la escala: un 5 queda en +2 ("le encantó"), un 1 en −2 ("lo odió") y las celdas vacías en 0 ("sin opinión"). Tus estrellas se tratan exactamente igual.</p>
          <div class="formula">r̃(u,i) = estrellas(u,i) − 3</div></div></div>
        <div class="paso"><div class="paso-num">3</div><div><h3>PCA: ${K} componentes principales</h3>
          <p>PCA encuentra los ${K} "ejes de gusto" que explican la mayor variación entre lectores (${(M.varianza_total * 100).toFixed(1)}% de la varianza). Cada libro queda descrito por sus cargas en esos ejes. Abajo puedes ver qué libros están en los extremos de los primeros ejes.</p></div></div>
        <div class="paso"><div class="paso-num">4</div><div><h3>Tu perfil</h3>
          <p>Cuando calificas un libro, sus cargas se suman a tu perfil multiplicadas por (estrellas − 3): un libro de 5★ empuja con fuerza (+2), uno de 3★ no mueve nada y uno de 1★ resta (−2). El resultado es tu posición en esos ${K} ejes: la proyección de tus gustos sobre los componentes.</p>
          <div class="formula">z = Σ (estrellas(i) − 3) · v(i)</div></div></div>
        <div class="paso"><div class="paso-num">5</div><div><h3>Recomendar</h3>
          <p>Para cada libro que no has calificado se reconstruye tu calificación esperada multiplicando tu perfil por las cargas del libro. Se muestran los de mayor puntaje. En usuarios reales que no se usaron para entrenar, ${(M.evaluacion.pca * 100).toFixed(0)}% de las 20 recomendaciones eran libros que de verdad leyeron y les gustaron, contra ${(M.evaluacion.popularidad * 100).toFixed(0)}% si solo se recomiendan los más populares. "Libros parecidos" usa la similitud coseno entre las cargas de dos libros.</p>
          <div class="formula">puntaje(j) = z · v(j)</div></div></div>
        <h2 class="seccion-titulo" style="margin-top:40px"><span>Los primeros componentes</span></h2>
        <p class="nota">Cada componente separa dos grupos de libros que suelen gustar a lectores distintos. El componente 1 no aparece porque solo mide popularidad (todos los best-sellers del mismo lado). Por ejemplo, el 2 enfrenta a Harry Potter con las lecturas escolares, y el 3 a la ficción contemporánea con la fantasía y ciencia ficción clásicas.</p>
        <div class="componentes">${comp}</div>
      </div>`;
  }

  iniciar();
})();
