/*
  player.js - Premium Player
  - متطلبات: ضع هذا الملف بعد تحميل channels.js في index.html
  - يعتمد على hls.js (يتم تحميله ديناميكياً)
  - ميزات: HLS, multi-quality, Auto, HEVC attempt (native), PiP, Fullscreen,
    volume, mute, prev/next, auto-hide controls, reconnection, buffering handling,
    keyboard shortcuts, accessible UI.
*/

(function(){
  /* ---- Dynamics: load hls.js if not present ---- */
  function loadHlsLib(cb){
    if(window.Hls) return cb();
    const s = document.createElement('script');
    s.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
    s.onload = cb;
    s.onerror = cb;
    document.head.appendChild(s);
  }

  /* ---- Inject player styles (kept self-contained) ---- */
  (function injectStyles(){
    const css = `
    #player-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);display:none;align-items:center;justify-content:center;z-index:99999}
    #player-box{position:relative;width:100%;max-width:1200px;height:56vw;max-height:720px;background:#000;border-radius:8px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.7)}
    #videoEl{width:100%;height:100%;background:#000;display:block;object-fit:contain}
    #stream-title{position:absolute;left:14px;top:10px;color:#fff;font-weight:600;text-shadow:0 2px 6px rgba(0,0,0,.6);z-index:5}
    #close-player{position:absolute;right:10px;top:10px;background:rgba(0,0,0,.45);color:#fff;border:none;padding:8px;border-radius:6px;cursor:pointer;z-index:6}
    .center-controls{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;gap:12px;z-index:5}
    .nav-btn{background:rgba(0,0,0,0.45);color:#fff;border:none;padding:12px;border-radius:50%;font-size:18px;cursor:pointer}
    .player-controls{position:absolute;left:0;right:0;bottom:12px;display:flex;gap:8px;justify-content:center;align-items:center;z-index:6;transition:opacity .25s}
    .control-btn{background:rgba(0,0,0,0.45);color:#fff;border:none;padding:8px 10px;border-radius:6px;cursor:pointer}
    .quality-select{background:rgba(0,0,0,0.45);color:#fff;border-radius:6px;padding:6px;font-size:14px}
    .volume-range{width:110px}
    .hide-controls .player-controls,.hide-controls .center-controls{opacity:0;pointer-events:none}
    .loading-indicator{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:7;color:#fff;font-size:14px;background:rgba(0,0,0,0.45);padding:8px 12px;border-radius:6px}
    `;
    const st = document.createElement('style');
    st.innerHTML = css;
    document.head.appendChild(st);
  })();

  /* ---- Build UI once ---- */
  function buildUI(){
    if(document.getElementById('player-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'player-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = `
      <div id="player-box">
        <div id="stream-title"></div>
        <video id="videoEl" playsinline webkit-playsinline controlsList="nodownload"></video>
        <button id="close-player" aria-label="اغلاق">✕</button>

        <div class="center-controls" id="center-controls">
          <button class="nav-btn" id="prev-channel" title="السابق">⏮</button>
          <button class="nav-btn" id="play-pause-big" title="تشغيل/ايقاف">⏯</button>
          <button class="nav-btn" id="next-channel" title="التالي">⏭</button>
        </div>

        <div class="player-controls" id="player-controls">
          <button class="control-btn" id="btn-play" title="تشغيل/ايقاف">⏯</button>
          <button class="control-btn" id="btn-stop" title="إيقاف">⏹</button>
          <button class="control-btn" id="btn-mute" title="كتم">🔊</button>
          <input id="vol" class="volume-range" type="range" min="0" max="1" step="0.01" value="1" />
          <select id="quality" class="quality-select" title="اختر جودة"></select>
          <button class="control-btn" id="btn-pip" title="صورة داخل صورة">🖼️</button>
          <button class="control-btn" id="btn-full" title="تكبير">⤢</button>
        </div>

        <div class="loading-indicator" id="loading-indicator" style="display:none">جارٍ التحميل...</div>

      </div>
    `;
    document.body.appendChild(overlay);
  }
  buildUI();

  /* ---- DOM refs ---- */
  const overlay = document.getElementById('player-overlay');
  const video = document.getElementById('videoEl');
  const titleEl = document.getElementById('stream-title');
  const closeBtn = document.getElementById('close-player');
  const prevBtn = document.getElementById('prev-channel');
  const nextBtn = document.getElementById('next-channel');
  const playPauseBig = document.getElementById('play-pause-big');
  const btnPlay = document.getElementById('btn-play');
  const btnStop = document.getElementById('btn-stop');
  const btnMute = document.getElementById('btn-mute');
  const volRange = document.getElementById('vol');
  const qualitySelect = document.getElementById('quality');
  const btnPiP = document.getElementById('btn-pip');
  const btnFull = document.getElementById('btn-full');
  const loading = document.getElementById('loading-indicator');

  /* ---- state ---- */
  let hls = null;
  let currentKey = null;
  let keysList = [];
  let currentIndex = 0;
  let hideTimer = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT = 3;
  let lastSrc = null;
  let manualQualityList = null; // if channel provides explicit qualities array

  /* ---- helper: collect keys from page links go:KEY ---- */
  function collectKeys(){
    const nodes = Array.from(document.querySelectorAll('a[href^="go:"]'));
    keysList = nodes.map(n => n.getAttribute('href').replace('go:',''));
  }
  collectKeys();

  /* ---- open player for key ---- */
  function openPlayer(key){
    currentKey = key;
    currentIndex = keysList.indexOf(key);
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden','false');
    titleEl.textContent = channelTitle(key);
    resetHideControls();
    initStreamForKey(key);
  }

  /* ---- close player ---- */
  function closePlayer(){
    stopStream();
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden','true');
  }

  /* ---- helpers to get channel data from window.channels ---- */
  function channelConfig(key){
    return (window.channels && window.channels[key]) ? window.channels[key] : null;
  }
  function channelTitle(key){
    const c = channelConfig(key);
    return c && c.title ? c.title : key;
  }

  /* ---- init stream ---- */
  function initStreamForKey(key){
    stopStream();
    reconnectAttempts = 0;
    const cfg = channelConfig(key);
    if(!cfg){
      alert('لا توجد بيانات للقناة: ' + key);
      return;
    }

    // Determine if config provides explicit qualities array
    if(Array.isArray(cfg.qualities) && cfg.qualities.length>0){
      // If there is an "Auto" entry (pointing to master m3u8) handle via hls levels
      const autoEntry = cfg.qualities.find(q => q.label && q.label.toLowerCase() === 'auto');
      if(autoEntry){
        manualQualityList = null;
        loadSrc(autoEntry.src, true);
      } else {
        // explicit list -> create quality menu and load default
        manualQualityList = cfg.qualities;
        populateManualQualities(manualQualityList, cfg.defaultQuality);
      }
    } else if(typeof cfg === 'string' && cfg.length>0){
      // simple string -> treat as master or single src
      manualQualityList = null;
      loadSrc(cfg, true);
    } else {
      alert('تنسيق القناة غير صحيح: ' + key);
    }
  }

  /* ---- populate manual quality selects ---- */
  function populateManualQualities(list, defaultLabel){
    qualitySelect.innerHTML = '';
    list.forEach((q, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = q.label || ('Q' + (idx+1));
      qualitySelect.appendChild(opt);
    });
    // choose default index
    let defIdx = 0;
    if(defaultLabel){
      const found = list.findIndex(x => (x.label || '').toString() === defaultLabel.toString());
      if(found >= 0) defIdx = found;
    }
    qualitySelect.value = defIdx;
    // load selected
    loadSrc(list[defIdx].src, false);
    qualitySelect.onchange = function(){
      const idx = parseInt(this.value);
      if(list[idx] && list[idx].src) loadSrc(list[idx].src, false);
    };
  }

  /* ---- load source (src may be master m3u8 or mp4) ----
       allowHlsLevels -> if true: attempt to parse hls levels and provide Auto + list
  */
  function loadSrc(src, allowHlsLevels){
    if(!src) { alert('لم يتم تحديد رابط للبث'); return; }
    lastSrc = src;
    showLoading(true);
    // Destroy previous hls
    if(hls){ try{ hls.destroy(); }catch(e){} hls = null; }

    // Attempt native HLS first (Safari/iOS) or HEVC native playback
    if(video.canPlayType('application/vnd.apple.mpegurl')){
      video.src = src;
      video.play().catch(()=>{});
      showLoading(false);
      return;
    }

    // If Hls.js supported, use it
    if(window.Hls && Hls.isSupported()){
      hls = new Hls({
        maxBufferLength: 30,
        capLevelToPlayerSize: true,
        debug: false
      });
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, function(){
        // populate levels
        const levels = hls.levels || [];
        qualitySelect.innerHTML = '';
        if(levels.length>0 && allowHlsLevels){
          const autoOpt = document.createElement('option'); autoOpt.value = 'auto'; autoOpt.textContent = 'Auto'; qualitySelect.appendChild(autoOpt);
          levels.forEach((lvl, i)=>{
            const lab = lvl.height ? (lvl.height + 'p') : (Math.round((lvl.bitrate||0)/1000) + 'kbps');
            const opt = document.createElement('option'); opt.value = i; opt.textContent = lab;
            qualitySelect.appendChild(opt);
          });
          qualitySelect.onchange = function(){
            const v = this.value;
            if(v === 'auto') hls.currentLevel = -1;
            else hls.currentLevel = parseInt(v);
          };
        } else if(!allowHlsLevels){
          // leave quality select empty (manual mode)
        }
        video.play().catch(()=>{});
        showLoading(false);
      });

      hls.on(Hls.Events.LEVEL_LOADED, function(evt, data){
        // optional: could update UI with current level info
      });

      // error handling & auto-retry
      hls.on(Hls.Events.ERROR, function(event, data){
        console.warn('HLS error', data);
        if(data && data.fatal){
          switch(data.type){
            case Hls.ErrorTypes.NETWORK_ERROR:
              attemptReconnect();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              try{ hls.destroy(); }catch(e){}
              showLoading(false);
              break;
          }
        }
      });

      // buffering / stalled detection
      video.addEventListener('stalled', ()=> { showLoading(true); attemptReconnect(); });
      video.addEventListener('waiting', ()=> { showLoading(true); });
      video.addEventListener('playing', ()=> { showLoading(false); });

      return;
    }

    // fallback: try set src directly (mp4)
    video.src = src;
    video.play().then(()=> showLoading(false)).catch((e)=> { showLoading(false); console.warn('Direct play failed', e); alert('هذا النوع قد لا يُدعم في المتصفح'); });
  }

  /* ---- stop stream ---- */
  function stopStream(){
    if(hls){ try{ hls.destroy(); }catch(e){} hls=null; }
    try{ video.pause(); video.removeAttribute('src'); video.load(); }catch(e){}
    qualitySelect.innerHTML = '';
    manualQualityList = null;
    showLoading(false);
  }

  /* ---- reconnect attempts ---- */
  function attemptReconnect(){
    if(reconnectAttempts >= MAX_RECONNECT){
      showLoading(false);
      // final fail => show message
      console.warn('Max reconnect attempts reached');
      return;
    }
    reconnectAttempts++;
    console.log('Attempt reconnect', reconnectAttempts);
    // small backoff
    setTimeout(()=> {
      if(lastSrc) loadSrc(lastSrc, true);
    }, 1000 * reconnectAttempts);
  }

  /* ---- UI interactions ---- */
  btnPlay.addEventListener('click', togglePlay);
  playPauseBig.addEventListener('click', togglePlay);
  btnStop.addEventListener('click', ()=> { stopStream(); });
  function togglePlay(){ if(video.paused) video.play().catch(()=>{}); else video.pause(); }

  btnMute.addEventListener('click', ()=> {
    video.muted = !video.muted;
    btnMute.textContent = video.muted ? '🔇' : '🔊';
  });
  volRange.addEventListener('input', (e)=> { video.volume = parseFloat(e.target.value); video.muted = video.volume === 0; });

  prevBtn.addEventListener('click', ()=> changeChannel(-1));
  nextBtn.addEventListener('click', ()=> changeChannel(1));

  btnPiP.addEventListener('click', async ()=> {
    try{
      if(document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    }catch(err){
      console.warn('PiP not supported', err);
    }
  });

  btnFull.addEventListener('click', async ()=> {
    try{
      if(document.fullscreenElement) await document.exitFullscreen();
      else await document.getElementById('player-box').requestFullscreen();
    }catch(err){ console.warn('Fullscreen error', err); }
  });

  closeBtn.addEventListener('click', ()=> closePlayer());

  /* ---- keyboard shortcuts ---- */
  document.addEventListener('keydown', (e)=>{
    if(overlay.style.display !== 'flex') return;
    if(e.key === 'ArrowLeft') changeChannel(-1);
    if(e.key === 'ArrowRight') changeChannel(1);
    if(e.key === ' ') { e.preventDefault(); togglePlay(); }
    if(e.key === 'm' || e.key === 'M') { video.muted = !video.muted; }
  });

  /* ---- auto-hide controls ---- */
  function resetHideControls(){
    overlay.classList.remove('hide-controls');
    if(hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(()=> overlay.classList.add('hide-controls'), 3500);
  }
  ['mousemove','touchstart','click','keydown'].forEach(ev => {
    document.addEventListener(ev, resetHideControls, {passive:true});
  });

  /* ---- change channel ---- */
  function changeChannel(delta){
    if(keysList.length === 0) collectKeys();
    if(!currentKey) return;
    currentIndex = (currentIndex + delta + keysList.length) % keysList.length;
    const newKey = keysList[currentIndex];
    initStreamForKey(newKey);
    titleEl.textContent = channelTitle(newKey);
    // update currentKey
    currentKey = newKey;
  }

  /* ---- show/hide loading ---- */
  function showLoading(show){
    loading.style.display = show ? 'block' : 'none';
  }

  /* ---- event: open when clicking go: links ---- */
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[href^="go:"]');
    if(!a) return;
    e.preventDefault();
    const key = a.getAttribute('href').replace('go:','');
    if(keysList.length === 0) collectKeys();
    currentIndex = keysList.indexOf(key);
    openPlayer(key);
  });

  /* ---- auto collect keys on DOM ready and when DOM changes ---- */
  const observer = new MutationObserver(()=> collectKeys());
  observer.observe(document.body, {childList:true, subtree:true});

  /* ---- small UX: pause when page hidden ---- */
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){
      // optionally pause
    } else {
      // resume if desired
    }
  });

  /* ---- init: load hls lib and ready ---- */
  loadHlsLib(()=> {
    console.log('hls.js loaded?', !!window.Hls);
  });

  /* ---- advanced: optional MediaSession integration for lockscreen controls (basic) ---- */
  try {
    if('mediaSession' in navigator){
      navigator.mediaSession.setActionHandler('play', ()=> video.play().catch(()=>{}));
      navigator.mediaSession.setActionHandler('pause', ()=> video.pause());
      navigator.mediaSession.setActionHandler('previoustrack', ()=> changeChannel(-1));
      navigator.mediaSession.setActionHandler('nexttrack', ()=> changeChannel(1));
    }
  } catch(e){ /* ignore */ }

})();
