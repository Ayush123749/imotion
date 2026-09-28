/* ═══════════════════════════════════════════════
   iMotion — Emotion Detection
   ═══════════════════════════════════════════════ */

/* ── Config ── */
const MODEL_URLS = [
  '/models',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
];
var BACKEND_AVAILABLE = false;
var backendCheckDone = false;

/* ── Emotion Colors & Labels ── */
var emoColors = { happiness:'#7c3aed', sadness:'#3b82f6', anger:'#ef4444', fear:'#f59e0b', surprise:'#8b5cf6', disgust:'#10b981', neutral:'#9ca3af' };
var emoLabels = { happiness:'Happiness', sadness:'Sadness', anger:'Anger', fear:'Fear', surprise:'Surprise', disgust:'Disgust', neutral:'Neutral' };
var emoEmojis = { happiness:'😊', sadness:'😢', anger:'😡', fear:'😨', surprise:'😲', disgust:'🤢', neutral:'😐' };

/* ── Check backend health ── */
async function checkBackend() {
  if (backendCheckDone) return BACKEND_AVAILABLE;
  try {
    var r = await fetch('/api/health');
    var data = await r.json();
    BACKEND_AVAILABLE = data.status === 'ok';
  } catch(e) { BACKEND_AVAILABLE = false; }
  backendCheckDone = true;
  return BACKEND_AVAILABLE;
}

/* ── Tab Navigation ── */
(function () {
  var navBtns = document.querySelectorAll('.nav-link');
  navBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      navBtns.forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
      btn.classList.add('active');
      var tab = document.getElementById('tab-' + btn.getAttribute('data-tab'));
      if (tab) tab.classList.add('active');
    });
  });
  // Ctrl+Enter to analyze text
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      var tab = document.getElementById('tab-text');
      if (tab && tab.classList.contains('active')) {
        var btn = document.getElementById('btnAnalyze');
        if (btn) btn.click();
      }
    }
  });
})();

/* ═══════════════════════════════════════════════
   TEXT ANALYSIS (backend with client fallback)
   ═══════════════════════════════════════════════ */
var btnAnalyze = document.getElementById('btnAnalyze');
if (btnAnalyze) btnAnalyze.addEventListener('click', doTextAnalysis);

