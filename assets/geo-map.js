/* GeoMiniMap: local, dependency-free Web Mercator slippy map.
   Base tiles are optional; pins and coordinates remain visible without network. */
(() => {
  'use strict';
  const rad=Math.PI/180;
  const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
  const TILE=256;
  const toXY=(lat,lng,z)=>{
    const a=clamp(lat,-85.05112878,85.05112878)*rad;
    const scale=TILE*Math.pow(2,z);
    return {x:((lng+180)/360)*scale,y:(1-Math.log(Math.tan(a)+1/Math.cos(a))/Math.PI)/2*scale};
  };
  const toLatLng=(x,y,z)=>{
    const s=TILE*Math.pow(2,z),n=Math.PI*(1-2*y/s);
    return {lat:Math.atan(Math.sinh(n))/rad,lng:x/s*360-180};
  };
  class GeoMiniMap {
    constructor(id){
      this.el=document.getElementById(id);
      if(!this.el)throw new Error('Container do mapa indisponível');
      this.el.classList.add('geo-map');
      this.el.innerHTML='';
      this.tiles=document.createElement('div');this.tiles.className='geo-tiles';
      this.grid=document.createElement('div');this.grid.className='geo-grid';
      this.pins=document.createElement('div');this.pins.className='geo-pins';
      this.popup=document.createElement('div');this.popup.className='geo-popup';this.popup.hidden=true;
      this.controls=document.createElement('div');this.controls.className='geo-controls';
      const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.title='Aproximar';plus.setAttribute('aria-label','Aproximar mapa');
      const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.title='Afastar';minus.setAttribute('aria-label','Afastar mapa');
      this.controls.append(plus,minus);
      this.hud=document.createElement('div');this.hud.className='geo-hud';
      this.attribution=document.createElement('div');this.attribution.className='geo-attribution';this.attribution.textContent='© OpenStreetMap • Tiles Esri no modo satélite';
      this.el.append(this.tiles,this.grid,this.pins,this.popup,this.controls,this.hud,this.attribution);
      this.center={lat:-23.61,lng:-46.51};this.zoom=11;this.markers=[];this.mode='street';this.active=null;this.drag=null;
      plus.addEventListener('click',e=>{e.stopPropagation();this.setView(this.center,this.zoom+1);});
      minus.addEventListener('click',e=>{e.stopPropagation();this.setView(this.center,this.zoom-1);});
      this.el.addEventListener('wheel',e=>{if(e.target.closest('.geo-popup'))return;e.preventDefault();this.setView(this.center,this.zoom+(e.deltaY<0?1:-1));},{passive:false});
      this.el.addEventListener('dblclick',e=>{if(e.target.closest('.geo-popup, .geo-controls, .geo-pin'))return;this.setView(this.center,this.zoom+1);});
      this.el.addEventListener('pointerdown',e=>{
        if(e.button!==0||e.target.closest('.geo-popup,.geo-controls,.geo-pin'))return;
        this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,origin:toXY(this.center.lat,this.center.lng,this.zoom)};
        try{this.el.setPointerCapture(e.pointerId);}catch(_){}
        this.el.classList.add('dragging');this.closePopup();
      });
      this.el.addEventListener('pointermove',e=>{
        if(!this.drag||e.pointerId!==this.drag.id)return;
        const p=toLatLng(this.drag.origin.x-(e.clientX-this.drag.x),this.drag.origin.y-(e.clientY-this.drag.y),this.zoom);
        this.center.lat=clamp(p.lat,-85,85);this.center.lng=clamp(p.lng,-180,180);this.render();
      });
      const stop=e=>{if(this.drag && this.drag.id===e.pointerId){this.drag=null;this.el.classList.remove('dragging');}};
      this.el.addEventListener('pointerup',stop);this.el.addEventListener('pointercancel',stop);
      this.el.addEventListener('click',e=>{if(e.target===this.el||e.target===this.grid||e.target===this.tiles)this.closePopup();});
      if(window.ResizeObserver){this.observer=new ResizeObserver(()=>this.render());this.observer.observe(this.el);}else window.addEventListener('resize',()=>this.render());
      this.render();
    }
    setView(c,z){this.center={lat:clamp(c.lat,-85,85),lng:clamp(c.lng,-180,180)};this.zoom=clamp(Math.round(z),3,19);this.closePopup();this.render();}
    fitPoints(groups){
      if(!groups.length){this.setView({lat:-23.615,lng:-46.51},11);return;}
      if(groups.length===1){this.setView(groups[0],15);return;}
      const lats=groups.map(p=>p.lat),lngs=groups.map(p=>p.lng);
      const lo={lat:Math.min(...lats),lng:Math.min(...lngs)},hi={lat:Math.max(...lats),lng:Math.max(...lngs)};
      const top=toXY(hi.lat,lo.lng,0),bottom=toXY(lo.lat,hi.lng,0);
      const width=Math.max(300,this.el.clientWidth),height=Math.max(300,this.el.clientHeight);
      const z=Math.floor(Math.min(Math.log2(Math.max(1,(width-100))/Math.max(0.000001,bottom.x-top.x)),Math.log2(Math.max(1,(height-110))/Math.max(0.000001,bottom.y-top.y))));
      const mid=toLatLng((top.x+bottom.x)/2,(top.y+bottom.y)/2,0);
      this.setView(mid,clamp(z,7,16));
    }
    setMarkers(markers){this.markers=markers;this.closePopup();this.render();}
    setMode(mode){this.mode=mode==='satellite'?'satellite':'street';this.render();}
    closePopup(){this.active=null;this.popup.hidden=true;this.popup.innerHTML='';}
    render(){
      if(!this.el.isConnected)return;
      const w=this.el.clientWidth||700,h=this.el.clientHeight||480,c=toXY(this.center.lat,this.center.lng,this.zoom),sz=TILE*Math.pow(2,this.zoom);
      const left=c.x-w/2,top=c.y-h/2;
      this.tiles.replaceChildren();
      const tileTemplate=this.mode==='satellite'
        ? (z,x,y)=>`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
        : (z,x,y)=>`https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      const count=Math.pow(2,this.zoom);
      const minX=Math.floor(left/TILE),maxX=Math.ceil((left+w)/TILE),minY=Math.floor(top/TILE),maxY=Math.ceil((top+h)/TILE);
      for(let ty=minY;ty<=maxY;ty++){
        if(ty<0||ty>=count)continue;
        for(let tx=minX;tx<=maxX;tx++){
          const x=((tx%count)+count)%count;
          const img=document.createElement('img');img.className='geo-tile';img.alt='';img.decoding='async';
          img.draggable=false;img.src=tileTemplate(this.zoom,x,ty);
          img.style.left=Math.round(tx*TILE-left)+'px';img.style.top=Math.round(ty*TILE-top)+'px';
          img.onerror=()=>{img.style.display='none';};
          this.tiles.appendChild(img);
        }
      }
      this.pins.replaceChildren();
      // Screen-space grouping prevents nearby (but distinct) GPS points from masking each other.
      // Opening a group shows every original project without changing its stored coordinates.
      const projected=this.markers.map(m=>{
        const p=toXY(m.lat,m.lng,this.zoom);return {...m,screenX:p.x-left,screenY:p.y-top};
      }).filter(m=>m.screenX>=-45&&m.screenY>=-45&&m.screenX<=w+45&&m.screenY<=h+45);
      const clusters=[];
      for(const m of projected){
        let c=clusters.find(c=>Math.hypot(c.x-m.screenX,c.y-m.screenY)<44);
        if(c){c.members.push(m);c.x=(c.x*(c.members.length-1)+m.screenX)/c.members.length;c.y=(c.y*(c.members.length-1)+m.screenY)/c.members.length;}
        else clusters.push({members:[m],x:m.screenX,y:m.screenY});
      }
      this.displayMarkers=clusters.map(c=>{
        if(c.members.length===1)return {...c.members[0],screenX:c.x,screenY:c.y};
        const total=c.members.reduce((sum,m)=>sum+m.count,0);
        const html=`<div class="popup-head">${total} projetos em ${c.members.length} pontos próximos</div>`+
          `<div class="popup-desc">Agrupamento visual: aproxime o mapa para separar os pontos. Cada projeto mantém suas coordenadas originais.</div>`+
          c.members.map(m=>m.html).join('<div class="geo-cluster-separator"></div>');
        return {...c.members[0],count:total,className:'p-multi',title:`${total} projetos em ${c.members.length} pontos próximos`,screenX:c.x,screenY:c.y,html};
      });
      this.displayMarkers.forEach((item,idx)=>{
        const b=document.createElement('button');b.type='button';b.className=`geo-pin ${item.className||''}`;
        b.style.left=item.screenX+'px';b.style.top=item.screenY+'px';b.textContent=item.count||1;
        b.title=item.title||`${item.lat}, ${item.lng}`;b.setAttribute('aria-label',b.title);
        b.addEventListener('click',e=>{e.stopPropagation();this.active=idx;this.renderPopup();});
        this.pins.appendChild(b);
      });
      this.hud.textContent=`Centro: ${this.center.lat.toFixed(5)}, ${this.center.lng.toFixed(5)} • Zoom ${this.zoom}`;
      if(this.active!==null)this.renderPopup();
    }
    renderPopup(){
      const m=this.displayMarkers?.[this.active];if(!m){this.closePopup();return;}
      const w=this.el.clientWidth,h=this.el.clientHeight,c=toXY(this.center.lat,this.center.lng,this.zoom),p=toXY(m.lat,m.lng,this.zoom);
      const x=m.screenX,y=m.screenY;
      this.popup.innerHTML=`<button class="geo-popup-close" type="button" aria-label="Fechar janela">×</button><div class="geo-popup-scroll">${m.html||''}</div>`;
      this.popup.hidden=false;
      this.popup.style.left=clamp(x,145,Math.max(145,w-145))+'px';
      this.popup.style.top=clamp(y,180,Math.max(180,h-10))+'px';
      this.popup.querySelector('.geo-popup-close').onclick=()=>this.closePopup();
    }
  }
  window.GeoMiniMap=GeoMiniMap;
})();
