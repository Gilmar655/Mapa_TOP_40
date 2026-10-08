# TOP 40 — Localização dos Projetos

Site estático responsivo, pronto para publicação no **GitHub Pages**. Inclui mapa de projetos, filtros sincronizados, indicadores e gráficos, tabela de todas as colunas da base de dados, importação de Excel/CSV, exportações CSV/XLSX, Google Maps, rotas, Street View, Google My Maps e Google Earth.

## Publicar no GitHub Pages

1. Extraia o arquivo ZIP.
2. Crie um repositório no GitHub ou abra o repositório que hospedará o site.
3. Envie **o conteúdo da pasta extraída** para a raiz do repositório (`index.html`, `assets/`, `dados/`, `.nojekyll` e `README.md`). Não envie apenas o ZIP.
4. Vá em **Settings > Pages > Build and deployment** e escolha **Deploy from a branch**, branch **main**, pasta **/(root)**; salve.
5. Acesse o link informado pelo GitHub Pages, no formato `https://USUARIO.github.io/REPOSITORIO/`.

**Importante:** os links do site são relativos, então o site funciona tanto na raiz de um domínio quanto no endereço `USUARIO.github.io/NOME-DO-REPOSITORIO/`. O arquivo `.nojekyll` está incluído.

## Conteúdo do ZIP

- `index.html`: página principal.
- `assets/style.css`: apresentação responsiva (cores claras).
- `assets/app.js`: filtros, indicadores, importação, exportação e detalhes dos projetos.
- `assets/geo-map.js`: motor de mapa local, zoom, agrupamento dos pontos próximos e marcadores independentes de CDN.
- `assets/data.js`: **base de dados operacional publicada**, carregada sem backend.
- `assets/favicon.svg`: ícone do painel.
- `dados/projetos.json`: cópia estruturada, legível por outras ferramentas.
- `dados/PROJETOS_TOP_40_geolocalizacao.xlsx`: planilha original fornecida.
- `dados/projetos_top40.geojson`: pontos para ferramentas SIG.
- `dados/projetos_top40.kml`: arquivo para importar no Google Earth / My Maps.
- `RELATORIO_DE_CONFERENCIA.md`: verificações da base.

## Atualizar a base de dados no site

1. Abra o site e clique em **Importar Excel/CSV**.
2. Escolha uma planilha `.xlsx`, `.xls` ou `.csv` com coluna **definicao_do_projeto** (ou **Projeto**). Para marcar os pontos no mapa, ela precisa também de colunas **Latitude** e **Longitude**.
3. Confira os dados na tela; a importação recalcula automaticamente o mapa, os filtros, os gráficos e a tabela.
4. Clique em **Base do site** para baixar um novo `data.js`.
5. No repositório GitHub, **substitua o arquivo `assets/data.js`** pelo gerado e faça commit. A base atualizada será exibida para todos após a publicação.

**Importação é local à sessão do navegador:** atualizar somente a interface não modifica automaticamente os arquivos publicados no GitHub. Para atualizar também os arquivos KML, GeoJSON ou a planilha original, eles devem ser substituídos no repositório separadamente.

**Exportar Excel/CSV** exporta apenas os projetos que passam pelos filtros. O download do KML incluído é a versão da base original embutida no ZIP, não uma exportação dinâmica após nova importação.

## Sobre o mapa

- Os mapas de fundo são OpenStreetMap (mapa convencional) e Esri World Imagery (satélite). **Mesmo se as imagens de fundo falharem por falta de internet, os marcadores continuam visíveis**, com coordenadas e rotas acessíveis.
- Projetos com o **mesmo par latitude/longitude** ficam num mesmo marcador numerado. Coordenadas distintas, mas muito próximas na tela, são temporariamente agrupadas para evitar sobreposição: aproximar o mapa separa os pontos. Ao clicar, aparecem os projetos individualizados. Nenhum dado de GPS original é alterado.
- Os dados de cada projeto vêm da planilha fornecida; **não foi realizada geocodificação adicional**, nem foram fabricados pontos sem GPS.
- Os botões Google Earth / My Maps abrem os serviços externos originais; seu acesso pode depender das permissões de compartilhamento definidas pelo proprietário.
- O mecanismo de mapa e os marcadores estão incluídos em `assets/geo-map.js` e **não precisam de bibliotecas externas**. As imagens de fundo exigem internet; os marcadores funcionam sem elas. A importação/exportação de `.xlsx` necessita da biblioteca SheetJS carregada pela internet; CSV conta com implementação local.

## Cartografia e privacidade

Antes de publicar o site em repositório **público**, confira se os códigos, coordenadas, contratos e demais informações operacionais podem ser divulgados. Se os dados forem restritos à operação, utilize um ambiente de hospedagem com controle de acesso, pois o GitHub Pages de repositório público não impede que terceiros acessem os arquivos de dados.

Fonte: `PROJETOS_TOP_40_geolocalizacao.xlsx` recebido em 08/10/2026. Criado para a carteira de projetos TOP 40, Polo Leste.

## Repositório de publicação

Repositório fornecido pelo responsável: `https://github.com/Gilmar655/Mapa_TOP_40`. Endereço esperado após ativação do GitHub Pages: `https://gilmar655.github.io/Mapa_TOP_40/`. O repositório público sozinho não ativa o Pages; use as instruções de configuração acima.