async function doTextAnalysis() {
  var text = document.getElementById('txtInput').value.trim();
  if (!text) { showToast('Please enter some text', 'warning'); return; }

  document.getElementById('txtResult').style.display = 'block';
  document.getElementById('txtEmpty').style.display = 'none';
  document.getElementById('txtBars').innerHTML = '<div class="txt-bar-row"><div class="txt-bar-track"><div class="txt-bar-fill" style="background:#7c3aed;width:30%"></div></div></div>';

  var result;
  var backend = await checkBackend();

  if (backend) {
    try {
      var resp = await fetch('/api/analyze/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      });
      if (!resp.ok) throw new Error('Server ' + resp.status);
      var data = await resp.json();
      result = { emotion: data.emotion, confidence: data.confidence, breakdown: data.breakdown };
    } catch(e) {
      console.warn('Backend text analysis failed:', e.message);
      result = analyzeTextLexicon(text);
    }
  } else {
    result = analyzeTextLexicon(text);
  }

  var emojis = { neutral:'😐', happiness:'😊', sadness:'😢', anger:'😡', fear:'😨', surprise:'😲', disgust:'🤢' };
  document.getElementById('txtEmoji').textContent = emojis[result.emotion] || '😐';
  document.getElementById('txtEmotionLabel').textContent = emoLabels[result.emotion] || result.emotion;
  document.getElementById('txtConfidence').textContent = result.confidence + '% confidence';
  document.getElementById('txtBars').innerHTML = buildEmotionBarsHTML(result.breakdown, 'txt-bar');

  saveToLocalStorage(text, result.emotion, result.confidence);
  showToast('Analysis complete: ' + emoLabels[result.emotion], 'success');
}

/* ═══════════════════════════════════════════════
   CLIENT-SIDE LEXICON (Sets + Pre-stemmed)
   ═══════════════════════════════════════════════ */
function stem(w) {
  return w.replace(/(?:ied|ies)$/i, 'y')
          .replace(/(?:ing|ed|ly|ness|tion|ment|ity|able|ible|es|s)$/i, '');
}

var happyWords = new Set(['happy','joy','glad','love','great','good','wonderful','amazing','awesome','fantastic','excited','pleased','delight','cheerful','brilliant','superb','excellent','beautiful','perfect','nice','laugh','smile','fun','enjoy','grateful','thank','blessed','paradise','celebrate','win','success','thrilled','elated','satisfied','content','proud','delighted','relieved','relaxed','comfortable','cozy','warm','friendly','peaceful','marvelous','outstanding','fabulous','incredible','magnificent','gorgeous','splendid','radiant','ecstatic','overjoyed','exhilarated','optimistic','inspired','motivated','confident','energetic','lively','vibrant','merry','festive','blissful','carefree','gratified','upbeat']);
var sadWords = new Set(['sad','unhappy','cry','tears','depressed','down','miserable','heartbroken','grief','sorrow','gloomy','lonely','hurt','pain','lost','disappointed','hopeless','despair','mourn','miss','blue','melancholy','suffering','broken','regret','sorry','weeping','crying','sorrowful','devastated','anguish','aching','dull','numb','empty','hollow','alone','abandoned','rejected','defeated','discouraged','disheartened','pathetic','tragic','woeful','mournful','despondent','dejected','forlorn','disconsolate','upset','distraught','grieving','sobbing']);
var angryWords = new Set(['angry','furious','rage','hate','mad','irritated','frustrated','annoyed','outraged','annoying','hostile','bitter','aggressive','livid','resent','violence','terrible','worst','ridiculous','nonsense','enraged','infuriated','irritable','cranky','grumpy','aggravated','provoked','confrontational','sarcastic','insulting','insulted','disrespect','disrespectful','demanding','impossible','difficult','spiteful','vengeful','offended','maddening','outrageous','unbearable','intolerable','unacceptable','frustrating','hatred','fury','wrath','seething','raging','exasperating','infuriating','bothersome','pestering','nagging','aggravation','belligerent','combative','antagonistic','vicious','venomous','snarl','smash','crash','corrupt','corrupted','fail','failed','failure','bug','nightmare','fuming']);
var fearWords = new Set(['scared','afraid','fear','terrified','anxious','worried','nervous','panic','dread','frightened','threat','danger','phobia','horror','creepy','nightmare','tense','uneasy','apprehensive','paranoid','unsafe','stress','alarming','worrying','frightening','disturbing','threatening','ominous','spooky','terrifying','petrifying','unnerving','horrifying','intimidating','dreadful','shocking','concerned','alarmed','startled','jumpy','restless','petrified','horrified','traumatized','trembling','shaking']);
var surpriseWords = new Set(['surprise','shocked','amazed','astonished','wow','unexpected','unbelievable','incredible','whoa','stunned','astounded','mindblown','astonishing','jawdropping','staggering','miraculous','wondrous','baffling','bewildered','confused','puzzling','weird','bizarre','strange','odd','peculiar','unusual','extraordinary','remarkable','startled','leap','jumped','gasp','flabbergast','speechless','dumbfounded']);
var disgustWords = new Set(['disgust','gross','nasty','revolting','icky','repulsive','yuck','ew','nauseous','repulsed','disgusting','awful','ugly','horrible','sickening','repugnant','vile','foul','offensive','abhorrent','appalling','loathsome','nauseating','distasteful','unpleasant','sickened','repelled','revolted','nauseated','detestable']);

var amplifiers = new Set(['very','extremely','incredibly','absolutely','completely','totally','utterly','really','super','highly','deeply','profoundly','intensely','remarkably','exceptionally','particularly','especially','tremendously']);
var diminishers = new Set(['somewhat','slightly','kind','sort','mildly','barely','hardly']);
var negations = new Set(["not","n't",'never','no','nor','neither','nobody','nothing','nowhere']);

var emotionSets = {};
(function buildSets() {
  var dicts = { happiness:happyWords, sadness:sadWords, anger:angryWords, fear:fearWords, surprise:surpriseWords, disgust:disgustWords };
  for (var emo in dicts) {
    var s = new Set();
    dicts[emo].forEach(function(w) { s.add(stem(w.toLowerCase())); });
    emotionSets[emo] = s;
  }
})();

function analyzeTextLexicon(text) {
  var cleaned = text.toLowerCase().replace(/[^a-z\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
  var words = cleaned.split(' ');
  var allEmos = ['happiness','sadness','anger','fear','surprise','disgust'];
  var scores = {};
  allEmos.forEach(function(e) { scores[e] = 0; });
  var negWindow = 0;

  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    if (negations.has(w) || w.includes("n't")) { negWindow = 3; continue; }
    if (negWindow > 0) negWindow--;
    var s = stem(w);
    var matched = false;
    for (var j = 0; j < allEmos.length; j++) {
      if (emotionSets[allEmos[j]].has(s)) {
        var weight = 1;
        for (var k = Math.max(0, i - 3); k < i; k++) {
          if (amplifiers.has(words[k])) { weight *= 1.5; break; }
          if (diminishers.has(words[k])) { weight *= 0.5; break; }
        }
        if (negWindow === 0) scores[allEmos[j]] += weight;
        else scores[allEmos[j]] -= weight * 0.5;
        matched = true; break;
      }
    }
  }

  var posTotal = 0;
  allEmos.forEach(function(e) { posTotal += Math.max(0, scores[e]); });
  var breakdown = {};
  if (posTotal === 0) {
    breakdown = { happiness:8, sadness:4, anger:3, fear:4, surprise:3, disgust:2, neutral:76 };
    return { emotion:'neutral', confidence:76, breakdown:breakdown };
  }
  allEmos.forEach(function(e) { breakdown[e] = Math.round((Math.max(0, scores[e]) / posTotal) * 100); });
  breakdown.neutral = Math.max(0, 100 - allEmos.reduce(function(s, e) { return s + breakdown[e]; }, 0));

  var topEmo = 'neutral', topVal = 0;
  allEmos.forEach(function(e) { if (breakdown[e] > topVal) { topVal = breakdown[e]; topEmo = e; } });
  if (breakdown.neutral > topVal) topEmo = 'neutral';
  return { emotion:topEmo, confidence:topEmo === 'neutral' ? breakdown.neutral : topVal, breakdown:breakdown };
}

/* ═══════════════════════════════════════════════
   LOCALSTORAGE HISTORY
   ═══════════════════════════════════════════════ */
var LOCAL_KEY = 'imotion_history';

function saveToLocalStorage(text, emotion, confidence) {
  var hist = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  hist.unshift({ text:text.substring(0,200), emotion:emotion, confidence:confidence, time:Date.now(), type:'text' });
  if (hist.length > 100) hist = hist.slice(0, 100);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(hist));
  renderLocalStorageHistory();
}

function renderLocalStorageHistory() {
  var hist = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  var list = document.getElementById('histList');
  if (!list) return;
  if (hist.length === 0) { list.innerHTML = '<p class="empty-state">No analyses yet</p>'; return; }
  list.innerHTML = hist.map(function(h) {
    var c = emoColors[h.emotion] || '#9ca3af';
    var l = emoLabels[h.emotion] || h.emotion;
    var t = new Date(h.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    var preview = (h.text || '').substring(0, 60);
    if (h.text && h.text.length > 60) preview += '...';
    return '<div class="history-item"><div style="flex:1;overflow:hidden;">' +
      '<div style="font-size:0.88rem;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escHtml(preview) + '</div>' +
      '<span style="font-size:0.72rem;color:#9ca3af;">' + t + '</span></div>' +
      '<span class="history-tag" style="background:'+c+'10;color:'+c+';border:1px solid '+c+'30;">' + l + ' ' + h.confidence + '%</span></div>';
  }).join('');
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function clearHistory() {
  localStorage.removeItem(LOCAL_KEY);
  renderLocalStorageHistory();
  if (BACKEND_AVAILABLE) {
    fetch('/api/history', { method:'DELETE' }).catch(function() {});
  }
  showToast('History cleared', 'success');
}

(function() {
  var hs = document.querySelector('.history-section');
  if (!hs) return;
  var h3 = hs.querySelector('h3');
  if (!h3) return;
  var btn = document.createElement('button');
  btn.textContent = 'Clear History';
  btn.className = 'btn btn-outline';
  btn.style.cssText = 'margin-left:12px;font-size:0.78rem;padding:4px 12px;';
  btn.addEventListener('click', clearHistory);
  h3.style.display = 'inline-block';
  h3.insertAdjacentElement('afterend', btn);
})();

/* ═══════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════ */
function showToast(msg, type) {
  type = type || 'info';
  var old = document.getElementById('imotion-toast');
  if (old) old.remove();
  var toast = document.createElement('div');
  toast.id = 'imotion-toast';
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;padding:12px 24px;border-radius:10px;font-size:0.9rem;font-weight:500;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,0.15);';
  if (type === 'success') toast.style.background = '#10b981';
  else if (type === 'error') toast.style.background = '#ef4444';
  else if (type === 'warning') toast.style.background = '#f59e0b';
  else toast.style.background = '#7c3aed';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 4000);
}

/* ═══════════════════════════════════════════════
   EMOTION BARS BUILDER
   ═══════════════════════════════════════════════ */
function buildEmotionBarsHTML(expr, prefix) {
  prefix = prefix || 'bar';
  var emotions = ['happiness','sadness','anger','fear','surprise','disgust','neutral'];
  var html = '';

  // Detect whether values are already 0-100 (backend) or 0-1 (face-api raw)
  var alreadyPercent = false;
  for (var ki = 0; ki < emotions.length; ki++) {
    if (expr[emotions[ki]] > 1) { alreadyPercent = true; break; }
  }

  for (var i = 0; i < emotions.length; i++) {
    var e = emotions[i];
    var raw = expr[e] || 0;
    var pct = alreadyPercent ? Math.round(raw) : Math.round(raw * 100);
    var c = emoColors[e];
    html += '<div class="'+prefix+'-row"><span class="bar-label">'+emoLabels[e]+'</span>' +
      '<div class="'+prefix+'-track"><div class="'+prefix+'-fill" style="background:'+c+';width:'+pct+'%"></div></div>' +
      '<span class="bar-pct">'+pct+'%</span></div>';
  }
  return html;
}

/* ═══════════════════════════════════════════════
   MEDIA TAB — Camera + Face Detection ONLY
   ═══════════════════════════════════════════════ */
var stream = null;
var detectionActive = false;
var faceApiReady = false;

function checkFaceApi() {
  if (typeof faceapi === 'undefined') {
    console.warn('face-api.js not loaded from CDN');
    showToast('face-api.js failed to load. Face detection unavailable.', 'error');
    return false;
  }
  return true;
}

var faceApiToOurs = {
  happy:'happiness', sad:'sadness', angry:'anger',
  fearful:'fear', disgusted:'disgust', surprised:'surprise', neutral:'neutral'
};

/* ── Camera / Mic Button (single toggle) ── */
var btnGrant = document.getElementById('btnGrant');
var mediaActive = false;

function toggleCamera() {
  if (mediaActive) { stopMedia(); return; }

  var permStatus = document.getElementById('permStatus');
  permStatus.textContent = 'Requesting camera access...';
  permStatus.style.color = '#7c3aed';
  permStatus.style.display = 'inline-block';

  navigator.mediaDevices.getUserMedia({ video:true, audio:false }).then(function(s) {
    stream = s;
    var vid = document.getElementById('vidPlayer');
    vid.srcObject = stream;
    vid.onloadedmetadata = function() { vid.play(); };
    mediaActive = true;
    detectionActive = true;

    document.getElementById('cameraPlaceholder').style.display = 'none';
    document.getElementById('videoContainer').style.display = 'block';
    btnGrant.disabled = false;
    btnGrant.textContent = '⏹ Stop Camera';
    btnGrant.style.background = '#ef4444';
    permStatus.textContent = 'Camera active — detecting faces...';
    permStatus.style.color = '#10b981';

    var statusBadge = document.getElementById('statusBadge');
    statusBadge.textContent = 'Active';
    statusBadge.classList.add('active');

    startFaceDetection(vid);
  }).catch(function(err) {
    permStatus.textContent = 'Permission denied: ' + err.message;
    permStatus.style.color = '#ef4444';
    showToast('Permission denied: ' + err.message, 'error');
  });
}

if (btnGrant) btnGrant.addEventListener('click', toggleCamera);

function stopMedia() {
  mediaActive = false;
  detectionActive = false;

  if (stream) { stream.getTracks().forEach(function(t) { t.stop(); }); stream = null; }

  document.getElementById('cameraPlaceholder').style.display = '';
  document.getElementById('videoContainer').style.display = 'none';

  var btn = document.getElementById('btnGrant');
  btn.textContent = '📷 Enable Camera';
  btn.style.background = '';
  document.getElementById('statusBadge').textContent = 'Inactive';
  document.getElementById('statusBadge').classList.remove('active');
  document.getElementById('permStatus').textContent = 'Click to enable camera';
  document.getElementById('permStatus').style.color = '';
  document.getElementById('emoFace').textContent = '—';
  document.getElementById('emoFaceEmoji').textContent = '😊';
  document.getElementById('liveBars').innerHTML = '';

  showToast('Camera stopped', 'info');
}

/* ── Face Detection Loop ── */
async function loadFaceApiModels() {
  var lastError = null;
  for (var i = 0; i < MODEL_URLS.length; i++) {
    var url = MODEL_URLS[i];
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(url);
      await faceapi.nets.faceLandmark68Net.loadFromUri(url);
      await faceapi.nets.faceExpressionNet.loadFromUri(url);
      return url;
    } catch (err) {
      lastError = err;
      console.warn('Model load failed for ' + url, err);
    }
  }
  throw lastError || new Error('Unknown model loading error');
}

