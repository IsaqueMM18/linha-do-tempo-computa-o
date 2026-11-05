# TempoEdu

**Explore o passado. Compreenda o presente. Descubra o futuro.**

TempoEdu é um **Recurso Educacional Aberto (REA)**: uma linha do tempo interativa sobre a **História da Computação**, dos primeiros instrumentos de cálculo até a inteligência artificial generativa. É uma aplicação **100% estática** (HTML, CSS e JavaScript), sem backend, banco de dados, chaves de API ou autenticação, pronta para o **GitHub Pages**.

## Funcionalidades

- Linha do tempo interativa com [vis-timeline](https://visjs.github.io/vis-timeline/docs/timeline/): navegação horizontal, zoom, cores por categoria e títulos nos marcadores.
- 94 acontecimentos, da Antiguidade a 2022, organizados em 11 categorias.
- Pesquisa por título, descrição, importância e personagens (ignora acentos e maiúsculas).
- Filtros por categoria (múltipla escolha) e período histórico, combinados com a pesquisa.
- Contador de resultados, mensagem para buscas sem resultados e botões **Limpar filtros** e **Visão completa**.
- Agrupamento opcional por categoria.
- Painel de detalhes com data, categoria, descrição, importância histórica, personagens, imagem, créditos da imagem e link para a Wikipédia.
- Navegação entre acontecimentos e link compartilhável para cada item (`...#evento-19`).
- Modo claro e escuro, layout responsivo, navegação por teclado e lista alternativa dos acontecimentos.

## Estrutura

```
tempoedu/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── timeline.js
│   └── filtros.js
├── data/
│   └── computacao.json
├── assets/
│   ├── images/
│   └── icons/
├── LICENSE
├── LICENSE-CONTENT.md
├── THIRD_PARTY_NOTICES.md
├── README.md
└── .nojekyll
```

Os caminhos dos arquivos locais são relativos. O projeto pode ser publicado no GitHub Pages ou servido na raiz de um domínio.

## Como testar no seu computador

Navegadores bloqueiam `fetch()` em arquivos abertos diretamente com `file://`. Use um servidor local, por exemplo:

```bash
cd tempoedu
python3 -m http.server 8000
```

Depois, abra `http://localhost:8000` no navegador.

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
| `id` | Número inteiro único. |
| `data` | Formato `AAAA-MM-DD`. Para anos antes de Cristo, use sinal negativo (por exemplo, `-2700-01-01`). Se o dia ou mês não for conhecido, use `01` no campo correspondente e informe a precisão. |
| `precisao` | `dia`, `mes`, `ano` ou `aprox`. |
| `dataExibicao` | Texto mostrado ao leitor (por exemplo, `c. 820` ou `maio de 1974`). Use-o para explicar datas incertas. |
| `fim` | Opcional. Data final para acontecimentos que representam períodos; aparecem como faixa. |
| `nota` | Opcional. Observação exibida no painel. |
| `categoria` | Uma categoria existente ou uma nova. Para definir uma cor própria, edite `CATEGORIAS` em `js/filtros.js`. |
| `periodo` | Deve corresponder a um dos nomes definidos em `PERIODOS`, em `js/filtros.js`. |
| `imagem` | Use `null` para buscar uma miniatura licenciada na Wikipédia ou informe uma URL HTTPS direta com os metadados de atribuição descritos abaixo. |
| `wikipedia` | Link do artigo correspondente, preferencialmente em português. |

Confira datas, nomes e informações em fontes confiáveis antes de publicar. Para fatos que ocorreram em várias etapas (como Internet, Web e linguagens), prefira criar um acontecimento para cada etapa.

### Imagens e atribuição

Quando o campo `imagem` é `null`, o TempoEdu consulta a **Action API do MediaWiki** do artigo indicado em `wikipedia`. Primeiro, usa a propriedade `pageimages` para localizar uma imagem com licença livre; depois, consulta `imageinfo` e os metadados de extensão (`extmetadata`) para obter a URL, o autor/crédito, a licença e a página de origem.

A imagem só é exibida quando há uma URL HTTPS, uma licença identificada e uma página de origem válida. Após o carregamento bem-sucedido, o painel de detalhes apresenta os créditos da imagem. Se os dados necessários não forem encontrados, ou se a imagem falhar ao carregar, o projeto mantém a ilustração SVG de substituição. A disponibilidade e a qualidade dos metadados dependem das informações fornecidas pela página do arquivo na Wikimedia.

Para cadastrar manualmente uma imagem, informe uma URL HTTPS e os metadados no mesmo objeto do acontecimento:

```json
{
  "imagem": "https://exemplo.org/imagem.jpg",
  "imagemAutor": "Nome do autor ou responsável",
  "imagemLicenca": "CC BY 4.0",
  "imagemLicencaUrl": "https://creativecommons.org/licenses/by/4.0/",
  "imagemFonte": "https://exemplo.org/pagina-do-arquivo"
}
```

Regras para imagens cadastradas manualmente:

- `imagem`: URL HTTPS direta da imagem.
- `imagemAutor`: nome do autor ou crédito; se não for informado, a interface indica **Não informado**.
- `imagemLicenca`: identificação textual da licença. É obrigatória.
- `imagemLicencaUrl`: URL HTTPS da licença, quando disponível.
- `imagemFonte`: URL HTTPS da página de origem do arquivo. É obrigatória.

O sistema não aceita caminhos locais ou relativos para imagens manuais. Não basta informar apenas a URL da imagem: a licença e a página de origem também precisam ser cadastradas. Antes de reutilizar qualquer imagem, confira a licença e cumpra suas condições, inclusive atribuição e compartilhamento pela mesma licença quando aplicável.

A API do MediaWiki e as imagens da Wikimedia são serviços e conteúdos de terceiros. Cada imagem mantém sua própria licença; a licença geral do TempoEdu não se estende a elas. Consulte também [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## Como criar novas linhas do tempo temáticas

1. Copie `data/computacao.json` para um novo arquivo, por exemplo `data/internet.json`, e substitua os acontecimentos.
2. Em `js/app.js`, altere a constante `CAMINHO_DADOS` para apontar para o novo arquivo (ou crie outra página HTML).
3. Ajuste `CATEGORIAS` e `PERIODOS` em `js/filtros.js`.
4. Ajuste `JANELA_INICIAL`, no início de `js/timeline.js`, para o intervalo de anos exibido ao abrir a página.
5. Atualize os textos do `index.html`, como título, apresentação e seção "Sobre".

## Tecnologias e serviços externos

- HTML5, CSS3 (variáveis CSS, grid e flexbox) e JavaScript puro (ES2015+).
- [vis-timeline 7.7.3](https://visjs.github.io/vis-timeline/), carregada por CDN: cdnjs como endereço principal e jsDelivr como alternativa.
- JSON para os dados e `fetch()` com caminhos relativos.
- Fontes Inter e Space Grotesk, disponibilizadas pelo Google Fonts, com alternativas do sistema.
- [MediaWiki Action API](https://www.mediawiki.org/wiki/API:Main_page), propriedades `pageimages` e `imageinfo`, para localizar imagens e consultar metadados de atribuição nos artigos da Wikipédia.

## Navegação e interação

- **Arrastar**: mover no tempo. **Ctrl + rolagem** ou pinça: zoom. Também há botões para aproximar, afastar e deslocar.
- Clique em um acontecimento para abrir os detalhes. Em telas pequenas, o painel abre como uma folha inferior; feche com ✕, `Esc` ou tocando fora dela.
- A seção **Ver os acontecimentos em lista** oferece o mesmo conteúdo em formato alternativo, útil para navegação por teclado e leitores de tela.

## Licenciamento

O TempoEdu utiliza licenças distintas para seu código-fonte e seus conteúdos originais.

### Código-fonte

Licenciado sob a [MIT License](./LICENSE).

### Conteúdos educacionais

Os textos, descrições históricas e materiais didáticos originais do projeto são licenciados sob [Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)](./LICENSE-CONTENT.md).

### Recursos de terceiros

Imagens, bibliotecas, fontes tipográficas e outros materiais externos mantêm suas próprias licenças e condições. Consulte [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) e os créditos apresentados no painel de detalhes para cada imagem carregada.

As licenças do código e do conteúdo original não substituem nem alteram as licenças dos recursos de terceiros.

## Contribuições

Correções históricas e novos acontecimentos são bem-vindos por *issue* ou *pull request*. Indique as fontes consultadas e, ao incluir imagens ou outros recursos, informe a origem, a autoria e a licença correspondente.
