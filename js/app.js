/* TempoEdu — app.js
 * Carrega o JSON, monta a interface, liga filtros, linha do tempo e painel de detalhes.
 * Aplicação 100% estática: todos os caminhos são relativos (funciona no GitHub Pages). */
(function () {
  'use strict';

  var T = window.TempoEdu;
  var F = T.Filtros;
  var L = T.Linha;

  var CAMINHO_DADOS = 'data/computacao.json';
  var CDN_JS_ALT = 'https://cdn.jsdelivr.net/npm/vis-timeline@7.7.3/standalone/umd/vis-timeline-graph2d.min.js';
  var CDN_CSS_ALT = 'https://cdn.jsdelivr.net/npm/vis-timeline@7.7.3/styles/vis-timeline-graph2d.min.css';
  var CHAVE_TEMA = 'tempoedu-tema';

  var eventos = [];
  var porId = new Map();
  var filtrados = [];
  var selecionadoId = null;
  var focoAnterior = null;
  var tokenImagem = 0;
  var cacheImagens = new Map();
  var linhaPronta = false;
  var temporizadorToast = null;
  var temporizadorBusca = null;

  var mqPainelModal = window.matchMedia('(max-width: 1099px)');

  /* ---------- utilidades ---------- */
  function $(id) { return document.getElementById(id); }

  function limparNo(no) { while (no.firstChild) no.removeChild(no.firstChild); }

  function h(tag, props, filhos) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (k === 'texto') n.textContent = v;
      else if (k === 'classe') n.className = v;
      else if (k === 'estilo') n.setAttribute('style', v);
      else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    (filhos || []).forEach(function (f) {
      n.appendChild(typeof f === 'string' ? document.createTextNode(f) : f);
    });
    return n;
  }

  function anoDe(data) { return parseInt(String(data).split(/(?!^)-/)[0], 10); }

  function reduzMovimento() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function plural(n, singular, pluralTxt) { return n + ' ' + (n === 1 ? singular : pluralTxt); }

  function mostrarToast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('visivel');
    clearTimeout(temporizadorToast);
    temporizadorToast = setTimeout(function () { t.classList.remove('visivel'); }, 2800);
  }

  /* ---------- tema ---------- */
  function aplicarTema(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    $('icone-tema').textContent = tema === 'dark' ? '☀️' : '🌙';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', tema === 'dark' ? '#070d24' : '#0b1437');
  }

  function iniciarTema() {
    aplicarTema(document.documentElement.getAttribute('data-theme') || 'light');
    $('btn-tema').addEventListener('click', function () {
      var novo = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      aplicarTema(novo);
      try { localStorage.setItem(CHAVE_TEMA, novo); } catch (e) { /* sem armazenamento */ }
    });
  }

  /* No GitHub Pages (usuario.github.io/repo), aponta o link para o repositório. */
  function iniciarLinksGithub() {
    var m = /^([^.]+)\.github\.io$/.exec(location.hostname);
    if (!m) return;
    var repo = location.pathname.split('/').filter(Boolean)[0];
    var url = 'https://github.com/' + m[1] + (repo ? '/' + repo : '');
    $('link-github').href = url;
    $('link-github-topo').href = url;
  }

  /* ---------- carregamento da biblioteca e dos dados ---------- */
  function carregarScript(url) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = url; s.onload = resolve; s.onerror = function () { reject(new Error('Falha ao carregar ' + url)); };
      document.head.appendChild(s);
    });
  }

  function garantirBiblioteca() {
    if (window.vis && window.vis.Timeline) return Promise.resolve();
    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = CDN_CSS_ALT;
    document.head.appendChild(css);
    return carregarScript(CDN_JS_ALT).then(function () {
      if (!(window.vis && window.vis.Timeline)) throw new Error('vis-timeline indisponível');
    });
  }

  function eventoValido(e) {
    var ok = e && typeof e.id !== 'undefined' && e.titulo && e.categoria &&
      /^-?\d{1,6}-\d{2}-\d{2}$/.test(String(e.data)) && L.parseData(e.data);
    if (!ok) console.warn('TempoEdu: acontecimento ignorado por estar incompleto ou inválido:', e);
    return !!ok;
  }

  function carregarDados() {
    return fetch(CAMINHO_DADOS, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('O arquivo de dados respondeu com o código ' + r.status + '.');
      return r.json();
    }).then(function (dados) {
      if (!Array.isArray(dados)) throw new Error('O arquivo de dados não contém uma lista de acontecimentos.');
      var vistos = new Set();
      return dados.filter(eventoValido).filter(function (e) {
        if (vistos.has(e.id)) { console.warn('TempoEdu: id duplicado ignorado:', e.id); return false; }
        vistos.add(e.id); return true;
      }).sort(function (a, b) { return L.parseData(a.data) - L.parseData(b.data) || a.id - b.id; });
    });
  }

  /* ---------- montagem da interface ---------- */
  function injetarCoresCategorias() {
    var css = F.CATEGORIAS.map(function (c) { return '.cat-' + c.slug + '{--cat:' + c.cor + ';}'; }).join('\n');
    var s = $('estilo-categorias');
    if (!s) { s = h('style', { id: 'estilo-categorias' }); document.head.appendChild(s); }
    s.textContent = css;
  }

  function formatarSpan() {
    var primeiro = anoDe(eventos[0].data);
    var ultimo = anoDe(eventos[eventos.length - 1].data);
    var anos = ultimo - primeiro;
    return anos.toLocaleString('pt-BR') + ' anos';
  }

  function montarEstatisticas() {
    $('stat-eventos').textContent = eventos.length;
    $('stat-categorias').textContent = F.CATEGORIAS.filter(function (c) {
      return eventos.some(function (e) { return e.categoria === c.nome; });
    }).length;
    $('stat-anos').textContent = formatarSpan();
  }

  function montarFiltros() {
    var chips = $('chips-categorias');
    limparNo(chips);
    F.CATEGORIAS.forEach(function (c) {
      if (!eventos.some(function (e) { return e.categoria === c.nome; })) return;
      var b = h('button', {
        type: 'button', classe: 'chip cat-' + c.slug, 'aria-pressed': 'false', 'data-categoria': c.nome,
        onclick: function () {
          var ativo = F.alternarCategoria(c.nome);
          b.setAttribute('aria-pressed', ativo ? 'true' : 'false');
          aoMudarFiltros();
        }
      }, [h('span', { 'aria-hidden': 'true', texto: c.icone }), c.nome]);
      chips.appendChild(b);
    });

    var sel = $('filtro-periodo');
    F.PERIODOS.forEach(function (p) {
      if (eventos.some(function (e) { return e.periodo === p.nome; })) {
        sel.appendChild(h('option', { value: p.nome, texto: p.nome }));
      }
    });
  }

  function montarLegenda() {
    var ul = $('legenda');
    limparNo(ul);
    var contagem = F.contarPorCategoria(filtrados);
    F.CATEGORIAS.forEach(function (c) {
      if (!eventos.some(function (e) { return e.categoria === c.nome; })) return;
      ul.appendChild(h('li', { classe: 'cat-' + c.slug }, [
        h('span', { classe: 'legenda-amostra', 'aria-hidden': 'true', texto: c.icone }),
        h('span', { texto: c.nome }),
        h('span', { classe: 'legenda-qtd', 'aria-label': plural(contagem[c.nome] || 0, 'acontecimento', 'acontecimentos'), texto: String(contagem[c.nome] || 0) })
      ]));
    });
  }

  function montarLista() {
    var ol = $('lista-resultados');
    limparNo(ol);
    filtrados.forEach(function (e) {
      var cat = F.categoria(e.categoria);
      var b = h('button', {
        type: 'button', classe: 'item-lista cat-' + cat.slug, 'data-id': String(e.id),
        onclick: function () { abrirDetalhe(e.id, { focar: true, origem: 'lista' }); }
      }, [h('small', { texto: e.dataExibicao || e.data }), h('span', { texto: e.titulo })]);
      if (e.id === selecionadoId) b.setAttribute('aria-current', 'true');
      ol.appendChild(h('li', {}, [b]));
    });
  }

  function atualizarContador() {
    var total = eventos.length;
    var n = filtrados.length;
    var txt;
    if (!F.ativos()) txt = 'Exibindo todos os ' + total + ' acontecimentos.';
    else if (n === 0) txt = 'Nenhum acontecimento encontrado com os filtros atuais.';
    else txt = 'Encontrado' + (n === 1 ? '' : 's') + ': ' + plural(n, 'acontecimento', 'acontecimentos') + ' de ' + total + '.';
    $('contador').textContent = txt;
  }

  /* ---------- filtros ---------- */
  function aoMudarFiltros() {
    filtrados = F.aplicar(eventos);
    atualizarContador();
    montarLegenda();
    montarLista();
    $('vazio').hidden = filtrados.length !== 0;
    if (linhaPronta) {
      L.atualizar(filtrados);
      if (filtrados.length) {
        if (F.ativos()) L.ajustar(filtrados); else L.janelaInicial();
      }
    }
  }

  function limparFiltros() {
    F.limpar();
    $('busca').value = '';
    $('filtro-periodo').value = '';
    Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) { c.setAttribute('aria-pressed', 'false'); });
    aoMudarFiltros();
  }

  /* ---------- imagens ---------- */
  function textoAno(data) {
    var a = anoDe(data);
    return a < 0 ? (-a) + ' a.C.' : String(a);
  }

  /* Ilustração própria (SVG) usada quando não há imagem ou ela falha ao carregar. */
  function placeholderPara(e) {
    var c = F.categoria(e.categoria);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.cor + '"/><stop offset="1" stop-color="#0b1437"/></linearGradient></defs>' +
      '<rect width="640" height="360" fill="url(#g)"/>' +
      '<g fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="2"><path d="M0 250h180l30-40h120l30 40h280M0 290h140l40-30h160M640 120H480l-30 30H300"/><circle cx="210" cy="210" r="6"/><circle cx="360" cy="250" r="6"/><circle cx="450" cy="150" r="6"/></g>' +
      '<text x="320" y="200" font-size="120" text-anchor="middle">' + c.icone + '</text>' +
      '<text x="320" y="318" font-size="34" font-family="sans-serif" font-weight="700" fill="#fff" fill-opacity=".9" text-anchor="middle">' + textoAno(e.data) + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* Ordem: 1) imagem cadastrada com atribuição no JSON; 2) Wikipédia;
   * 3) ilustração SVG própria. Imagens sem licença/origem verificáveis não são exibidas. */
  function validarUrlHttps(valor) {
    if (!valor) return null;
    try {
      // Exige URL absoluta: caminhos relativos não devem ser aceitos como créditos externos.
      var url = new URL(String(valor));
      if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
      return url.href;
    } catch (erro) {
      return null;
    }
  }

  function licencaDispensaAutor(licenca) {
    // CC0 e declarações de domínio público não exigem atribuição autoral.
    return /\bcc0\b|creative commons zero|public domain|dom[ií]nio p[uú]blico|public domain mark/i.test(String(licenca || ''));
  }

  function limparMetadado(valor) {
    if (!valor) return '';
    var documento = new DOMParser().parseFromString(String(valor), 'text/html');
    return (documento.body.textContent || '').trim();
  }

  function imagemManual(e) {
    var url = validarUrlHttps(e.imagem);
    var origem = validarUrlHttps(e.imagemFonte);
    var licenca = limparMetadado(e.imagemLicenca);
    var autor = limparMetadado(e.imagemAutor);
    if (!url || !origem || !licenca) return null;
    if (!autor && !licencaDispensaAutor(licenca)) return null;

    return {
      url: url,
      autor: autor || 'Autoria não informada (domínio público/CC0)',
      licenca: licenca,
      licencaUrl: validarUrlHttps(e.imagemLicencaUrl),
      origem: origem
    };
  }

  function resolverImagem(e) {
    if (cacheImagens.has(e.id)) return cacheImagens.get(e.id);

    var promessa = Promise.resolve().then(function () {
      var manual = imagemManual(e);
      if (manual) return manual;
      if (!e.wikipedia) return null;

      var artigo;
      try {
        artigo = new URL(e.wikipedia);
      } catch (erro) {
        return null;
      }

      if (artigo.protocol !== 'https:' || !/^(pt|en)\.wikipedia\.org$/.test(artigo.hostname)) {
        return null;
      }

      var marcador = '/wiki/';
      var posicao = artigo.pathname.indexOf(marcador);
      if (posicao === -1) return null;

      var titulo;
      try {
        titulo = decodeURIComponent(artigo.pathname.slice(posicao + marcador.length));
      } catch (erro) {
        return null;
      }
      titulo = titulo.replace(/_/g, ' ');
      if (!titulo) return null;

      var api = artigo.origin + '/w/api.php';
      var parametrosImagem = new URLSearchParams({
        action: 'query',
        format: 'json',
        prop: 'pageimages',
        piprop: 'name',
        pilicense: 'free',
        titles: titulo,
        origin: '*'
      });

      return fetch(api + '?' + parametrosImagem.toString())
        .then(function (resposta) {
          if (!resposta.ok) throw new Error('Erro ao consultar artigo');
          return resposta.json();
        })
        .then(function (dados) {
          var paginas = dados && dados.query && dados.query.pages;
          if (!paginas) return null;

          var ids = Object.keys(paginas);
          var pagina = ids.length ? paginas[ids[0]] : null;
          if (!pagina || !pagina.pageimage) return null;

          var parametrosInfo = new URLSearchParams({
            action: 'query',
            format: 'json',
            prop: 'imageinfo',
            titles: 'File:' + pagina.pageimage,
            iiprop: 'url|extmetadata',
            iiurlwidth: '1200',
            iiextmetadatalanguage: 'pt',
            origin: '*'
          });

          return fetch(api + '?' + parametrosInfo.toString());
        })
        .then(function (resposta) {
          if (!resposta) return null;
          if (!resposta.ok) throw new Error('Erro ao consultar metadados da imagem');
          return resposta.json();
        })
        .then(function (dados) {
          if (!dados) return null;

          var paginas = dados.query && dados.query.pages;
          if (!paginas) return null;

          var ids = Object.keys(paginas);
          var pagina = ids.length ? paginas[ids[0]] : null;
          var info = pagina && pagina.imageinfo && pagina.imageinfo[0];
          if (!info) return null;

          var meta = info.extmetadata || {};
          var licenca = limparMetadado(meta.LicenseShortName && meta.LicenseShortName.value);
          var autor = limparMetadado(meta.Artist && meta.Artist.value);
          var credito = limparMetadado(meta.Credit && meta.Credit.value);
          var urlImagem = validarUrlHttps(info.thumburl || info.url);
          var origem = validarUrlHttps(info.descriptionurl);

          // Exige licença, origem e atribuição autoral; CC0/domínio público são exceções.
          var atribuicao = autor || credito;
          if (!licenca || !urlImagem || !origem) return null;
          if (!atribuicao && !licencaDispensaAutor(licenca)) return null;

          return {
            url: urlImagem,
            autor: atribuicao || 'Autoria não informada (domínio público/CC0)',
            licenca: licenca,
            licencaUrl: validarUrlHttps(meta.LicenseUrl && meta.LicenseUrl.value),
            origem: origem
          };
        });
    }).catch(function (erro) {
      console.warn('Não foi possível obter a imagem e seus créditos:', erro);
      return null;
    });

    cacheImagens.set(e.id, promessa);
    return promessa;
  }

  function carregarImagem(e) {
    var img = $('det-imagem');
    var fig = $('det-figura');
    var creditos = $('det-creditos');
    var token = ++tokenImagem;

    img.alt = 'Ilustração: ' + e.titulo;
    img.src = placeholderPara(e);
    creditos.hidden = true;
    fig.classList.add('carregando');

    resolverImagem(e).then(function (dados) {
      if (token !== tokenImagem) return;
      if (!dados || !dados.url) {
        fig.classList.remove('carregando');
        return;
      }

      var teste = new Image();
      teste.onload = function () {
        if (token !== tokenImagem) return;

        img.src = dados.url;
        $('det-imagem-autor').textContent = dados.autor;

        var linkLicenca = $('det-imagem-licenca');
        linkLicenca.textContent = dados.licenca;
        if (dados.licencaUrl) {
          linkLicenca.href = dados.licencaUrl;
        } else {
          linkLicenca.removeAttribute('href');
        }

        var linkOrigem = $('det-imagem-origem');
        linkOrigem.href = dados.origem;
        creditos.hidden = false;
        fig.classList.remove('carregando');
      };

      teste.onerror = function () {
        if (token === tokenImagem) fig.classList.remove('carregando');
      };
      teste.src = dados.url;
    });
  }

  /* ---------- painel de detalhes ---------- */
  function painelEhModal() { return mqPainelModal.matches; }

  function indiceNaLista(id) {
    for (var i = 0; i < filtrados.length; i++) if (filtrados[i].id === id) return i;
    return -1;
  }

  function preencherDetalhe(e) {
    var cat = F.categoria(e.categoria);
    $('painel-vazio').hidden = true;
    $('painel-conteudo').hidden = false;
    $('painel-conteudo').className = 'cat-' + cat.slug;

    var selo = $('det-categoria');
    selo.textContent = cat.icone + ' ' + e.categoria;
    $('det-data').textContent = e.dataExibicao || e.data;
    $('det-titulo').textContent = e.titulo;
    $('det-periodo').textContent = e.periodo || '';
    $('det-descricao').textContent = e.descricao || '';
    $('det-importancia').textContent = e.importancia || '';

    var ul = $('det-personagens');
    limparNo(ul);
    (e.personagens || []).forEach(function (p) { ul.appendChild(h('li', { texto: p })); });
    $('det-personagens-bloco').hidden = !(e.personagens && e.personagens.length);

    var nota = $('det-nota');
    nota.hidden = !e.nota;
    nota.textContent = e.nota ? 'Observação: ' + e.nota : '';

    var link = $('det-wiki');
    link.href = e.wikipedia || '#';
    var ingles = /^https:\/\/en\./.test(e.wikipedia || '');
    link.textContent = ingles ? 'Ler na Wikipédia (em inglês)' : 'Ler na Wikipédia';
    link.hidden = !e.wikipedia;

    var i = indiceNaLista(e.id);
    $('btn-ant').disabled = !(i > 0);
    $('btn-prox').disabled = !(i !== -1 && i < filtrados.length - 1);

    carregarImagem(e);
  }

  function abrirPainelModal() {
    var painel = $('painel');
    if (!painelEhModal()) return;
    painel.classList.add('aberto');
    painel.setAttribute('role', 'dialog');
    painel.setAttribute('aria-modal', 'true');
    $('painel-fundo').hidden = false;
    document.body.classList.add('painel-aberto');
    setTimeout(function () { $('det-titulo').focus(); }, 60);
  }

  function fecharPainelModal() {
    var painel = $('painel');
    painel.classList.remove('aberto');
    painel.removeAttribute('role');
    painel.removeAttribute('aria-modal');
    $('painel-fundo').hidden = true;
    document.body.classList.remove('painel-aberto');
  }

  function atualizarMarcaLista() {
    Array.prototype.forEach.call(document.querySelectorAll('.item-lista'), function (b) {
      if (b.getAttribute('data-id') === String(selecionadoId)) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }

  function definirHash(id) {
    try { history.replaceState(null, '', id == null ? location.pathname + location.search : '#evento-' + id); } catch (err) { /* ignora */ }
  }

  function abrirDetalhe(id, opcoes) {
    opcoes = opcoes || {};
    var e = porId.get(id);
    if (!e) return;
    if (!painelEhModal() || !$('painel').classList.contains('aberto')) focoAnterior = document.activeElement;
    selecionadoId = id;
    preencherDetalhe(e);
    atualizarMarcaLista();
    definirHash(id);
    if (linhaPronta) L.selecionar(id, !!opcoes.focar);
    abrirPainelModal();
  }

  function fecharDetalhe() {
    fecharPainelModal();
    if (focoAnterior && document.contains(focoAnterior) && focoAnterior.focus) focoAnterior.focus();
    focoAnterior = null;
    if (!painelEhModal()) return;
    selecionadoId = null;
    $('painel-vazio').hidden = false;
    $('painel-conteudo').hidden = true;
    if (linhaPronta) L.limparSelecao();
    atualizarMarcaLista();
    definirHash(null);
  }

  function navegar(delta) {
    var i = indiceNaLista(selecionadoId);
    var alvo = filtrados[i + delta];
    if (alvo) abrirDetalhe(alvo.id, { focar: true });
  }

  /* ---------- compartilhamento ---------- */
  function urlEvento(id) { return location.href.split('#')[0] + '#evento-' + id; }

  function copiarTexto(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto);
    }
    return new Promise(function (resolve, reject) {
      var ta = h('textarea', { 'aria-hidden': 'true', estilo: 'position:fixed;opacity:0;top:0;left:0' });
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (err) { reject(err); }
      document.body.removeChild(ta);
    });
  }

  function compartilhar() {
    var e = porId.get(selecionadoId);
    if (!e) return;
    var url = urlEvento(e.id);
    var dados = { title: 'TempoEdu — ' + e.titulo, text: e.titulo + ' (' + (e.dataExibicao || e.data) + ')', url: url };
    var copiar = function () {
      copiarTexto(url).then(function () { mostrarToast('Link copiado para a área de transferência.'); })
        .catch(function () { window.prompt('Copie o link do acontecimento:', url); });
    };
    if (navigator.share) {
      navigator.share(dados).catch(function (err) { if (!err || err.name !== 'AbortError') copiar(); });
    } else {
      copiar();
    }
  }

  /* ---------- hash (links compartilháveis) ---------- */
  function abrirPeloHash() {
    var m = /^#evento-(\d+)$/.exec(location.hash);
    if (!m) return;
    var id = parseInt(m[1], 10);
    if (!porId.has(id)) { mostrarToast('Esse acontecimento não foi encontrado.'); return; }
    if (indiceNaLista(id) === -1) limparFiltros();
    abrirDetalhe(id, { focar: true });
  }

  /* ---------- eventos fixos ---------- */
  function ligarControles() {
    $('busca').addEventListener('input', function (ev) {
      clearTimeout(temporizadorBusca);
      var valor = ev.target.value;
      temporizadorBusca = setTimeout(function () { F.definirBusca(valor); aoMudarFiltros(); }, 160);
    });
    $('filtro-periodo').addEventListener('change', function (ev) { F.definirPeriodo(ev.target.value); aoMudarFiltros(); });
    $('btn-limpar').addEventListener('click', limparFiltros);
    $('btn-vazio-limpar').addEventListener('click', limparFiltros);
    $('btn-completa').addEventListener('click', function () { if (linhaPronta) L.visaoCompleta(); });
    $('btn-inicio-janela').addEventListener('click', function () { if (linhaPronta) L.janelaInicial(); });
    $('btn-mais').addEventListener('click', function () { L.zoom(0.5); });
    $('btn-menos').addEventListener('click', function () { L.zoom(-0.5); });
    $('btn-esq').addEventListener('click', function () { L.mover(-1); });
    $('btn-dir').addEventListener('click', function () { L.mover(1); });
    $('chk-agrupar').addEventListener('change', function (ev) { if (linhaPronta) L.definirAgrupamento(ev.target.checked, filtrados); });
    $('btn-fechar').addEventListener('click', fecharDetalhe);
    $('painel-fundo').addEventListener('click', fecharDetalhe);
    $('btn-compartilhar').addEventListener('click', compartilhar);
    $('btn-ant').addEventListener('click', function () { navegar(-1); });
    $('btn-prox').addEventListener('click', function () { navegar(1); });
    $('btn-recarregar').addEventListener('click', function () { location.reload(); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && $('painel').classList.contains('aberto')) fecharDetalhe();
    });
    window.addEventListener('hashchange', abrirPeloHash);
    var aoMudarMq = function () {
      if (!painelEhModal()) fecharPainelModal();
      else if (selecionadoId != null && !$('painel').classList.contains('aberto')) { /* mantém fechado até nova seleção */ }
    };
    if (mqPainelModal.addEventListener) mqPainelModal.addEventListener('change', aoMudarMq);
    else if (mqPainelModal.addListener) mqPainelModal.addListener(aoMudarMq);
  }

  function mostrarErro(msg) {
    $('carregando').hidden = true;
    $('erro-texto').textContent = msg;
    $('erro').hidden = false;
    $('contador').textContent = 'Não foi possível carregar os acontecimentos.';
  }

  /* ---------- inicialização ---------- */
  function iniciar() {
    iniciarTema();
    iniciarLinksGithub();
    ligarControles();

    carregarDados().then(function (lista) {
      if (!lista.length) throw new Error('Nenhum acontecimento válido foi encontrado no arquivo de dados.');
      eventos = lista;
      eventos.forEach(function (e) { porId.set(e.id, e); });
      F.registrarCategorias(eventos);
      F.registrarPeriodos(eventos);
      F.indexar(eventos);
      injetarCoresCategorias();
      montarEstatisticas();
      montarFiltros();
      filtrados = F.aplicar(eventos);
      atualizarContador();
      montarLegenda();
      montarLista();

      return garantirBiblioteca().then(function () {
        L.iniciar($('timeline'), filtrados, function (id) { abrirDetalhe(id, { origem: 'linha' }); });
        linhaPronta = true;
        $('carregando').hidden = true;
        abrirPeloHash();
      }).catch(function (err) {
        console.error(err);
        $('carregando').hidden = true;
        $('erro-texto').textContent = 'Não foi possível carregar a biblioteca da linha do tempo (verifique sua conexão). Você ainda pode consultar os acontecimentos na lista abaixo.';
        $('erro').hidden = false;
        $('detalhes-lista').open = true;
        abrirPeloHash();
      });
    }).catch(function (err) {
      console.error(err);
      mostrarErro('Não foi possível carregar os acontecimentos. ' + (err && err.message ? err.message : '') +
        ' Se estiver testando no seu computador, abra o projeto por um servidor local (veja o README), pois navegadores bloqueiam fetch() em arquivos abertos diretamente.');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
