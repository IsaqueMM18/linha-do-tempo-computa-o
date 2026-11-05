/* TempoEdu — timeline.js
 * Camada de integração com a biblioteca vis-timeline (carregada por CDN). */
(function (global) {
  'use strict';

  var T = global.TempoEdu = global.TempoEdu || {};
  var F = T.Filtros;

  var JANELA_INICIAL = { inicio: '1935-01-01', fim: '2027-12-31' };
  var LIMITE_MIN = '-3000-01-01';
  var LIMITE_MAX = '2035-12-31';
  var ANO_MS = 365.25 * 86400000;

  var timeline = null;
  var itens = null;
  var agrupar = false;
  var atuais = [];
  var aoSelecionar = null;
  var idSelecionado = null;

  /* Converte "AAAA-MM-DD" (aceita anos negativos, a.C.) em Date. */
  function parseData(texto) {
    var m = /^(-?\d{1,6})-(\d{2})-(\d{2})$/.exec(String(texto));
    if (!m) return null;
    var d = new Date(2000, 0, 1, 12, 0, 0);
    d.setFullYear(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    return isNaN(d.getTime()) ? null : d;
  }

  function somarAnos(data, anos) {
    var d = new Date(data.getTime());
    d.setFullYear(d.getFullYear() + anos);
    return d;
  }

  function reduzMovimento() {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function animacao() {
    return reduzMovimento() ? false : { duration: 450, easingFunction: 'easeInOutQuad' };
  }

  function alturaMaxima() {
    return Math.round(Math.min(640, Math.max(380, global.innerHeight * 0.7)));
  }

  function criarItem(e) {
    var cat = F.categoria(e.categoria);
    var inicio = parseData(e.data);
    var fim = e.fim ? parseData(e.fim) : null;
    var item = {
      id: e.id,
      content: cat.icone + ' ' + e.titulo,
      start: inicio,
      type: fim ? 'range' : 'box',
      className: 'cat-' + cat.slug,
      title: e.dataExibicao + ' — ' + e.titulo
    };
    if (fim) item.end = fim;
    if (agrupar) item.group = cat.slug;
    return item;
  }

  function criarGrupos(eventos) {
    var presentes = {};
    eventos.forEach(function (e) { presentes[e.categoria] = true; });
    var grupos = [];
    F.CATEGORIAS.forEach(function (c, i) {
      if (presentes[c.nome]) {
        grupos.push({ id: c.slug, content: c.icone + ' ' + c.nome, ordem: i, className: 'grupo-' + c.slug });
      }
    });
    return new global.vis.DataSet(grupos);
  }

  function iniciar(container, eventos, callbackSelecao) {
    if (!global.vis || !global.vis.Timeline || !global.vis.DataSet) {
      throw new Error('A biblioteca vis-timeline não foi carregada.');
    }
    aoSelecionar = callbackSelecao;
    itens = new global.vis.DataSet();

    var opcoes = {
      locale: 'pt-br',
      start: parseData(JANELA_INICIAL.inicio),
      end: parseData(JANELA_INICIAL.fim),
      min: parseData(LIMITE_MIN),
      max: parseData(LIMITE_MAX),
      zoomMin: 1000 * 60 * 60 * 24 * 365 * 2,
      zoomMax: ANO_MS * 5200,
      zoomKey: 'ctrlKey',
      verticalScroll: true,
      maxHeight: alturaMaxima(),
      minHeight: 320,
      stack: true,
      selectable: true,
      multiselect: false,
      editable: false,
      showCurrentTime: false,
      groupOrder: 'ordem',
      margin: { item: { horizontal: 6, vertical: 8 }, axis: 10 },
      tooltip: { followMouse: true, overflowMethod: 'cap' }
    };

    timeline = new global.vis.Timeline(container, itens, opcoes);

    timeline.on('select', function (props) {
      var id = props.items && props.items.length ? props.items[0] : null;
      if (id != null) {
        idSelecionado = id;
        if (aoSelecionar) aoSelecionar(id);
      }
    });

    global.addEventListener('resize', function () {
      if (timeline) timeline.setOptions({ maxHeight: alturaMaxima() });
    });

    atualizar(eventos);
  }

  function atualizar(eventos) {
    atuais = eventos;
    if (!timeline) return;
    if (agrupar) timeline.setGroups(criarGrupos(eventos));
    else timeline.setGroups(null);
    itens.clear();
    itens.add(eventos.map(criarItem));
    if (idSelecionado != null && eventos.some(function (e) { return e.id === idSelecionado; })) {
      timeline.setSelection(idSelecionado);
    }
  }

  function definirAgrupamento(valor, eventos) {
    agrupar = !!valor;
    atualizar(eventos || atuais);
  }

  function selecionar(id, focar) {
    idSelecionado = id;
    if (!timeline) return;
    var existe = atuais.some(function (e) { return e.id === id; });
    if (!existe) { timeline.setSelection([]); return; }
    timeline.setSelection(id);
    if (focar) garantirVisivel(id);
  }

  function limparSelecao() {
    idSelecionado = null;
    if (timeline) timeline.setSelection([]);
  }

  function garantirVisivel(id) {
    var e = atuais.filter(function (x) { return x.id === id; })[0];
    if (!e || !timeline) return;
    var data = parseData(e.data);
    var janela = timeline.getWindow();
    var largura = (janela.end - janela.start) / ANO_MS;
    if (largura > 300) {
      timeline.setWindow(somarAnos(data, -30), somarAnos(data, 30), { animation: animacao() });
    } else {
      timeline.moveTo(data, { animation: animacao() });
    }
  }

  function limites(eventos) {
    var min = null, max = null;
    eventos.forEach(function (e) {
      var a = parseData(e.data);
      var b = e.fim ? parseData(e.fim) : a;
      if (a && (!min || a < min)) min = a;
      if (b && (!max || b > max)) max = b;
    });
    return min && max ? { min: min, max: max } : null;
  }

  /* Ajusta a janela para mostrar os eventos informados, com margem. */
  function ajustar(eventos) {
    if (!timeline) return;
    var l = limites(eventos);
    if (!l) return;
    var span = (l.max - l.min) / ANO_MS;
    var margem = Math.max(span * 0.08, 8);
    timeline.setWindow(somarAnos(l.min, -Math.ceil(margem)), somarAnos(l.max, Math.ceil(margem)), { animation: animacao() });
  }

  function janelaInicial() {
    if (!timeline) return;
    timeline.setWindow(parseData(JANELA_INICIAL.inicio), parseData(JANELA_INICIAL.fim), { animation: animacao() });
  }

  function visaoCompleta() {
    if (!timeline) return;
    var l = limites(atuais);
    if (l) ajustar(atuais);
    else timeline.fit({ animation: animacao() });
  }

  function zoom(fator) {
    if (!timeline) return;
    if (fator > 0) timeline.zoomIn(fator, { animation: animacao() });
    else timeline.zoomOut(-fator, { animation: animacao() });
  }

  function mover(direcao) {
    if (!timeline) return;
    var j = timeline.getWindow();
    var passo = (j.end - j.start) * 0.3 * direcao;
    timeline.setWindow(new Date(j.start.getTime() + passo), new Date(j.end.getTime() + passo), { animation: animacao() });
  }

  T.Linha = {
    parseData: parseData,
    iniciar: iniciar,
    atualizar: atualizar,
    definirAgrupamento: definirAgrupamento,
    selecionar: selecionar,
    limparSelecao: limparSelecao,
    ajustar: ajustar,
    janelaInicial: janelaInicial,
    visaoCompleta: visaoCompleta,
    zoom: zoom,
    mover: mover
  };
})(window);
