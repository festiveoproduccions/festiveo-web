// FESTIVEO Produccions · Sitio público + contenido administrable Decap CMS
// Esquema en /admin/config.yml, archivos JSON en /cms/.
(() => {
  'use strict';
  const pageName = location.pathname.split('/').pop() || 'index.html';
  const pages = {
    'index.html': 'inicio.json', 'nosaltres.html': 'nosaltres.json',
    'serveis.html': 'serveis.json', 'esdeveniments.html': 'esdeveniments.json',
    'artistes.html': 'artistes.json', 'contacte.html': 'contacte.json'
  };
  let lang = localStorage.getItem('festiveo-lang') === 'es' ? 'es' : 'ca';
  let settings = null, pageContent = null, events = [], services = null, artists = null;
  const $all = (selector) => Array.from(document.querySelectorAll(selector));
  const $ = (selector) => document.querySelector(selector);
  function tr(value) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') return String(value[lang] ?? value.ca ?? '');
    return '';
  }
  function safeImage(src) {
    return typeof src === 'string' && (/^https:\/\//i.test(src) || /^\/(?!\/)/.test(src) || /^(?:images|assets)\//.test(src));
  }
  function safeHref(src) {
    return typeof src === 'string' && (/^https:\/\//i.test(src) || /^(?!\/)[\w.\-/]+(?:[?#][^\s]*)?$/.test(src) || /^mailto:[^\s]+$/i.test(src) || /^tel:[+\d]+$/i.test(src));
  }
  function textWithEm(node, value) {
    // Solo conservamos <em> para el resaltado dorado; todo lo demás es texto plano.
    const pieces = String(value ?? '').split(/(<em>[\s\S]*?<\/em>)/gi);
    const nodes = pieces.map(piece => {
      if (/^<em>[\s\S]*<\/em>$/i.test(piece)) {
        const em = document.createElement('em');
        em.textContent = piece.slice(4, -5);
        return em;
      }
      return document.createTextNode(piece);
    });
    node.replaceChildren(...nodes);
  }
  function pageSpans() {
    return $all('main [data-ca][data-es]').filter(el => !(pageName === 'serveis.html' && el.closest('.service-grid')));
  }
  function applyPage() {
    if (!pageContent) return;
    const spans = pageSpans();
    spans.forEach((el, idx) => {
      const entry = pageContent.texts?.['text' + String(idx + 1).padStart(2, '0')];
      if (entry) { el.dataset.ca = entry.ca ?? ''; el.dataset.es = entry.es ?? ''; }
    });
    // Las pequeñas etiquetas que contienen traducciones propias conservan su HTML original.
    let plainIndex = 0;
    $all('main .eyebrow').forEach(el => {
      if (el.querySelector('[data-ca][data-es]')) return;
      plainIndex++;
      const entry = pageContent.eyebrows?.['eyebrow' + String(plainIndex).padStart(2,'0')];
      if (entry) el.textContent = tr(entry);
    });
    $all('main a.button').forEach((a, idx) => {
      const entry = pageContent.buttons?.['button' + String(idx + 1).padStart(2, '0')];
      if (entry && safeHref(entry.href)) a.href = entry.href;
    });
    if (pageContent.seo_title) document.title = tr(pageContent.seo_title);
    const description = $('meta[name="description"]');
    if (description && pageContent.seo_description) description.content = tr(pageContent.seo_description);
  }
  function applySettings() {
    if (!settings) return;
    const props = { gold:'--gold', background:'--black', foreground:'--white' };
    for (const [key, prop] of Object.entries(props)) {
      if (/^#[0-9a-fA-F]{6}$/.test(settings[key] || '')) document.documentElement.style.setProperty(prop, settings[key]);
    }
    if (safeImage(settings.logo)) $all('.brand img').forEach(img => { img.src = settings.logo; });
    if (safeImage(settings.hero_image)) $all('.hero').forEach(hero => {
      const u = settings.hero_image.replace(/["\\]/g, '');
      hero.style.backgroundImage = 'linear-gradient(90deg,rgba(0,0,0,.8),rgba(0,0,0,.4)),url("' + u + '")';
      hero.style.backgroundSize = 'cover'; hero.style.backgroundPosition = 'center';
    });
    if (Array.isArray(settings.menu)) {
      $all('#nav a').forEach((a,i) => {
        const item = settings.menu[i]; if (!item) return;
        if (safeHref(item.href)) a.href = item.href;
        const label = a.querySelector('[data-ca][data-es]');
        if (label) { label.dataset.ca = item.ca || ''; label.dataset.es = item.es || ''; }
      });
    }
    const phone = String(settings.phone || '');
    const digits = phone.replace(/[^+\d]/g, '');
    if (digits) {
      $all('a[href^="tel:"]').forEach(a => { a.href='tel:' + digits; a.textContent=phone; });
      $all('a[href^="https://wa.me/"]').forEach(a => { a.href='https://wa.me/' + digits.replace(/\D/g,''); });
    }
    const email = String(settings.email || '').trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $all('a[href^="mailto:"]').forEach(a => {
        a.href='mailto:' + email;
        if (a.classList.contains('contact-link') || a.closest('footer')) a.textContent=email;
      });
    }
    const loc = String(settings.location || '').trim();
    if (loc) {
      const p = $('.contact-grid article:last-child > p:first-of-type'); if (p) p.textContent=loc;
      $all('footer').forEach(footer => {
        const sp = footer.querySelector('span');
        if (!sp) return;
        // Primer span: © año FESTIVEO PRODUCCIONS · ubicación
        const nodes = Array.from(sp.childNodes).filter(n => n.nodeType===Node.TEXT_NODE);
        if (nodes.length) nodes[nodes.length-1].textContent=' FESTIVEO PRODUCCIONS · ' + loc.toUpperCase();
      });
    }
    $all('footer').forEach(footer => {
      let box=footer.querySelector('#cms-social');
      if (!box) { box=document.createElement('span');box.id='cms-social';footer.append(box); }
      box.replaceChildren();
      for (const key of ['instagram','facebook','tiktok']) {
        const href=settings[key];
        if (typeof href==='string' && /^https:\/\//.test(href)) {
          const a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=key.toUpperCase();
          if (box.childNodes.length) box.append(document.createTextNode(' · '));
          box.append(a);
        }
      }
    });
    const slot = $('#forvenues-slot');
    if (slot && typeof settings.forvenues_url === 'string' && /^https:\/\//.test(settings.forvenues_url)) {
      slot.replaceChildren();
      const a=document.createElement('a');a.className='button primary';a.href=settings.forvenues_url;a.target='_blank';a.rel='noopener noreferrer';
      a.textContent=lang==='ca'?'COMPRAR ENTRADES':'COMPRAR ENTRADAS';slot.append(a);
    }
  }
  function renderGallery() {
    const grid=$('#event-gallery'); if (!grid) return;
    grid.replaceChildren();
    for (const event of events) {
      const card=document.createElement('article');card.className='event-card';
      const photos=Array.isArray(event.photos) ? event.photos.map(p => typeof p==='string' ? p : p?.image).filter(safeImage) : [];
      if (photos.length) { const img=document.createElement('img');img.src=photos[0];img.alt=tr(event.title);img.loading='lazy';card.append(img); }
      const info=document.createElement('div');info.className='event-info';
      const date=document.createElement('span');date.className='event-date';date.textContent=event.date || '';
      const title=document.createElement('h3');title.textContent=tr(event.title);
      const desc=document.createElement('p');desc.textContent=tr(event.description);
      info.append(date,title,desc);
      if (photos.length>1) {
        const group=document.createElement('div');group.className='thumbs';
        photos.slice(1).forEach(src => {const img=document.createElement('img');img.src=src;img.alt=title.textContent;img.loading='lazy';group.append(img);});
        info.append(group);
      }
      if (typeof event.url==='string' && /^https:\/\//.test(event.url)) {
        const a=document.createElement('a');a.href=event.url;a.target='_blank';a.rel='noopener noreferrer';
        a.textContent=lang==='ca'?'MÉS INFORMACIÓ →':'MÁS INFORMACIÓN →';info.append(a);
      }
      card.append(info);grid.append(card);
    }
  }
  function renderCards(root, data, type) {
    if (!root || !Array.isArray(data)) return;
    root.replaceChildren();
    for (const item of data) {
      const card=document.createElement('article');card.className='feature';
      if (safeImage(item.image)) {
        const img=document.createElement('img');img.src=item.image;img.loading='lazy';
        img.alt=tr(type==='artist'?item.name:item.title);img.style.width='100%';img.style.aspectRatio='4/3';img.style.objectFit='cover';card.append(img);
      }
      const heading=document.createElement('h3');heading.textContent=tr(type==='artist'?item.name:item.title);
      const detail=document.createElement('p');detail.textContent=tr(type==='artist'?item.bio:item.description);
      card.append(heading,detail);
      if (typeof item.url === 'string' && /^https:\/\//.test(item.url)) {
        const a=document.createElement('a');a.className='button outline';a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';
        a.textContent=lang==='ca'?'MÉS INFORMACIÓ':'MÁS INFORMACIÓN';card.append(a);
      }
      root.append(card);
    }
  }
  function renderServices() {
    if (pageName!=='serveis.html' || !services) return;
    const grid=$('main .service-grid');renderCards(grid,services,'service');
  }
  function renderArtists() {
    if (pageName!=='artistes.html' || !Array.isArray(artists)) return;
    let root=$('#cms-artists');
    if (!root) {
      root=document.createElement('div');root.id='cms-artists';root.className='service-grid';
      const grid=$('main .service-grid');grid?.insertAdjacentElement('afterend',root);
    }
    renderCards(root,artists,'artist');
    const note=$('main .note');if (note) note.style.display=artists.length?'none':'';
  }
  function translate() {
    document.documentElement.lang=lang;
    applySettings();
    applyPage();
    $all('[data-ca][data-es]').forEach(el => textWithEm(el,el.getAttribute('data-'+lang)));
    $all('[data-lang]').forEach(b => {b.classList.toggle('active',b.dataset.lang===lang);b.setAttribute('aria-pressed',String(b.dataset.lang===lang));});
    renderServices();renderArtists();renderGallery();
  }
  $all('[data-lang]').forEach(b => b.addEventListener('click',() => {lang=b.dataset.lang;localStorage.setItem('festiveo-lang',lang);translate();}));
  const menu=$('#menu');if (menu) menu.addEventListener('click',() => {const nav=$('#nav');const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
  const year=$('#year');if (year) year.textContent=new Date().getFullYear();
  async function getJSON(path) {
    const resp=await fetch(path,{cache:'no-store'});
    if (!resp.ok) throw new Error('No se pudo cargar '+path+' ('+resp.status+')');
    return resp.json();
  }
  const read=(path,callback)=>getJSON(path).then(callback).then(translate).catch(err=>console.warn('FESTIVEO:',err));
  const requests=[read('cms/settings.json',data=>{settings=data;})];
  if (pages[pageName]) requests.push(read('cms/'+pages[pageName],data=>{pageContent=data;}));
  if ($('#event-gallery')) requests.push(read('events.json',data=>{events=Array.isArray(data)?data:(Array.isArray(data.items)?data.items:[]);}));
  if (pageName==='serveis.html') requests.push(read('cms/services.json',data=>{services=Array.isArray(data.items)?data.items:[];}));
  if (pageName==='artistes.html') requests.push(read('cms/artists.json',data=>{artists=Array.isArray(data.items)?data.items:[];}));
  translate();
  Promise.allSettled(requests).then(translate);
})();
