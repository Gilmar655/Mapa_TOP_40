# Conferência da base — Projetos TOP 40

**Fonte:** `PROJETOS_TOP_40_geolocalizacao.xlsx`, aba `Projetos`, registros de A2:T83. Inspeção em 08/10/2026.

| Indicador | Quantidade |
| --- | ---: |
| Registros de projetos | **82** |
| Campos na planilha | **20** |
| Projetos com Latitude e Longitude numéricas | **80** |
| Projetos sem Latitude/Longitude | **2** |
| Pares de coordenadas distintos | **29** |
| IDs de projeto duplicados | **0** |

## Empreiteiras

| Empreiteira | Projetos |
| --- | ---: |
| Engelmig | 52 |
| Start | 23 |
| PSC Alpitel | 7 |
| **Total** | **82** |

## Status

| Status | Projetos |
| --- | ---: |
| LIB // AUTO | 36 |
| LIB // DELI | 25 |
| LIB // ASSI | 19 |
| LIB // EXEC | 1 |
| LIB // FISC | 1 |

## Municípios

| Município (como consta na base) | Projetos |
| --- | ---: |
| SÃO PAULO | 68 |
| SANTO ANDRE | 13 |
| MAUA | 1 |

## Pendências de coordenadas

- `DMP/A.LES.26.03188` — Engelmig — SÃO PAULO — LIB // AUTO.
- `DMP/A.LES.26.01969` — Engelmig — SÃO PAULO — LIB // AUTO.

Esses projetos são exibidos na planilha e entram nos indicadores. **Não aparecem no mapa** enquanto a base não informar coordenadas válidas.

## Observações de integridade

- Diversos projetos possuem **Latitude/Longitude idênticas**. O maior grupo tem **28 projetos em um único ponto**. Esses dados foram mantidos exatamente como recebidos; cada marcador agrupa os projetos, sem distribuir pontos artificialmente.
- A aba `Como usar` contém o link My Maps: `https://www.google.com/maps/d/edit?mid=1FhSs4z4XyVo8q6ywBexvTMaPd01oMt0&usp=sharing`. A interface aponta para o modo de visualização público do mesmo ID de mapa. A visibilidade depende do compartilhamento do proprietário.
- `dataATEC` foi interpretada como data serial do Excel para exibição em formato dia/mês/ano. O valor original permanece no arquivo JSON e no `data.js` até nova importação.
- A planilha usa a designação **TOP 40**, mas contém efetivamente **82 registros**, todos preservados no site.

**A conferência verifica integridade, cobertura e agrupamento; não confirma presencialmente a precisão geográfica de cada coordenada.**
