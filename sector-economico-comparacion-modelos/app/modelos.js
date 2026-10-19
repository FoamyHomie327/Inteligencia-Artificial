// Prediccion de los modelos exportados desde el notebook (app/datos/modelos.json).
// Cada funcion recibe el modelo y un perfil {eda, anios_esc, hrsocup, ingocup, sex01, ur01}
// y regresa las probabilidades [P(primario), P(secundario), P(terciario)].
(function (global) {
  'use strict';

  function softmax(z) {
    const m = Math.max.apply(null, z);
    const e = z.map(function (v) { return Math.exp(v - m); });
    const s = e.reduce(function (a, b) { return a + b; }, 0);
    return e.map(function (v) { return v / s; });
  }

  // Vector de entrada en el orden de variables que usa cada modelo
  function vector(perfil, vars) {
    return vars.map(function (v) { return v === 'log_ingocup' ? Math.log(perfil.ingocup) : perfil[v]; });
  }

  function escalar(x, media, escala) {
    return x.map(function (v, i) { return (v - media[i]) / escala[i]; });
  }

  // Recorre un arbol de sklearn: a la izquierda si x[f] <= umbral
  function hoja(arbol, x) {
    let n = 0;
    while (arbol.l[n] !== -1) n = x[arbol.f[n]] <= arbol.t[n] ? arbol.l[n] : arbol.r[n];
    return arbol.v[n];
  }

  const Modelos = {
    // Gradient Boosting: puntaje inicial + learning_rate * suma de los arboles de cada clase, y softmax
    gb: function (m, perfil) {
      const x = vector(perfil, m.vars);
      const z = m.init.slice();
      for (let i = 0; i < m.arboles.length; i++) {
        for (let k = 0; k < 3; k++) z[k] += m.lr * hoja(m.arboles[i][k], x);
      }
      return softmax(z);
    },
    // Arbol de decision: proporcion (ponderada) de cada clase en la hoja
    arbol: function (m, perfil) {
      return hoja(m, vector(perfil, m.vars)).slice();
    },
    // Regresion logistica multinomial y LDA: puntaje lineal por clase y softmax
    lineal: function (m, perfil) {
      const x = escalar(vector(perfil, m.vars), m.media, m.escala);
      return softmax(m.coef.map(function (c, k) {
        return c.reduce(function (s, ci, i) { return s + ci * x[i]; }, m.intercepto[k]);
      }));
    },
    // Red neuronal: capas densas con ReLU y softmax en la salida
    red: function (m, perfil) {
      let a = escalar(vector(perfil, m.vars), m.media, m.escala);
      m.capas.forEach(function (capa, j) {
        const z = capa.b.map(function (b, o) {
          let s = b;
          for (let i = 0; i < a.length; i++) s += a[i] * capa.W[i][o];
          return s;
        });
        a = j < m.capas.length - 1 ? z.map(function (v) { return Math.max(0, v); }) : softmax(z);
      });
      return a;
    }
  };
  Modelos.logistica = Modelos.lineal;
  Modelos.lda = Modelos.lineal;

  global.Modelos = Modelos;
  if (typeof module !== 'undefined' && module.exports) module.exports = Modelos;
})(typeof window !== 'undefined' ? window : globalThis);
