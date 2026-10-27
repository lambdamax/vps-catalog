(function(){
  var M=window.VPS_MAP,DATA=M.sites,VIEWS=M.views;
  document.getElementById('land').setAttribute('d',M.land);
  var NAMES={vultr:'Vultr',do:'DigitalOcean',linode:'Linode (Akamai)',hetzner:'Hetzner',hostinger:'Hostinger',ovh:'OVHcloud'};
  var ORDER=['vultr','do','linode','hetzner','hostinger','ovh'];
  var VL={world:'World',americas:'Americas',europe:'Europe',asia:'Asia-Pacific'};
  var on={};ORDER.forEach(function(k){on[k]=true});
  var NS='http://www.w3.org/2000/svg';
  var svg=document.getElementById('map'),pins=document.getElementById('pins'),info=document.getElementById('info'),pf=document.getElementById('pf');
  var scale=1,rows=[].slice.call(document.querySelectorAll('#t tbody tr')),chips=[].slice.call(document.querySelectorAll('.chip')),
      q=document.getElementById('q'),empty=document.getElementById('empty'),f='all';
  function col(k){return 'var(--c-'+k+')'}
  /* provider chips */
  ORDER.forEach(function(k){
    var b=document.createElement('button');b.className='pchip';b.type='button';b.dataset.k=k;b.setAttribute('aria-pressed','true');b.style.setProperty('--c',col(k));
    b.innerHTML='<i></i>'+NAMES[k]+' <small>'+DATA[k].length+'</small>';
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
    info.innerHTML=html;
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
  function apply(){
    var s=q.value.toLowerCase(),n=0;
    rows.forEach(function(r){
      var ok=on[r.dataset.p]&&(f==='all'||r.dataset.s===f)&&r.textContent.toLowerCase().indexOf(s)>-1;
      r.hidden=!ok;if(ok)n++;
    });
    empty.hidden=n>0;
  }
  function sync(){
    [].forEach.call(pf.querySelectorAll('.pchip'),function(b){b.setAttribute('aria-pressed',on[b.dataset.k]?'true':'false')});
    info.textContent='Select a pin to see which providers have a server there, or hover over it.';
    drawPins();apply();
  }
  chips.forEach(function(c){c.addEventListener('click',function(){
    f=c.dataset.f;chips.forEach(function(x){x.setAttribute('aria-pressed',x===c?'true':'false')});apply();
  })});
  q.addEventListener('input',apply);
  drawPins();
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
