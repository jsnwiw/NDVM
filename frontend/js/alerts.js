/* NDVM - Real-time Disaster Alerts & Radar Pulse Map Module */

let ndvmDisasterAlerts = [];
let ndvmCurrentTickerIndex = 0;
let ndvmTickerTimer = null;
let ndvmTickerIsPaused = false;
let ndvmAlertPulseLayer = null;
let ndvmAlertMarkersMap = {};
let ndvmRadarVisible = true;
let ndvmHudCollapsed = false;

// 알림 확인(읽음) 및 차단 상태 영구 보관 (localStorage)
const NDVM_CONFIRMED_ALERTS_KEY = 'ndvm_confirmed_alerts_v1';
const NDVM_MUTED_ALERTS_KEY = 'ndvm_muted_alerts_v1';

// 접속 시점에 이미 존재하던 알림 ID 집합 (진입 시 알림 팝업 차단용)
const ndvmInitialAlertIds = new Set();

// 1. 확인(읽음) 상태 관리 헬퍼
function getConfirmedAlertIds() {
  try {
    const raw = localStorage.getItem(NDVM_CONFIRMED_ALERTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function isAlertConfirmed(alertId) {
  if (!alertId) return false;
  const list = getConfirmedAlertIds();
  return list.includes(String(alertId));
}

function markAlertConfirmed(alertId, confirmed = true) {
  if (!alertId) return;
  const list = getConfirmedAlertIds();
  const idStr = String(alertId);
  let updated;
  if (confirmed) {
    if (!list.includes(idStr)) {
      updated = [idStr, ...list].slice(0, 300);
    } else {
      updated = list;
    }
  } else {
    updated = list.filter(id => id !== idStr);
  }
  try {
    localStorage.setItem(NDVM_CONFIRMED_ALERTS_KEY, JSON.stringify(updated));
  } catch (_) {}

  // 화면 UI 동기화 (티커, 모달, HUD, 지도 마커)
  renderAlertTickerUI();
  if (typeof window.__refreshAlertModal === 'function') {
    window.__refreshAlertModal();
  }
  if (document.getElementById('ndvm-live-radar-hud')) {
    renderLiveRadarHud();
  }
  if (window.ndvmLeafletMap && ndvmAlertPulseLayer) {
    initAlertsOnMap(window.ndvmLeafletMap);
  }
}

function markAllAlertsConfirmed() {
  const alerts = ndvmDisasterAlerts.length > 0 ? ndvmDisasterAlerts : NDVM_FALLBACK_ALERTS;
  const list = getConfirmedAlertIds();
  const idSet = new Set(list);
  alerts.forEach(a => {
    idSet.add(String(a.id));
    if (a.title) idSet.add(String(a.title));
  });
  try {
    localStorage.setItem(NDVM_CONFIRMED_ALERTS_KEY, JSON.stringify(Array.from(idSet).slice(0, 300)));
  } catch (_) {}

  // 열려있는 토스트 팝업 즉시 제거
  const t = document.getElementById('ndvm-alert-toast');
  if (t) t.remove();

  renderAlertTickerUI();
  if (typeof window.__refreshAlertModal === 'function') {
    window.__refreshAlertModal();
  }
  if (document.getElementById('ndvm-live-radar-hud')) {
    renderLiveRadarHud();
  }
  if (window.ndvmLeafletMap && ndvmAlertPulseLayer) {
    initAlertsOnMap(window.ndvmLeafletMap);
  }
}

function isToastsMuted() {
  return localStorage.getItem(NDVM_MUTED_ALERTS_KEY) === 'true';
}

function toggleMuteToasts() {
  const next = !isToastsMuted();
  localStorage.setItem(NDVM_MUTED_ALERTS_KEY, String(next));
  if (next) {
    const t = document.getElementById('ndvm-alert-toast');
    if (t) t.remove();
  }
  renderAlertTickerUI();
  if (typeof window.__refreshAlertModal === 'function') {
    window.__refreshAlertModal();
  }
  return next;
}

// 기본 실시간 재난문자 데이터셋 (전국 주요 재난 현황)
const NDVM_FALLBACK_ALERTS = [
  {
    id: "alert_2026_01",
    category: "호우",
    level: "긴급재난",
    sender: "서울특별시 / 기상청",
    title: "[호우경보] 서울 강남·서초 일대 집중호우 경보",
    message: "시간당 55mm 이상의 매우 강한 비가 지속되고 있습니다. 탄천·양재천 산책로와 지하차도 진입을 절대 금지하며, 반지하 및 저지대 주민은 즉시 안전한 고지대로 대피 바랍니다.",
    region: "서울특별시 강남구",
    sido: "서울특별시",
    sigungu: "강남구",
    lat: 37.4981,
    lng: 127.0276,
    timestamp: "방금 전 (14:10)",
    instruction: "하천변 및 지하차도 진입 금지, 저지대 거주민 즉시 대피",
    is_active: true
  },
  {
    id: "alert_2026_02",
    category: "산사태",
    level: "긴급재난",
    sender: "산림청",
    title: "[산사태경보] 강원 강릉시 산사태 경보 발령",
    message: "지속된 집중호우로 강릉시 전역에 산사태 경보가 발령되었습니다. 급경사지 인접 주민 및 산간 방문객은 즉시 마을회관 등 지정 대피소로 대피하십시오.",
    region: "강원특별자치도 강릉시",
    sido: "강원특별자치도",
    sigungu: "강릉시",
    lat: 37.7519,
    lng: 128.8761,
    timestamp: "18분 전 (13:56)",
    instruction: "산림 인접지 출입 금지 및 인근 대피시설 대피",
    is_active: true
  },
  {
    id: "alert_2026_03",
    category: "지진",
    level: "안전안내",
    sender: "기상청",
    title: "[지진속보] 경북 포항시 북구 해역 규모 3.4 지진 발생",
    message: "경북 포항시 북구 북쪽 9km 해역에서 규모 3.4 지진 발생. 낙하물에 주의하시고 여진 발생에 대비하여 머리를 보호하고 넓은 공터로 이동하세요.",
    region: "경상북도 포항시",
    sido: "경상북도",
    sigungu: "포항시",
    lat: 36.0821,
    lng: 129.3653,
    timestamp: "35분 전 (13:40)",
    instruction: "머리 보호 및 비상계단 이용 대피 (엘리베이터 탑승 금지)",
    is_active: true
  },
  {
    id: "alert_2026_04",
    category: "홍수",
    level: "긴급재난",
    sender: "금강홍수통제소",
    title: "[홍수주의보] 충남 당진시 당진천 수위 상승 홍수주의보",
    message: "당진천 수위가 급격히 상승하여 경계수위에 도달했습니다. 하천변 둔치 주차장 차량은 즉시 이동 조치하고 하천변 산책로 출입을 금지합니다.",
    region: "충청남도 당진시",
    sido: "충청남도",
    sigungu: "당진시",
    lat: 36.8931,
    lng: 126.6283,
    timestamp: "52분 전 (13:22)",
    instruction: "하천 둔치 차량 대피 및 저지대 침수 대비",
    is_active: true
  },
  {
    id: "alert_2026_05",
    category: "태풍",
    level: "안전안내",
    sender: "부산광역시 재난안전대책본부",
    title: "[강풍·풍랑주의보] 부산 해안가 월파 및 강풍 주의",
    message: "해안가를 중심으로 순간최대풍속 20m/s 내외의 강풍과 높은 너울성 파도가 발생하고 있습니다. 해안산책로, 방파제, 갯바위 출입을 통제합니다.",
    region: "부산광역시 해운대구",
    sido: "부산광역시",
    sigungu: "해운대구",
    lat: 35.1631,
    lng: 129.1636,
    timestamp: "1시간 전 (13:10)",
    instruction: "해안가 출입 통제 준수 및 시설물 결속 점검",
    is_active: true
  },
  {
    id: "alert_2026_06",
    category: "호우",
    level: "안전안내",
    sender: "광주광역시",
    title: "[호우주의보] 광주광역시 전역 호우주의보 발효",
    message: "광주 전역에 호우주의보가 발효 중입니다. 배수구 역류 및 지하차도 침수 위험이 있으니 차량 운행 시 감속하고 보행 안전에 유의하세요.",
    region: "광주광역시 서구",
    sido: "광주광역시",
    sigungu: "서구",
    lat: 35.1521,
    lng: 126.8900,
    timestamp: "1시간 30분 전 (12:45)",
    instruction: "상습 침수 도로 우회 및 보행 안전 유의",
    is_active: true
  },
  {
    id: "alert_2026_07",
    category: "호우",
    level: "긴급재난",
    sender: "대전광역시 재난안전대책본부",
    title: "[호우경보] 대전 유등천 수위 급상승 범람 위험 경보",
    message: "유등천 수위가 범람 위험수위에 근접하고 있습니다. 인근 하천변 산책로 및 저지대 주민은 즉시 안전한 고지대로 대피하십시오.",
    region: "대전광역시 중구",
    sido: "대전광역시",
    sigungu: "중구",
    lat: 36.3259,
    lng: 127.4215,
    timestamp: "2시간 전 (12:15)",
    instruction: "하천변 출입 금지 및 대전 중구 고지대 대피소 이용",
    is_active: true
  },
  {
    id: "alert_2026_08",
    category: "산사태",
    level: "긴급재난",
    sender: "산림청",
    title: "[산사태주의보] 경남 거제시 산사태 주의보 발령",
    message: "지속된 강우로 경남 거제시 산사태 주의보 발령. 급경사지 인접 지역 주민 및 통행객은 안전에 유의하시고 유사시 마을회관으로 대피하세요.",
    region: "경상남도 거제시",
    sido: "경상남도",
    sigungu: "거제시",
    lat: 34.8806,
    lng: 128.6211,
    timestamp: "2시간 30분 전 (11:45)",
    instruction: "산림 인접지 접근 자제 및 붕괴 징후 발견 시 119 신고",
    is_active: true
  },
  {
    id: "alert_2026_09",
    category: "홍수",
    level: "긴급재난",
    sender: "낙동강홍수통제소",
    title: "[홍수경보] 대구 신천 침수 위험 홍수경보 발령",
    message: "대구 신천 수위 급상승으로 하상도로 전면 통제 중입니다. 둔치 주차장 차량 소유주는 이동 조치 바랍니다.",
    region: "대구광역시 수성구",
    sido: "대구광역시",
    sigungu: "수성구",
    lat: 35.8582,
    lng: 128.6306,
    timestamp: "3시간 전 (11:15)",
    instruction: "신천 하상도로 진입 절대 금지 및 우회 도로 이용",
    is_active: true
  },
  {
    id: "alert_2026_10",
    category: "태풍",
    level: "긴급재난",
    sender: "제주특별자치도 재난본부",
    title: "[태풍경보] 제주 전역 태풍경보 발효 월파 대비",
    message: "최대순간풍속 30m/s 이상의 폭풍우가 몰아치고 있습니다. 방파제, 포구 출입을 일체 통제하며 외출을 삼가시기 바랍니다.",
    region: "제주특별자치도 제주시",
    sido: "제주특별자치도",
    sigungu: "제주시",
    lat: 33.4996,
    lng: 126.5312,
    timestamp: "3시간 30분 전 (10:45)",
    instruction: "외출 자제, 창문 결속 및 해안가 접근 절대 금지",
    is_active: true
  }
];

// 2. 재난문자 데이터 로드 (백엔드 연동 + 로컬 폴백)
async function fetchDisasterAlerts() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const base = typeof apiBase === 'function' ? apiBase() : (window.NDVM_API_BASE || 'http://127.0.0.1:8000');
    const response = await fetch(`${base}/api/disaster-alerts`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data && Array.isArray(data.items) && data.items.length > 0) {
      ndvmDisasterAlerts = data.items;
      ndvmDisasterAlerts.forEach(a => ndvmInitialAlertIds.add(String(a.id)));
      return ndvmDisasterAlerts;
    }
  } catch (err) {
    // 백엔드 미실행 시 로컬 내장 데이터 안전 사용
  }
  if (!ndvmDisasterAlerts || ndvmDisasterAlerts.length === 0) {
    ndvmDisasterAlerts = [...NDVM_FALLBACK_ALERTS];
  }
  ndvmDisasterAlerts.forEach(a => ndvmInitialAlertIds.add(String(a.id)));
  return ndvmDisasterAlerts;
}

// 3. 상단 재난문자 티커 바 렌더링
function renderAlertTickerUI() {
  const container = document.getElementById('ndvm-alert-ticker-container');
  if (!container) return;

  const alerts = ndvmDisasterAlerts.length > 0 ? ndvmDisasterAlerts : NDVM_FALLBACK_ALERTS;
  const current = alerts[ndvmCurrentTickerIndex] || alerts[0];
  const isEmergency = current.level === '긴급재난' || current.level === '위급재난';
  const confirmed = isAlertConfirmed(current.id);
  const muted = isToastsMuted();

  container.innerHTML = `
    <aside class="ndvm-ticker-bar ${isEmergency ? 'emergency' : 'safety'} ${confirmed ? 'is-confirmed' : ''}" role="alert" aria-live="assertive">
      <div class="ticker-inner">
        <div class="ticker-badge">
          <span class="ticker-beacon ${confirmed ? 'beacon-off' : ''}" aria-hidden="true"></span>
          <strong>${esc(current.level || '긴급재난')}</strong>
          <span class="ticker-count">${ndvmCurrentTickerIndex + 1}/${alerts.length}</span>
        </div>
        
        <div class="ticker-content" id="ticker-alert-item" title="클릭 시 지도에서 위치를 확인하고 확인 완료로 처리합니다.">
          <span class="ticker-tag">${esc(current.category)}</span>
          <span class="ticker-title">${esc(current.title)}</span>
          <span class="ticker-time">${esc(current.timestamp)}</span>
          ${confirmed 
            ? '<span class="ticker-confirmed-label" style="display:inline-flex;align-items:center;background:#059669;color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;margin-left:6px;">✓ 확인됨</span>'
            : '<span class="ticker-hint">지도 보기 ›</span>'}
        </div>

        <div class="ticker-controls">
          <button type="button" class="ticker-btn-ack ${confirmed ? 'confirmed' : ''}" id="ticker-ack-current" title="${confirmed ? '확인된 알림입니다 (클릭 시 확인 취소)' : '이 재난문자를 확인 처리합니다 (알림 해제)'}">
            ${confirmed ? '✓ 확인완료' : '✓ 확인'}
          </button>
          <button type="button" class="ticker-btn" id="ticker-prev" aria-label="이전 재난문자">‹</button>
          <button type="button" class="ticker-btn" id="ticker-toggle-play" aria-label="${ndvmTickerIsPaused ? '재생' : '일시정지'}">
            ${ndvmTickerIsPaused ? '▶' : '❚❚'}
          </button>
          <button type="button" class="ticker-btn" id="ticker-next" aria-label="다음 재난문자">›</button>
          <button type="button" class="ticker-list-btn" id="ticker-open-modal">
            <span>재난문자 보관함</span>
            <strong class="count-pill">${alerts.length}</strong>
          </button>
          <button type="button" class="ticker-mute-btn ${muted ? 'muted' : ''}" id="ticker-toggle-mute" title="${muted ? '알림 팝업 음소거 해제' : '알림 팝업 전체 음소거'}">
            ${muted ? '🔕 음소거 중' : '🔔 알림 켜짐'}
          </button>
        </div>
      </div>
    </aside>
  `;

  // 티커 이벤트 리스너 연결
  const alertItemEl = document.getElementById('ticker-alert-item');
  if (alertItemEl) {
    alertItemEl.onclick = () => {
      markAlertConfirmed(current.id, true);
      focusDisasterAlert(current.id);
    };
  }

  const ackBtn = document.getElementById('ticker-ack-current');
  if (ackBtn) {
    ackBtn.onclick = (e) => {
      e.stopPropagation();
      markAlertConfirmed(current.id, !confirmed);
    };
  }

  const muteBtn = document.getElementById('ticker-toggle-mute');
  if (muteBtn) {
    muteBtn.onclick = (e) => {
      e.stopPropagation();
      toggleMuteToasts();
    };
  }

  const prevBtn = document.getElementById('ticker-prev');
  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      navigateTicker(-1);
    };
  }

  const nextBtn = document.getElementById('ticker-next');
  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      navigateTicker(1);
    };
  }

  const playBtn = document.getElementById('ticker-toggle-play');
  if (playBtn) {
    playBtn.onclick = (e) => {
      e.stopPropagation();
      toggleTickerPlay();
    };
  }

  const modalBtn = document.getElementById('ticker-open-modal');
  if (modalBtn) {
    modalBtn.onclick = (e) => {
      e.stopPropagation();
      openDisasterAlertModal();
    };
  }
}

