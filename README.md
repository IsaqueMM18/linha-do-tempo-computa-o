# TempoEdu

**Explore o passado. Compreenda o presente. Descubra o futuro.**

TempoEdu é um **Recurso Educacional Aberto (REA)**: uma linha do tempo interativa sobre a **História da Computação**, dos primeiros instrumentos de cálculo (ábaco sumério) até a inteligência artificial generativa. É uma aplicação **100% estática** (HTML, CSS e JavaScript puro), sem backend, sem banco de dados, sem chaves de API e sem autenticação, pronta para o **GitHub Pages**.

## Funcionalidades

- Linha do tempo interativa com [vis-timeline](https://visjs.github.io/vis-timeline/docs/timeline/): navegação horizontal, zoom, cores por categoria e títulos visíveis nos marcadores.
- 94 acontecimentos, da Antiguidade a 2022, em 11 categorias.
- Pesquisa por título, descrição, importância e personagens (ignora acentos e maiúsculas).
- Filtros por **categoria** (múltipla escolha) e por **período histórico**, que funcionam **em conjunto** com a pesquisa.
- Contador de resultados, mensagem amigável quando nada é encontrado, botões **Limpar filtros** e **Visão completa**.
- Agrupamento opcional por categoria.
- Painel de detalhes (modal em telas pequenas) com data, categoria, descrição, importância histórica, personagens, imagem e link para a Wikipédia; botões Anterior/Próximo.
- Link compartilhável para cada acontecimento (`...#evento-19`).
- Modo claro e escuro, layout responsivo, navegação por teclado e lista alternativa dos acontecimentos (acessibilidade).

## Estrutura

```
tempoedu/
├── index.html
├── css/style.css
├── js/
│   ├── app.js         # carrega o JSON, monta a interface, painel de detalhes, compartilhamento
│   ├── timeline.js    # integração com a vis-timeline
│   └── filtros.js     # categorias, períodos, pesquisa e filtros combinados
├── data/computacao.json
├── assets/{images,icons}
├── LICENSE
├── README.md
└── .nojekyll
```

Todos os caminhos são **relativos**; o projeto funciona em `https://usuario.github.io/tempoedu/` e na raiz de um domínio.

## Como testar no seu computador

Navegadores bloqueiam `fetch()` em arquivos abertos com duplo clique (`file://`). Use um servidor local qualquer, por exemplo:

```bash
cd tempoedu
python3 -m http.server 8000
# abra http://localhost:8000
```

(Isso é só para testar; em produção o GitHub Pages serve os arquivos estáticos.)

## Como adicionar acontecimentos

Edite `data/computacao.json` e acrescente um objeto à lista:

```json
{
  "id": 95,
  "data": "1946-02-14",
  "titulo": "Título curto do acontecimento",
  "categoria": "Computadores",
  "periodo": "Século XX (1900–1949)",
  "descricao": "Texto próprio e resumido.",
  "importancia": "Por que esse fato importa para a história da computação.",
  "personagens": ["Pessoa ou instituição"],
  "imagem": null,
  "wikipedia": "https://pt.wikipedia.org/wiki/Artigo",
  "precisao": "dia",
  "dataExibicao": "14 de fevereiro de 1946"
}
```

| Campo | Regra |
|---|---|
| `id` | Número inteiro **único**. |
| `data` | Formato `AAAA-MM-DD`. Anos antes de Cristo levam sinal de menos (`-2700-01-01`). Se só o ano ou o mês são conhecidos, use `01` no que faltar e informe a precisão. |
| `precisao` | `dia`, `mes`, `ano` ou `aprox` (informativo). |
| `dataExibicao` | Texto mostrado ao leitor (ex.: `c. 820`, `maio de 1974`). Use-o para explicar datas incertas. |
| `fim` | Opcional. Data final (`AAAA-MM-DD`) para acontecimentos que são períodos; aparecem como faixa. |
| `nota` | Opcional. Observação exibida no painel (ótima para eventos com várias etapas, como a Internet). |
| `categoria` | Uma das categorias existentes, ou uma nova (ela aparece sozinha nos filtros; cor padrão cinza). Para dar cor própria, edite `CATEGORIAS` em `js/filtros.js`. |
| `periodo` | Deve ser igual a um dos nomes em `PERIODOS` (`js/filtros.js`). |
| `imagem` | URL direta de imagem **ou** `null` (veja abaixo). |
| `wikipedia` | Link do artigo em português; se não houver artigo adequado, em inglês. |

**Confira datas e nomes em fontes confiáveis antes de publicar.** Em fatos com várias etapas (Internet, Web, linguagens), crie um acontecimento por etapa, como já ocorre com ARPANET, TCP/IP, DNS e Web.

### Imagens

Com `"imagem": null`, o TempoEdu busca a miniatura do artigo da Wikipédia indicado em `wikipedia`, usando a API pública da Wikimedia (sem chave, direto do navegador). Se não houver imagem ou ela falhar, a interface mostra uma ilustração própria gerada em SVG. Para usar uma imagem específica, coloque a URL direta (por exemplo, de Wikimedia Commons, Unsplash, Pexels ou Pixabay) em `imagem`, ou salve o arquivo em `assets/images/` e use o caminho relativo (`assets/images/enig.jpg`).

A interface não exibe créditos de imagens. Ainda assim, algumas licenças (como CC BY-SA, comum na Wikimedia Commons) **exigem atribuição**. Se você reutilizar imagens em outros contextos ou preferir não ter essa exigência, use imagens de domínio público ou CC0 e informe-as no campo `imagem`.

## Como criar novas linhas do tempo temáticas

1. Copie `data/computacao.json` para um novo arquivo, por exemplo `data/internet.json`, e substitua os acontecimentos.
2. Em `js/app.js`, altere a constante `CAMINHO_DADOS` para o novo arquivo (ou crie outra página HTML que use um `CAMINHO_DADOS` diferente).
3. Ajuste `CATEGORIAS` e `PERIODOS` em `js/filtros.js` para o novo tema.
4. Ajuste `JANELA_INICIAL`, no topo de `js/timeline.js`, para o intervalo de anos que deve aparecer ao abrir a página.
5. Atualize textos do `index.html` (título, apresentação, "Sobre").

## Tecnologias

- HTML5, CSS3 (variáveis CSS, grid, flexbox) e JavaScript puro (ES2015+).
- [vis-timeline 7.7.3](https://visjs.github.io/vis-timeline/) por CDN (cdnjs, com alternativa em jsDelivr caso a primeira falhe).
- JSON para os dados; `fetch()` com caminho relativo.
- Fontes Inter e Space Grotesk (Google Fonts), com alternativas do sistema.
- API pública de resumos da Wikipédia (apenas para miniaturas, opcional).

## Navegação e interação

- **Arrastar**: mover no tempo. **Ctrl + rolagem** ou pinça: zoom. Há botões de zoom e de deslocamento.
- Clique em um acontecimento para ver os detalhes. Em telas pequenas, o painel abre como folha inferior; feche com ✕, `Esc` ou tocando fora dela.
- A seção "Ver os acontecimentos em lista" oferece o mesmo conteúdo para quem prefere teclado ou leitor de tela.

## Licenciamento

O TempoEdu é um projeto educacional aberto que utiliza
licenças distintas para seu código-fonte e seus conteúdos.

### Código-fonte
Licenciado sob MIT License.

Consulte o arquivo [LICENSE](./LICENSE).

### Conteúdos educacionais
Os textos, descrições históricas e materiais didáticos
originais são licenciados sob Creative Commons
Atribuição 4.0 Internacional (CC BY 4.0).

Consulte [LICENSE-CONTENT.md](./LICENSE-CONTENT.md).

### Recursos de terceiros
Imagens, bibliotecas, ícones e outros materiais externos
seguem suas respectivas licenças.

### Objetivo
Permitir que estudantes, professores e desenvolvedores
utilizem, compartilhem e adaptem os recursos educacionais
do TempoEdu.

## Contribuições

Correções históricas e novos acontecimentos são bem-vindos por *issue* ou *pull request*. Indique a fonte consultada para facilitar a revisão.
