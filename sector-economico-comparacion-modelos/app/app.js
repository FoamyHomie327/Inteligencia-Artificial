// Tablero interactivo del proyecto de prediccion del sector economico (ENOE 2026).
// Lee los resultados exportados por el notebook (datos/resultados.json y datos/modelos.json).
(function () {
  'use strict';

  // ------------------------------------------------------------------
  // Constantes
  // ------------------------------------------------------------------
  const SECT = ['Primario', 'Secundario', 'Terciario'];
  const COLOR = { Primario: '#1baf7a', Secundario: '#2a78d6', Terciario: '#eb6834' };
  const SUAVE = { Primario: '#e2f5ee', Secundario: '#e4eefb', Terciario: '#fdebe3' };
  const APODO = { Primario: 'el campo', Secundario: 'la industria', Terciario: 'los servicios' };
  const EJEMPLOS = {
    Primario: 'Agricultura, ganadería, pesca y aprovechamiento forestal.',
    Secundario: 'Fábricas, construcción, minería y electricidad.',
    Terciario: 'Comercio, transporte, educación, salud, restaurantes y gobierno.'
  };
  const ICONO = {
    Primario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V11"/><path d="M12 11c0-4.5 3-7.5 8-7.5 0 5-3 8.2-8 7.5z"/><path d="M12 14.5c0-3.2-2.6-5.8-7-5.8 0 4.2 2.6 6.8 7 5.8z"/></svg>',
    Secundario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M4 20V10l5 3v-3l5 3V5h4l2 15"/><path d="M8 17h1M12 17h1"/></svg>',
    Terciario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10h17L19 5H5z"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>'
  };
  const PERSONA = '<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="3.6"/><path d="M4.8 21c0-4.3 3.2-7.4 7.2-7.4s7.2 3.1 7.2 7.4z"/></svg>';

  const ORDEN = ['logistica', 'lda', 'arbol', 'rf', 'gb', 'svm', 'red'];
  const MODELOS = {
    referencia: { nombre: 'Siempre terciario', desc: 'No aprende nada: a todos les dice "servicios".' },
    logistica: {
      nombre: 'Regresión logística',
      desc: 'Le da un peso a cada variable y traza fronteras rectas entre los sectores. Es el modelo más sencillo.',
      pros: ['Entrena en milisegundos', 'Cada variable tiene un coeficiente que se puede interpretar', 'Muy estable entre folds'],
      contras: ['Sus fronteras son rectas y los sectores no se separan así', 'No capta combinaciones como "rural y con ingreso bajo"']
    },
    lda: {
      nombre: 'LDA',
      desc: 'Supone que cada sector es una "nube" con forma de campana y busca las líneas que mejor separan esas nubes.',
      pros: ['Muy rápido', 'Funciones discriminantes fáciles de visualizar'],
      contras: ['No puede usar sexo ni tipo de localidad, que son las variables más útiles', 'Sus supuestos (normalidad, misma varianza) se cumplen solo a medias']
    },
    arbol: {
      nombre: 'Árbol de decisión',
      desc: 'Hace preguntas de sí o no (¿vive en zona rural?, ¿gana menos de cierto monto?) hasta llegar a un sector.',
      pros: ['Se puede leer regla por regla', 'Usa variables binarias y cortes de ingreso sin problema', 'Primer salto grande sobre los modelos lineales'],
      contras: ['Es inestable: cambia bastante entre folds', 'Un solo árbol tiene poca precisión']
    },
    rf: {
      nombre: 'Random Forest',
      desc: '300 árboles distintos, cada uno entrenado con una muestra diferente, votan y gana el sector con más votos.',
      pros: ['El más estable de todos', 'La mejor exactitud', 'Entrena en un par de segundos'],
      contras: ['Memoriza el entrenamiento (F1 de 0.93 contra 0.58 en validación)', 'Se le escapa casi la mitad de las personas del campo']
    },
    gb: {
      nombre: 'Gradient Boosting',
      desc: 'Árboles pequeños en fila: cada uno se enfoca en corregir los errores de los anteriores.',
      pros: ['El mejor F1 macro', 'El que mejor detecta al campo y a la industria', 'Casi no sobreajusta gracias al early stopping'],
      contras: ['Más lento que el Random Forest', 'No se puede leer árbol por árbol']
    },
    svm: {
      nombre: 'SVM',
      desc: 'Busca la frontera que deja el mayor margen posible entre sectores, y la dobla con un kernel radial.',
      pros: ['Puede hacer fronteras curvas', 'Casi no sobreajusta'],
      contras: ['Muy lenta: solo se pudo entrenar con 20,000 personas por fold', 'No le gana ni al árbol sencillo', 'Es una caja negra']
    },
    red: {
      nombre: 'Red neuronal',
      desc: 'Dos capas de neuronas (32 y 16) con 803 pesos que aprenden combinaciones de las variables.',
      pros: ['Fronteras suaves y flexibles', 'Casi no sobreajusta gracias al early stopping'],
      contras: ['La menos estable entre folds', 'La que más tarda en entrenar', 'Queda prácticamente igual que un árbol']
    }
  };
  const SIMULABLES = ['gb', 'logistica', 'lda', 'arbol', 'red'];
  const METRICAS = { f1: 'F1 macro', exactitud: 'Exactitud', precision: 'Precisión', sensibilidad: 'Sensibilidad' };
  const AYUDA_METRICA = {
    f1: 'Promedio del F1 de los 3 sectores, sin importar qué tan grande es cada uno. Es la métrica principal.',
    exactitud: 'Porcentaje de personas bien clasificadas. Engaña: decir siempre "servicios" ya da 65.6%.',
    precision: 'Cuando el modelo dice un sector, qué tan seguido acierta (promedio de los 3 sectores).',
    sensibilidad: 'De las personas que sí son de un sector, cuántas detecta el modelo (promedio de los 3 sectores).'
  };
  const VARS = {
    eda: { nombre: 'Edad', min: 15, max: 80, paso: 1, fmt: function (v) { return Math.round(v) + ' años'; } },
    anios_esc: { nombre: 'Escolaridad', min: 0, max: 24, paso: 1, fmt: function (v) { return Math.round(v) + ' años'; } },
    hrsocup: { nombre: 'Horas a la semana', min: 1, max: 90, paso: 1, fmt: function (v) { return Math.round(v) + ' h'; } },
    ingocup: { nombre: 'Ingreso mensual', min: 1000, max: 80000, log: true, fmt: function (v) { return pesos(v); } }
  };
  const NOMBRE_VAR = {
    eda: 'Edad', anios_esc: 'Escolaridad', hrsocup: 'Horas trabajadas', ingocup: 'Ingreso mensual',
    sex01: 'Sexo', ur01: 'Rural o urbano'
  };
  const PERFILES = [
    { nombre: 'Hombre rural, primaria', p: { eda: 45, anios_esc: 6, hrsocup: 48, ingocup: 5000, sex01: 0, ur01: 1 } },
    { nombre: 'Hombre urbano, secundaria', p: { eda: 30, anios_esc: 9, hrsocup: 48, ingocup: 10000, sex01: 0, ur01: 0 } },
    { nombre: 'Mujer urbana, licenciatura', p: { eda: 35, anios_esc: 16, hrsocup: 40, ingocup: 15000, sex01: 1, ur01: 0 } },
    { nombre: 'Mujer rural, primaria', p: { eda: 50, anios_esc: 6, hrsocup: 30, ingocup: 4000, sex01: 1, ur01: 1 } }
  ];

  let R = null;   // resultados.json
  let M = null;   // modelos.json
  const estado = {
    varDist: 'anios_esc',
    metrica: 'f1',
    modelo: 'gb',
    tabla: false,
    matrizModelo: 'pct',
    matrizFinal: 'pct',
    importancia: 'permutacion',
    perfil: { eda: 39, anios_esc: 11, hrsocup: 45, ingocup: 9500, sex01: 0, ur01: 0 },
    modeloSim: 'gb',
    varCurva: 'anios_esc',
    modeloMapa: 'gb'
  };
  const redibujar = [];   // funciones que dependen del ancho de la pantalla

  // ------------------------------------------------------------------
  // Utilidades
  // ------------------------------------------------------------------
  function num(v, d) {
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }).format(v);
  }
  function pct(v, d) { return num(v * 100, d === undefined ? 0 : d) + '%'; }
  function pesos(v) { return '$' + num(v); }
  function pesosCorto(v) { return v >= 1000 ? '$' + num(v / 1000) + 'k' : '$' + num(v); }
  function media(a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; }
  function desv(a) {
    const m = media(a);
    return Math.sqrt(a.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / (a.length - 1));
  }
  function el(tag, clase, html) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  const NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, padre) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (padre) padre.appendChild(e);
    return e;
  }
  function texto(padre, x, y, contenido, attrs) {
    const t = s('text', Object.assign({ x: x, y: y }, attrs || {}), padre);
    t.textContent = contenido;
    return t;
  }
  function svgBase(cont, W, H) {
    cont.innerHTML = '';
    return s('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img' }, cont);
  }
  function anchoDe(cont, minimo) { return Math.max(minimo || 280, Math.floor(cont.clientWidth)); }
  function segmentado(opciones, actual, alCambiar, ancho) {
    const g = el('div', 'segmentado' + (ancho ? ' ancho' : ''));
    g.setAttribute('role', 'tablist');
    Object.keys(opciones).forEach(function (k) {
      const b = el('button', k === actual ? 'activo' : '', opciones[k]);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', k === actual);
      b.addEventListener('click', function () {
        g.querySelectorAll('button').forEach(function (x) { x.classList.remove('activo'); x.setAttribute('aria-selected', false); });
        b.classList.add('activo');
        b.setAttribute('aria-selected', true);
        alCambiar(k);
      });
      g.appendChild(b);
    });
    return g;
  }
  function leyendaSectores(extra) {
    return '<div class="leyenda">' + SECT.map(function (c) {
      return '<span><i' + (extra ? ' class="linea-key"' : '') + ' style="background:' + COLOR[c] + '"></i>' + c + '</span>';
    }).join('') + '</div>';
  }
  function bordeRedondo(x0, y, w, h, r) {
    // Barra horizontal con el extremo derecho redondeado y el inicio recto
    r = Math.min(r, w, h / 2);
    if (w <= 0) return '';
    return 'M' + x0 + ',' + y + 'h' + (w - r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r + 'v' + (h - 2 * r) +
      'a' + r + ',' + r + ' 0 0 1 ' + (-r) + ',' + r + 'h' + (-(w - r)) + 'z';
  }
  function ticksBonitos(min, max, n) {
    const paso0 = (max - min) / Math.max(1, n);
    const mag = Math.pow(10, Math.floor(Math.log10(paso0)));
    const paso = [1, 2, 2.5, 5, 10].map(function (f) { return f * mag; }).find(function (p) { return p >= paso0; });
    const out = [];
    for (let v = Math.ceil(min / paso) * paso; v <= max + 1e-9; v += paso) out.push(+v.toFixed(10));
    return out;
  }
  function mezclar(hex, alfa) {
    // Mezcla un color con blanco (alfa = 1 es el color puro)
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) { return Math.round(255 + (v - 255) * alfa); });
    return 'rgb(' + c.join(',') + ')';
  }
  function rampaAzul(t) {
    // Rampa secuencial de un solo tono (azul) para las matrices de confusion
    const a = [240, 245, 253], b = [16, 66, 129];
    return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',') + ')';
  }

  // Tooltip
  const tip = document.getElementById('tooltip');
  function mostrarTip(evt, html) {
    tip.innerHTML = html;
    tip.classList.add('visible');
    const x = evt.clientX, y = evt.clientY;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let left = x + 14, top = y - h - 12;
    if (left + w > window.innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 16;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  function ocultarTip() { tip.classList.remove('visible'); }
  function filaTip(color, etiqueta, valor) {
    return '<div class="fila"><span>' + (color ? '<i style="background:' + color + '"></i>' : '') + etiqueta + '</span><b>' + valor + '</b></div>';
  }

  function predecir(clave, perfil) { return Modelos[clave](M[clave], perfil); }
  function maxIdx(p) { return p.indexOf(Math.max.apply(null, p)); }

  // Resumen de la validacion cruzada por modelo
  function resumenCV(k) {
    const f = R.cv[k].folds;
    return {
      f1: media(f.f1), f1std: desv(f.f1), exactitud: media(f.exactitud), precision: media(f.precision),
      sensibilidad: media(f.sensibilidad), f1train: media(f.f1_train), tiempo: media(f.tiempo)
    };
  }

  // ------------------------------------------------------------------
  // Graficas genericas
  // ------------------------------------------------------------------

  // Lineas con area suave, cuadricula, marcador opcional y tooltip con cruz
  function graficaLineas(cont, o) {
    const W = anchoDe(cont), H = o.alto || 300;
    const m = { t: 14, r: 18, b: 34, l: 46 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const xs = o.x, x0 = o.xMin !== undefined ? o.xMin : xs[0], x1 = o.xMax !== undefined ? o.xMax : xs[xs.length - 1];
    let ymax = o.yMax;
    if (!ymax) {
      let mx = 0;
      o.series.forEach(function (se) { se.valores.forEach(function (v) { if (v > mx) mx = v; }); });
      const t = ticksBonitos(0, mx, 4);
      const paso = t.length > 1 ? t[1] - t[0] : mx;
      ymax = Math.ceil(mx * 1.04 / paso) * paso;
    }
    const sx = function (v) { return m.l + (v - x0) / (x1 - x0) * iw; };
    const sy = function (v) { return m.t + ih - v / ymax * ih; };
    const svg = svgBase(cont, W, H);
    const eje = s('g', { class: 'eje' }, svg);
    ticksBonitos(0, ymax, 4).forEach(function (t) {
      s('line', { x1: m.l, x2: W - m.r, y1: sy(t), y2: sy(t), 'stroke-width': 1 }, eje);
      texto(eje, m.l - 8, sy(t) + 4, o.yFmt(t), { 'text-anchor': 'end' });
    });
    (o.xTicks || ticksBonitos(x0, x1, 6)).forEach(function (t) {
      texto(eje, sx(t), H - 10, o.xFmt(t), { 'text-anchor': 'middle' });
    });
    s('line', { x1: m.l, x2: W - m.r, y1: m.t + ih, y2: m.t + ih, stroke: '#d2d2d7', 'stroke-width': 1 }, svg);

    o.series.forEach(function (se) {
      const pts = xs.map(function (x, i) { return [sx(x), sy(se.valores[i])]; });
      const d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('');
      if (o.area !== false) {
        s('path', { d: d + 'L' + pts[pts.length - 1][0] + ',' + sy(0) + 'L' + pts[0][0] + ',' + sy(0) + 'Z', fill: se.color, opacity: 0.1 }, svg);
      }
      s('path', { d: d, fill: 'none', stroke: se.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
    });

    if (o.marcador !== undefined) {
      const xm = sx(Math.min(x1, Math.max(x0, o.marcador)));
      s('line', { x1: xm, x2: xm, y1: m.t, y2: m.t + ih, stroke: '#1d1d1f', 'stroke-width': 1, opacity: 0.35 }, svg);
      o.series.forEach(function (se) {
        const v = o.valorEn ? o.valorEn(se) : null;
        if (v !== null && v !== undefined) s('circle', { cx: xm, cy: sy(v), r: 5, fill: se.color, stroke: '#fff', 'stroke-width': 2 }, svg);
      });
      texto(svg, xm, m.t - 2, o.marcadorTexto || '', { 'text-anchor': xm > W - 80 ? 'end' : 'middle', class: 'etiqueta-dato' });
    }

    // Capa de hover
    const guia = s('line', { y1: m.t, y2: m.t + ih, stroke: '#86868b', 'stroke-width': 1, opacity: 0 }, svg);
    const puntos = o.series.map(function (se) { return s('circle', { r: 4.5, fill: se.color, stroke: '#fff', 'stroke-width': 2, opacity: 0 }, svg); });
    const zona = s('rect', { x: m.l, y: m.t, width: iw, height: ih, fill: 'transparent' }, svg);
    zona.addEventListener('mousemove', function (e) {
      const caja = svg.getBoundingClientRect();
      const px = (e.clientX - caja.left) * (W / caja.width);
      let mejor = 0, dist = Infinity;
      xs.forEach(function (x, i) { const d = Math.abs(sx(x) - px); if (d < dist) { dist = d; mejor = i; } });
      const gx = sx(xs[mejor]);
      guia.setAttribute('x1', gx); guia.setAttribute('x2', gx); guia.setAttribute('opacity', 1);
      puntos.forEach(function (p, j) {
        p.setAttribute('cx', gx); p.setAttribute('cy', sy(o.series[j].valores[mejor])); p.setAttribute('opacity', 1);
      });
      mostrarTip(e, '<b>' + o.tipX(xs[mejor]) + '</b>' + o.series.map(function (se) {
        return filaTip(se.color, se.nombre, o.yFmtTip(se.valores[mejor]));
      }).join(''));
    });
    zona.addEventListener('mouseleave', function () {
      guia.setAttribute('opacity', 0);
      puntos.forEach(function (p) { p.setAttribute('opacity', 0); });
      ocultarTip();
    });
  }

  // Barras horizontales de una sola serie (importancia de variables)
  function graficaBarrasH(cont, filas, o) {
    const W = anchoDe(cont), filaH = 40, m = { t: 6, r: 70, b: 6, l: o.izq || 140 };
    const H = m.t + m.b + filas.length * filaH;
    const iw = W - m.l - m.r;
    const vmax = o.max || Math.max.apply(null, filas.map(function (f) { return f.valor; }));
    const svg = svgBase(cont, W, H);
    filas.forEach(function (f, i) {
      const y = m.t + i * filaH + (filaH - 20) / 2;
      const w = Math.max(2, f.valor / vmax * iw);
      texto(svg, m.l - 12, y + 14, f.etiqueta, { 'text-anchor': 'end', class: 'etiqueta-modelo' });
      s('rect', { x: m.l, y: y, width: iw, height: 20, rx: 4, fill: '#f2f2f5' }, svg);
      const barra = s('path', { d: bordeRedondo(m.l, y, w, 20, 4), fill: f.color || 'var(--modelo)' }, svg);
      texto(svg, m.l + w + 8, y + 14, o.fmt(f.valor), { class: 'etiqueta-dato' });
      const zona = s('rect', { x: 0, y: y - 8, width: W, height: 36, fill: 'transparent' }, svg);
      zona.addEventListener('mousemove', function (e) { mostrarTip(e, f.tip); barra.setAttribute('opacity', 0.85); });
      zona.addEventListener('mouseleave', function () { ocultarTip(); barra.setAttribute('opacity', 1); });
    });
  }

  // Matriz de confusion en HTML
  function matrizConfusion(cont, matriz, modo) {
    cont.innerHTML = '';
    const g = el('div', 'matriz');
    g.appendChild(el('div', 'encab', ''));
    SECT.forEach(function (c) { g.appendChild(el('div', 'encab', '<span><span class="punto" style="background:' + COLOR[c] + '"></span> ' + c + '</span>')); });
    matriz.forEach(function (fila, i) {
      const total = fila.reduce(function (a, b) { return a + b; }, 0);
      g.appendChild(el('div', 'encab encab-fila', '<span class="punto" style="background:' + COLOR[SECT[i]] + '"></span>&nbsp;' + SECT[i]));
      fila.forEach(function (v, j) {
        const p = v / total;
        const celda = el('div', 'celda', modo === 'pct' ? pct(p) + '<small>' + num(v) + '</small>' : num(v) + '<small>' + pct(p) + '</small>');
        celda.style.background = rampaAzul(Math.pow(p, 0.8));
        celda.style.color = p > 0.42 ? '#fff' : '#1d1d1f';
        celda.addEventListener('mousemove', function (e) {
          mostrarTip(e, i === j
            ? '<b>Aciertos en ' + SECT[i].toLowerCase() + '</b><br>' + num(v) + ' de ' + num(total) + ' personas (' + pct(p) + ')'
            : '<b>' + num(v) + ' personas de ' + SECT[i].toLowerCase() + '</b><br>clasificadas como ' + SECT[j].toLowerCase() + ' (' + pct(p, 1) + ' de su sector)');
        });
        celda.addEventListener('mouseleave', ocultarTip);
        g.appendChild(celda);
      });
    });
    cont.appendChild(g);
    cont.appendChild(el('div', 'matriz-ejes', '<span>Filas: sector real</span><span>Columnas: sector que predijo el modelo</span>'));
  }

  // ------------------------------------------------------------------
  // Secciones
  // ------------------------------------------------------------------
  function seccion(id, etiqueta, titulo, sub) {
    const sec = el('section', 'seccion');
    sec.id = id;
    sec.appendChild(el('div', 'seccion-titulo aparecer',
      '<span class="etiqueta">' + etiqueta + '</span><h2>' + titulo + '</h2>' + (sub ? '<p>' + sub + '</p>' : '')));
    return sec;
  }

  function portada(app) {
    const d = R.datos, p = R.prueba;
    const sec = el('section', 'portada');
    sec.id = 'inicio';
    sec.innerHTML =
      '<span class="etiqueta aparecer">ENOE 2026 · 7 modelos de clasificación</span>' +
      '<h1 class="aparecer">¿Tu perfil decide <span class="degradado">en qué trabajas?</span></h1>' +
      '<p class="lead aparecer">Con solo seis datos de una persona (edad, escolaridad, horas, ingreso, sexo y si vive en zona rural) intentamos adivinar si trabaja en el campo, en la industria o en los servicios. Esto es lo que encontramos.</p>' +
      '<div class="botones aparecer"><a class="boton boton-lleno" href="#simulador">Probar el simulador</a><a class="boton boton-claro" href="#modelos">Ver los modelos</a></div>';
    const cifras = el('div', 'rejilla rejilla-4 cifras');
    [
      [num(d.n_limpio), 'personas ocupadas analizadas'],
      ['7', 'modelos comparados con validación cruzada'],
      [num(p.metricas['F1-score (macro)'], 3), 'F1 macro del modelo final en datos nuevos'],
      [Math.round(p.por_clase.Primario.recall * 10) + ' de 10', 'personas del campo identificadas']
    ].forEach(function (c) {
      cifras.appendChild(el('div', 'tarjeta cifra aparecer', '<div class="cifra-valor">' + c[0] + '</div><div class="cifra-etiqueta">' + c[1] + '</div>'));
    });
    sec.appendChild(cifras);
    app.appendChild(sec);
  }

  function seccionDatos(app) {
    const d = R.datos;
    const sec = seccion('datos', 'Los datos', 'Tres sectores, tres perfiles muy distintos',
      'Encuesta Nacional de Ocupación y Empleo (INEGI), primer trimestre de 2026. Las gráficas usan solo el set de entrenamiento (' + num(d.n_train) + ' personas).');

    // Waffle de balance de clases
    const total = SECT.reduce(function (a, c) { return a + d.conteo_limpio[c]; }, 0);
    const crudos = SECT.map(function (c) { return d.conteo_limpio[c] / total * 100; });
    const cuadros = crudos.map(Math.floor);
    let falta = 100 - cuadros.reduce(function (a, b) { return a + b; }, 0);
    crudos.map(function (v, i) { return [v - Math.floor(v), i]; }).sort(function (a, b) { return b[0] - a[0]; })
      .forEach(function (x) { if (falta > 0) { cuadros[x[1]]++; falta--; } });
    const tarjetaBal = el('div', 'tarjeta aparecer');
    const bal = el('div', 'balance');
    const waffle = el('div', 'waffle');
    waffle.setAttribute('aria-label', 'De cada 100 personas ocupadas: ' + SECT.map(function (c, i) { return cuadros[i] + ' ' + c; }).join(', '));
    SECT.forEach(function (c, i) {
      for (let k = 0; k < cuadros[i]; k++) {
        const q = el('i');
        q.style.background = COLOR[c];
        q.addEventListener('mousemove', function (e) { mostrarTip(e, '<b>' + c + '</b> (' + APODO[c] + ')<br>' + num(d.conteo_limpio[c]) + ' personas · ' + pct(d.conteo_limpio[c] / total, 1)); });
        q.addEventListener('mouseleave', ocultarTip);
        waffle.appendChild(q);
      }
    });
    bal.appendChild(waffle);
    bal.appendChild(el('div', 'balance-texto',
      '<h3>De cada 100 personas que trabajan…</h3><p class="sub">Las clases están muy desbalanceadas, por eso decir siempre "servicios" ya acierta al 65.6%.</p>' +
      '<div class="balance-num">' + SECT.map(function (c, i) {
        return '<div><span class="punto" style="background:' + COLOR[c] + '"></span><b>' + cuadros[i] + '</b><span>trabajan en ' + APODO[c] + ' (' + c.toLowerCase() + ')</span></div>';
      }).join('') + '</div>'));
    tarjetaBal.appendChild(bal);
    sec.appendChild(tarjetaBal);
    sec.appendChild(el('div', 'espacio'));

    // Tarjetas de cada sector
    const rej = el('div', 'rejilla rejilla-3');
    SECT.forEach(function (c) {
      const r = d.resumen_sector[c];
      rej.appendChild(el('div', 'tarjeta sector aparecer',
        '<div class="sector-icono" style="background:' + SUAVE[c] + ';color:' + COLOR[c] + '">' + ICONO[c] + '</div>' +
        '<h3>' + c + ' · ' + APODO[c] + '</h3><p class="sub">' + EJEMPLOS[c] + '</p>' +
        '<div class="datos-sector">' +
        '<div><b>' + num(r.esc_prom, 1) + '</b><span>años de escuela en promedio</span></div>' +
        '<div><b>' + pesos(r.ingreso_mediana) + '</b><span>ingreso mensual (mediana)</span></div>' +
        '<div><b>' + num(r.pct_rural, 0) + '%</b><span>vive en zona rural</span></div>' +
        '<div><b>' + num(r.pct_mujer, 0) + '%</b><span>son mujeres</span></div>' +
        '</div>'));
    });
    sec.appendChild(rej);
    sec.appendChild(el('div', 'espacio'));

    // Distribucion de una variable por sector
    const tarjetaDist = el('div', 'tarjeta aparecer');
    const cab = el('div', 'tarjeta-cabeza', '<div><h3>¿Cómo se distribuye cada variable?</h3><p class="sub">Porcentaje de personas de cada sector en cada rango</p></div>');
    const opcionesDist = { anios_esc: 'Escolaridad', log_ingocup: 'Ingreso', eda: 'Edad', hrsocup: 'Horas' };
    const IDEAS = {
      anios_esc: '<strong>La escolaridad es la variable continua que mejor separa al campo.</strong> Los picos en 6, 9, 12 y 16 años son primaria, secundaria, prepa y licenciatura terminadas. El campo se concentra en 0 a 6 años; servicios, en 12 y 16 o más.',
      log_ingocup: '<strong>El campo gana menos</strong> (mediana de ' + pesos(d.resumen_sector.Primario.ingreso_mediana) + ' al mes), pero las curvas de industria y servicios prácticamente se enciman: con el ingreso no se pueden distinguir.',
      eda: '<strong>La edad casi no ayuda.</strong> El campo tiene un poco más de personas mayores, pero industria y servicios se ven casi iguales.',
      hrsocup: '<strong>Los tres sectores tienen su pico en la jornada de 40 a 48 horas.</strong> La industria se concentra más ahí; los servicios tienen más jornadas cortas y también muy largas.'
    };
    const contDist = el('div', 'grafica');
    const ideaDist = el('div', 'idea');
    function dibujarDist() {
      const v = estado.varDist, dist = d.distribuciones[v];
      const esIngreso = v === 'log_ingocup';
      graficaLineas(contDist, {
        x: dist.centros,
        series: SECT.map(function (c) { return { nombre: c, color: COLOR[c], valores: dist.pct[c] }; }),
        yFmt: function (t) { return num(t) + '%'; },
        yFmtTip: function (t) { return num(t, 1) + '%'; },
        xFmt: esIngreso ? function (t) { return pesosCorto(Math.exp(t)); } : function (t) { return num(t); },
        xTicks: esIngreso ? [1000, 3000, 10000, 30000, 100000].map(Math.log) : undefined,
        tipX: esIngreso ? function (t) { return 'Cerca de ' + pesos(Math.round(Math.exp(t) / 100) * 100) + ' al mes'; }
          : v === 'anios_esc' ? function (t) { return Math.round(t) + ' años de escuela'; }
            : v === 'eda' ? function (t) { return Math.round(t - 1) + ' a ' + Math.round(t + 1) + ' años de edad'; }
              : function (t) { return Math.round(t - 2) + ' a ' + Math.round(t + 2) + ' horas por semana'; },
        alto: 300
      });
      ideaDist.innerHTML = IDEAS[v];
    }
    const ctrl = el('div', 'controles');
    ctrl.appendChild(segmentado(opcionesDist, estado.varDist, function (k) { estado.varDist = k; dibujarDist(); }));
    ctrl.appendChild(el('div', '', leyendaSectores(true)));
    tarjetaDist.appendChild(cab);
    tarjetaDist.appendChild(ctrl);
    tarjetaDist.appendChild(contDist);
    tarjetaDist.appendChild(ideaDist);
    sec.appendChild(tarjetaDist);
    sec.appendChild(el('div', 'espacio'));

    // Variables binarias
    const rej2 = el('div', 'rejilla rejilla-2');
    [['localidad', 'Rural o urbano', ['Urbano', 'Rural'],
      '<strong>' + num(d.resumen_sector.Primario.pct_rural, 0) + '% de las personas del campo viven en zona rural.</strong> Es la variable que más claramente identifica al sector primario.'],
    ['sexo', 'Hombres y mujeres', ['Hombre', 'Mujer'],
      '<strong>' + num(d.binarias.sexo.Mujer.Terciario, 0) + '% de las mujeres que trabajan lo hacen en servicios</strong>, contra ' + num(d.binarias.sexo.Hombre.Terciario, 0) + '% de los hombres. Solo ' + num(d.resumen_sector.Primario.pct_mujer, 0) + '% de quienes trabajan en el campo son mujeres.']
    ].forEach(function (cfg) {
      const t = el('div', 'tarjeta aparecer');
      t.appendChild(el('div', 'tarjeta-cabeza', '<div><h3>' + cfg[1] + '</h3><p class="sub">¿En qué sector trabaja cada grupo?</p></div>'));
      const cont = el('div', 'grafica');
      t.appendChild(cont);
      t.appendChild(el('div', '', leyendaSectores()));
      t.appendChild(el('div', 'idea', cfg[3]));
      rej2.appendChild(t);
      redibujar.push(function () { apiladas(cont, cfg[2], d.binarias[cfg[0]]); });
    });
    sec.appendChild(rej2);
    app.appendChild(sec);
    redibujar.push(dibujarDist);
  }

  // Barras 100% apiladas (una por grupo), con 2px de separacion entre segmentos
  function apiladas(cont, grupos, datos) {
    const W = anchoDe(cont), filaH = 58, m = { l: 70, r: 4 };
    const H = grupos.length * filaH + 6;
    const iw = W - m.l - m.r;
    const svg = svgBase(cont, W, H);
    grupos.forEach(function (g, i) {
      const y = 8 + i * filaH;
      texto(svg, 0, y + 22, g, { class: 'etiqueta-modelo' });
      let x = m.l;
      SECT.forEach(function (c, j) {
        const v = datos[g][c];
        const w = v / 100 * iw - (j < 2 ? 2 : 0);
        const r = s('rect', { x: x, y: y, width: Math.max(0, w), height: 34, rx: 6, fill: COLOR[c] }, svg);
        const etiqueta = num(v, 0) + '%';
        if (w > etiqueta.length * 8 + 14) texto(svg, x + w / 2, y + 22, etiqueta, { 'text-anchor': 'middle', fill: '#fff', 'font-size': 13, 'font-weight': 600 });
        r.addEventListener('mousemove', function (e) { mostrarTip(e, '<b>' + g + '</b>' + filaTip(COLOR[c], c, num(v, 1) + '%')); });
        r.addEventListener('mouseleave', ocultarTip);
        x += w + 2;
      });
    });
  }

  function seccionModelos(app) {
    const sec = seccion('modelos', 'Los modelos', 'Siete formas de adivinar un sector',
      'Todos se evaluaron con los mismos 5 folds de validación cruzada sobre el entrenamiento. Haz clic en un modelo para ver cómo se equivoca.');

    // Comparacion de metricas
    const tarjeta = el('div', 'tarjeta aparecer');
    tarjeta.appendChild(el('div', 'tarjeta-cabeza', '<div><h3>¿Qué modelo predice mejor?</h3><p class="sub" id="ayuda-metrica"></p></div>'));
    const ctrl = el('div', 'controles');
    const contBarras = el('div', 'grafica');
    const contTabla = el('div', 'tabla-envoltura');
    contTabla.hidden = true;
    const botonTabla = el('button', 'enlace-boton', 'Ver tabla');
    botonTabla.type = 'button';
    botonTabla.addEventListener('click', function () {
      estado.tabla = !estado.tabla;
      contTabla.hidden = !estado.tabla;
      contBarras.hidden = estado.tabla;
      botonTabla.textContent = estado.tabla ? 'Ver gráfica' : 'Ver tabla';
    });
    ctrl.appendChild(segmentado(METRICAS, estado.metrica, function (k) { estado.metrica = k; dibujarBarras(); }));
    ctrl.appendChild(botonTabla);
    tarjeta.appendChild(ctrl);
    tarjeta.appendChild(contBarras);
    tarjeta.appendChild(contTabla);
    tarjeta.appendChild(el('p', 'nota', 'La barra es el promedio de los 5 folds y cada punto es un fold. La línea vertical es el modelo que siempre dice "servicios".'));
    sec.appendChild(tarjeta);
    sec.appendChild(el('div', 'espacio'));

    // Detalle del modelo seleccionado
    const detalle = el('div', 'rejilla rejilla-2');
    const tarjetaInfo = el('div', 'tarjeta aparecer');
    const tarjetaMatriz = el('div', 'tarjeta aparecer');
    detalle.appendChild(tarjetaInfo);
    detalle.appendChild(tarjetaMatriz);
    sec.appendChild(detalle);
    sec.appendChild(el('div', 'espacio'));

    // Complejidad y sobreajuste
    const rej = el('div', 'rejilla rejilla-2');
    const tarjetaComp = el('div', 'tarjeta aparecer');
    tarjetaComp.appendChild(el('div', 'tarjeta-cabeza', '<div><h3>Complejidad contra desempeño</h3><p class="sub">Tiempo de entrenamiento por fold contra F1 macro</p></div>'));
    const contComp = el('div', 'grafica');
    tarjetaComp.appendChild(contComp);
    tarjetaComp.appendChild(el('div', 'idea', '<strong>Más tiempo no significa mejor modelo.</strong> La red neuronal es la que más tarda y queda igual que un árbol que entrena en un segundo. El salto grande fue pasar de fronteras rectas (logística, LDA) a árboles, y luego juntar muchos árboles.'));
    const tarjetaSobre = el('div', 'tarjeta aparecer');
    tarjetaSobre.appendChild(el('div', 'tarjeta-cabeza', '<div><h3>¿Memoriza o aprende?</h3><p class="sub">F1 macro en entrenamiento contra validación</p></div>'));
    tarjetaSobre.appendChild(el('div', '', '<div class="leyenda" style="margin-bottom:10px"><span><i style="background:#aeaeb2"></i>Entrenamiento</span><span><i style="background:var(--modelo)"></i>Validación</span></div>'));
    const contSobre = el('div', 'grafica');
    tarjetaSobre.appendChild(contSobre);
    tarjetaSobre.appendChild(el('div', 'idea', '<strong>El Random Forest memoriza su entrenamiento</strong> (0.93 contra 0.58), aunque eso no le pega en datos nuevos. Los demás tienen brechas muy chicas.'));
    rej.appendChild(tarjetaComp);
    rej.appendChild(tarjetaSobre);
    sec.appendChild(rej);
    app.appendChild(sec);

    function dibujarBarras() {
      document.getElementById('ayuda-metrica').textContent = AYUDA_METRICA[estado.metrica];
      const met = estado.metrica;
      const claveFolds = met;
      const filas = ORDEN.map(function (k) { return { k: k, folds: R.cv[k].folds[claveFolds], prom: media(R.cv[k].folds[claveFolds]) }; })
        .sort(function (a, b) { return b.prom - a.prom; });
      const ref = media(R.cv.referencia.folds[claveFolds]);
      const W = anchoDe(contBarras), filaH = 46, m = { t: 30, r: 64, b: 28, l: W < 520 ? 128 : 170 };
      const H = m.t + m.b + filas.length * filaH;
      const iw = W - m.l - m.r, vmax = 0.8;
      const sx = function (v) { return m.l + v / vmax * iw; };
      const svg = svgBase(contBarras, W, H);
      const eje = s('g', { class: 'eje' }, svg);
      [0, 0.2, 0.4, 0.6, 0.8].forEach(function (t) {
        s('line', { x1: sx(t), x2: sx(t), y1: m.t - 6, y2: H - m.b, 'stroke-width': 1 }, eje);
        texto(eje, sx(t), H - 8, met === 'exactitud' ? pct(t) : num(t, 1), { 'text-anchor': 'middle' });
      });
      // Referencia
      s('line', { x1: sx(ref), x2: sx(ref), y1: m.t - 8, y2: H - m.b, stroke: '#1d1d1f', 'stroke-width': 1, opacity: 0.45 }, svg);
      texto(svg, sx(ref), m.t - 14, 'Siempre "servicios": ' + (met === 'exactitud' ? pct(ref, 1) : num(ref, 3)),
        { 'text-anchor': sx(ref) > W - 140 ? 'end' : 'middle', class: 'etiqueta-dato' });

      filas.forEach(function (f, i) {
        const y = m.t + i * filaH + (filaH - 20) / 2;
        const sel = f.k === estado.modelo;
        const color = sel ? 'var(--modelo)' : '#c7c7cc';
        const g = s('g', { class: 'clicable', tabindex: 0, role: 'button', 'aria-label': MODELOS[f.k].nombre }, svg);
        texto(g, m.l - 12, y + 14, MODELOS[f.k].nombre, { 'text-anchor': 'end', class: 'etiqueta-modelo', 'font-weight': sel ? 600 : 400 });
        s('path', { d: bordeRedondo(m.l, y, sx(f.prom) - m.l, 20, 4), fill: color }, g);
        f.folds.forEach(function (v) {
          s('circle', { cx: sx(v), cy: y + 10, r: 4, fill: sel ? '#3634a3' : '#8e8e93', stroke: '#fff', 'stroke-width': 2 }, g);
        });
        const xTxt = sx(Math.max(f.prom, Math.max.apply(null, f.folds))) + 10;
        texto(g, xTxt, y + 14, met === 'exactitud' ? pct(f.prom, 1) : num(f.prom, 3), { class: 'etiqueta-dato', 'font-weight': sel ? 600 : 500 });
        if (f.k === 'gb') texto(g, xTxt, y - 2, 'final', { class: 'etiqueta-dato', fill: '#5e5ce6', 'font-size': 10, 'font-weight': 700 });
        const zona = s('rect', { x: 0, y: y - 12, width: W, height: filaH, fill: 'transparent' }, g);
        zona.addEventListener('mousemove', function (e) {
          mostrarTip(e, '<b>' + MODELOS[f.k].nombre + '</b>' +
            filaTip(null, METRICAS[met] + ' (promedio)', met === 'exactitud' ? pct(f.prom, 1) : num(f.prom, 3)) +
            filaTip(null, 'Desv. estándar entre folds', num(desv(f.folds), 4)) +
            filaTip(null, 'Peor y mejor fold', num(Math.min.apply(null, f.folds), 3) + ' – ' + num(Math.max.apply(null, f.folds), 3)));
        });
        zona.addEventListener('mouseleave', ocultarTip);
        g.addEventListener('click', function () { estado.modelo = f.k; actualizarModelo(); });
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); estado.modelo = f.k; actualizarModelo(); } });
      });

      // Tabla equivalente
      contTabla.innerHTML = '<table class="tabla"><thead><tr><th>Modelo</th><th>F1 macro</th><th>Desv. est.</th><th>Exactitud</th><th>Precisión</th><th>Sensibilidad</th><th>F1 entren.</th><th>Tiempo/fold</th></tr></thead><tbody>' +
        ['referencia'].concat(ORDEN).map(function (k) {
          const r = resumenCV(k);
          return '<tr class="' + (k === 'gb' ? 'resaltada' : '') + '"><td>' + MODELOS[k].nombre + '</td><td>' + num(r.f1, 3) + '</td><td>' + num(r.f1std, 4) +
            '</td><td>' + pct(r.exactitud, 1) + '</td><td>' + num(r.precision, 3) + '</td><td>' + num(r.sensibilidad, 3) + '</td><td>' + num(r.f1train, 3) +
            '</td><td>' + num(r.tiempo, r.tiempo < 1 ? 2 : 1) + ' s</td></tr>';
        }).join('') + '</tbody></table>';
    }

    function dibujarDetalle() {
      const k = estado.modelo, info = MODELOS[k], r = resumenCV(k), cv = R.cv[k];
      tarjetaInfo.innerHTML =
        '<h3>' + info.nombre + (k === 'gb' ? '<span class="insignia">Modelo final</span>' : '') + '</h3>' +
        '<p class="modelo-desc">' + info.desc + '</p>' +
        '<div class="chips"><span class="chip">F1 macro <b>' + num(r.f1, 3) + ' ± ' + num(r.f1std, 3) + '</b></span>' +
        '<span class="chip">Exactitud <b>' + pct(r.exactitud, 1) + '</b></span>' +
        '<span class="chip">Brecha entren.–valid. <b>' + num(r.f1train - r.f1, 3) + '</b></span>' +
        '<span class="chip">Tiempo por fold <b>' + num(r.tiempo, r.tiempo < 1 ? 2 : 1) + ' s</b></span></div>' +
        '<div class="barras-prob" style="margin-top:18px">' + SECT.map(function (c, i) {
          return '<div><div class="barra-prob-cabeza"><span><span class="punto" style="background:' + COLOR[c] + '"></span>Detecta a ' + APODO[c] + '</span><b>' + pct(cv.recall_clase[i]) + '</b></div>' +
            '<div class="pista"><div style="width:' + (cv.recall_clase[i] * 100) + '%;background:' + COLOR[c] + '"></div></div></div>';
        }).join('') + '</div>' +
        '<div class="pros-contras"><div><h4><span class="icono-bien">✓</span>Ventajas</h4><ul>' + info.pros.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
        '<div><h4><span class="icono-mal">✕</span>Limitaciones</h4><ul>' + info.contras.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div></div>';

      tarjetaMatriz.innerHTML = '';
      const cab = el('div', 'tarjeta-cabeza', '<div><h3>¿Cómo se equivoca?</h3><p class="sub">Matriz de confusión fuera de fold: cada persona la predijo un modelo que no la vio</p></div>');
      tarjetaMatriz.appendChild(cab);
      const cont = el('div');
      tarjetaMatriz.appendChild(segmentado({ pct: 'Porcentaje', conteo: 'Personas' }, estado.matrizModelo, function (m) { estado.matrizModelo = m; matrizConfusion(cont, cv.matriz_oof, m); }));
      tarjetaMatriz.appendChild(el('div', 'espacio'));
      tarjetaMatriz.appendChild(cont);
      matrizConfusion(cont, cv.matriz_oof, estado.matrizModelo);
      const m = cv.matriz_oof;
      const sec2ter = m[1][2] / m[1].reduce(function (a, b) { return a + b; }, 0);
      const ter2sec = m[2][1] / m[2].reduce(function (a, b) { return a + b; }, 0);
      tarjetaMatriz.appendChild(el('div', 'idea', '<strong>La confusión más grande es entre industria y servicios:</strong> ' + pct(sec2ter) + ' de la industria se clasifica como servicios y ' + pct(ter2sec) + ' de los servicios como industria. Sus perfiles son demasiado parecidos.'));
    }

    function dibujarComplejidad() {
      const W = anchoDe(contComp), H = 300, m = { t: 16, r: 20, b: 38, l: 46 };
      const iw = W - m.l - m.r, ih = H - m.t - m.b;
      const lx0 = Math.log10(0.005), lx1 = Math.log10(60), y0 = 0.40, y1 = 0.60;
      const sx = function (v) { return m.l + (Math.log10(v) - lx0) / (lx1 - lx0) * iw; };
      const sy = function (v) { return m.t + ih - (v - y0) / (y1 - y0) * ih; };
      const svg = svgBase(contComp, W, H);
      const eje = s('g', { class: 'eje' }, svg);
      [0.40, 0.45, 0.50, 0.55, 0.60].forEach(function (t) {
        s('line', { x1: m.l, x2: W - m.r, y1: sy(t), y2: sy(t), 'stroke-width': 1 }, eje);
        texto(eje, m.l - 8, sy(t) + 4, num(t, 2), { 'text-anchor': 'end' });
      });
      [0.01, 0.1, 1, 10].forEach(function (t) { texto(eje, sx(t), H - 18, (t < 1 ? num(t, t < 0.1 ? 2 : 1) : num(t)) + ' s', { 'text-anchor': 'middle' }); });
      texto(eje, m.l + iw / 2, H - 2, 'segundos por fold (escala logarítmica)', { 'text-anchor': 'middle' });
      ORDEN.map(function (k) { return { k: k, r: resumenCV(k) }; })
        .sort(function (a, b) { return (a.k === estado.modelo) - (b.k === estado.modelo); })
        .forEach(function (p) {
          const sel = p.k === estado.modelo;
          const cx = sx(p.r.tiempo), cy = sy(p.r.f1);
          const g = s('g', { class: 'clicable' }, svg);
          s('circle', { cx: cx, cy: cy, r: sel ? 7 : 5.5, fill: sel ? 'var(--modelo)' : '#8e8e93', stroke: '#fff', 'stroke-width': 2 }, g);
          // Posicion de la etiqueta de cada punto para que no se encimen
          const pos = { rf: 'izq', gb: 'arriba', arbol: 'izq', red: 'arriba', svm: 'abajo', logistica: 'der', lda: 'der' }[p.k];
          const dx = pos === 'izq' ? -11 : pos === 'der' ? 11 : 0;
          const dy = pos === 'arriba' ? -13 : pos === 'abajo' ? 19 : 4;
          let ancla = pos === 'izq' ? 'end' : pos === 'der' ? 'start' : 'middle';
          if (ancla === 'middle' && cx > W - 70) ancla = 'end';
          texto(g, cx + dx + (ancla === 'end' && dx === 0 ? 8 : 0), cy + dy, MODELOS[p.k].nombre, { 'text-anchor': ancla, class: 'etiqueta-dato', fill: sel ? '#1d1d1f' : '#515154', 'font-weight': sel ? 600 : 400 });
          const zona = s('circle', { cx: cx, cy: cy, r: 16, fill: 'transparent' }, g);
          zona.addEventListener('mousemove', function (e) {
            mostrarTip(e, '<b>' + MODELOS[p.k].nombre + '</b>' + filaTip(null, 'F1 macro', num(p.r.f1, 3)) + filaTip(null, 'Tiempo por fold', num(p.r.tiempo, p.r.tiempo < 1 ? 2 : 1) + ' s'));
          });
          zona.addEventListener('mouseleave', ocultarTip);
          g.addEventListener('click', function () { estado.modelo = p.k; actualizarModelo(); });
        });
    }

    function dibujarSobreajuste() {
      const W = anchoDe(contSobre), filaH = 34, m = { t: 4, r: 52, b: 24, l: W < 520 ? 128 : 150 };
      const H = m.t + m.b + ORDEN.length * filaH;
      const iw = W - m.l - m.r;
      const sx = function (v) { return m.l + v * iw; };
      const svg = svgBase(contSobre, W, H);
      const eje = s('g', { class: 'eje' }, svg);
      [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
        s('line', { x1: sx(t), x2: sx(t), y1: 0, y2: H - m.b, 'stroke-width': 1 }, eje);
        texto(eje, sx(t), H - 6, num(t, 2), { 'text-anchor': 'middle' });
      });
      ORDEN.forEach(function (k, i) {
        const r = resumenCV(k), y = m.t + i * filaH + 4;
        texto(svg, m.l - 12, y + 15, MODELOS[k].nombre, { 'text-anchor': 'end', class: 'etiqueta-modelo', 'font-weight': k === estado.modelo ? 600 : 400 });
        s('path', { d: bordeRedondo(m.l, y, sx(r.f1train) - m.l, 11, 3), fill: '#aeaeb2' }, svg);
        s('path', { d: bordeRedondo(m.l, y + 13, sx(r.f1) - m.l, 11, 3), fill: 'var(--modelo)' }, svg);
        if (r.f1train - r.f1 > 0.05) texto(svg, sx(r.f1train) + 6, y + 10, num(r.f1train, 2), { class: 'etiqueta-dato' });
        texto(svg, sx(r.f1) + 6, y + 23, num(r.f1, 2), { class: 'etiqueta-dato' });
        const zona = s('rect', { x: 0, y: y - 4, width: W, height: filaH, fill: 'transparent' }, svg);
        zona.addEventListener('mousemove', function (e) {
          mostrarTip(e, '<b>' + MODELOS[k].nombre + '</b>' + filaTip('#aeaeb2', 'Entrenamiento', num(r.f1train, 3)) + filaTip('#5e5ce6', 'Validación', num(r.f1, 3)) + filaTip(null, 'Brecha', num(r.f1train - r.f1, 3)));
        });
        zona.addEventListener('mouseleave', ocultarTip);
      });
    }

    function actualizarModelo() { dibujarBarras(); dibujarDetalle(); dibujarComplejidad(); dibujarSobreajuste(); }
    redibujar.push(dibujarBarras, dibujarComplejidad, dibujarSobreajuste);
    dibujarDetalle();
  }

  function seccionSimulador(app) {
    const sec = seccion('simulador', 'Simulador', '¿En qué sector trabajaría esta persona?',
      'Mueve los controles para armar un perfil. Los modelos corren aquí mismo, en tu navegador.');
    const cont = el('div', 'simulador');
    const panel = el('div', 'tarjeta panel-controles aparecer');
    const derecha = el('div', 'rejilla');
    cont.appendChild(panel);
    cont.appendChild(derecha);
    sec.appendChild(cont);
    app.appendChild(sec);

    const p = estado.perfil;
    const salidas = {};
    const sliders = {};
    function posIngreso(v) { return Math.round((Math.log(v) - Math.log(1000)) / (Math.log(80000) - Math.log(1000)) * 1000); }
    function valorIngreso(pos) {
      const v = Math.exp(Math.log(1000) + pos / 1000 * (Math.log(80000) - Math.log(1000)));
      return v < 10000 ? Math.round(v / 100) * 100 : Math.round(v / 500) * 500;
    }
    function pintarRelleno(inp) { inp.style.setProperty('--relleno', ((inp.value - inp.min) / (inp.max - inp.min) * 100) + '%'); }
    panel.appendChild(el('h3', '', 'Perfil'));
    panel.appendChild(el('p', 'sub', 'Datos de una persona que trabaja'));
    panel.appendChild(el('div', 'espacio'));
    const ayudas = {
      eda: ['15', '80'], anios_esc: ['Ninguna', 'Posgrado'], hrsocup: ['1 h', '90 h'], ingocup: ['$1,000', '$80,000']
    };
    ['eda', 'anios_esc', 'hrsocup', 'ingocup'].forEach(function (v) {
      const cfg = VARS[v];
      const c = el('div', 'control');
      const id = 'sim-' + v;
      c.innerHTML = '<div class="control-cabeza"><label for="' + id + '">' + cfg.nombre + '</label><output for="' + id + '"></output></div>';
      const inp = document.createElement('input');
      inp.type = 'range';
      inp.id = id;
      if (cfg.log) { inp.min = 0; inp.max = 1000; inp.step = 1; inp.value = posIngreso(p[v]); }
      else { inp.min = cfg.min; inp.max = cfg.max; inp.step = cfg.paso; inp.value = p[v]; }
      inp.addEventListener('input', function () {
        p[v] = cfg.log ? valorIngreso(+inp.value) : +inp.value;
        pintarRelleno(inp);
        programar();
      });
      c.appendChild(inp);
      c.appendChild(el('div', 'control-ayuda', '<span>' + ayudas[v][0] + '</span><span>' + ayudas[v][1] + '</span>'));
      panel.appendChild(c);
      salidas[v] = c.querySelector('output');
      sliders[v] = inp;
      pintarRelleno(inp);
    });
    const segs = {};
    [['sex01', 'Sexo', { 0: 'Hombre', 1: 'Mujer' }], ['ur01', 'Localidad', { 0: 'Urbana', 1: 'Rural' }]].forEach(function (cfg) {
      const c = el('div', 'control');
      c.appendChild(el('div', 'control-cabeza', '<label>' + cfg[1] + '</label>'));
      const contSeg = el('div');
      c.appendChild(contSeg);
      panel.appendChild(c);
      segs[cfg[0]] = function () {
        contSeg.innerHTML = '';
        contSeg.appendChild(segmentado(cfg[2], String(p[cfg[0]]), function (k) { p[cfg[0]] = +k; programar(); }, true));
      };
      segs[cfg[0]]();
    });
    panel.appendChild(el('div', 'control-cabeza', '<label>Perfiles de ejemplo</label>'));
    const pf = el('div', 'perfiles');
    PERFILES.forEach(function (x) {
      const b = el('button', '', x.nombre);
      b.type = 'button';
      b.addEventListener('click', function () {
        Object.assign(p, x.p);
        ['eda', 'anios_esc', 'hrsocup'].forEach(function (v) { sliders[v].value = p[v]; pintarRelleno(sliders[v]); });
        sliders.ingocup.value = posIngreso(p.ingocup);
        pintarRelleno(sliders.ingocup);
        segs.sex01(); segs.ur01();
        programar();
      });
      pf.appendChild(b);
    });
    panel.appendChild(pf);

    // Resultado del modelo final
    const tarjetaRes = el('div', 'tarjeta aparecer');
    const tarjetaComp = el('div', 'tarjeta aparecer');
    tarjetaComp.innerHTML = '<div class="tarjeta-cabeza"><div><h3>¿Qué diría cada modelo?</h3><p class="sub">Probabilidad de cada sector para este mismo perfil</p></div></div>';
    const comp = el('div', 'comparar-modelos');
    tarjetaComp.appendChild(comp);
    tarjetaComp.appendChild(el('div', 'espacio'));
    tarjetaComp.appendChild(el('div', '', leyendaSectores()));
    tarjetaComp.appendChild(el('p', 'nota', 'El Random Forest (300 árboles profundos) y la SVM (miles de vectores de soporte) no se incluyen porque son demasiado pesados para correr en el navegador.'));

    const tarjetaCurva = el('div', 'tarjeta aparecer');
    tarjetaCurva.appendChild(el('div', 'tarjeta-cabeza', '<div><h3>¿Cómo influye cada variable?</h3><p class="sub">Qué pasa con las probabilidades si solo cambia una variable y el resto del perfil se queda igual</p></div>'));
    const ctrlCurva = el('div', 'controles');
    ctrlCurva.appendChild(segmentado({ anios_esc: 'Escolaridad', ingocup: 'Ingreso', hrsocup: 'Horas', eda: 'Edad' }, estado.varCurva, function (k) { estado.varCurva = k; dibujarCurva(); }));
    ctrlCurva.appendChild(segmentado(nombresSim(), estado.modeloSim, function (k) { estado.modeloSim = k; dibujarCurva(); }));
    tarjetaCurva.appendChild(ctrlCurva);
    tarjetaCurva.appendChild(el('div', '', leyendaSectores(true)));
    const contCurva = el('div', 'grafica');
    contCurva.style.marginTop = '8px';
    tarjetaCurva.appendChild(contCurva);

    const tarjetaMapa = el('div', 'tarjeta aparecer');
    tarjetaMapa.appendChild(el('div', 'tarjeta-cabeza', '<div><h3>Mapa de decisión</h3><p class="sub">Sector que predice el modelo para cada combinación de escolaridad e ingreso (con el resto del perfil fijo). Más intenso = más seguro.</p></div>'));
    const ctrlMapa = el('div', 'controles');
    ctrlMapa.appendChild(segmentado(nombresSim(), estado.modeloMapa, function (k) { estado.modeloMapa = k; dibujarMapa(); }));
    tarjetaMapa.appendChild(ctrlMapa);
    const envMapa = el('div', 'mapa-envoltura');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    envMapa.appendChild(canvas);
    tarjetaMapa.appendChild(envMapa);
    tarjetaMapa.appendChild(el('div', '', leyendaSectores()));
    const ideaMapa = el('div', 'idea');
    tarjetaMapa.appendChild(ideaMapa);

    derecha.appendChild(tarjetaRes);
    derecha.appendChild(tarjetaComp);
    derecha.appendChild(tarjetaCurva);
    derecha.appendChild(tarjetaMapa);

    function nombresSim() {
      const o = {};
      SIMULABLES.forEach(function (k) { o[k] = { gb: 'Boosting', logistica: 'Logística', lda: 'LDA', arbol: 'Árbol', red: 'Red' }[k]; });
      return o;
    }

    function dibujarResultado() {
      salidas.eda.textContent = p.eda + ' años';
      salidas.anios_esc.textContent = p.anios_esc + ' años' + ({ 6: ' · primaria', 9: ' · secundaria', 12: ' · prepa', 16: ' · licenciatura' }[p.anios_esc] || '');
      salidas.hrsocup.textContent = p.hrsocup + ' h';
      salidas.ingocup.textContent = pesos(p.ingocup);
      const prob = predecir('gb', p), k = maxIdx(prob), c = SECT[k];
      tarjetaRes.innerHTML =
        '<p class="sub" style="margin:0 0 14px">Gradient Boosting <span class="insignia" style="margin-left:4px">Modelo final</span></p>' +
        '<div class="resultado-grande"><div class="sector-icono" style="background:' + SUAVE[c] + ';color:' + COLOR[c] + '">' + ICONO[c] + '</div>' +
        '<div><h3>' + c + '</h3><p class="sub">Lo más probable es que trabaje en ' + APODO[c] + ' (' + pct(prob[k]) + ' de probabilidad)</p></div></div>' +
        '<div class="barras-prob">' + SECT.map(function (x, i) {
          return '<div><div class="barra-prob-cabeza"><span><span class="punto" style="background:' + COLOR[x] + '"></span>' + x + ' · ' + APODO[x] + '</span><b>' + pct(prob[i], 1) + '</b></div>' +
            '<div class="pista"><div style="width:' + (prob[i] * 100) + '%;background:' + COLOR[x] + '"></div></div></div>';
        }).join('') + '</div>' +
        (prob[k] < 0.5 ? '<div class="idea"><strong>Perfil intermedio:</strong> ningún sector pasa del 50%. Aquí es donde se concentran los errores del modelo.</div>' : '');

      comp.innerHTML = '';
      SIMULABLES.forEach(function (m) {
        const pr = predecir(m, p), j = maxIdx(pr);
        const fila = el('div', 'fila-modelo');
        fila.innerHTML = '<span class="nombre"' + (m === 'gb' ? ' style="font-weight:600"' : '') + '>' + MODELOS[m].nombre + '</span>' +
          '<div class="apilada">' + SECT.map(function (x, i) { return '<div style="width:' + (pr[i] * 100) + '%;background:' + COLOR[x] + '"></div>'; }).join('') + '</div>' +
          '<span class="pred"><span class="punto" style="background:' + COLOR[SECT[j]] + '"></span>' + SECT[j] + '</span>';
        fila.addEventListener('mousemove', function (e) {
          mostrarTip(e, '<b>' + MODELOS[m].nombre + '</b>' + SECT.map(function (x, i) { return filaTip(COLOR[x], x, pct(pr[i], 1)); }).join(''));
        });
        fila.addEventListener('mouseleave', ocultarTip);
        comp.appendChild(fila);
      });
    }

    function rejillaVar(v) {
      const cfg = VARS[v], out = [];
      if (cfg.log) { for (let i = 0; i <= 60; i++) out.push(Math.exp(Math.log(cfg.min) + i / 60 * (Math.log(cfg.max) - Math.log(cfg.min)))); }
      else { for (let x = cfg.min; x <= cfg.max; x += cfg.paso) out.push(x); }
      return out;
    }

    function dibujarCurva() {
      const v = estado.varCurva, mod = estado.modeloSim, cfg = VARS[v];
      const xs = rejillaVar(v);
      const probs = xs.map(function (x) { const q = Object.assign({}, p); q[v] = x; return predecir(mod, q); });
      const esLog = !!cfg.log;
      const tx = esLog ? Math.log : function (x) { return x; };
      graficaLineas(contCurva, {
        x: xs.map(tx),
        series: SECT.map(function (c, i) { return { nombre: c, color: COLOR[c], valores: probs.map(function (pr) { return pr[i]; }) }; }),
        yMax: 1,
        area: false,
        yFmt: function (t) { return pct(t); },
        yFmtTip: function (t) { return pct(t, 1); },
        xFmt: esLog ? function (t) { return pesosCorto(Math.exp(t)); } : function (t) { return num(t); },
        xTicks: esLog ? [1000, 2000, 5000, 10000, 20000, 50000].map(Math.log) : undefined,
        tipX: function (t) { return cfg.fmt(esLog ? Math.exp(t) : t); },
        marcador: tx(p[v]),
        marcadorTexto: 'Perfil actual',
        valorEn: function (se) { return predecir(mod, p)[SECT.indexOf(se.nombre)]; },
        alto: 280
      });
    }

    function dibujarMapa() {
      const mod = estado.modeloMapa;
      const W = anchoDe(envMapa), H = Math.round(Math.min(380, Math.max(260, W * 0.55)));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.height = H + 'px';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const m = { t: 8, r: 8, b: 36, l: 56 };
      const iw = W - m.l - m.r, ih = H - m.t - m.b;
      const nx = Math.min(100, Math.floor(iw / 5)), ny = Math.min(64, Math.floor(ih / 5));
      const lmin = Math.log(1000), lmax = Math.log(80000);
      const conteo = [0, 0, 0];
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
          const esc = (i + 0.5) / nx * 24;
          const ing = Math.exp(lmin + (j + 0.5) / ny * (lmax - lmin));
          const q = Object.assign({}, p, { anios_esc: esc, ingocup: ing });
          const pr = predecir(mod, q), k = maxIdx(pr);
          conteo[k]++;
          const alfa = 0.25 + 0.75 * Math.min(1, (pr[k] - 1 / 3) / (2 / 3) * 1.6);
          ctx.fillStyle = mezclar(COLOR[SECT[k]], alfa);
          const x = m.l + i / nx * iw, y = m.t + ih - (j + 1) / ny * ih;
          ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(iw / nx) + 1, Math.ceil(ih / ny) + 1);
        }
      }
      // Ejes
      ctx.fillStyle = '#86868b';
      ctx.font = '12px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'center';
      [0, 6, 9, 12, 16, 24].forEach(function (t) { ctx.fillText(t, m.l + t / 24 * iw, H - 20); });
      ctx.fillText('Años de escolaridad', m.l + iw / 2, H - 4);
      ctx.textAlign = 'right';
      [1000, 3000, 10000, 30000, 80000].forEach(function (t) {
        ctx.fillText(pesosCorto(t), m.l - 8, m.t + ih - (Math.log(t) - lmin) / (lmax - lmin) * ih + 4);
      });
      // Perfil actual
      const px = m.l + Math.min(24, p.anios_esc) / 24 * iw;
      const py = m.t + ih - (Math.log(p.ingocup) - lmin) / (lmax - lmin) * ih;
      ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#1d1d1f'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
      canvas.setAttribute('aria-label', 'Mapa de decisión de ' + MODELOS[mod].nombre);
      canvas.onmousemove = function (e) {
        const caja = canvas.getBoundingClientRect();
        const x = e.clientX - caja.left, y = e.clientY - caja.top;
        if (x < m.l || x > m.l + iw || y < m.t || y > m.t + ih) { ocultarTip(); return; }
        const esc = Math.round((x - m.l) / iw * 24);
        const ing = Math.exp(lmin + (m.t + ih - y) / ih * (lmax - lmin));
        const pr = predecir(mod, Object.assign({}, p, { anios_esc: esc, ingocup: ing }));
        mostrarTip(e, '<b>' + esc + ' años de escuela · ' + pesos(Math.round(ing / 100) * 100) + '</b>' + SECT.map(function (c, i) { return filaTip(COLOR[c], c, pct(pr[i], 1)); }).join(''));
      };
      canvas.onmouseleave = ocultarTip;
      const IDEA = {
        gb: '<strong>Boosting:</strong> fronteras en escalones, porque suma cientos de árboles pequeños que cortan por umbrales.',
        arbol: '<strong>Árbol:</strong> rectángulos, porque cada regla corta una variable en un umbral.',
        logistica: '<strong>Logística:</strong> fronteras rectas (en escala logarítmica de ingreso). No puede hacer "islas" ni escalones.',
        lda: '<strong>LDA:</strong> fronteras rectas, y además ignora sexo y localidad: el mapa no cambia si mueves esos controles.',
        red: '<strong>Red neuronal:</strong> fronteras curvas y suaves, más flexibles que las rectas pero sin los cortes de los árboles.'
      };
      ideaMapa.innerHTML = IDEA[mod];
    }

    let pendiente = false;
    function programar() {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () {
        pendiente = false;
        dibujarResultado(); dibujarCurva(); dibujarMapa();
      });
    }
    dibujarResultado();
    redibujar.push(dibujarCurva, dibujarMapa);
  }

  function seccionFinal(app) {
    const pr = R.prueba, met = pr.metricas;
    const gbcv = resumenCV('gb');
    const sec = seccion('final', 'Resultado final', 'Así le fue con personas que nunca vio',
      'El Gradient Boosting se eligió solo con la validación cruzada. Después se evaluó una sola vez con ' + num(R.datos.n_test) + ' personas que se apartaron desde el inicio.');

    const rej = el('div', 'rejilla rejilla-2');
    rej.appendChild(el('div', 'tarjeta aparecer',
      '<p class="sub" style="margin:0 0 8px">F1 macro en el conjunto de prueba</p>' +
      '<div class="hero-numero">' + num(met['F1-score (macro)'], 3) + '</div>' +
      '<p class="sub" style="margin-top:10px">Intervalo de 95%: ' + num(pr.ic_f1[0], 3) + ' a ' + num(pr.ic_f1[1], 3) + '. En validación cruzada se había estimado ' + num(gbcv.f1, 3) + ': se comportó como se esperaba.</p>' +
      '<div class="chips" style="margin-top:20px"><span class="chip">Exactitud <b>' + pct(met.Exactitud, 1) + '</b></span>' +
      '<span class="chip">Sensibilidad macro <b>' + num(met['Sensibilidad (macro)'], 3) + '</b></span>' +
      '<span class="chip">Árboles <b>' + pr.arboles + '</b></span>' +
      '<span class="chip">Siempre "servicios" <b>' + num(pr.referencia['F1-score (macro)'], 3) + '</b></span></div>' +
      '<div class="idea">Su exactitud (' + pct(met.Exactitud, 1) + ') es un poco menor que decir siempre "servicios" (' + pct(pr.referencia.Exactitud, 1) + '), pero ese "modelo" no detecta a nadie del campo ni de la industria. El F1 macro es más del doble.</div>'));

    const personas = el('div', 'tarjeta aparecer');
    personas.innerHTML = '<div class="tarjeta-cabeza"><div><h3>En palabras</h3><p class="sub">De cada 10 personas que de verdad trabajan en cada sector…</p></div></div>';
    const lista = el('div', 'personas');
    SECT.forEach(function (c) {
      const pc = pr.por_clase[c], n = Math.round(pc.recall * 10);
      let iconos = '';
      for (let i = 0; i < 10; i++) iconos += PERSONA.replace('<svg', '<svg fill="' + (i < n ? COLOR[c] : '#e5e5ea') + '"');
      const enCuantas = Math.round(1 / pc.precision);
      const frasePrec = pc.precision >= 0.75
        ? 'Cuando dice "' + APODO[c] + '", acierta ' + Math.round(pc.precision * 100) + ' de cada 100 veces.'
        : 'Cuando dice "' + APODO[c] + '", acierta aproximadamente 1 de cada ' + enCuantas + ' veces.';
      lista.appendChild(el('div', 'personas-fila',
        '<h4><span class="punto" style="background:' + COLOR[c] + '"></span>' + c + ' · identifica a ' + n + '</h4>' +
        '<div class="personas-iconos" aria-label="' + n + ' de 10">' + iconos + '</div>' +
        '<p>Sensibilidad de ' + pct(pc.recall) + '. ' + frasePrec + '</p>'));
    });
    personas.appendChild(lista);
    rej.appendChild(personas);
    sec.appendChild(rej);
    sec.appendChild(el('div', 'espacio'));

    const rej2 = el('div', 'rejilla rejilla-2');
    const tarjetaMatriz = el('div', 'tarjeta aparecer');
    tarjetaMatriz.appendChild(el('div', 'tarjeta-cabeza', '<div><h3>Matriz de confusión en prueba</h3><p class="sub">' + num(R.datos.n_test) + ' personas nuevas</p></div>'));
    const contM = el('div');
    tarjetaMatriz.appendChild(segmentado({ pct: 'Porcentaje', conteo: 'Personas' }, estado.matrizFinal, function (m) { estado.matrizFinal = m; matrizConfusion(contM, pr.matriz, m); }));
    tarjetaMatriz.appendChild(el('div', 'espacio'));
    tarjetaMatriz.appendChild(contM);
    matrizConfusion(contM, pr.matriz, estado.matrizFinal);
    tarjetaMatriz.appendChild(el('div', 'idea', '<strong>Casi todos los errores en el campo son al revés:</strong> personas rurales, hombres, con poca escolaridad e ingreso bajo que trabajan en otro sector, pero que "se parecen" al campo.'));

    const tarjetaImp = el('div', 'tarjeta aparecer');
    tarjetaImp.appendChild(el('div', 'tarjeta-cabeza', '<div><h3>¿Qué usa el modelo para decidir?</h3><p class="sub" id="ayuda-imp"></p></div>'));
    const contImp = el('div', 'grafica');
    tarjetaImp.appendChild(segmentado({ permutacion: 'Permutación', impureza: 'Impureza' }, estado.importancia, function (k) { estado.importancia = k; dibujarImp(); }));
    tarjetaImp.appendChild(el('div', 'espacio'));
    tarjetaImp.appendChild(contImp);
    tarjetaImp.appendChild(el('div', 'idea', '<strong>Dónde vive, su sexo, cuánto trabaja y cuánto gana</strong> es lo que más le ayuda al modelo. La edad casi no le sirve.'));
    rej2.appendChild(tarjetaMatriz);
    rej2.appendChild(tarjetaImp);
    sec.appendChild(rej2);
    app.appendChild(sec);

    function dibujarImp() {
      const imp = pr.importancia, tipo = estado.importancia;
      document.getElementById('ayuda-imp').textContent = tipo === 'permutacion'
        ? 'Cuánto baja el F1 macro si se revuelven al azar los valores de una variable'
        : 'Qué parte de la reducción de error de los árboles viene de cada variable';
      const filas = imp.vars.map(function (v, i) {
        const val = imp[tipo][i];
        return {
          etiqueta: NOMBRE_VAR[v], valor: val,
          tip: '<b>' + NOMBRE_VAR[v] + '</b>' + filaTip(null, 'Caída de F1 al permutar', num(imp.permutacion[i], 3)) + filaTip(null, 'Importancia por impureza', pct(imp.impureza[i], 1))
        };
      }).sort(function (a, b) { return b.valor - a.valor; });
      graficaBarrasH(contImp, filas, { fmt: tipo === 'permutacion' ? function (v) { return '−' + num(v, 3); } : function (v) { return pct(v, 0); }, izq: 130 });
    }
    redibujar.push(dibujarImp);
  }

  function seccionConclusiones(app) {
    const d = R.datos, pr = R.prueba;
    const sec = seccion('conclusiones', 'Conclusiones', 'Lo que aprendimos');
    const rej = el('div', 'rejilla rejilla-2');
    [
      ['El campo tiene un perfil muy marcado', 'El ' + num(d.resumen_sector.Primario.pct_rural, 0) + '% vive en zona rural, estudió ' + num(d.resumen_sector.Primario.esc_prom, 1) + ' años en promedio y gana una mediana de ' + pesos(d.resumen_sector.Primario.ingreso_mediana) + ' al mes. Por eso el modelo identifica a ' + Math.round(pr.por_clase.Primario.recall * 10) + ' de cada 10 personas del campo con solo 6 datos: el lugar donde vives y la escuela a la que tuviste acceso pesan mucho en el trabajo que tienes.'],
      ['Industria y servicios se parecen demasiado', 'Tienen escolaridad, ingreso, horas y edad muy parecidos, y ningún modelo logró separarlos bien. La diferencia entre trabajar en una fábrica o en un comercio depende de cosas que no están en estos datos, como la región o la oferta de empleo.'],
      ['Más complejo no siempre es mejor', 'Lo que funcionó fue pasar de fronteras rectas a árboles, y luego juntar muchos árboles. La SVM y la red neuronal, que son las más pesadas, no le ganaron a un árbol sencillo.'],
      ['El modelo final: Gradient Boosting', 'Tuvo el mejor F1 macro en validación cruzada y el comportamiento más equilibrado entre sectores. Con personas nuevas obtuvo ' + num(pr.metricas['F1-score (macro)'], 3) + ', prácticamente lo que se esperaba.']
    ].forEach(function (c, i) {
      rej.appendChild(el('div', 'tarjeta tarjeta-conclusion aparecer', '<div class="numero">0' + (i + 1) + '</div><h3>' + c[0] + '</h3><p>' + c[1] + '</p>'));
    });
    sec.appendChild(rej);
    sec.appendChild(el('div', 'espacio'));
    sec.appendChild(el('div', 'tarjeta aparecer',
      '<h3>Limitaciones</h3><div class="pros-contras" style="margin-top:12px"><ul>' +
      '<li>Solo se usaron 6 variables del perfil de la persona; ningún modelo pasa de 0.60 de F1 macro.</li>' +
      '<li>Es un solo trimestre, y el trabajo agrícola es estacional.</li>' +
      '<li>No se usaron los factores de expansión, así que los porcentajes describen a la muestra.</li></ul><ul>' +
      '<li>Solo incluye a personas ocupadas que reportan ingreso.</li>' +
      '<li>La SVM se entrenó con una submuestra por su costo.</li>' +
      '<li>El simulador muestra perfiles inventados; no es una predicción sobre una persona real.</li></ul></div>'));
    app.appendChild(sec);
  }

  // ------------------------------------------------------------------
  // Navegacion, animaciones y arranque
  // ------------------------------------------------------------------
  function activarNavegacion() {
    const enlaces = Array.prototype.slice.call(document.querySelectorAll('#nav a'));
    const obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) {
          enlaces.forEach(function (a) { a.classList.toggle('activo', a.getAttribute('href') === '#' + en.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { obs.observe(s); });

    const aparecer = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('visto'); aparecer.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.aparecer').forEach(function (e) { aparecer.observe(e); });
  }

  function iniciar() {
    Promise.all([
      fetch('datos/resultados.json').then(function (r) { return r.json(); }),
      fetch('datos/modelos.json').then(function (r) { return r.json(); })
    ]).then(function (res) {
      R = res[0];
      M = res[1];
      const app = document.getElementById('app');
      app.innerHTML = '';
      portada(app);
      seccionDatos(app);
      seccionModelos(app);
      seccionSimulador(app);
      seccionFinal(app);
      seccionConclusiones(app);
      redibujar.forEach(function (f) { f(); });
      activarNavegacion();
      // Si el enlace trae una seccion (#simulador, etc.), se baja a ella cuando ya existe
      if (location.hash) {
        const destino = document.getElementById(location.hash.slice(1));
        if (destino) destino.scrollIntoView();
      }
      let ancho = window.innerWidth, t = null;
      window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          if (Math.abs(window.innerWidth - ancho) < 2) return;
          ancho = window.innerWidth;
          redibujar.forEach(function (f) { f(); });
        }, 150);
      });
    }).catch(function (err) {
      document.getElementById('app').innerHTML = '<div class="cargando"><p>No se pudieron cargar los datos. Si abriste el archivo directo, usa un servidor local (por ejemplo <code>python -m http.server</code>).</p></div>';
      console.error(err);
    });
  }

  iniciar();
})();