function startTickerTimer() {
  stopTickerTimer();
  if (ndvmTickerIsPaused) return;
  ndvmTickerTimer = setInterval(() => {
    navigateTicker(1, true);
  }, 4800);
}

function stopTickerTimer() {
  if (ndvmTickerTimer) {
    clearInterval(ndvmTickerTimer);
    ndvmTickerTimer = null;
  }
}

function toggleTickerPlay() {
  ndvmTickerIsPaused = !ndvmTickerIsPaused;
  if (ndvmTickerIsPaused) {
    stopTickerTimer();
  } else {
    startTickerTimer();
  }
  renderAlertTickerUI();
}

function navigateTicker(direction, fromAuto = false) {
  const alerts = ndvmDisasterAlerts.length > 0 ? ndvmDisasterAlerts : NDVM_FALLBACK_ALERTS;
  ndvmCurrentTickerIndex = (ndvmCurrentTickerIndex + direction + alerts.length) % alerts.length;
  renderAlertTickerUI();
  if (!fromAuto && !ndvmTickerIsPaused) {
    startTickerTimer();
  }
}

// 4. 지도 상의 펄스(Pulse) 마커 초기화 & 렌더링
function initAlertsOnMap(map) {
  if (!map || !window.L) return;

  if (ndvmAlertPulseLayer) {
    map.removeLayer(ndvmAlertPulseLayer);
  }
  ndvmAlertPulseLayer = L.layerGroup();
  ndvmAlertMarkersMap = {};

  const alerts = ndvmDisasterAlerts.length > 0 ? ndvmDisasterAlerts : NDVM_FALLBACK_ALERTS;

  alerts.forEach(alert => {
    if (!alert.lat || !alert.lng) return;

    const isConfirmed = isAlertConfirmed(alert.id);
    const isEmergency = alert.level === '긴급재난' || alert.level === '위급재난';
    const markerTypeClass = isConfirmed ? 'pulse-confirmed' : (isEmergency ? 'pulse-danger' : 'pulse-warning');

    const getIcon = (cat) => {
      if (cat === '호우') return '🌧';
      if (cat === '산사태') return '⛰';
      if (cat === '지진') return '⚡';
      if (cat === '태풍') return '🌀';
      if (cat === '홍수') return '🌊';
      return '⚠️';
    };

    // 커스텀 펄스 애니메이션 DOM 아이콘
    const icon = L.divIcon({
      className: 'ndvm-radar-marker-wrap',
      html: `
        <div class="ndvm-radar-pulse ${markerTypeClass}" data-alert-id="${esc(alert.id)}">
          <div class="radar-ring ring-1"></div>
          <div class="radar-ring ring-2"></div>
          <div class="radar-dot">
            <span class="radar-icon">${getIcon(alert.category)}</span>
          </div>
          <div class="radar-label">${isConfirmed ? '✓ 확인완료' : esc(alert.category)}: ${esc(alert.sigungu || alert.region)}</div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22]
    });

    const marker = L.marker([alert.lat, alert.lng], {
      icon: icon,
      title: `${alert.level}: ${alert.title}`,
      zIndexOffset: isConfirmed ? 900 : 1200
    });

    // 팝업 내용
    const popupHtml = `
      <div class="ndvm-alert-popup ${isEmergency ? 'is-danger' : 'is-warning'}">
        <div class="alert-popup-head">
          <span class="badge ${isEmergency ? 'danger' : 'warning'}">${esc(alert.level)}</span>
          <span class="alert-popup-category">${esc(alert.category)}</span>
          <span class="alert-popup-time">${esc(alert.timestamp)}</span>
          ${isConfirmed ? '<span class="badge confirmed" style="background:#059669;color:#fff;">✓ 확인완료</span>' : ''}
        </div>
        <h4 class="alert-popup-title">${esc(alert.title)}</h4>
        <div class="alert-popup-sender">발령: ${esc(alert.sender)}</div>
        <p class="alert-popup-msg">${esc(alert.message)}</p>
        <div class="alert-popup-inst">
          <strong>🚨 행동요령:</strong> ${esc(alert.instruction)}
        </div>
        <div class="alert-popup-actions" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
          <button type="button" class="btn-popup-shelter" onclick="searchNearShelter('${esc(alert.sigungu || alert.region)}')">
            🏢 대피시설 찾기
          </button>
          <button type="button" class="btn-popup-ack" onclick="markAlertConfirmed('${esc(alert.id)}', ${!isConfirmed})" style="padding:4px 8px;font-size:11px;font-weight:700;border-radius:4px;border:none;cursor:pointer;background:${isConfirmed ? '#64748b' : '#059669'};color:#fff;">
            ${isConfirmed ? '✓ 확인완료 (해제)' : '✓ 확인 (알림끄기)'}
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, {
      maxWidth: 340,
      minWidth: 280,
      className: 'ndvm-radar-popup-custom'
    });

    marker.addTo(ndvmAlertPulseLayer);
    ndvmAlertMarkersMap[alert.id] = marker;
  });

  if (ndvmRadarVisible) {
    ndvmAlertPulseLayer.addTo(map);
  }

  // 배지 카운트 업데이트
  const countBadge = document.getElementById('radar-count-badge');
  if (countBadge) {
    countBadge.textContent = String(alerts.length);
  }

  // 지도 위 실시간 알림 HUD 위젯 렌더링
  renderLiveRadarHud();
}

// 5. 지도 위에 띄우는 실시간 재난문자 플로팅 HUD (Live Alert HUD)
function renderLiveRadarHud() {
  const mapContainer = document.getElementById('ndvm-map');
  if (!mapContainer) return;

  const parent = mapContainer.parentElement || mapContainer;
  let hudEl = document.getElementById('ndvm-live-radar-hud');

  if (!hudEl) {
    hudEl = document.createElement('div');
    hudEl.id = 'ndvm-live-radar-hud';
    hudEl.className = 'ndvm-live-radar-hud';
    parent.appendChild(hudEl);
  }

  const alerts = ndvmDisasterAlerts.length > 0 ? ndvmDisasterAlerts : NDVM_FALLBACK_ALERTS;
  const emergencyCount = alerts.filter(a => a.level === '긴급재난' || a.level === '위급재난').length;
  const warningCount = alerts.length - emergencyCount;
  const confirmedCount = alerts.filter(a => isAlertConfirmed(a.id)).length;
  const recentAlerts = alerts.slice(0, 4);

  hudEl.className = `ndvm-live-radar-hud ${ndvmHudCollapsed ? 'collapsed' : ''}`;

  hudEl.innerHTML = `
    <div class="radar-hud-header" id="radar-hud-toggle-btn" title="${ndvmHudCollapsed ? '클릭하여 펼치기' : '클릭하여 접기'}">
      <div class="radar-hud-title-wrap">
        <span class="radar-live-beacon" aria-hidden="true"></span>
        <span class="radar-hud-title">실시간 재난문자 현황</span>
        <span class="radar-hud-badge">${alerts.length}</span>
      </div>
      <div class="radar-hud-actions">
        <button type="button" class="radar-hud-btn-mini" id="radar-hud-min-btn" aria-label="접기/펼치기">
          ${ndvmHudCollapsed ? '▼' : '▲'}
        </button>
      </div>
    </div>

    <div class="radar-hud-body">
      <!-- 재난 집계 현황 통계 -->
      <div class="radar-scope-container">
        <div class="radar-scope-stats">
          <div class="stat-row">
            <span class="stat-label">수신 상태:</span>
            <span class="stat-val ok">● 실시간 감시 중</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">🚨 긴급재난:</span>
            <span class="stat-val danger">${emergencyCount}건</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">⚠️ 안전안내:</span>
            <span class="stat-val warning">${warningCount}건</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">✓ 확인완료:</span>
            <span class="stat-val" style="color:#10b981;">${confirmedCount}건</span>
          </div>
        </div>
      </div>

      <!-- 실시간 재난 피드 목록 -->
      <div class="radar-feed-title">
        <span>최근 수신 재난문자</span>
        <span style="font-size:9px;color:#10b981;">LIVE 갱신</span>
      </div>
      <div class="radar-feed-list">
        ${recentAlerts.map(item => {
          const isEmer = item.level === '긴급재난' || item.level === '위급재난';
          const isConf = isAlertConfirmed(item.id);
          return `
            <div class="radar-feed-item ${isEmer ? 'danger' : ''} ${isConf ? 'confirmed' : ''}" onclick="markAlertConfirmed('${esc(item.id)}', true); focusDisasterAlert('${esc(item.id)}')" title="클릭 시 지도 이동 및 확인 처리">
              <span class="radar-feed-icon">${item.category === '호우' ? '🌧' : item.category === '산사태' ? '⛰' : item.category === '지진' ? '⚡' : item.category === '태풍' ? '🌀' : '⚠️'}</span>
              <div class="radar-feed-content">
                <div class="radar-feed-top">
                  <span class="radar-feed-region">${esc(item.region || item.sigungu)}</span>
                  <span class="radar-feed-time">${esc(item.timestamp)}</span>
                  ${isConf ? '<span style="font-size:9px;color:#10b981;font-weight:700;">✓ 확인됨</span>' : ''}
                </div>
                <div class="radar-feed-msg">${esc(item.title)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="radar-hud-footer">
        <button type="button" class="radar-hud-btn-all" onclick="openDisasterAlertModal()" style="width:100%;">재난문자 보관함 전체보기 (${alerts.length})</button>
      </div>
    </div>
  `;

  // 접기/펼치기 핸들러
  const headerBtn = document.getElementById('radar-hud-toggle-btn');
  if (headerBtn) {
    headerBtn.onclick = () => {
      ndvmHudCollapsed = !ndvmHudCollapsed;
      renderLiveRadarHud();
    };
  }
}

// 6. 토스트 알림 팝업 (신규 알림 전용)
function showDisasterToast(alert) {
  if (!alert) return;

  // 1. 전체 알림 팝업이 음소거 상태인 경우 알림 안 옴
  if (isToastsMuted()) return;

  // 2. 사용자가 이미 확인(읽음)한 알림인 경우 알림 안 옴
  if (isAlertConfirmed(alert.id) || isAlertConfirmed(alert.title)) return;

  // 3. 사이트에 들어왔을 때 이미 존재하던 기존 알림인 경우 팝업 알림 안 옴
  if (ndvmInitialAlertIds.has(String(alert.id))) return;

  let existingToast = document.getElementById('ndvm-alert-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.id = 'ndvm-alert-toast';
  const isEmergency = alert.level === '긴급재난' || alert.level === '위급재난';
  toast.className = `ndvm-alert-toast ${isEmergency ? 'danger' : 'warning'}`;

  toast.innerHTML = `
    <div class="toast-top">
      <div class="toast-badge-wrap">
        <span class="toast-badge ${isEmergency ? '' : 'warning'}">🚨 ${esc(alert.level)}</span>
        <span class="toast-time">${esc(alert.timestamp)}</span>
      </div>
      <button type="button" class="toast-close" onclick="markAlertConfirmed('${esc(alert.id)}'); this.closest('.ndvm-alert-toast').remove()" aria-label="확인하고 닫기" title="확인하고 다시 알리지 않음">×</button>
    </div>
    <h4 class="toast-title">${esc(alert.title)}</h4>
    <p class="toast-body">${esc(alert.message)}</p>
    <div class="toast-actions-wrap" style="display:flex;gap:6px;justify-content:flex-end;margin-top:6px;">
      <button type="button" class="toast-btn-ack" onclick="markAlertConfirmed('${esc(alert.id)}'); this.closest('.ndvm-alert-toast').remove();" title="이 재난문자를 확인 처리하고 다시 알림이 오지 않게 합니다.">
        ✓ 확인 (다시 알리지 않음)
      </button>
      <button type="button" class="toast-btn" onclick="markAlertConfirmed('${esc(alert.id)}'); focusDisasterAlert('${esc(alert.id)}'); this.closest('.ndvm-alert-toast').remove();">
        지도에서 보기 →
      </button>
    </div>
  `;

  document.body.appendChild(toast);

  // 8초 후 자동 소멸
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 350);
    }
  }, 8000);
}

// 모의 수신 기능 비활성화 (사용자 요청으로 제거됨)
function simulateIncomingAlert() {
  // 모의 수신 기능 제거됨 (실제 수신 또는 공식 데이터만 유지)
}

// 7. 특정 알림 위치로 지도 시점 이동 및 펄스 강조
function focusDisasterAlert(alertId) {
  const alerts = ndvmDisasterAlerts.length > 0 ? ndvmDisasterAlerts : NDVM_FALLBACK_ALERTS;
  const target = alerts.find(a => a.id === alertId) || alerts[0];
  if (!target) return;

  // 확인 처리
  markAlertConfirmed(target.id, true);

  // 지도가 아닌 다른 화면에 있다면 지도 화면으로 전환
  if (state.page !== 'map') {
    navigate('map');
  }

  const performFly = () => {
    const map = window.ndvmLeafletMap;
    if (!map) return;

    if (!ndvmRadarVisible) {
      toggleAlertPulseLayer();
    }

    map.flyTo([target.lat, target.lng], 11, {
      duration: 1.2,
      easeLinearity: 0.25
    });

    setTimeout(() => {
      const marker = ndvmAlertMarkersMap[target.id];
      if (marker) {
        marker.openPopup();
      }
    }, 1250);
  };

  if (window.ndvmLeafletMap) {
    performFly();
  } else {
    setTimeout(performFly, 350);
  }
}

// 8. 대피시설 검색으로 즉시 연결
function searchNearShelter(regionName) {
  state.shelterQuery = regionName.replace(/특별시|광역시|특별자치도/g, '').trim();
  navigate('shelter');
}

// 9. 펄스 오버레이 켜기/끄기 토글
function toggleAlertPulseLayer() {
  ndvmRadarVisible = !ndvmRadarVisible;
  const map = window.ndvmLeafletMap;
  const toggleBtn = document.getElementById('btn-toggle-radar');

  if (map && ndvmAlertPulseLayer) {
    if (ndvmRadarVisible) {
      if (!map.hasLayer(ndvmAlertPulseLayer)) {
        ndvmAlertPulseLayer.addTo(map);
      }
    } else {
      if (map.hasLayer(ndvmAlertPulseLayer)) {
        map.removeLayer(ndvmAlertPulseLayer);
      }
    }
  }

  if (toggleBtn) {
    toggleBtn.classList.toggle('active', ndvmRadarVisible);
    toggleBtn.setAttribute('aria-pressed', String(ndvmRadarVisible));
  }

  const hud = document.getElementById('ndvm-live-radar-hud');
  if (hud) {
    hud.style.display = ndvmRadarVisible ? 'block' : 'none';
  }
}

// 10. 긴급재난문자 보관함 모달 (전체보기 & 필터링 & 전체 확인 기능)
function openDisasterAlertModal() {
  let modalEl = document.getElementById('ndvm-alert-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'ndvm-alert-modal';
    modalEl.className = 'ndvm-modal-backdrop';
    document.body.appendChild(modalEl);
  }

  const alerts = ndvmDisasterAlerts.length > 0 ? ndvmDisasterAlerts : NDVM_FALLBACK_ALERTS;

  let currentCategory = '전체';
  let showUnconfirmedOnly = false;

  const renderModalContent = () => {
    let filtered = currentCategory === '전체'
      ? alerts
      : alerts.filter(a => a.category.includes(currentCategory));

    if (showUnconfirmedOnly) {
      filtered = filtered.filter(a => !isAlertConfirmed(a.id));
    }

    const categories = ['전체', '호우', '산사태', '지진', '홍수', '태풍'];
    const confirmedCount = alerts.filter(a => isAlertConfirmed(a.id)).length;
    const unconfirmedCount = alerts.length - confirmedCount;
    const isMuted = isToastsMuted();

    modalEl.innerHTML = `
      <div class="ndvm-modal-window" role="dialog" aria-labelledby="alert-modal-title" aria-modal="true">
        <header class="ndvm-modal-header">
          <div>
            <span class="eyebrow">REAL-TIME DISASTER BROADCAST</span>
            <h2 id="alert-modal-title">🚨 전국 실시간 긴급재난문자 보관함</h2>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button type="button" class="btn btn-ack-all" id="modal-ack-all" style="font-size:11px;padding:5px 10px;background:#059669;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;">
              ✓ 전체 알림 확인(읽음) 처리
            </button>
            <button type="button" class="btn ${isMuted ? 'muted' : ''}" id="modal-mute-toggle" style="font-size:11px;padding:5px 10px;background:#334155;color:#fff;border:none;border-radius:6px;cursor:pointer;">
              ${isMuted ? '🔕 팝업 음소거 중' : '🔔 팝업 알림 켜짐'}
            </button>
            <button type="button" class="modal-close-btn" id="modal-close-x" aria-label="닫기">×</button>
          </div>
        </header>

        <div class="modal-filter-tabs" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            ${categories.map(cat => `
              <button type="button" class="modal-tab ${currentCategory === cat ? 'active' : ''}" data-cat="${cat}">
                ${cat} ${cat === '전체' ? `(${alerts.length})` : ''}
              </button>
            `).join('')}
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button type="button" class="btn-filter-status ${showUnconfirmedOnly ? 'active' : ''}" id="toggle-unconfirmed-filter" style="font-size:11px;padding:4px 9px;border-radius:6px;border:1px solid #475569;background:${showUnconfirmedOnly ? '#dc2626' : '#1e293b'};color:#fff;cursor:pointer;">
              미확인 알림만 보기 (${unconfirmedCount})
            </button>
          </div>
        </div>

        <div class="ndvm-modal-body">
          <div class="alert-cards-grid">
            ${filtered.length === 0 ? `
              <div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:#94a3b8;">
                <p style="font-size:15px;font-weight:600;margin-bottom:6px;">해당 조건의 재난문자가 없습니다.</p>
                <small>모든 알림을 확인했거나 필터 조건에 일치하는 항목이 없습니다.</small>
              </div>
            ` : filtered.map(item => {
              const isEmer = item.level === '긴급재난' || item.level === '위급재난';
              const isConf = isAlertConfirmed(item.id);
              return `
                <article class="alert-card ${isEmer ? 'danger' : 'warning'} ${isConf ? 'is-confirmed' : ''}">
                  <div class="alert-card-top">
                    <span class="badge ${isEmer ? 'danger' : 'warning'}">${esc(item.level)}</span>
                    <span class="alert-card-category">${esc(item.category)}</span>
                    <span class="alert-card-time">${esc(item.timestamp)}</span>
                    ${isConf ? '<span class="badge confirmed" style="background:#059669;color:#fff;margin-left:auto;">✓ 확인완료</span>' : ''}
                  </div>
                  <h3 class="alert-card-title">${esc(item.title)}</h3>
                  <div class="alert-card-sender">발송처: ${esc(item.sender)} · 대상: ${esc(item.region)}</div>
                  <p class="alert-card-msg">${esc(item.message)}</p>
                  <div class="alert-card-action" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                    <span class="alert-card-inst" style="flex:1;">💡 ${esc(item.instruction)}</span>
                    <div style="display:flex;gap:6px;">
                      <button type="button" class="btn btn-toggle-card-ack" data-alert-id="${esc(item.id)}" style="font-size:11px;padding:5px 9px;border-radius:6px;border:1px solid #475569;background:${isConf ? '#334155' : '#059669'};color:#fff;cursor:pointer;">
                        ${isConf ? '확인 취소' : '✓ 확인 완료'}
                      </button>
                      <button type="button" class="btn primary btn-fly-map" data-alert-id="${esc(item.id)}">
                        지도에서 보기 →
                      </button>
                    </div>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </div>

        <footer class="ndvm-modal-footer">
          <span>출처: 행정안전부 국민재난안전포털 재난문자방송 · 실시간 갱신 · 확인된 알림은 중복 팝업 차단</span>
          <button type="button" class="btn" id="modal-close-foot">닫기</button>
        </footer>
      </div>
    `;

    // 이벤트 리스너 바인딩
    modalEl.querySelectorAll('.modal-tab').forEach(btn => {
      btn.onclick = () => {
        currentCategory = btn.dataset.cat;
        renderModalContent();
      };
    });

    const unconfBtn = document.getElementById('toggle-unconfirmed-filter');
    if (unconfBtn) {
      unconfBtn.onclick = () => {
        showUnconfirmedOnly = !showUnconfirmedOnly;
        renderModalContent();
      };
    }

    const ackAllBtn = document.getElementById('modal-ack-all');
    if (ackAllBtn) {
      ackAllBtn.onclick = () => {
        markAllAlertsConfirmed();
        renderModalContent();
      };
    }

    const muteBtn = document.getElementById('modal-mute-toggle');
    if (muteBtn) {
      muteBtn.onclick = () => {
        toggleMuteToasts();
        renderModalContent();
      };
    }

    modalEl.querySelectorAll('.btn-toggle-card-ack').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.alertId;
        markAlertConfirmed(id, !isAlertConfirmed(id));
        renderModalContent();
      };
    });

    modalEl.querySelectorAll('.btn-fly-map').forEach(btn => {
      btn.onclick = () => {
        closeDisasterAlertModal();
        focusDisasterAlert(btn.dataset.alertId);
      };
    });

    const closeBtnX = document.getElementById('modal-close-x');
    if (closeBtnX) closeBtnX.onclick = closeDisasterAlertModal;

    const closeBtnFoot = document.getElementById('modal-close-foot');
    if (closeBtnFoot) closeBtnFoot.onclick = closeDisasterAlertModal;
  };

  window.__refreshAlertModal = renderModalContent;
  renderModalContent();
  modalEl.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeDisasterAlertModal() {
  const modalEl = document.getElementById('ndvm-alert-modal');
  if (modalEl) {
    modalEl.classList.remove('open');
  }
  document.body.classList.remove('modal-open');
}

// 11. 모듈 초기화 (앱 로드시 실행)
async function initNdvmAlertsSystem() {
  await fetchDisasterAlerts();
  renderAlertTickerUI();
  startTickerTimer();
}

// 전역 바인딩
window.initNdvmAlertsSystem = initNdvmAlertsSystem;
window.initAlertsOnMap = initAlertsOnMap;
window.focusDisasterAlert = focusDisasterAlert;
window.toggleAlertPulseLayer = toggleAlertPulseLayer;
window.openDisasterAlertModal = openDisasterAlertModal;
window.closeDisasterAlertModal = closeDisasterAlertModal;
window.searchNearShelter = searchNearShelter;
window.renderLiveRadarHud = renderLiveRadarHud;
window.simulateIncomingAlert = simulateIncomingAlert;
window.markAlertConfirmed = markAlertConfirmed;
window.markAllAlertsConfirmed = markAllAlertsConfirmed;
window.isAlertConfirmed = isAlertConfirmed;
window.toggleMuteToasts = toggleMuteToasts;
window.isToastsMuted = isToastsMuted;
