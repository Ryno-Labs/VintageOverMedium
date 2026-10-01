(() => {
  const scriptUrl = document.currentScript && document.currentScript.src ? new URL(document.currentScript.src) : new URL('assets/site.js', window.location.href);
  const assetsBase = new URL('.', scriptUrl);
  const siteBase = new URL('../', assetsBase);
  const resolveSitePath = (raw) => {
    if (!raw) return raw;
    if (/^(?:https?:|data:|blob:)/i.test(raw)) return raw;
    return new URL(String(raw).replace(/^\/+/, ''), siteBase).href;
  };
  const safeGet=(k)=>{try{return localStorage.getItem(k)}catch(e){return null}};
  const safeSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};

  const header=document.querySelector('.site-header');
  const menu=document.querySelector('.menu-btn');
  const nav=document.getElementById('site-nav');
  if(menu&&header&&nav){menu.addEventListener('click',()=>{const open=header.classList.toggle('mobile-open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');});}

  const bar=document.querySelector('.announcement');
  const barClose=document.querySelector('[data-dismiss-announcement]');
  if(safeGet('vom-announcement-dismissed')==='1'&&bar)bar.hidden=true;
  if(barClose&&bar)barClose.addEventListener('click',()=>{bar.hidden=true;safeSet('vom-announcement-dismissed','1');});

  document.querySelectorAll('.demo-form').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const msg=form.querySelector('.form-message');if(msg)msg.textContent='Signup delivery is being connected.';}));

  const modal=document.querySelector('.modal-backdrop');
  let lastFocus=null; let shown=false;
  const closeModal=()=>{if(!modal)return;modal.classList.remove('show');modal.setAttribute('aria-hidden','true');if(lastFocus&&lastFocus.focus)lastFocus.focus();};
  const showModal=()=>{if(!modal||shown||safeGet('vom-email-popup-seen')==='1')return;shown=true;lastFocus=document.activeElement;modal.classList.add('show');modal.setAttribute('aria-hidden','false');safeSet('vom-email-popup-seen','1');const first=modal.querySelector('input,button');if(first)first.focus();};
  if(modal&&safeGet('vom-email-popup-seen')!=='1'){
    const onScroll=()=>{const total=document.documentElement.scrollHeight-innerHeight;if(total>0&&scrollY/total>=.5)showModal();};
    window.addEventListener('scroll',onScroll,{passive:true});
    setTimeout(showModal,45000);
    if(matchMedia('(pointer:fine)').matches)document.addEventListener('mouseout',e=>{if(e.clientY<=0)showModal();});
  }
  document.querySelectorAll('[data-close-modal]').forEach(btn=>btn.addEventListener('click',closeModal));
  if(modal){modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('show'))closeModal();});}

  let productData=null;
  let demoEarnings=0;
  let toastTimer=null;
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
  const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const pageLabel=p=>({home:'home','special-event':'special-event',swing:'swing',gatsby:'gatsby'}[p]||p||'page');
  const trackedUrl=(raw,page)=>raw.replaceAll('DEMO-PAGE',pageLabel(page));

  function cardHTML(product, retailer, page){
    const href=trackedUrl(product.url,page);
    return `<article class="product-card">
      <div class="product-media"><img src="${esc(resolveSitePath(product.image))}" alt="${esc(product.name)}" width="600" height="900" loading="lazy" data-pin-description="${esc(product.name)} — ${esc(product.sizeTag)} — VintageOverMedium"></div>
      <div class="tags"><span class="tag">${esc(product.era)}</span><span class="tag">${esc(product.sizeTag)}</span></div>
      <h3>${esc(product.name)}</h3>
      <p class="meta">${esc(retailer.name)} · ${money(Number(product.demoPrice))}</p>
      <p class="why">${esc(product.why)}</p>
      <a class="btn product-link" href="${esc(href)}" target="_blank" rel="sponsored nofollow noopener" data-product="${esc(product.id)}" data-retailer="${esc(product.retailer)}" data-price="${esc(product.demoPrice)}" data-page="${esc(page)}">Shop at ${esc(retailer.name)} →</a>
    </article>`;
  }

  function showDemoToast(product,retailer,page){
    const earned=Number(product.demoPrice)*Number(retailer.demoRate);
    demoEarnings+=earned;
    let toast=document.querySelector('.demo-commission-toast');
    if(!toast){toast=document.createElement('button');toast.type='button';toast.className='demo-commission-toast';toast.setAttribute('aria-live','polite');toast.setAttribute('aria-label','Close demo commission message');document.body.appendChild(toast);}
    toast.innerHTML=`<strong>Demo click — no one was charged.</strong><span>This would send the shopper to <b>${esc(retailer.name)}</b> with our tracking ID.</span><span>If she buys this <b>${money(Number(product.demoPrice))}</b> item, VintageOverMedium earns about <b>${money(earned)}</b> (${Math.round(Number(retailer.demoRate)*1000)/10}% demo rate).</span><em>Tracked as: ${esc(pageLabel(page))} page</em><span class="session-total">Demo earnings this session: <b>${money(demoEarnings)}</b></span>`;
    toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),6000);
    toast.onclick=()=>toast.classList.remove('show');
  }

  async function loadProducts(){
    const grids=[...document.querySelectorAll('.product-grid[data-page]')];
    const demoTable=document.querySelector('[data-demo-earnings-table]');
    if(!grids.length&&!demoTable)return;
    try{
      const res=await fetch(new URL('products.json', assetsBase),{cache:'no-store'});
      if(!res.ok)throw new Error('products.json unavailable');
      productData=await res.json();
      grids.forEach(grid=>{
        const page=grid.dataset.page;
        const section=grid.dataset.section;
        let items=productData.products.filter(p=>Array.isArray(p.pages)&&p.pages.includes(page));
        if(section)items=items.filter(p=>Array.isArray(p.sections)&&p.sections.includes(`${page}:${section}`));
        if(!items.length)return;
        grid.innerHTML=items.map(p=>cardHTML(p,productData.retailers[p.retailer],page)).join('');
      });
      document.addEventListener('click',e=>{
        const link=e.target.closest('.product-link');
        if(!link||!productData||productData.demoMode!==true)return;
        const product=productData.products.find(p=>p.id===link.dataset.product);
        const retailer=product&&productData.retailers[product.retailer];
        if(!product||!retailer)return;
        e.preventDefault();
        showDemoToast(product,retailer,link.dataset.page);
      });
      if(demoTable)renderDemoTable(demoTable,productData);
    }catch(err){
      console.warn('VintageOverMedium product feed:',err.message);
    }
  }

  function renderDemoTable(tbody,data){
    const ranked=data.products.map(p=>({p,r:data.retailers[p.retailer],earned:Number(p.demoPrice)*Number(data.retailers[p.retailer].demoRate)}));
    const max=Math.max(...ranked.map(x=>x.earned));
    tbody.innerHTML=ranked.map(({p,r,earned})=>`<tr class="${earned===max?'highest-earner':''}"><td>${esc(p.name)}</td><td>${esc(r.name)}</td><td>${money(Number(p.demoPrice))}</td><td>${Math.round(Number(r.demoRate)*1000)/10}%</td><td><strong>${money(earned)}</strong></td></tr>`).join('');
  }

  function initCalculator(){
    const calc=document.querySelector('[data-money-calculator]');
    if(!calc)return;
    const keys=['visitors','clickRate','buyRate','aov','commissionRate'];
    const get=k=>Number(calc.querySelector(`[data-value="${k}"]`).value);
    const update=()=>{
      keys.forEach(k=>{
        const num=calc.querySelector(`[data-value="${k}"]`);
        const range=calc.querySelector(`[data-range="${k}"]`);
        if(num&&range&&String(range.value)!==String(num.value))range.value=num.value;
      });
      const visitors=get('visitors'), clickRate=get('clickRate')/100, buyRate=get('buyRate')/100, aov=get('aov'), rate=get('commissionRate')/100;
      const clicks=visitors*clickRate, orders=clicks*buyRate, sales=orders*aov, commission=sales*rate;
      calc.querySelector('[data-output="clicks"]').textContent=Math.round(clicks).toLocaleString('en-US');
      calc.querySelector('[data-output="orders"]').textContent=orders.toLocaleString('en-US',{maximumFractionDigits:1});
      calc.querySelector('[data-output="sales"]').textContent=money(sales);
      calc.querySelector('[data-output="commission"]').textContent=money(commission);
    };
    calc.querySelectorAll('input').forEach(input=>input.addEventListener('input',e=>{
      const key=e.target.dataset.range||e.target.dataset.value;
      if(!key)return;
      const other=e.target.dataset.range?calc.querySelector(`[data-value="${key}"]`):calc.querySelector(`[data-range="${key}"]`);
      if(other)other.value=e.target.value;
      update();
    }));
    const preset=calc.querySelector('[data-event-preset]');
    if(preset)preset.addEventListener('click',()=>{calc.querySelector('[data-value="visitors"]').value=15000;calc.querySelector('[data-range="visitors"]').value=15000;calc.querySelector('[data-value="aov"]').value=110;calc.querySelector('[data-range="aov"]').value=110;update();});
    update();
  }

  loadProducts();
  initCalculator();
})();
