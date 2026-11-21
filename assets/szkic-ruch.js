/* WOJTEL – szkic: interakcje (bez śledzenia, bez zewnętrznych skryptów) */
(function(){
  var d=document, w=window;
  var calm=w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=w.matchMedia && w.matchMedia('(pointer: fine)').matches;
  function seen(els,fn,opt){
    if(!els.length)return;
    if(!('IntersectionObserver' in w)){els.forEach(fn);return}
    var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){fn(x.target);io.unobserve(x.target)}})},opt||{rootMargin:'0px 0px -12% 0px'});
    els.forEach(function(el){io.observe(el)});
  }
  var all=function(s){return Array.prototype.slice.call(d.querySelectorAll(s))};

  /* 1. Odręczne podkreślenia i kółka rysują się, gdy wjadą na ekran */
  d.documentElement.classList.add('ruch');
  seen(all('.squig,.ring'),function(el){el.classList.add('drawn')});

  /* 2. Liczby odliczają od zera */
  seen(all('.stats .n'),function(el){
    var end=parseInt(el.textContent,10); if(isNaN(end)||calm)return;
    var t0=null,dur=1100+end*25;
    function step(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/dur);el.textContent=Math.round(end*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(step)}
    el.textContent='0';requestAnimationFrame(step);
  },{threshold:.6});

  /* 3. Oś czasu: czerwona linia rośnie przy przewijaniu, aktywny rok się podświetla */
  all('.tl').forEach(function(tl){
    var items=all.call(null,'.tl li').filter(function(li){return tl.contains(li)});
    var tick=false;
    function upd(){tick=false;
      var r=tl.getBoundingClientRect(),mid=w.innerHeight*.55;
      var p=Math.max(0,Math.min(1,(mid-r.top)/r.height));
      tl.style.setProperty('--p',p.toFixed(3));
      items.forEach(function(li){var b=li.getBoundingClientRect();li.classList.toggle('on',b.top<mid)});
    }
    w.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});
    w.addEventListener('resize',upd);upd();
  });

  /* 4. Karty lekko się przechylają za kursorem */
  if(fine&&!calm){
    all('.card,.polaroid,.note').forEach(function(c){
      c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect();
        var x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        c.style.transform='perspective(800px) rotateX('+(-y*5).toFixed(2)+'deg) rotateY('+(x*6).toFixed(2)+'deg) translateY(-4px)'});
      c.addEventListener('mouseleave',function(){c.style.transform=''});
    });
    var ill=d.querySelector('.hero .ill');
    if(ill){d.addEventListener('mousemove',function(e){
      var x=e.clientX/w.innerWidth-.5,y=e.clientY/w.innerHeight-.5;
      ill.style.transform='translate('+(x*14).toFixed(1)+'px,'+(y*10).toFixed(1)+'px) rotate('+(x*1.5).toFixed(2)+'deg)'})}
  }

  /* 5. Przewodnik „Od czego zacząć?” */
  var g=d.getElementById('przewodnik');
  if(g){
    var btns=all('#przewodnik [data-wybor]'),out=d.getElementById('przewodnik-wynik');
    btns.forEach(function(b){b.addEventListener('click',function(){
      btns.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
      var t=d.getElementById('wynik-'+b.getAttribute('data-wybor'));
      out.innerHTML=t.innerHTML; out.hidden=false; out.classList.remove('pop'); void out.offsetWidth; out.classList.add('pop');
      if(out.querySelector('.squig'))out.querySelectorAll('.squig').forEach(function(s){s.classList.add('drawn')});
      if(w.innerWidth<860){var r=out.getBoundingClientRect();if(r.top>w.innerHeight*.6)out.scrollIntoView({behavior:calm?'auto':'smooth',block:'center'})}
    })});
    out.addEventListener('click',function(e){
      var a=e.target.closest('[data-temat]'); if(!a)return;
      var sel=d.getElementById('f-topic'); if(!sel)return;
      e.preventDefault();
      Array.prototype.forEach.call(sel.options,function(o){o.selected=(o.text===a.getAttribute('data-temat'))});
      var k=d.getElementById('kontakt'); k.scrollIntoView({behavior:calm?'auto':'smooth'});
      setTimeout(function(){var m=d.getElementById('f-msg');if(m)m.focus({preventScroll:true})},calm?0:600);
    });
  }

  /* 6. Przycisk „do góry” */
  var up=d.createElement('a');
  up.href='#tresc';up.className='upbtn';up.setAttribute('aria-label','Do góry strony');up.innerHTML='<span aria-hidden="true">↑</span>';
  up.addEventListener('click',function(e){e.preventDefault();w.scrollTo({top:0,behavior:calm?'auto':'smooth'})});
  d.body.appendChild(up);
  var lastOn=null;
  w.addEventListener('scroll',function(){var on=w.scrollY>700;if(on!==lastOn){up.classList.toggle('on',on);lastOn=on}},{passive:true});
})();
