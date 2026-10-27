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
  function setLevel(n){
    level=n;
    try{history.replaceState(null,'',n===1?location.pathname+location.search:'#level='+n)}catch(e){}
    render();
  }

  /* provider chips */
  ORDER.forEach(function(k){
    var b=document.createElement('button');b.className='pchip';b.type='button';b.dataset.k=k;b.setAttribute('aria-pressed','true');b.style.setProperty('--c',col(k));
    b.innerHTML='<i></i>'+NAMES[k]+' <small>'+DATA[k].length+'</small>';
    b.title=DATA[k].length+' data center locations';
    b.addEventListener('click',function(){on[k]=!on[k];sync()});pf.appendChild(b);
  });
  [['All',true],['None',false]].forEach(function(a){
    var b=document.createElement('button');b.className='link';b.type='button';b.textContent=a[0];
    b.addEventListener('click',function(){ORDER.forEach(function(k){on[k]=a[1]});sync()});pf.appendChild(b);
  });
  /* region buttons */
  var vb=document.getElementById('views');
  Object.keys(VL).forEach(function(v){
    var b=document.createElement('button');b.className='vbtn';b.type='button';b.textContent=VL[v];b.dataset.v=v;b.setAttribute('aria-pressed',v==='world'?'true':'false');
    b.addEventListener('click',function(){
      svg.setAttribute('viewBox',VIEWS[v]);scale=parseFloat(VIEWS[v].split(' ')[2])/960;
      [].forEach.call(vb.children,function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});drawPins();
    });vb.appendChild(b);
  });
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
    info.innerHTML=html;info.hidden=false;
  }
  function drawPins(){
    pins.textContent='';
    var g=groups(),r=3.6*scale;
    Object.keys(g).forEach(function(key){
      var grp=g[key],n=grp.items.length,a=el('g',{class:'pin',tabindex:'0',role:'button','aria-label':n+' provider sites, '+grp.items.map(function(i){return NAMES[i.k]+' '+i.n}).join('; ')});
      grp.items.forEach(function(it,idx){
        var ang=(idx/n)*Math.PI*2-Math.PI/2,off=n>1?r*0.95:0;
        var cx=grp.x+Math.cos(ang)*off,cy=grp.y+Math.sin(ang)*off;
        var c=el('circle',{cx:cx.toFixed(1),cy:cy.toFixed(1),r:r.toFixed(2)});
        if(it.a){c.setAttribute('fill','var(--sea)');c.setAttribute('fill-opacity','.6');c.setAttribute('stroke',col(it.k));c.setAttribute('stroke-width',(1.6*scale).toFixed(2))}
        else{c.setAttribute('fill',col(it.k));c.setAttribute('stroke','var(--sea)');c.setAttribute('stroke-width',(0.8*scale).toFixed(2))}
        a.appendChild(c);
      });
      a.addEventListener('mouseenter',function(){show(grp)});a.addEventListener('focus',function(){show(grp)});a.addEventListener('click',function(){show(grp)});
      pins.appendChild(a);
    });
  }

  /* ---- chart: cheapest plan per provider at each level ---- */
  var chart=document.getElementById('chart'),legend=document.getElementById('legend'),tip=document.createElement('div');
  tip.className='tip';tip.hidden=true;chart.appendChild(tip);
  function niceMax(v){var steps=[10,20,25,50,100,150,200];for(var i=0;i<steps.length;i++)if(v<=steps[i])return steps[i];return Math.ceil(v/100)*100}
  function drawChart(){
    var old=chart.querySelector('svg');if(old)chart.removeChild(old);
    tip.hidden=true;
    var W=chart.clientWidth||600,H=chart.clientHeight||300,pad={l:40,r:30,t:8,b:24};
    var iw=W-pad.l-pad.r,ih=H-pad.t-pad.b,keys=ORDER.filter(function(k){return on[k]});
    var max=0;keys.forEach(function(k){for(var t=1;t<=5;t++){var p=cheapest(k,t);if(p&&p.price>max)max=p.price}});
    max=niceMax(max||10);
    function x(t){return pad.l+(t-1)*iw/4}
    function y(v){return pad.t+ih-v/max*ih}
    var s=el('svg',{width:W,height:H,role:'img','aria-label':'Line chart of the lowest monthly price per provider at levels 1 to 5. The table below lists the same values.'});
    /* selected level band */
    var bw=Math.min(iw/4*0.7,90);
    s.appendChild(el('rect',{class:'band',x:x(level)-bw/2,y:pad.t,width:bw,height:ih,rx:4}));
    /* grid and y axis */
    var gg=el('g',{class:'grid'}),ax=el('g',{class:'axis'});
    for(var i=0;i<=4;i++){
      var v=max*i/4,yy=y(v);
      gg.appendChild(el('line',{x1:pad.l,x2:W-pad.r,y1:yy,y2:yy}));
      var tx=el('text',{x:pad.l-8,y:yy+4,'text-anchor':'end'});tx.textContent='$'+v;ax.appendChild(tx);
    }
    LEVELS.forEach(function(L){
      var tx=el('text',{x:x(L.n),y:H-6,'text-anchor':'middle'});tx.textContent=iw<380?'L'+L.n:'L'+L.n+' '+L.tag;
      if(L.n===level)tx.setAttribute('class','sel');ax.appendChild(tx);
    });
    s.appendChild(gg);s.appendChild(ax);
    /* series */
    var sg=el('g',{class:'series'});
    keys.forEach(function(k){
      var d='',pts=[];
      for(var t=1;t<=5;t++){var p=cheapest(k,t);if(!p)continue;pts.push([t,p]);d+=(d?'L':'M')+x(t).toFixed(1)+','+y(p.price).toFixed(1)}
      sg.appendChild(el('path',{d:d,stroke:col(k)}));
      pts.forEach(function(a){
        var t=a[0],p=a[1],c=el('circle',{cx:x(t).toFixed(1),cy:y(p.price).toFixed(1),r:t===level?5:4});
        /* 2px surface ring keeps overlapping dots readable; prepay intro prices are hollow */
        if(p.prepay){c.setAttribute('fill','var(--bg)');c.setAttribute('stroke',col(k));c.setAttribute('stroke-width','2')}
        else{c.setAttribute('fill',col(k));c.setAttribute('stroke','var(--bg)');c.setAttribute('stroke-width','2')}
        sg.appendChild(c);
      });
    });
    s.appendChild(sg);
    /* crosshair and per-level hit columns */
    var xh=el('line',{class:'xhair',y1:pad.t,y2:pad.t+ih,visibility:'hidden'});s.appendChild(xh);
    LEVELS.forEach(function(L){
      var w=iw/4,h=el('rect',{class:'hit',x:Math.max(0,x(L.n)-w/2),y:pad.t,width:w,height:ih,tabindex:'0',role:'button','aria-label':'Select level '+L.n+', '+L.name});
      function hover(){xh.setAttribute('x1',x(L.n));xh.setAttribute('x2',x(L.n));xh.setAttribute('visibility','visible');showTip(L.n,x(L.n),W)}
      h.addEventListener('pointermove',hover);h.addEventListener('focus',hover);
      h.addEventListener('pointerleave',function(){xh.setAttribute('visibility','hidden');tip.hidden=true});
      h.addEventListener('blur',function(){xh.setAttribute('visibility','hidden');tip.hidden=true});
      h.addEventListener('click',function(){setLevel(L.n)});
      h.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();setLevel(L.n)}});
      s.appendChild(h);
    });
    chart.insertBefore(s,tip);
    /* legend mirrors the mark: a line key per provider */
    legend.textContent='';
    keys.forEach(function(k){
      var sp=document.createElement('span'),i=document.createElement('i');i.style.background=col(k);
      sp.appendChild(i);sp.appendChild(document.createTextNode(NAMES[k]));legend.appendChild(sp);
    });
    var sp=document.createElement('span'),i=document.createElement('i');i.className='hollow';
    sp.appendChild(i);sp.appendChild(document.createTextNode('Prepaid intro price'));legend.appendChild(sp);
  }
  function showTip(t,px,W){
    var list=ORDER.filter(function(k){return on[k]}).map(function(k){return cheapest(k,t)}).filter(Boolean)
      .sort(function(a,b){return a.price-b.price});
    tip.textContent='';
    var h=document.createElement('h3');h.textContent='Level '+t+' · '+lv(t).tag;tip.appendChild(h);
    list.forEach(function(p){
      var r=document.createElement('div');r.className='r';
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
  function tile(label,val,text){
    var d=document.createElement('div');
    var b=document.createElement('dt');b.textContent=label;
    var v=document.createElement('dd');v.className='v';v.textContent=val;
    var p=document.createElement('dd');p.className='d';p.textContent=text;p.title=text;
    d.appendChild(b);d.appendChild(v);d.appendChild(p);ins.appendChild(d);
  }
  function name(p){return p.plan.indexOf(SHORT[p.k])===0?p.plan:SHORT[p.k]+' '+p.plan}
  function minBy(list,fn){var b=null;list.forEach(function(p){if(!b||fn(p)<fn(b))b=p});return b}
  function drawInsights(){
    insTitle.textContent='Insights · '+lvTitle(level);
    ins.textContent='';
    var L=tierPlans(level);
    if(!L.length){tile('No providers selected','–','Turn on at least one provider.');return}
    var low=minBy(L,function(p){return p.price});
    tile('Lowest price',money(low.price),name(low)+', '+low.specs+(low.prepay?', prepaid':', monthly'));
    var mo=L.filter(function(p){return !p.prepay});
    if(low.prepay&&mo.length){
      var m=minBy(mo,function(p){return p.price});
      tile('Lowest, no prepay',money(m.price),name(m)+', '+m.specs);
    }
    var cpu=minBy(L,function(p){return p.price/p.cpu+p.price/1000});
    tile('Most vCPU per dollar',money(cpu.price/cpu.cpu)+'/vCPU',name(cpu)+': '+cpu.cpu+' vCPU for '+money(cpu.price));
    var big=BIG.filter(function(k){return on[k]}).map(function(k){return cheapest(k,level)}).filter(Boolean);
    var bud=BUDGET.filter(function(k){return on[k]}).map(function(k){return cheapest(k,level)}).filter(Boolean);
    if(big.length&&bud.length){
      var bl=minBy(big,function(p){return p.price}),ul=minBy(bud,function(p){return p.price}),x=bl.price/ul.price;
      if(x>=1.2)tile('Big cloud vs budget',(x>=1.95?Math.round(x)+'×':x.toFixed(1)+'×')+' gap',
        'Vultr, DigitalOcean and Linode from '+money(bl.price)+'; Hetzner, Hostinger and OVH from '+money(ul.price)+'.');
      else tile('Big cloud vs budget','No gap',
        name(bl)+' ('+money(bl.price)+') undercuts them, but has '+bl.ram+' GB RAM vs '+ul.ram+' GB.');
    }
    var warn=[];
    L.forEach(function(p){if(p.renew&&p.k==='hostinger')warn.push('Hostinger renews at '+p.renew+'.')});
    if(on.ovh&&L.some(function(p){return p.k==='ovh'}))warn.push('OVH needs 12 months upfront.');
    if(on.hetzner&&L.some(function(p){return p.k==='hetzner'}))warn.push('Hetzner CX listed as unavailable (Oct 27).');
    if(warn.length)tile('Watch out',warn.length+' caveat'+(warn.length>1?'s':''),warn.join(' '));
  }

  /* ---- table ---- */
  var tblTitle=document.getElementById('tbl-title');
  function apply(){
    var s=q.value.toLowerCase(),n=0;
    rows.forEach(function(r){
      var ok=+r.dataset.tier===level&&on[r.dataset.p]&&(f==='all'||r.dataset.s===f)&&r.textContent.toLowerCase().indexOf(s)>-1;
      r.hidden=!ok;if(ok)n++;
    });
    empty.hidden=n>0;
    tblTitle.textContent='Plans · '+lvTitle(level);
  }

  function render(){
    [].forEach.call(lvBox.querySelectorAll('.lvbtn'),function(b){b.setAttribute('aria-pressed',+b.dataset.n===level?'true':'false')});
    document.getElementById('use').textContent=lv(level).use;
    drawChart();drawInsights();apply();
  }
  function sync(){
    [].forEach.call(pf.querySelectorAll('.pchip'),function(b){b.setAttribute('aria-pressed',on[b.dataset.k]?'true':'false')});
    info.hidden=true;
    drawPins();render();
  }
  chips.forEach(function(c){c.addEventListener('click',function(){
    f=c.dataset.f;chips.forEach(function(x){x.setAttribute('aria-pressed',x===c?'true':'false')});apply();
  })});
  q.addEventListener('input',apply);
  var rt,lastW=0,lastH=0;
  function resized(){if(chart.clientWidth===lastW&&chart.clientHeight===lastH)return;lastW=chart.clientWidth;lastH=chart.clientHeight;clearTimeout(rt);rt=setTimeout(drawChart,80)}
  if(window.ResizeObserver)new ResizeObserver(resized).observe(chart);else window.addEventListener('resize',resized);
  drawPins();render();

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