function startFaceDetection(vid) {
  if (!checkFaceApi()) return;

  if (faceApiReady) { runFaceDetection(vid); return; }

  showToast('Loading face detection models...', 'info');
  loadFaceApiModels().then(function() {
    faceApiReady = true;
    showToast('Face detection ready', 'success');
    runFaceDetection(vid);
  }).catch(function(e) {
    showToast('Face model load failed: ' + (e.message || 'unknown'), 'error');
  });
}

function runFaceDetection(videoEl) {
  if (!detectionActive) return;
  if (!videoEl || videoEl.paused || videoEl.ended) {
    setTimeout(function() { runFaceDetection(videoEl); }, 500);
    return;
  }

  faceapi.detectAllFaces(
    videoEl,
    new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.25, inputSize: 256 })
  ).withFaceExpressions().then(function(detections) {
    if (!detectionActive) return;
    if (detections && detections.length > 0) {
      var expr = detections[0].expressions;

      var topEmo = 'neutral', topVal = 0;
      for (var ek in expr) {
        if (expr[ek] > topVal) { topVal = expr[ek]; topEmo = ek; }
      }
      var ourName = faceApiToOurs[topEmo] || 'neutral';
      document.getElementById('emoFace').textContent = emoLabels[ourName];
      document.getElementById('emoFaceEmoji').textContent = emoEmojis[ourName];
      document.getElementById('liveBars').innerHTML = buildEmotionBarsHTML(expr);
    } else {
      document.getElementById('emoFace').textContent = 'No face';
      document.getElementById('emoFaceEmoji').textContent = '🔍';
      document.getElementById('liveBars').innerHTML = '';
    }
  }).catch(function(e) {
    console.log('Detection error:', e.message);
  }).finally(function() {
    setTimeout(function() { runFaceDetection(videoEl); }, 500);
  });
}

