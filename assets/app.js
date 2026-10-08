/* TOP 40 | Geolocalização de Projetos — site estático, sem backend.
 * Base local: assets/data.js (objeto window.TOP40_SEED).
 * Bibliotecas externas: Leaflet (mapa) e SheetJS (Excel). 
 */
(() => {
  'use strict';
  const seed = window.TOP40_SEED || { headers: [], rows: [], source: '', myMaps: '', googleEarth: '' };
  const fields = {
    id: 'definicao_do_projeto', note: 'nota', family: 'familia_regen', polo: 'Polo',
    op: 'Polo Operacional', status: 'status', contract: 'contrato',
    company: 'Empreiteira_Contratos', ups: 'Plan_Servico_UPS', circuit: 'Circuito',
    area: 'Area', date: 'dataATEC', city: 'Município', lat: 'Latitude', lng: 'Longitude'
  };
  const columnLabels = {
    definicao_do_projeto:'Projeto', nota:'Nota', familia_regen:'Família', Polo:'Polo',
    'Polo Operacional':'Polo operacional', status:'Status', contrato:'Contrato',
    Empreiteira_Contratos:'Empreiteira', Plan_Servico_UPS:'Plan. Serviço UPS',
    Circuito:'Circuito', Area:'Área', dataATEC:'Data ATEC', 'Município':'Município',
    Latitude:'Latitude', Longitude:'Longitude', 'Coordenadas (lat,long)':'Coordenadas (lat,long)',
    'Link Google Maps':'Google Maps', 'Link Rota (Como chegar)':'Rota / GPS',
    'Link Street View':'Street View', 'Link My Maps (mapa geral)':'My Maps'
  };
  const aliasMap = {
    projeto:fields.id, definicaodoprojeto:fields.id, definicaoprojeto:fields.id,
    numero_projeto:fields.id, empreiteira:fields.company, contratada:fields.company,
    municipio:fields.city, cidade:fields.city, latitude:fields.lat, longitude:fields.lng,
    status:fields.status, circuito:fields.circuit, area:fields.area, dataatec:fields.date,
    data_atec:fields.date, planservicoups:fields.ups
  };
  const companyColors = {'Start':'#13aeb7', 'Engelmig':'#428cda', 'PSC Alpitel':'#a07ad1'};
  const statusColors = ['#16b7bd','#3e91d8','#ac83d7','#24a67b','#efab4b','#8197ac'];
  const el = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanString = value => String(value == null ? '' : value).trim();
  const number = value => {
    if(typeof value==='number') return Number.isFinite(value) ? value : null;
    let t=cleanString(value).replace(/\s/g,'');
    if(!t) return null;
    if(t.includes(',') && !t.includes('.')) t=t.replace(',','.');
    else if(t.includes(',') && t.includes('.')) t=t.replace(/\./g,'').replace(',','.');
    const val=Number(t);
    return Number.isFinite(val)?val:null;
  };
  const isoDate = v => {
    if(v instanceof Date && !isNaN(v)) return v.toISOString().slice(0,10);
    if(v===null || v===undefined || v==='') return '';
    const n=number(v);
    if(n!==null && n>30000 && n<90000){
      const d=new Date(Date.UTC(1899,11,30)+Math.floor(n)*86400000);
      return d.toISOString().slice(0,10);
    }
    const s=cleanString(v);
    if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
    const d=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if(d) return `${d[3]}-${d[2].padStart(2,'0')}-${d[1].padStart(2,'0')}`;
    return '';
  };
  const brDate = v => { const s=isoDate(v); return s ? s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4) : '—'; };
  const fmtNumber = n => new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(n);
  const isValidGeo = (a,b) => a!==null && b!==null && a>=-90&&a<=90&&b>=-180&&b<=180&&!(a===0&&b===0);
  const latLngKey = r => r._lat.toFixed(8)+'|'+r._lng.toFixed(8);
  const shortText = (s,max=45) => s.length>max?s.slice(0,max-1)+'…':s;
  const mapsUrl = r => r._geo ? `https://www.google.com/maps/search/?api=1&query=${r._lat}%2C${r._lng}` : '';
  const routeUrl = r => r._geo ? `https://www.google.com/maps/dir/?api=1&destination=${r._lat}%2C${r._lng}&travelmode=driving` : '';
  const streetUrl = r => r._geo ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${r._lat}%2C${r._lng}` : '';
  const myMapsUrl = seed.myMaps || 'https://www.google.com/maps/d/viewer?mid=1FhSs4z4XyVo8q6ywBexvTMaPd01oMt0';
  const state = {
    originalHeaders:(seed.headers||[]).filter(Boolean), headers:(seed.headers||[]).filter(Boolean),
    rows:[], visible:[], markerGroups:new Map(), markers:new Map(), map:null,
    streetTiles:null,satelliteTiles:null,tileMode:'street', geo:'all',
    page:1, pageSize:30, selected:'', originalCount:0, source:seed.source||'Planilha de projetos',
    loadedAt:'08/10/2026', toastTimer:null
  };

  function hydrateRow(input,index){
    const r={...input};
    r._id=cleanString(r[fields.id])||`Registro ${index+1}`;
    r._row=index+2;
    r._lat=number(r[fields.lat]);
    r._lng=number(r[fields.lng]);
    r._geo=isValidGeo(r._lat,r._lng);
    r._date=isoDate(r[fields.date]);
    r._company=cleanString(r[fields.company])||'Não informada';
    r._status=cleanString(r[fields.status])||'Não informado';
    r._city=cleanString(r[fields.city])||'Não informado';
    r._circuit=cleanString(r[fields.circuit]);
    r._area=cleanString(r[fields.area]);
    r._polo=cleanString(r[fields.polo]);
    r._haystack=Object.keys(r).filter(k=>!k.startsWith('_')).map(k=>cleanString(r[k])).join(' ').toLocaleLowerCase('pt-BR');
    return r;
  }
  function setRows(rows,source,headers){
    state.rows=rows.map(hydrateRow);
    state.headers=[...(headers||state.originalHeaders)].filter(Boolean);
    state.source=source||state.source;
    state.originalCount=rows.length;
    state.selected='';state.page=1;
    el('dataSource').textContent=state.source;
    el('baseDate').textContent=state.loadedAt;
    el('tableColumnCount').textContent=`${state.headers.length} colunas de origem`;
    populateSelectors();resetAll(false);renderAll();
  }
  function unique(field){return Array.from(new Set(state.rows.map(r=>cleanString(r[field])).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));}
  function fillSelect(id,items){
    const select=el(id), first=select.options[0].outerHTML;
    select.innerHTML=first+items.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    select.value='';
  }
  function populateSelectors(){
    fillSelect('filterCompany',unique(fields.company));
    fillSelect('filterStatus',unique(fields.status));
    fillSelect('filterCity',unique(fields.city));
    fillSelect('filterCircuit',unique(fields.circuit));
    fillSelect('filterArea',unique(fields.area));
    fillSelect('filterPolo',unique(fields.polo));
  }
  function getFilters(){return {
    text:el('searchText').value.trim().toLocaleLowerCase('pt-BR'),company:el('filterCompany').value,
    status:el('filterStatus').value,city:el('filterCity').value,
    circuit:el('filterCircuit').value,area:el('filterArea').value,polo:el('filterPolo').value,
    start:el('filterDateStart').value,end:el('filterDateEnd').value,geo:state.geo
  };}
  function filterData(){
    const f=getFilters();
    state.visible=state.rows.filter(r =>
      (!f.text || r._haystack.includes(f.text)) &&
      (!f.company||r._company===f.company) && (!f.status||r._status===f.status) &&
      (!f.city||r._city===f.city) && (!f.circuit||r._circuit===f.circuit) &&
      (!f.area||r._area===f.area) && (!f.polo||r._polo===f.polo) &&
      (!f.start|| (r._date && r._date>=f.start)) &&
      (!f.end|| (r._date && r._date<=f.end)) &&
      (f.geo==='all' || (f.geo==='with'&&r._geo) || (f.geo==='without'&&!r._geo))
    );
    const count=Object.entries(f).filter(([k,v])=>k==='geo'?v!=='all':!!v).length;
    el('filtersCount').textContent=count;
    el('tableSelection').textContent=count?`${count} filtro(s) aplicado(s)`:'Todos os projetos';
  }
  function groupsFor(records){
    const groups=new Map();
    for(const r of records) if(r._geo){
      const k=latLngKey(r);
      if(!groups.has(k))groups.set(k,{lat:r._lat,lng:r._lng,items:[],companies:new Set()});
      const g=groups.get(k);g.items.push(r);g.companies.add(r._company);
    }
    return groups;
  }
  function renderKpis(groups){
    const total=state.visible.length;
    const nGeo=state.visible.filter(r=>r._geo).length;
    const nCompanies=new Set(state.visible.map(r=>r._company)).size;
    el('kpiProjects').textContent=fmtNumber(total);
    el('kpiProjectsSub').textContent=`de ${state.originalCount} projetos na base`;
    el('kpiLocated').textContent=fmtNumber(nGeo);
    el('kpiLocatedSub').textContent= total?`${fmtNumber(nGeo/total*100)}% da seleção`:'Nenhum na seleção';
    el('kpiPoints').textContent=fmtNumber(groups.size);
    el('kpiMissing').textContent=fmtNumber(total-nGeo);
    el('kpiMissingSub').textContent=(total-nGeo)===0?'Nenhuma pendência geográfica':'Continuam disponíveis na planilha';
    el('kpiCompanies').textContent=fmtNumber(nCompanies);
    el('kpiCompaniesSub').textContent=nCompanies===1?'Empresa identificada':'Empresas identificadas';
    el('mapSubtitle').textContent=`${nGeo} projeto(s) em ${groups.size} ponto(s) distintos · ${total-nGeo} sem GPS`;
    el('mapCounter').textContent=`${groups.size} ponto(s) no mapa`;
    el('tableCount').textContent=`${total} registros`;
  }
  function countBy(prop){const c=new Map();for(const r of state.visible)c.set(r[prop],(c.get(r[prop])||0)+1);return [...c.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR'));}
  function renderBars(id,data,isCompany){
    const max=Math.max(1,...data.map(x=>x[1]));
    const node=el(id);
    node.innerHTML=data.length?data.map(([label,val],i)=>{
      const fill=isCompany?(companyColors[label]||'#7891a6'):statusColors[i%statusColors.length];
      return `<div class="chart-row"><div class="chart-label" title="${esc(label)}">${esc(label)}</div><div class="chart-track"><div class="chart-fill" style="width:${(val/max*100).toFixed(1)}%;background:${fill}"></div></div><span class="chart-value">${val}</span></div>`;
    }).join(''):'<div class="chart-empty">Nenhum projeto corresponde aos filtros.</div>';
  }
  function getMap(){
    // Local map engine: no external JS, so markers work even without tile access.
    try{
      const m=new window.GeoMiniMap('projectMap');
      state.map=m;
      el('mapFallback').hidden=true;
      return m;
    }catch(err){
      console.warn('Falha ao iniciar o mapa local:',err);
      el('mapFallback').hidden=false;el('mapOverlayTip').hidden=true;return null;
    }
  }
  function pinClass(g){
    if(g.companies.size!==1)return 'p-multi';
    const c=[...g.companies][0];
    return c==='Start'?'p-start':c==='Engelmig'?'p-engelmig':c==='PSC Alpitel'?'p-psc':'p-multi';
  }
  function buildPopup(g){
    const parts=g.items.map(r=>`<button type="button" class="popup-project" data-open-project="${esc(r._id)}">${esc(r._id)}<small>${esc(r._company)} · ${esc(r._status)} · ${esc(r._city)}</small></button>`).join('');
    const url=mapsUrl(g.items[0]);
    return `<div class="popup-head">${g.items.length} projeto(s) neste ponto</div><div class="popup-desc">${esc(g.lat.toFixed(7))}, ${esc(g.lng.toFixed(7))}</div><div class="popup-list">${parts}</div><div class="popup-meta"><span>${g.companies.size} empreiteira(s)</span><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Ver no Google Maps ↗</a></div>`;
  }
  function fitCurrentMap(){
    if(!state.map)return;
    state.map.fitPoints([...state.markerGroups.values()]);
  }
  function renderMap(groups,fit=true){
    state.markerGroups=groups;
    if(!state.map)return;
    const entries=[...groups.values()].map(g=>({lat:g.lat,lng:g.lng,count:g.items.length,className:pinClass(g),
      title:`${g.items.length} projeto(s) — ${g.lat}, ${g.lng}`,html:buildPopup(g)}));
    state.map.setMarkers(entries);
    if(fit)fitCurrentMap();
  }
  function renderTableHeaders(){
    el('tableHeaders').innerHTML=state.headers.map(h=>`<th title="${esc(h)}">${esc(columnLabels[h]||h)}</th>`).join('');
  }
  const linkColumns=['Link Google Maps','Link Rota (Como chegar)','Link Street View','Link My Maps (mapa geral)'];
  function renderCell(r,h){
    if(h===fields.id)return `<td><div class="project-cell"><button class="open-details" type="button" data-open-project="${esc(r._id)}">${esc(r._id)}</button></div></td>`;
    if(h===fields.date)return `<td title="${esc(r._date)}">${esc(brDate(r[h]))}</td>`;
    if(h===fields.status){let kind=r._status.includes('DELI')?'deli':r._status.includes('ASSI')?'assi':r._status.includes('EXEC')?'exec':'';return `<td><span class="status-tag ${kind}">${esc(r._status)}</span></td>`;}
    if(h===fields.lat||h===fields.lng)return `<td class="${r._geo?'':'coord-missing'}">${r[h]===null||r[h]===''||r[h]===undefined?'Sem coordenada':esc(r[h])}</td>`;
    if(h==='Coordenadas (lat,long)')return `<td class="${r._geo?'':'coord-missing'}">${r._geo?esc(r._lat+', '+r._lng):'Sem coordenada'}</td>`;
    if(linkColumns.includes(h)){
      const link=h==='Link Google Maps'?mapsUrl(r):h==='Link Rota (Como chegar)'?routeUrl(r):h==='Link Street View'?streetUrl(r):myMapsUrl;
      if(!link)return '<td class="coord-missing">Indisponível</td>';
      const label=h==='Link Google Maps'?'Abrir mapa ↗':h==='Link Rota (Como chegar)'?'Traçar rota ↗':h==='Link Street View'?'Street View ↗':'My Maps ↗';
      return `<td><a class="cell-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${label}</a></td>`;
    }
    const value=r[h];return `<td title="${esc(value)}">${value===null||value===undefined||value===''?'—':esc(value)}</td>`;
  }
  function renderTable(){
    renderTableHeaders();
    const n=state.visible.length;
    const perPage=state.pageSize===Infinity?Math.max(n,1):state.pageSize;
    const maxPage=Math.max(1,Math.ceil(n/perPage));
    state.page=Math.min(state.page,maxPage);
    const start=(state.page-1)*perPage,part=state.visible.slice(start,start+perPage);
    el('tableRows').innerHTML=part.length?part.map(r=>`<tr class="${r._id===state.selected?'selected':''}">${state.headers.map(h=>renderCell(r,h)).join('')}</tr>`).join(''):`<tr><td colspan="${state.headers.length}" style="padding:30px;color:#8596a5;text-align:center;position:static">Nenhum projeto encontrado com os filtros aplicados.</td></tr>`;
    el('paginationInfo').textContent=n?`Exibindo ${start+1}–${Math.min(start+perPage,n)} de ${n} registros`:'Nenhum registro nesta seleção';
    el('pageIndicator').textContent=`${state.page} / ${maxPage}`;
    el('pagePrev').disabled=state.page<=1;
    el('pageNext').disabled=state.page>=maxPage;
  }
  function renderAll(){
    filterData();const groups=groupsFor(state.visible);
    renderKpis(groups);renderBars('companyBars',countBy('_company'),true);renderBars('statusBars',countBy('_status'),false);
    renderMap(groups);renderTable();
  }
  function filterChanged(){state.page=1;renderAll();}
  function resetAll(shouldRender=true){
    ['searchText','filterCompany','filterStatus','filterCity','filterCircuit','filterArea','filterPolo','filterDateStart','filterDateEnd'].forEach(id=>el(id).value='');
    state.geo='all';el('filterDateStart').setCustomValidity('');el('filterDateEnd').setCustomValidity('');
    document.querySelectorAll('[data-geo]').forEach(b=>b.classList.toggle('active',b.dataset.geo==='all'));
    state.page=1;if(shouldRender)renderAll();
  }
  function copyText(text){
    if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>toast('Coordenadas copiadas.')).catch(()=>toast('Não foi possível copiar automaticamente.'));
    else {const a=document.createElement('textarea');a.value=text;document.body.appendChild(a);a.select();try{document.execCommand('copy');toast('Coordenadas copiadas.');}catch(e){toast('Copie as coordenadas manualmente.');}a.remove();}
  }
  function toast(message){
    const node=el('toast');clearTimeout(state.toastTimer);node.textContent=message;node.classList.add('show');
    state.toastTimer=setTimeout(()=>node.classList.remove('show'),4300);
  }
  function openProject(projectId,fromMap=false){
    const r=state.rows.find(x=>x._id===projectId);
    if(!r){toast('Projeto não encontrado nesta base.');return;}
    state.selected=r._id;
    el('detailTitle').textContent=r._id;
    const bits=[
      ['Empreiteira',r._company],['Município',r._city],['Status',r._status],['Circuito',r._circuit],
      ['Área',r._area],['Polo',r._polo],['Nota',r[fields.note]],['Contrato',r[fields.contract]],
      ['Plan. Serviço UPS',r[fields.ups]],['Data ATEC',brDate(r[fields.date])],
      ['Família',r[fields.family]],['Polo operacional',r[fields.op]]
    ];
    const actions=r._geo ? `<a href="${esc(mapsUrl(r))}" target="_blank" rel="noopener noreferrer">◉ Google Maps ↗</a><a href="${esc(routeUrl(r))}" target="_blank" rel="noopener noreferrer">➜ Traçar rota ↗</a><a href="${esc(streetUrl(r))}" target="_blank" rel="noopener noreferrer">▣ Street View ↗</a><button type="button" id="btnCopyCoords">Copiar coordenadas</button>` : `<div class="disabled">Sem Google Maps</div><div class="disabled">Sem rota</div>`;
    const allFields=state.headers.filter(h=>!linkColumns.includes(h)).map(h=>`<div><dt>${esc(columnLabels[h]||h)}</dt><dd>${esc(h===fields.date?brDate(r[h]):r[h]===null||r[h]===undefined||r[h]===''?'—':r[h])}</dd></div>`).join('');
    el('drawerContent').innerHTML=`<div class="detail-status"><span class="status-tag">${esc(r._status)}</span></div><dl class="details-grid">${bits.map(([name,value])=>`<div><dt>${esc(name)}</dt><dd>${esc(value===null||value===''||value===undefined?'—':value)}</dd></div>`).join('')}</dl><div class="detail-divider"></div><div class="detail-geo-box"><strong>${r._geo?'✓ Localização disponível':'⚠ Localização não informada'}</strong>${r._geo?`<code>${esc(r._lat)}, ${esc(r._lng)}</code>`:'Latitude e/ou longitude ausentes na planilha; nenhum ponto foi inventado.'}</div><div class="detail-actions">${actions}<a href="${esc(myMapsUrl)}" target="_blank" rel="noopener noreferrer">⌖ My Maps ↗</a><button type="button" id="btnFindRow">Ver na planilha ↓</button></div><details class="more-fields" style="margin-top:25px"><summary style="cursor:pointer;font-weight:750;color:#377a91">Ver todos os campos do registro</summary><dl class="details-grid" style="margin-top:16px">${allFields}</dl></details>`;
    const btnCopy=el('btnCopyCoords');if(btnCopy)btnCopy.onclick=()=>copyText(`${r._lat}, ${r._lng}`);
    el('btnFindRow').onclick=()=>{
      const position=state.visible.findIndex(x=>x._id===r._id);
      if(position<0){resetAll(false);el('searchText').value=r._id;renderAll();}else{state.page=state.pageSize===Infinity?1:Math.floor(position/state.pageSize)+1;renderTable();}
      closeDrawer();el('tableSection').scrollIntoView({behavior:'smooth',block:'start'});
    };
    el('drawerBackdrop').hidden=false;el('detailDrawer').classList.add('open');el('detailDrawer').setAttribute('aria-hidden','false');
    if(r._geo && state.map && !fromMap){const k=latLngKey(r),marker=state.markers.get(k);if(marker){state.map.setView([r._lat,r._lng],Math.max(state.map.getZoom(),13),{animate:true});marker.openPopup();}}
    const hash='#projeto='+encodeURIComponent(r._id);if(location.hash!==hash)try{history.replaceState(null,'',hash);}catch(e){}
    renderTable();
  }
  function closeDrawer(){el('detailDrawer').classList.remove('open');el('detailDrawer').setAttribute('aria-hidden','true');el('drawerBackdrop').hidden=true;}
  function renderClock(){const n=new Date();el('clockTime').textContent=n.toLocaleTimeString('pt-BR',{hour12:false,timeZone:'America/Sao_Paulo'});el('clockDate').textContent=n.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'});}
  function exportRows(){return state.visible.map(r=>Object.fromEntries(state.headers.map(h=>[h,h===fields.date?(r._date||''):r[h]??''])));}
  function filenamePart(){return new Date().toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}).replaceAll('/','-');}
  function downloadBlob(name,content,mime){const b=new Blob([content],{type:mime}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
  function csvCell(value){const s=String(value==null?'':value);return /["\n\r;]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;}
  function exportCsv(){const out=[state.headers.map(csvCell).join(';'),...exportRows().map(r=>state.headers.map(h=>csvCell(r[h])).join(';'))].join('\r\n');downloadBlob('TOP40_projetos_filtrados_'+filenamePart()+'.csv','\ufeff'+out,'text/csv;charset=utf-8;');toast('CSV exportado com os registros filtrados.');}
  function exportExcel(){
    if(!window.XLSX){toast('A biblioteca Excel não carregou. Use a exportação CSV ou verifique a internet.');return;}
    try{
      const aoa=[state.headers,...exportRows().map(r=>state.headers.map(h=>r[h]??''))];
      const sheet=XLSX.utils.aoa_to_sheet(aoa);
      sheet['!cols']=state.headers.map(h=>({wch:h===fields.id?25:h==='Município'?20:h.includes('Link')?22:18}));
      sheet['!autofilter']={ref:sheet['!ref']};
      const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,sheet,'Projetos');
      XLSX.writeFile(wb,'TOP40_projetos_filtrados_'+filenamePart()+'.xlsx');
      toast('Excel exportado com os registros filtrados.');
    }catch(err){console.error(err);toast('Falha ao exportar Excel. Utilize o CSV.');}
  }
  function exportSite(){
    const publicRows=state.rows.map(r=>Object.fromEntries(state.headers.map(h=>[h,r[h]??null])));
    const updated={headers:state.headers,rows:publicRows,source:state.source,myMaps:myMapsUrl,googleEarth:seed.googleEarth};
    downloadBlob('data.js', 'window.TOP40_SEED = '+JSON.stringify(updated,null,2)+';\n','application/javascript;charset=utf-8;');
    toast('Arquivo data.js gerado. Substitua assets/data.js no repositório GitHub para persistir a nova base.');
  }
  function normalizeKey(k){return cleanString(k).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase();}
  function resolveHeader(h){
    const value=cleanString(h);
    const original=state.originalHeaders.find(s=>normalizeKey(s)===normalizeKey(value));
    if(original)return original;
    return aliasMap[normalizeKey(value)]||value;
  }
  function loadImportedObjects(data,filename){
    if(!Array.isArray(data)||!data.length){toast('A planilha importada está vazia.');return;}
    const mapped=data.map(record=>Object.fromEntries(Object.entries(record).map(([k,v])=>[resolveHeader(k),v])));
    if(!mapped.some(r=>cleanString(r[fields.id]))){toast('Não foi encontrada a coluna de identificação do projeto.');return;}
    const headers=Array.from(new Set([...state.originalHeaders,...mapped.flatMap(x=>Object.keys(x))]));
    const rowData=mapped.filter(r=>cleanString(r[fields.id])).map(r=>Object.fromEntries(headers.map(h=>[h,r[h]??null])));
    if(!rowData.length){toast('Nenhum projeto válido encontrado.');return;}
    state.loadedAt=new Date().toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'});
    setRows(rowData,filename,headers);
    toast(`Base importada: ${rowData.length} projetos. Para publicar permanentemente, exporte a Base do site e substitua assets/data.js no GitHub.`);
  }
  function parseCsv(text){
    const firstLine=text.replace(/^\ufeff/,'').split(/\r?\n/)[0]||'';
    const delimiter=[';',',','\t'].sort((a,b)=>(firstLine.split(b).length-firstLine.split(a).length))[0];
    let cells=[],rows=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
      else if(ch===delimiter&&!quoted){cells.push(cell);cell='';}
      else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;cells.push(cell);if(cells.some(c=>c!==''))rows.push(cells);cells=[];cell='';}
      else cell+=ch;
    }
    cells.push(cell);if(cells.some(c=>c!==''))rows.push(cells);
    if(rows.length<2)return [];
    const headers=rows.shift().map(h=>h.replace(/^\ufeff/,''));
    return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]??''])));
  }
  async function importFile(file){
    if(!file)return;
    const ext=file.name.split('.').pop().toLowerCase();
    try{
      if(ext==='csv'){
        const buf=await file.arrayBuffer();let str=new TextDecoder('utf-8').decode(buf);
        if(str.includes('\ufffd'))str=new TextDecoder('windows-1252').decode(buf);
        loadImportedObjects(parseCsv(str),file.name);return;
      }
      if(!window.XLSX){toast('Biblioteca Excel indisponível. Conecte-se à internet ou importe CSV.');return;}
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array',cellDates:false});
      const named=wb.SheetNames.find(n=>normalizeKey(n)==='projetos')||wb.SheetNames[0];
      const data=XLSX.utils.sheet_to_json(wb.Sheets[named],{defval:null,raw:true});
      loadImportedObjects(data,file.name);
    }catch(e){console.error(e);toast('Falha ao importar. Verifique se o arquivo é um Excel ou CSV válido.');}
  }
  function wireEvents(){
    ['searchText','filterCompany','filterStatus','filterCity','filterCircuit','filterArea','filterPolo','filterDateStart','filterDateEnd'].forEach(id=>el(id).addEventListener(id==='searchText'?'input':'change',filterChanged));
    el('resetFilters').addEventListener('click',()=>resetAll(true));
    document.querySelectorAll('[data-geo]').forEach(b=>b.addEventListener('click',()=>{state.geo=b.dataset.geo;document.querySelectorAll('[data-geo]').forEach(x=>x.classList.toggle('active',x===b));filterChanged();}));
    el('mapStreet').addEventListener('click',()=>switchLayer('street'));
    el('mapSatellite').addEventListener('click',()=>switchLayer('satellite'));
    el('fitMap').addEventListener('click',fitCurrentMap);
    el('tablePageSize').addEventListener('change',e=>{state.pageSize=e.target.value==='all'?Infinity:parseInt(e.target.value,10);state.page=1;renderTable();});
    el('pagePrev').addEventListener('click',()=>{state.page=Math.max(1,state.page-1);renderTable();});
    el('pageNext').addEventListener('click',()=>{state.page++;renderTable();});
    el('btnImport').addEventListener('click',()=>el('fileImport').click());
    el('fileImport').addEventListener('change',async e=>{await importFile(e.target.files?.[0]);e.target.value='';});
    el('btnExportCsv').addEventListener('click',exportCsv);
    el('btnExportXlsx').addEventListener('click',exportExcel);
    el('btnExportSite').addEventListener('click',exportSite);
    el('drawerClose').addEventListener('click',closeDrawer);
    el('drawerBackdrop').addEventListener('click',closeDrawer);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});
    document.addEventListener('click',e=>{const btn=e.target.closest('[data-open-project]');if(btn){e.preventDefault();openProject(btn.dataset.openProject,!!btn.closest('.geo-popup'));}});
    window.addEventListener('hashchange',()=>{const id=readHash();if(id)openProject(id);});
  }
  function readHash(){try{const h=location.hash.match(/(?:^#|&)projeto=([^&]+)/);return h?decodeURIComponent(h[1]):'';}catch(e){return '';}}
  function switchLayer(mode){
    if(!state.map)return;
    if(mode===state.tileMode)return;
    state.map.setMode(mode);state.tileMode=mode;
    el('mapStreet').classList.toggle('active',mode==='street');el('mapSatellite').classList.toggle('active',mode==='satellite');
  }
  function boot(){
    el('myMapsLink').href=myMapsUrl;el('mapFallbackMaps').href=myMapsUrl;
    el('earthLink').href=seed.googleEarth||'https://earth.google.com/web/';
    renderClock();setInterval(renderClock,1000);
    wireEvents();getMap();setRows(seed.rows||[],seed.source,state.headers);
    const id=readHash();if(id)openProject(id);
    if(!seed.rows?.length)toast('Nenhum projeto encontrado no arquivo de dados.');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();