# Créditos e Licenças de Terceiros

Este arquivo registra bibliotecas, fontes e serviços externos utilizados pelo TempoEdu. Os recursos listados aqui mantêm suas próprias licenças; eles não passam a ser licenciados sob MIT ou CC BY 4.0 apenas por integrarem o projeto.

## Biblioteca de linha do tempo

### vis-timeline

- **Versão utilizada:** 7.7.3.
- **Projeto:** https://github.com/visjs/vis-timeline
- **Documentação:** https://visjs.github.io/vis-timeline/
- **CDN principal (CSS):** https://cdnjs.cloudflare.com/ajax/libs/vis-timeline/7.7.3/vis-timeline-graph2d.min.css
- **CDN alternativo (JavaScript):** https://cdn.jsdelivr.net/npm/vis-timeline@7.7.3/standalone/umd/vis-timeline-graph2d.min.js
- **CDN alternativo (CSS):** https://cdn.jsdelivr.net/npm/vis-timeline@7.7.3/styles/vis-timeline-graph2d.min.css
- **Licença declarada pelo projeto:** dupla licença Apache License 2.0 ou MIT (SPDX: `Apache-2.0 OR MIT`). Consulte os textos oficiais:
  - Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0
  - MIT License: https://opensource.org/license/mit/

A distribuição da biblioteca informa que o usuário pode optar por uma das duas licenças. A versão 7.7.3 é a versão fixada nas URLs CDN utilizadas pelo TempoEdu.

## Fontes tipográficas

As fontes são solicitadas ao Google Fonts. Cada família tipográfica mantém sua licença própria.

### Inter

- **Criador:** Rasmus Andersson.
- **Projeto:** https://github.com/rsms/inter
- **Licença:** SIL Open Font License 1.1 (OFL).
- **Texto da licença:** https://openfontlicense.org/

### Space Grotesk

- **Criador:** Florian Karsten.
- **Projeto:** https://github.com/floriankarsten/space-grotesk
- **Licença:** SIL Open Font License 1.1 (OFL).
- **Texto da licença:** https://openfontlicense.org/

## Imagens e metadados

O TempoEdu pode carregar miniaturas associadas aos artigos da Wikipédia por meio da **MediaWiki Action API**. O código consulta:

- `pageimages`, para localizar uma imagem associada ao artigo e solicitar imagens com licença livre;
- `imageinfo`, com `extmetadata`, para obter a URL do arquivo, autor/crédito, identificação da licença, URL da licença e página de descrição/origem.

Serviços e referências:

- MediaWiki Action API: https://www.mediawiki.org/wiki/API:Main_page
- Documentação de `pageimages`: https://www.mediawiki.org/wiki/Extension:PageImages
- Documentação de `imageinfo`: https://www.mediawiki.org/wiki/API:Imageinfo
- Wikimedia Commons: https://commons.wikimedia.org/

As imagens não são redistribuídas como parte do repositório: podem ser carregadas dinamicamente a partir dos serviços Wikimedia. **Cada arquivo possui sua própria licença, autoria e condições de reutilização.** Quando os metadados necessários são encontrados e a imagem carrega, o painel de detalhes do TempoEdu apresenta autor/crédito, licença e link para a página de origem do arquivo.

A consulta automática depende da qualidade e da disponibilidade dos metadados fornecidos pela página do arquivo. Se a licença, a origem ou a URL HTTPS não puderem ser verificadas pelo código, a imagem não é exibida. Imagens cadastradas manualmente no arquivo de dados também precisam informar licença e página de origem; veja as instruções no [README.md](./README.md).

A exibição dos créditos pela aplicação não substitui a conferência das condições específicas de cada licença antes de reutilizar uma imagem em outro contexto.

## Observações sobre escopo das licenças

- O código original do TempoEdu está sob MIT, conforme o arquivo [LICENSE](./LICENSE).
- Os conteúdos educacionais originais estão sob CC BY 4.0, conforme [LICENSE-CONTENT.md](./LICENSE-CONTENT.md).
- As licenças acima não abrangem automaticamente bibliotecas, fontes, imagens, serviços ou quaisquer outros materiais de terceiros.
- Ao redistribuir ou adaptar um recurso de terceiros, consulte sua licença específica e preserve os avisos e atribuições exigidos.