/* ═══════════════════════════════════════════════
   IMAGE TAB — Upload & Analysis
   ═══════════════════════════════════════════════ */
(function() {
  var dropzone = document.getElementById('imgDropzone');
  var uploadInput = document.getElementById('imgUpload');
  var previewImg = document.getElementById('imgPreview');
  var canvas = document.getElementById('imgFaceCanvas');
  var fileName = document.getElementById('imgFileName');
  var emptyState = document.getElementById('imgResultEmpty');
  var analyzing = document.getElementById('imgAnalyzing');
  var resultsPanel = document.getElementById('imgResults');
  var faceCardsContainer = document.getElementById('imgFaceCards');

  if (!dropzone || !uploadInput) return;

  ['dragover','dragenter'].forEach(function(evt) {
    dropzone.addEventListener(evt, function(e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('dragover'); });
  });
  ['dragleave','dragend','drop'].forEach(function(evt) {
    dropzone.addEventListener(evt, function(e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('dragover'); });
  });
  dropzone.addEventListener('drop', function(e) {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleImgFile(e.dataTransfer.files[0]);
  });
  uploadInput.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) handleImgFile(e.target.files[0]);
  });

  function handleImgFile(file) {
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'warning'); return; }
    fileName.textContent = file.name;
    var reader = new FileReader();
    reader.onload = function(ev) {
      previewImg.onload = function() { analyzeImage(previewImg); };
      previewImg.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Remove / Clear image button
  var clearBtn = document.getElementById('imgClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      previewImg.src = '';
      previewImg.onload = null;
      canvas.width = 0;
      canvas.height = 0;
      faceCardsContainer.innerHTML = '';
      fileName.textContent = '';
      resultsPanel.style.display = 'none';
      analyzing.style.display = 'none';
      emptyState.style.display = 'block';
      emptyState.querySelector('p').textContent = 'Upload an image to see emotion analysis';
      uploadInput.value = '';
      showToast('Image removed', 'info');
    });
  }

  function getModelLoader() {
    if (faceApiReady) return Promise.resolve();
    return loadFaceApiModels().then(function() {
      faceApiReady = true;
    }).catch(function(e) {
      faceApiReady = false;
      throw e;
    });
  }

  // Multi-pass detection: scan 3 times with offset regions to catch all faces
  function detectAllFacesMultiPass(imgEl) {
    var opts = [
      { scoreThreshold: 0.15, inputSize: 416 },
      { scoreThreshold: 0.25, inputSize: 224 },
      { scoreThreshold: 0.35, inputSize: 160 }
    ];

    return faceapi.detectAllFaces(
      imgEl,
      new faceapi.TinyFaceDetectorOptions(opts[0])
    ).withFaceExpressions().then(function(detections1) {
      detections1 = detections1 || [];
      // If we got good results, try second pass for more faces
      return faceapi.detectAllFaces(
        imgEl,
        new faceapi.TinyFaceDetectorOptions(opts[1])
      ).withFaceExpressions().then(function(detections2) {
        var all = mergeDetections(detections1, detections2);
        // Third pass for small faces
        return faceapi.detectAllFaces(
          imgEl,
          new faceapi.TinyFaceDetectorOptions(opts[2])
        ).withFaceExpressions().then(function(detections3) {
          return mergeDetections(all, detections3);
        });
      });
    });
  }

  function mergeDetections(existing, newArr) {
    if (!newArr || !newArr.length) return existing;
    if (!existing || !existing.length) return newArr;

    // Check each new detection against existing ones
    for (var n = 0; n < newArr.length; n++) {
      var nd = newArr[n].detection.box;
      var duplicate = false;
      for (var e = 0; e < existing.length; e++) {
        var ed = existing[e].detection.box;
        var overlap = boxOverlap(nd, ed);
        if (overlap > 0.3) {
          duplicate = true;
          // Keep higher confidence detection
          var nExpr = newArr[n].expressions;
          var eTop = getMaxExpr(existing[e].expressions);
          var nTop = getMaxExpr(newArr[n].expressions);
          if (nTop > eTop) existing[e] = newArr[n];
          break;
        }
      }
      if (!duplicate) existing.push(newArr[n]);
    }
    return existing;
  }

  function boxOverlap(a, b) {
    var x1 = Math.max(a.x, b.x);
    var y1 = Math.max(a.y, b.y);
    var x2 = Math.min(a.x + a.width, b.x + b.width);
    var y2 = Math.min(a.y + a.height, b.y + b.height);
    if (x2 <= x1 || y2 <= y1) return 0;
    var inter = (x2 - x1) * (y2 - y1);
    var aArea = a.width * a.height;
    var bArea = b.width * b.height;
    return inter / Math.min(aArea, bArea);
  }

  function getMaxExpr(expr) {
    var max = 0;
    for (var k in expr) { if (expr[k] > max) max = expr[k]; }
    return max;
  }

  function analyzeImage(imgEl) {
    if (!checkFaceApi()) return;

    emptyState.style.display = 'none';
    resultsPanel.style.display = 'none';
    analyzing.style.display = 'block';
    faceCardsContainer.innerHTML = '';

    var imgW = imgEl.naturalWidth;
    var imgH = imgEl.naturalHeight;
    canvas.width = imgW;
    canvas.height = imgH;

    getModelLoader().then(function() {
      return detectAllFacesMultiPass(imgEl);
    }).then(function(detections) {
      analyzing.style.display = 'none';
      resultsPanel.style.display = 'block';

      if (!detections || detections.length === 0) {
        emptyState.style.display = 'block';
        emptyState.querySelector('p').textContent = 'No face detected — try a clearer image';
        showToast('No faces detected', 'warning');
        return;
      }

      detections.sort(function(a, b) { return b.detection.score - a.detection.score; });

      var displaySize = { width:imgW, height:imgH };
      var resized = faceapi.resizeResults(detections, displaySize);
      faceapi.draw.drawDetections(canvas, resized);
      faceapi.draw.drawFaceExpressions(canvas, resized);

      // Build per-face cards with mini emotion bars
      var cardsHTML = '';
      for (var i = 0; i < detections.length; i++) {
        var expr = detections[i].expressions;
        var topEmo = getTopEmotion(expr);
        var topKey = faceApiToOurs[topEmo] || 'neutral';
        var conf = Math.round(expr[topEmo] * 100);
        var c = emoColors[topKey] || '#9ca3af';

        // Mini emotion bars for this face
        var barsHTML = '<div class="face-mini-bars">';
        var emos = ['happiness','sadness','anger','fear','surprise','disgust','neutral'];
        for (var fi = 0; fi < emos.length; fi++) {
          var epct = Math.round((expr[emos[fi]] || 0) * 100);
          var ec = emoColors[emos[fi]];
          barsHTML += '<div class="face-mini-bar-row">' +
            '<span class="face-mini-bar-label">' + emoLabels[emos[fi]].substring(0,3) + '</span>' +
            '<div class="face-mini-bar-track"><div class="face-mini-bar-fill" style="background:' + ec + ';width:' + epct + '%"></div></div>' +
            '<span class="face-mini-bar-pct">' + epct + '%</span></div>';
        }
        barsHTML += '</div>';

        cardsHTML += '<div class="face-card-mini">' +
          '<div class="face-card-left">' +
            '<span class="face-emoji">' + emoEmojis[topKey] + '</span>' +
            '<span class="face-num-badge" style="color:' + c + ';border-color:' + c + ';">' + (i+1) + '</span>' +
          '</div>' +
          '<div class="face-card-center">' +
            '<div class="face-label">Face ' + (i+1) + ': <span style="color:' + c + '">' + (emoLabels[topKey] || topEmo) + '</span></div>' +
            '<div class="face-conf">' + conf + '% confidence</div>' +
            barsHTML +
          '</div>' +
          '<span class="face-badge" style="background:' + c + '15;color:' + c + ';border:1px solid ' + c + '30;">' + conf + '%</span></div>';
      }
      faceCardsContainer.innerHTML = cardsHTML;
      showToast('Found ' + detections.length + ' face(s)', 'success');
    }).catch(function(err) {
      analyzing.style.display = 'none';
      emptyState.style.display = 'block';
      emptyState.querySelector('p').textContent = 'Error: ' + err.message;
      showToast('Analysis error: ' + (err.message || 'unknown'), 'error');
    });
  }

  function getTopEmotion(expr) {
    var top = 'neutral', topVal = 0;
    for (var k in expr) { if (expr[k] > topVal) { topVal = expr[k]; top = k; } }
    return top;
  }
})();

/* ═══════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════ */
(function init() {
  renderLocalStorageHistory();
  checkBackend();
  // Remove mic dropdown since we don't use it
  var micSelect = document.getElementById('micSelect');
  if (micSelect) {
    var parent = micSelect.closest('.setting-item');
    if (parent) parent.style.display = 'none';
  }
  // Change detection mode to just "face" since voice is removed
  var modeSelect = document.getElementById('detectionMode');
  if (modeSelect) {
    modeSelect.innerHTML = '<option value="face" selected>Face Detection</option>';
  }
  // Update button text
  if (btnGrant) btnGrant.textContent = '📷 Enable Camera';
})();