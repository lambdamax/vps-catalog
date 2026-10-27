(function(){
  var M=window.VPS_MAP,DATA=M.sites,VIEWS=M.views;
  document.getElementById('land').setAttribute('d',M.land);
  var NAMES={vultr:'Vultr',do:'DigitalOcean',linode:'Linode (Akamai)',hetzner:'Hetzner',hostinger:'Hostinger',ovh:'OVHcloud'};
  var SHORT={vultr:'Vultr',do:'DigitalOcean',linode:'Linode',hetzner:'Hetzner',hostinger:'Hostinger',ovh:'OVH'};
  var ORDER=['vultr','do','linode','hetzner','hostinger','ovh'];
  var BIG=['vultr','do','linode'],BUDGET=['hetzner','hostinger','ovh'];
  var LEVELS=[
    {n:1,tag:'Entry',name:'Entry',use:'Cheapest plan per provider: tests, a static site or a small bot.'},
    {n:2,tag:'2 GB+',name:'at least 2 GB RAM',use:'At least 2 GB RAM: a small web app, WordPress or light containers.'},
    {n:3,tag:'4 GB+',name:'at least 4 GB RAM',use:'At least 4 GB RAM: an AI agent runtime, n8n or a small database.'},
    {n:4,tag:'8 GB+',name:'at least 8 GB RAM',use:'At least 8 GB RAM: several containers, a CI runner or a mid-size database.'},
    {n:5,tag:'16 GB+',name:'at least 16 GB RAM',use:'At least 16 GB RAM: many services, larger databases or build servers.'}
  ];
  var VL={world:'World',americas:'Americas',europe:'Europe',asia:'Asia-Pacific'};
  var on={};ORDER.forEach(function(k){on[k]=true});
  var NS='http://www.w3.org/2000/svg';
  var svg=document.getElementById('map'),pins=document.getElementById('pins'),info=document.getElementById('info'),pf=document.getElementById('pf');
  var scale=1,rows=[].slice.call(document.querySelectorAll('#t tbody tr')),chips=[].slice.call(document.querySelectorAll('.chip')),
      q=document.getElementById('q'),empty=document.getElementById('empty'),f='all',level=1;
  function col(k){return 'var(--c-'+k+')'}
  var calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* restart a CSS entrance animation on an element, with an optional stagger delay */
  function enter(node,cls,delay){node.classList.remove(cls);void node.offsetWidth;node.style.animationDelay=(delay||0)+'ms';node.classList.add(cls)}
  /* linked highlight: hovering a provider anywhere (chart, legend, map pin, table row, chip) highlights it everywhere; click pins it */
  var hoverK=null,pinK=null,dash=document.querySelector('.wrap');
  function paintFocus(){
    var k=hoverK||pinK;
    [].forEach.call(document.querySelectorAll('.chart [data-k],.legend [data-k],#pins [data-k],.ins [data-k],.mm-legend [data-k]'),function(e){
      e.classList.toggle('dim',!!k&&e.dataset.k!==k);e.classList.toggle('focus',!!k&&e.dataset.k===k);
    });
    rows.forEach(function(r){r.classList.toggle('dim',!!k&&r.dataset.p!==k);r.classList.toggle('hl',!!k&&r.dataset.p===k)});
    [].forEach.call(pf.querySelectorAll('.pchip'),function(b){b.classList.toggle('pinned',b.dataset.k===pinK)});
    var fb=document.getElementById('focus');
    if(pinK){fb.hidden=false;fb.firstChild.textContent='Pinned: '+NAMES[pinK]+' '}else fb.hidden=true;
  }
  function hoverOn(k){hoverK=k;paintFocus()}
  function hoverOff(){hoverK=null;paintFocus()}
  function togglePin(k){pinK=pinK===k?null:k;paintFocus()}
  function linkHover(node,k){
    node.addEventListener('pointerenter',function(){hoverOn(k)});node.addEventListener('pointerleave',hoverOff);
  }
  function ease(k){return k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2}
  function money(v){return '$'+(v%1?v.toFixed(2):v.toFixed(0))}
  function lv(n){return LEVELS[n-1]}
  function lvTitle(n){return 'L'+n+' '+lv(n).tag}

  /* plan data comes from the table rows, so the table stays the single source */
  /* full text on hover where the compact layout truncates */
  [].forEach.call(document.querySelectorAll('.price small'),function(s){s.title=s.textContent});
  var PLANS=rows.map(function(r){
    var d=r.dataset;
    return {tier:+d.tier,k:d.p,s:d.s,price:+d.price,cpu:+d.cpu,ram:+d.ram,prepay:d.prepay==='1',renew:d.renew||'',
      plan:r.querySelector('.plan').textContent,specs:r.querySelector('.specs').firstChild.textContent};
  });
  function cheapest(k,t){
    var best=null;PLANS.forEach(function(p){if(p.k===k&&p.tier===t&&(!best||p.price<best.price))best=p});return best;
  }
  function tierPlans(t){return PLANS.filter(function(p){return p.tier===t&&on[p.k]})}

  /* level buttons, from the hash so a level can be shared as a link */
  var lvBox=document.getElementById('levels');
  var m=/level=(\d)/.exec(location.hash);if(m&&+m[1]>=1&&+m[1]<=5)level=+m[1];
  LEVELS.forEach(function(L){
    var b=document.createElement('button');b.className='lvbtn';b.type='button';b.dataset.n=L.n;
    var s=document.createElement('b');s.textContent='L'+L.n;b.appendChild(s);b.appendChild(document.createTextNode(L.tag));
    b.setAttribute('aria-label','Level '+L.n+', '+L.name);
    b.addEventListener('click',function(){setLevel(L.n)});lvBox.appendChild(b);
  });
  var prevLevel=null,drawIn=true,levelChanged=true;
  function setLevel(n){
    if(n===level)return;
    prevLevel=level;level=n;levelChanged=true;
    try{history.replaceState(null,'',n===1?location.pathname+location.search:'#level='+n)}catch(e){}
    render();
  }

  /* provider chips */
  ORDER.forEach(function(k){
    var b=document.createElement('button');b.className='pchip';b.type='button';b.dataset.k=k;b.setAttribute('aria-pressed','true');b.style.setProperty('--c',col(k));
    b.innerHTML='<i></i>'+NAMES[k]+' <small>'+DATA[k].length+'</small>';
    b.title=DATA[k].length+' data center locations';
    b.addEventListener('click',function(){on[k]=!on[k];if(!on[k]&&pinK===k)pinK=null;sync()});linkHover(b,k);pf.appendChild(b);
  });
  [['All',true],['None',false]].forEach(function(a){
    var b=document.createElement('button');b.className='link';b.type='button';b.textContent=a[0];
    b.addEventListener('click',function(){ORDER.forEach(function(k){on[k]=a[1]});sync()});pf.appendChild(b);
  });
  /* region buttons */
  var vb=document.getElementById('views');
  Object.keys(VL).forEach(function(v){
    var b=document.createElement('button');b.className='vbtn';b.type='button';b.textContent=VL[v];b.dataset.v=v;b.setAttribute('aria-pressed',v==='world'?'true':'false');
    b.addEventListener('click',function(){pressRegion(v);zoomTo(v)});vb.appendChild(b);
  });
  /* glide the map viewBox between regions; pins are redrawn each frame so they keep a constant on-screen size */
  var curVB=VIEWS.world.split(' ').map(Number),vbRaf;
  function setVB(c){curVB=c;svg.setAttribute('viewBox',c.map(function(n){return n.toFixed(2)}).join(' '));scale=c[2]/960;drawPins();
    var zl=document.getElementById('zoom-lvl');if(zl)zl.textContent=(960/c[2]).toFixed(1).replace(/\.0$/,'')+'×'}
  var region='world';
  function pressRegion(v){region=v;[].forEach.call(vb.children,function(x){x.setAttribute('aria-pressed',x.dataset.v===v?'true':'false')})}
  function animateVB(to,dur){
    var from=curVB.slice(),t0=performance.now();cancelAnimationFrame(vbRaf);
    if(calm){setVB(to);return}
    (function step(t){var k=Math.min(1,(t-t0)/(dur||600)),e=ease(k);
      setVB(from.map(function(f,i){return f+(to[i]-f)*e}));if(k<1)vbRaf=requestAnimationFrame(step)})(t0);
  }
  function zoomTo(v){animateVB(VIEWS[v].split(' ').map(Number))}
  /* free zoom (modal): a box of width w centred on (cx,cy), kept roughly on the map */
  function box(cx,cy,w){
    w=Math.max(60,Math.min(1000,w));var h=w*500/960;
    var x=Math.max(-w*.25,Math.min(960-w*.75,cx-w/2)),y=Math.max(-h*.25,Math.min(500-h*.75,cy-h/2));
    return [x,y,w,h];
  }
  function zoomAround(cx,cy,f,animate){
    var w=curVB[2]*f,h=w*500/960,nx=cx-(cx-curVB[0])*f,ny=cy-(cy-curVB[1])*(h/curVB[3]);
    var b=box(nx+w/2,ny+h/2,w);pressRegion(null);if(animate)animateVB(b,380);else{cancelAnimationFrame(vbRaf);setVB(b)}
  }
  function flyTo(cx,cy,w){pressRegion(null);animateVB(box(cx,cy,w),700)}
  function svgPoint(e){var p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
  /* maximize: the live map moves into a modal card that zooms out from the panel (FLIP) and shrinks back on close */
  var modal=document.getElementById('map-modal'),card=document.getElementById('mm-card'),frame=document.getElementById('mapframe'),
      slot=document.getElementById('map-slot'),mmBody=document.getElementById('mm-body'),mmViews=document.getElementById('mm-views'),
      mapPh=document.getElementById('map-ph'),maxBtn=document.getElementById('map-max'),mmLegend=document.getElementById('mm-legend'),closing=false;
  function flip(from,to){
    return 'translate('+(from.left-to.left)+'px,'+(from.top-to.top)+'px) scale('+(from.width/to.width)+','+(from.height/to.height)+')';
  }
  function buildModalLegend(){
    mmLegend.textContent='';
    ORDER.forEach(function(k){if(!on[k])return;
      var b=document.createElement('button');b.type='button';b.dataset.k=k;var i=document.createElement('i');i.style.background=col(k);
      b.appendChild(i);b.appendChild(document.createTextNode(SHORT[k]+' '));var sm=document.createElement('small');sm.textContent=DATA[k].length;b.appendChild(sm);
      linkHover(b,k);b.addEventListener('click',function(){togglePin(k)});mmLegend.appendChild(b);
    });
  }
  function openMap(at){
    if(closing)return;
    if(modal.open){if(at)flyTo(at.x,at.y,Math.min(curVB[2]*.5,240));return}
    var r0=frame.getBoundingClientRect();
    buildModalLegend();mmBody.appendChild(frame);mmViews.appendChild(vb);
    modal.showModal();
    if(!calm){
      card.style.transformOrigin='0 0';
      card.animate([{transform:flip(r0,card.getBoundingClientRect()),opacity:.6},{transform:'none',opacity:1}],{duration:460,easing:'cubic-bezier(.2,.8,.2,1)'});
    }
    document.getElementById('map-close').focus();
    if(at)setTimeout(function(){flyTo(at.x,at.y,220)},calm?0:260);
  }
  function closeMap(){
    if(!modal.open||closing)return;
    var done=function(){slot.appendChild(frame);mapPh.insertBefore(vb,maxBtn);modal.classList.remove('closing');modal.close();closing=false;
      var r=region||'world';pressRegion(r);cancelAnimationFrame(vbRaf);setVB(VIEWS[r].split(' ').map(Number));maxBtn.focus()};
    if(calm){done();return}
    closing=true;modal.classList.add('closing');
    var to=slot.getBoundingClientRect();to={left:to.left,top:to.top,width:to.width||1,height:Math.max(to.height,frame.offsetHeight*.3)||1};
    card.style.transformOrigin='0 0';
    card.animate([{transform:'none',opacity:1},{transform:flip(to,card.getBoundingClientRect()),opacity:.4}],{duration:360,easing:'cubic-bezier(.4,0,.2,1)'}).onfinish=done;
  }
  maxBtn.addEventListener('click',function(){openMap()});
  /* modal zoom: wheel zooms toward the cursor, drag pans, +/- and reset buttons */
  document.getElementById('zoom-in').addEventListener('click',function(){zoomAround(curVB[0]+curVB[2]/2,curVB[1]+curVB[3]/2,.6,true)});
  document.getElementById('zoom-out').addEventListener('click',function(){zoomAround(curVB[0]+curVB[2]/2,curVB[1]+curVB[3]/2,1/.6,true)});
  document.getElementById('zoom-reset').addEventListener('click',function(){pressRegion('world');zoomTo('world')});
  svg.addEventListener('wheel',function(e){
    if(!modal.open)return;e.preventDefault();var p=svgPoint(e);zoomAround(p.x,p.y,Math.exp(e.deltaY*.0018),false);
  },{passive:false});
  var drag=null,dragged=false;
  svg.addEventListener('pointerdown',function(e){
    if(!modal.open||e.button!==0)return;drag={x:e.clientX,y:e.clientY,vb:curVB.slice(),k:curVB[2]/svg.clientWidth};dragged=false;
  });
  window.addEventListener('pointermove',function(e){
    if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!dragged&&Math.abs(dx)+Math.abs(dy)<4)return;
    if(!dragged){dragged=true;svg.classList.add('dragging');try{svg.setPointerCapture(e.pointerId)}catch(_){}}
    cancelAnimationFrame(vbRaf);pressRegion(null);
    var w=drag.vb[2],k=Math.max(drag.k,drag.vb[3]/svg.clientHeight);
    setVB(box(drag.vb[0]+w/2-dx*k,drag.vb[1]+drag.vb[3]/2-dy*k,w));
  });
  window.addEventListener('pointerup',function(){if(drag){drag=null;svg.classList.remove('dragging');setTimeout(function(){dragged=false},0)}});
  document.getElementById('map-close').addEventListener('click',closeMap);
  modal.addEventListener('cancel',function(e){e.preventDefault();closeMap()});
  modal.addEventListener('click',function(e){if(e.target===modal)closeMap()});
  function el(n,a){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);return e}

  /* ---- map ---- */
  /* group sites that share a point */
  function groups(){
    var g={};
    ORDER.forEach(function(k){if(!on[k])return;DATA[k].forEach(function(s){
      var key=Math.round(s[1]/3)+','+Math.round(s[2]/3);(g[key]=g[key]||{x:s[1],y:s[2],items:[]}).items.push({k:k,n:s[0],a:s[3]});
    })});
    return g;
  }
  function show(g){
    var html='<b>'+g.items.length+' provider site'+(g.items.length>1?'s':'')+' here</b><br>';
    html+=g.items.map(function(i){return '<span class="dot" style="background:'+col(i.k)+'"></span>'+NAMES[i.k]+': '+i.n}).join('<br>');
    info.innerHTML=html;info.hidden=false;if(!calm)enter(info,'fade',0);
  }
  var popPins=true;
  function drawPins(){
    pins.textContent='';
    var g=groups(),r=4.2*scale;
    Object.keys(g).forEach(function(key){
      var grp=g[key],n=grp.items.length,a=el('g',{class:'pin',tabindex:'0',role:'button','aria-label':n+' provider sites, '+grp.items.map(function(i){return NAMES[i.k]+' '+i.n}).join('; ')});
      grp.items.forEach(function(it,idx){
        var ang=(idx/n)*Math.PI*2-Math.PI/2,off=n>1?r*0.95:0;
        var cx=grp.x+Math.cos(ang)*off,cy=grp.y+Math.sin(ang)*off;
        var c=el('circle',{cx:cx.toFixed(1),cy:cy.toFixed(1),r:r.toFixed(2),'data-k':it.k});
        if(it.a){c.setAttribute('fill','var(--sea)');c.setAttribute('fill-opacity','.6');c.setAttribute('stroke',col(it.k));c.setAttribute('stroke-width',(1.6*scale).toFixed(2))}
        else{c.setAttribute('fill',col(it.k));c.setAttribute('stroke','var(--sea)');c.setAttribute('stroke-width',(0.8*scale).toFixed(2))}
        a.appendChild(c);
      });
      /* bring the hovered pin above its neighbours so the enlarged dot isn't covered */
      a.addEventListener('mouseenter',function(){if(a!==pins.lastChild)pins.appendChild(a);show(grp);if(n===1)hoverOn(grp.items[0].k)});a.addEventListener('mouseleave',hoverOff);a.addEventListener('focus',function(){show(grp)});
      a.addEventListener('click',function(){if(dragged)return;show(grp);openMap({x:grp.x,y:grp.y})});
      a.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();show(grp);openMap({x:grp.x,y:grp.y})}});
      pins.appendChild(a);
      if(popPins&&!calm){enter(a,'pop',Math.min(pins.childNodes.length*6,420));
        /* drop the entrance class once done, or its fill-mode would pin the scale and block the hover growth */
        a.addEventListener('animationend',function(){a.classList.remove('pop')},{once:true})}
    });
    popPins=false;
    paintFocus();
  }

  /* ---- chart: cheapest plan per provider at each level ---- */
  var chart=document.getElementById('chart'),legend=document.getElementById('legend'),tip=document.createElement('div');
  tip.className='tip';tip.hidden=true;chart.appendChild(tip);
  var lastGeo=null;
  function drawChart(){
    var old=chart.querySelector('svg');if(old)chart.removeChild(old);
    tip.hidden=true;
    var keys=ORDER.filter(function(k){return on[k]});
    /* legend first: it can change the chart's height, which must be measured after it */
    legend.textContent='';
    keys.forEach(function(k){
      var sp=document.createElement('button'),i=document.createElement('i');sp.type='button';sp.dataset.k=k;i.style.background=col(k);
      sp.title='Hover to highlight, click to pin';
      sp.appendChild(i);sp.appendChild(document.createTextNode(SHORT[k]));linkHover(sp,k);
      sp.addEventListener('click',function(){togglePin(k)});legend.appendChild(sp);
    });
    var sp=document.createElement('span'),i=document.createElement('i');i.className='hollow';
    sp.appendChild(i);sp.appendChild(document.createTextNode('Prepaid'));legend.appendChild(sp);
    var W=chart.clientWidth||600,H=chart.clientHeight||300,pad={l:40,r:30,t:8,b:24};
    lastW=chart.clientWidth;lastH=chart.clientHeight;/* so the resize observer skips this size */
    var iw=W-pad.l-pad.r,ih=H-pad.t-pad.b;
    /* log scale: entry prices ($2.50-$10) would otherwise pile up at the bottom under $96 plans */
    var max=0,min=1e9;keys.forEach(function(k){for(var t=1;t<=5;t++){var p=cheapest(k,t);if(p){if(p.price>max)max=p.price;if(p.price<min)min=p.price}}});
    var TICKS=[1,2,5,10,20,50,100,200,500],lo=1,hi=10;
    if(max){lo=TICKS.filter(function(v){return v<=min}).pop()||1;hi=TICKS.filter(function(v){return v>=max})[0]||1000}
    var L0=Math.log(lo),L1=Math.log(hi);
    function x(t){return pad.l+(t-1)*iw/4}
    function y(v){return pad.t+ih-(Math.log(v)-L0)/(L1-L0)*ih}
    /* nudge points that land on (nearly) the same spot sideways so tied prices stay visible */
    var dx={};keys.forEach(function(k){dx[k]={}});
    for(var t=1;t<=5;t++){
      var pts=keys.map(function(k){var p=cheapest(k,t);return p?{k:k,y:y(p.price)}:null}).filter(Boolean).sort(function(a,b){return a.y-b.y}),grp=[];
      pts.concat([null]).forEach(function(q){
        if(q&&grp.length&&q.y-grp[grp.length-1].y<7){grp.push(q);return}
        grp.forEach(function(g,i){dx[g.k][t]=(i-(grp.length-1)/2)*7});grp=q?[q]:[];
      });
    }
    function px(k,t){return x(t)+(dx[k][t]||0)}
    var s=el('svg',{width:W,height:H,role:'img','aria-label':'Line chart of the lowest monthly price per provider at levels 1 to 5. The table below lists the same values.'});
    /* selected level band */
    var bw=Math.min(iw/4*0.7,90);
    var band=el('rect',{class:'band',x:x(level)-bw/2,y:pad.t,width:bw,height:ih,rx:4});s.appendChild(band);
    /* grid and y axis */
    var gg=el('g',{class:'grid'}),ax=el('g',{class:'axis'});
    /* keep tick labels at least 14px apart; decades ($1, $10, $100) win when space is tight */
    var shown=TICKS.filter(function(v){return v>=lo&&v<=hi}).sort(function(a,b){return (String(b).match(/^10*$/)?1:0)-(String(a).match(/^10*$/)?1:0)}),kept=[];
    shown.forEach(function(v){if(kept.every(function(u){return Math.abs(y(u)-y(v))>=14}))kept.push(v)});
    TICKS.forEach(function(v){
      if(kept.indexOf(v)<0)return;var yy=y(v);
      gg.appendChild(el('line',{x1:pad.l,x2:W-pad.r,y1:yy,y2:yy}));
      var tx=el('text',{x:pad.l-8,y:yy+4,'text-anchor':'end'});tx.textContent='$'+v;ax.appendChild(tx);
    });
    LEVELS.forEach(function(L){
      var tx=el('text',{x:x(L.n),y:H-6,'text-anchor':'middle'});tx.textContent=iw<380?'L'+L.n:'L'+L.n+' '+L.tag;
      if(L.n===level)tx.setAttribute('class','sel');ax.appendChild(tx);
    });
    s.appendChild(gg);s.appendChild(ax);
    /* series */
    var sg=el('g',{class:'series'+(drawIn&&!calm?' draw':'')}),anim=[],geo={W:W,H:H,lo:lo,hi:hi,pts:{}};
    keys.forEach(function(k){
      var d='',pts=[],xy=[],cs=[];
      for(var t=1;t<=5;t++){var p=cheapest(k,t);if(!p)continue;pts.push([t,p]);xy.push([px(k,t),y(p.price)]);d+=(d?'L':'M')+px(k,t).toFixed(1)+','+y(p.price).toFixed(1)}
      var path=el('path',{d:d,stroke:col(k),'data-k':k,pathLength:1});sg.appendChild(path);geo.pts[k]=xy;anim.push({k:k,path:path,cs:cs,to:xy});
      pts.forEach(function(a){
        var t=a[0],p=a[1],c=el('circle',{cx:px(k,t).toFixed(1),cy:y(p.price).toFixed(1),r:t===level?5:4,'data-k':k,class:t===level?'sel':''});
        /* 2px surface ring keeps overlapping dots readable; prepay intro prices are hollow */
        if(p.prepay){c.setAttribute('fill','var(--bg)');c.setAttribute('stroke',col(k));c.setAttribute('stroke-width','2')}
        else{c.setAttribute('fill',col(k));c.setAttribute('stroke','var(--bg)');c.setAttribute('stroke-width','2')}
        sg.appendChild(c);cs.push(c);
      });
    });
    s.appendChild(sg);
    /* crosshair and per-level hit columns */
    var xh=el('line',{class:'xhair',y1:pad.t,y2:pad.t+ih,visibility:'hidden'});s.appendChild(xh);
    LEVELS.forEach(function(L){
      var w=iw/4,h=el('rect',{class:'hit',x:Math.max(0,x(L.n)-w/2),y:pad.t,width:w,height:ih,tabindex:'0',role:'button','aria-label':'Select level '+L.n+', '+L.name});
      function nearest(e){
        if(!e||e.offsetY==null)return null;var best=null,bd=1e9;
        keys.forEach(function(k){var p=cheapest(k,L.n);if(!p)return;var dd=Math.abs(y(p.price)-e.offsetY);if(dd<bd){bd=dd;best=k}});
        return bd<=18?best:null;
      }
      function hover(e){
        xh.setAttribute('x1',x(L.n));xh.setAttribute('x2',x(L.n));xh.setAttribute('visibility','visible');
        var k=nearest(e);if(k!==hoverK){hoverK=k;paintFocus()}
        showTip(L.n,x(L.n),W);
      }
      function out(){xh.setAttribute('visibility','hidden');tip.hidden=true;hoverOff()}
      h.addEventListener('pointermove',hover);h.addEventListener('focus',function(){hover(null)});
      h.addEventListener('pointerleave',out);h.addEventListener('blur',out);
      h.addEventListener('click',function(e){var k=nearest(e);if(k)pinK=k;if(L.n===level)paintFocus();else setLevel(L.n)});
      h.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();setLevel(L.n)}});
      s.appendChild(h);
    });
    chart.insertBefore(s,tip);
    /* slide the level band from the previous level instead of jumping */
    if(prevLevel&&prevLevel!==level&&!calm){
      band.style.transition='none';band.style.transform='translateX('+(x(prevLevel)-x(level))+'px)';
      band.getBoundingClientRect();band.style.transition='';band.style.transform='';
    }
    /* when providers change, lines glide from their old positions; newly shown providers draw in */
    var prev=lastGeo;lastGeo=geo;
    if(!drawIn&&!calm&&prev){
      if(prev.lo!==lo||prev.hi!==hi){gg.classList.add('fade');ax.classList.add('fade')}
      var moving=[];
      anim.forEach(function(a){
        var from=prev.pts[a.k];
        if(!from){a.path.classList.add('draw');a.cs.forEach(function(c){c.classList.add('draw')})}
        else if(from.length===a.to.length&&from.some(function(f,i){return Math.abs(f[1]-a.to[i][1])>.5||Math.abs(f[0]-a.to[i][0])>.5}))moving.push({a:a,from:from});
      });
      if(moving.length){
        var t0=performance.now();
        (function step(t){var k=Math.min(1,(t-t0)/600),e=ease(k);
          moving.forEach(function(m){
            var cur=m.a.to.map(function(p,i){return [m.from[i][0]+(p[0]-m.from[i][0])*e,m.from[i][1]+(p[1]-m.from[i][1])*e]});
            m.a.path.setAttribute('d','M'+cur.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1)}).join('L'));
            m.a.cs.forEach(function(c,i){c.setAttribute('cx',cur[i][0].toFixed(1));c.setAttribute('cy',cur[i][1].toFixed(1))});
          });
          if(k<1)requestAnimationFrame(step)})(t0);
      }
    }
    prevLevel=null;drawIn=false;
    paintFocus();
  }
  function showTip(t,px,W){
    var list=ORDER.filter(function(k){return on[k]}).map(function(k){return cheapest(k,t)}).filter(Boolean)
      .sort(function(a,b){return a.price-b.price});
    tip.textContent='';
    var h=document.createElement('h3');h.textContent='Level '+t+' · '+lv(t).tag;tip.appendChild(h);
    list.forEach(function(p){
      var r=document.createElement('div');r.className='r'+((hoverK||pinK)===p.k?' on':'');
      var k=document.createElement('i');k.className='k';k.style.background=col(p.k);
      var v=document.createElement('strong');v.textContent=money(p.price);
      var n=document.createElement('span');n.className='n';n.textContent=name(p)+(p.prepay?' (prepay)':'');
      r.appendChild(k);r.appendChild(v);r.appendChild(n);tip.appendChild(r);
    });
    if(!list.length){var e=document.createElement('div');e.textContent='No providers selected';tip.appendChild(e)}
    tip.hidden=false;
    var tw=tip.offsetWidth,left=px+14;if(left+tw>W)left=px-tw-14;if(left<0)left=0;
    tip.style.left=left+'px';tip.style.top='8px';
  }

  /* ---- insights for the selected level ---- */
  var ins=document.getElementById('ins'),insTitle=document.getElementById('ins-title');
  var lastVals={},insN=0;
  function countUp(node,label,val){
    var m=/^(\$?)([\d.]+)(.*)$/.exec(val),from=lastVals[label];lastVals[label]=m?+m[2]:null;
    if(!m||calm||from==null||from===+m[2])return;
    var to=+m[2],dec=(m[2].split('.')[1]||'').length,t0=performance.now();
    (function step(t){var k=Math.min(1,(t-t0)/450),e=1-Math.pow(1-k,3);
      node.textContent=m[1]+(from+(to-from)*e).toFixed(dec)+m[3];if(k<1)requestAnimationFrame(step)})(t0);
  }
  function tile(label,val,text,k){
    var d=document.createElement('div');if(!calm)enter(d,'rise',insN++*45);
    if(k){
      d.dataset.k=k;d.style.setProperty('--c',col(k));d.tabIndex=0;d.setAttribute('role','button');
      d.title=text+' (click to pin '+NAMES[k]+')';linkHover(d,k);
      var act=function(){togglePin(k);if(!calm)enter(d,'ping',0)};
      d.addEventListener('click',act);d.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();act()}});
    }
    var b=document.createElement('dt');b.textContent=label;
    var v=document.createElement('dd');v.className='v';v.textContent=val;
    var p=document.createElement('dd');p.className='d';p.textContent=text;p.title=text;
    d.appendChild(b);d.appendChild(v);d.appendChild(p);ins.appendChild(d);countUp(v,label,val);
  }
  function name(p){return p.plan.indexOf(SHORT[p.k])===0?p.plan:SHORT[p.k]+' '+p.plan}
  function minBy(list,fn){var b=null;list.forEach(function(p){if(!b||fn(p)<fn(b))b=p});return b}
  function drawInsights(){
    insTitle.textContent='Insights · '+lvTitle(level);
    ins.textContent='';insN=0;
    var L=tierPlans(level);
    if(!L.length){tile('No providers selected','–','Turn on at least one provider.');return}
    var low=minBy(L,function(p){return p.price});
    tile('Lowest price',money(low.price),name(low)+', '+low.specs+(low.prepay?', prepaid':', monthly'),low.k);
    var mo=L.filter(function(p){return !p.prepay});
    if(low.prepay&&mo.length){
      var m=minBy(mo,function(p){return p.price});
      tile('Lowest, no prepay',money(m.price),name(m)+', '+m.specs,m.k);
    }
    var cpu=minBy(L,function(p){return p.price/p.cpu+p.price/1000});
    tile('Most vCPU per dollar',money(cpu.price/cpu.cpu)+'/vCPU',name(cpu)+': '+cpu.cpu+' vCPU for '+money(cpu.price),cpu.k);
    var big=BIG.filter(function(k){return on[k]}).map(function(k){return cheapest(k,level)}).filter(Boolean);
    var bud=BUDGET.filter(function(k){return on[k]}).map(function(k){return cheapest(k,level)}).filter(Boolean);
    if(big.length&&bud.length){
      var bl=minBy(big,function(p){return p.price}),ul=minBy(bud,function(p){return p.price}),x=bl.price/ul.price;
      if(x>=1.2)tile('Big cloud vs budget',(x>=1.95?Math.round(x)+'×':x.toFixed(1)+'×')+' gap',
        'Vultr, DigitalOcean and Linode from '+money(bl.price)+'; Hetzner, Hostinger and OVH from '+money(ul.price)+'.',ul.k);
      else tile('Big cloud vs budget','No gap',
        name(bl)+' ('+money(bl.price)+') undercuts them, but has '+bl.ram+' GB RAM vs '+ul.ram+' GB.',bl.k);
    }
    var warn=[];
    L.forEach(function(p){if(p.renew&&p.k==='hostinger')warn.push('Hostinger renews at '+p.renew+'.')});
    if(on.ovh&&L.some(function(p){return p.k==='ovh'}))warn.push('OVH needs 12 months upfront.');
    if(on.hetzner&&L.some(function(p){return p.k==='hetzner'}))warn.push('Hetzner CX listed as unavailable (Oct 27).');
    if(warn.length)tile('Watch out',warn.length+' caveat'+(warn.length>1?'s':''),warn.join(' '));
  }

  /* ---- table ---- */
  var tblTitle=document.getElementById('tbl-title');
  var th=document.createElement('th');th.textContent='$ / GB RAM';th.className='num';
  document.querySelector('#t thead th:nth-child(3)').after(th);
  rows.forEach(function(r,i){
    var p=PLANS[i],pc=r.querySelector('.price'),bar=document.createElement('span');
    bar.className='pbar';bar.style.background=col(p.k);pc.appendChild(bar);r._bar=bar;
    var td=document.createElement('td');td.className='num';td.textContent=money(p.price/p.ram);pc.after(td);
    r.addEventListener('pointerenter',function(){hoverOn(p.k)});r.addEventListener('pointerleave',hoverOff);
    r.addEventListener('click',function(e){if(e.target.closest('a'))return;togglePin(p.k)});
  });
  document.getElementById('focus').querySelector('button').addEventListener('click',function(){pinK=null;paintFocus()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&pinK){pinK=null;paintFocus()}});
  function apply(){
    var s=q.value.toLowerCase(),n=0;
    rows.forEach(function(r){
      var ok=+r.dataset.tier===level&&on[r.dataset.p]&&(f==='all'||r.dataset.s===f)&&r.textContent.toLowerCase().indexOf(s)>-1;
      r.hidden=!ok;if(ok)n++;
    });
    /* price bars scale to the most expensive visible plan at this level */
    var max=0;rows.forEach(function(r,i){if(!r.hidden&&PLANS[i].price>max)max=PLANS[i].price});
    var vis=0;
    rows.forEach(function(r,i){
      var w=max?PLANS[i].price/max:0;
      if(levelChanged&&!r.hidden&&!calm){
        enter(r,'rise',vis++*35);
        r._bar.style.transition='none';r._bar.style.setProperty('--w',0);r._bar.getBoundingClientRect();r._bar.style.transition='';
      }
      r._bar.style.setProperty('--w',w);
    });
    levelChanged=false;
    empty.hidden=n>0;
    tblTitle.textContent='Plans · '+lvTitle(level);
  }

  function render(){
    [].forEach.call(lvBox.querySelectorAll('.lvbtn'),function(b){b.setAttribute('aria-pressed',+b.dataset.n===level?'true':'false')});
    document.getElementById('use').textContent=lv(level).use;
    drawChart();drawInsights();apply();paintFocus();
  }
  function sync(){
    if(modal.open)buildModalLegend();
    [].forEach.call(pf.querySelectorAll('.pchip'),function(b){b.setAttribute('aria-pressed',on[b.dataset.k]?'true':'false')});
    info.hidden=true;
    popPins=true;drawPins();render();
  }
  chips.forEach(function(c){c.addEventListener('click',function(){
    f=c.dataset.f;chips.forEach(function(x){x.setAttribute('aria-pressed',x===c?'true':'false')});apply();
  })});
  q.addEventListener('input',apply);
  var rt,lastW=0,lastH=0;
  function resized(){if(chart.clientWidth===lastW&&chart.clientHeight===lastH)return;lastW=chart.clientWidth;lastH=chart.clientHeight;clearTimeout(rt);rt=setTimeout(drawChart,80)}
  if(window.ResizeObserver)new ResizeObserver(resized).observe(chart);else window.addEventListener('resize',resized);
  drawPins();render();

  /* Notes & sources popup closes on outside click or Esc */
  var about=document.querySelector('.about');
  document.addEventListener('click',function(e){if(about.open&&!about.contains(e.target))about.open=false});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&about.open){about.open=false;about.querySelector('summary').focus()}});

  /* theme toggle: auto -> light -> dark */
  var tb=document.getElementById('theme'),root=document.documentElement,modes=['auto','light','dark'];
  function setTheme(m){
    if(m==='auto')delete root.dataset.theme;else root.dataset.theme=m;
    tb.textContent='Theme: '+m;
    try{if(m==='auto')localStorage.removeItem('theme');else localStorage.setItem('theme',m)}catch(e){}
  }
  tb.addEventListener('click',function(){setTheme(modes[(modes.indexOf(root.dataset.theme||'auto')+1)%3])});
  setTheme(root.dataset.theme||'auto');
})();
