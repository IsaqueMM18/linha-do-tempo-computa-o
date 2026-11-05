/* TempoEdu — filtros.js
 * Estado e lógica de filtragem: busca textual + categorias + período.
 * Todos os filtros funcionam em conjunto (E lógico). */
(function (global) {
  'use strict';

  var T = global.TempoEdu = global.TempoEdu || {};

  function normalizar(texto) {
    return String(texto == null ? '' : texto)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim();
  }

  function slugify(texto) {
    return normalizar(texto).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  /* Categorias: cores escolhidas para contraste mínimo AA com texto branco. */
  var CATEGORIAS = [
    { nome: 'Instrumentos de cálculo',   cor: '#b45309', icone: '🧮' },
    { nome: 'Matemática e algoritmos',   cor: '#0f766e', icone: '➗' },
    { nome: 'Computadores',              cor: '#1d4ed8', icone: '🖥️' },
    { nome: 'Hardware',                  cor: '#c2410c', icone: '🔌' },
    { nome: 'Software',                  cor: '#6d28d9', icone: '💿' },
    { nome: 'Linguagens de programação', cor: '#be185d', icone: '⌨️' },
    { nome: 'Redes e Internet',          cor: '#0e7490', icone: '🌐' },
    { nome: 'Empresas e instituições',   cor: '#475569', icone: '🏢' },
    { nome: 'Sistemas operacionais',     cor: '#15803d', icone: '🗂️' },
    { nome: 'Inteligência artificial',   cor: '#a21caf', icone: '🤖' },
    { nome: 'Tecnologias emergentes',    cor: '#4d7c0f', icone: '⚛️' }
  ];
  CATEGORIAS.forEach(function (c) { c.slug = slugify(c.nome); });

  /* Períodos: o campo "periodo" do JSON deve ser igual ao "nome" daqui. */
  var PERIODOS = [
    { nome: 'Antiguidade e Idade Média' },
    { nome: 'Séculos XVI–XVIII' },
    { nome: 'Século XIX' },
    { nome: 'Século XX (1900–1949)' },
    { nome: 'Século XX (1950–1999)' },
    { nome: 'Século XXI' }
  ];

  var FALLBACK = { cor: '#475569', icone: '📌' };

  function categoria(nome) {
    for (var i = 0; i < CATEGORIAS.length; i++) {
      if (CATEGORIAS[i].nome === nome) return CATEGORIAS[i];
    }
    return null;
  }

  /* Garante que categorias novas colocadas no JSON apareçam na interface. */
  function registrarCategorias(eventos) {
    eventos.forEach(function (e) {
      if (!categoria(e.categoria)) {
        CATEGORIAS.push({ nome: e.categoria, slug: slugify(e.categoria), cor: FALLBACK.cor, icone: FALLBACK.icone });
      }
    });
  }

  function registrarPeriodos(eventos) {
    eventos.forEach(function (e) {
      if (e.periodo && !PERIODOS.some(function (p) { return p.nome === e.periodo; })) {
        PERIODOS.push({ nome: e.periodo });
      }
    });
  }

  function indexar(eventos) {
    eventos.forEach(function (e) {
      e._busca = normalizar([e.titulo, e.descricao, e.importancia, e.categoria,
        (e.personagens || []).join(' ')].join(' '));
    });
  }

  var estado = { busca: '', categorias: new Set(), periodo: '' };

  function definirBusca(texto) { estado.busca = texto || ''; }
  function definirPeriodo(nome) { estado.periodo = nome || ''; }
  function alternarCategoria(nome) {
    if (estado.categorias.has(nome)) estado.categorias.delete(nome);
    else estado.categorias.add(nome);
    return estado.categorias.has(nome);
  }
  function limpar() {
    estado.busca = '';
    estado.periodo = '';
    estado.categorias.clear();
  }
  function ativos() {
    return !!(normalizar(estado.busca) || estado.periodo || estado.categorias.size);
  }

  function aplicar(eventos) {
    var termos = normalizar(estado.busca).split(/\s+/).filter(Boolean);
    return eventos.filter(function (e) {
      if (estado.categorias.size && !estado.categorias.has(e.categoria)) return false;
      if (estado.periodo && e.periodo !== estado.periodo) return false;
      return termos.every(function (t) { return e._busca.indexOf(t) !== -1; });
    });
  }

  function contarPorCategoria(eventos) {
    var mapa = {};
    eventos.forEach(function (e) { mapa[e.categoria] = (mapa[e.categoria] || 0) + 1; });
    return mapa;
  }

  T.Filtros = {
    CATEGORIAS: CATEGORIAS,
    PERIODOS: PERIODOS,
    FALLBACK: FALLBACK,
    estado: estado,
    normalizar: normalizar,
    slugify: slugify,
    categoria: function (nome) {
      return categoria(nome) || { nome: nome, slug: slugify(nome), cor: FALLBACK.cor, icone: FALLBACK.icone };
    },
    registrarCategorias: registrarCategorias,
    registrarPeriodos: registrarPeriodos,
    indexar: indexar,
    definirBusca: definirBusca,
    definirPeriodo: definirPeriodo,
    alternarCategoria: alternarCategoria,
    limpar: limpar,
    ativos: ativos,
    aplicar: aplicar,
    contarPorCategoria: contarPorCategoria
  };
})(window);
