/* NDVM - Content Pages (Home, Disaster Analysis, Safety Guide, About, Help) */

function homePage() {
  const faq = [
    ['메뉴는 어디에 있나요?', '화면 오른쪽 위의 메뉴 버튼을 누르면 지도, 강수량, 대피시설, 안전동행 등의 기능을 선택할 수 있습니다.'],
    ['취약도 점수는 실시간 위험을 의미하나요?', '아니요. 과거 자료를 바탕으로 계산한 교육용 시범 지표이며 실제 재난 발생 가능성이나 정부의 공식 위험등급이 아닙니다.'],
    ['안전동행에서 만든 문서가 자동으로 제출되나요?', '아니요. 신고서는 직접 복사하거나 저장해 관할 기관의 공식 접수 창구에 제출해야 합니다.'],
    ['구호물자 매칭으로 실제 물품을 주고받을 수 있나요?', '현재는 예시 데이터와 사용 중인 기기에서 등록한 목록끼리 비교하는 시연 기능입니다. 실제 지원 연결은 이루어지지 않습니다.'],
    ['비상용품 관리함은 어떻게 활용하나요?', '물품 이름과 현재 수량, 목표 수량, 유통기한 또는 점검일을 등록하면 보충할 목록을 따로 내보낼 수 있습니다. 기록은 사용 중인 기기에 저장됩니다.'],
    ['안심 그룹으로 인터넷 없이 자동 메시지를 보낼 수 있나요?', '현재 웹 버전은 자동 블루투스 전파가 아닙니다. 미리 사이트를 열어 두고 QR·전달 코드·파일을 사람 사이에 직접 교환하는 오프라인 릴레이 시연입니다. 전달이나 수신을 보장하지 않습니다.'],
    ['인터넷이 없어도 이용할 수 있나요?', '비상용품 관리함과 안심 그룹은 브라우저에 저장된 데이터를 사용합니다. 사이트의 오프라인 캐시는 인터넷 연결 중 한 번 열고 준비해야 하며, HTTPS 또는 localhost에서 지원됩니다. 지도 배경과 공공데이터 조회는 인터넷이나 별도 서버가 필요할 수 있습니다.']
  ];
  return `<div class="home">
    <section class="hero"><span class="hero-tag">NATURAL DISASTER VULNERABILITY MAP</span>
      <h1>재난을 이해하고,<br><em>안전을 준비하다.</em></h1>
      <p>우리 지역의 자연재해 정보를 더 쉽고 명확하게.<br>위험을 살펴보고, 필요한 안전 도구도 직접 이용하세요.</p>
      <div class="hero-buttons">
        <button type="button" data-page="map" class="btn primary">취약도 지도 보기 <span aria-hidden="true">→</span></button>
        <button type="button" data-page="action" class="btn">안전동행 바로가기 <span aria-hidden="true">›</span></button>
      </div>
    </section>
    <div class="home-bottom">
      <span>정보는 단순하게, 필요한 기능은 메뉴에서.</span>
      <button type="button" class="text-link" data-page="map">재해 분석 & 취약도 지도 살펴보기 →</button>
    </div>
    <section class="home-help" id="home-help" aria-labelledby="home-help-heading">
      <div class="home-help-intro"><span class="eyebrow">HELP & CONTACT</span><h2 id="home-help-heading">이용 안내 및 문의</h2><p>자주 묻는 질문을 확인하거나 문의할 내용을 정리할 수 있습니다.</p></div>
      <div class="home-help-grid">
        <div class="home-help-faq"><h3>자주 묻는 질문</h3>
          ${faq.map(([q,a]) => `<details class="home-help-item"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
        </div>
        <div class="home-help-contact"><h3>문의 내용 작성</h3><p>궁금한 점이나 의견을 적으면 문의 내용을 복사할 수 있습니다.</p>
          <label for="home-inquiry">문의 내용</label>
          <textarea id="home-inquiry" rows="6" maxlength="1000" placeholder="문의나 개선 의견을 입력하세요."></textarea>
          <button type="button" id="home-inquiry-copy" class="btn primary">문의 내용 복사</button>
          <p id="home-inquiry-status" role="status" aria-live="polite" class="safety-hint">※ 실제 문의는 학교 프로젝트 담당자에게 별도로 전달해야 합니다. 이 버튼은 메시지를 전송하지 않습니다.</p>
        </div>
      </div>
    </section>
  </div>`;
}

function disasterPage() {
  return mapPage();
}

function guidePage() {
  const [title, ...items] = GUIDES[state.guideIndex];
  return `<div class="page narrow">${head('06 / SAFETY GUIDE', '재난 행동요령', '재난 유형별 대피 원칙과 비상시 행동 요령을 확인하세요.')}
    <div class="chips" role="group" aria-label="재난 유형 선택">${GUIDES.map(([name], i) => `<button type="button" class="chip ${state.guideIndex === i ? 'active' : ''}" data-guide="${i}">${esc(name)}</button>`).join('')}</div>
    <section class="feature panel"><div class="feature-letter" aria-hidden="true">G</div><div><span class="little-label">SAFETY PRINCIPLES</span><h2>${esc(title)} 발생 시 기본 원칙</h2><p>신속한 상황 판단과 침착한 대응이 가장 중요합니다.</p></div></section>
    <h3 class="section-label">단계별 행동요령</h3>
    <div class="card-grid">${items.map((text, i) => `<article class="card panel"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>단계 ${i + 1}</h3><p>${esc(text)}</p></article>`).join('')}</div>
    ${note('※ 본 행동요령은 행정안전부 국민안전포털의 표준 재난대응 지침을 기반으로 작성되었습니다.')}
  </div>`;
}

function aboutPage() {
  return `<div class="page narrow">${head('07 / ABOUT PROJECT', '프로젝트 소개', '자연재해 정보를 쉽게 탐색할 수 있는 데이터 기반 정보 서비스입니다.')}
    <section class="about-hero panel"><span class="big-n" aria-hidden="true">N</span><div><span class="little-label">PROJECT NDVM</span><h2>자연재해 취약지역 지도 대시보드</h2><p>지역별 위험요인과 재난 안전정보를 찾아보기 쉽게 전달하기 위해 기획한 교육용 웹 프로젝트입니다.</p></div></section>
    <div class="card-grid two">
      <article class="card panel"><span class="num">PURPOSE</span><h3>프로젝트 목표</h3><p>자연재해 관련 공공데이터를 사용자가 쉽게 탐색할 수 있도록 구성</p></article>
      <article class="card panel"><span class="num">DESIGN</span><h3>UI/UX 설계 원칙</h3><p>간단한 홈화면, 8개 독립 메뉴, 일관된 화면 구성과 넓은 여백</p></article>
    </div>
    <section class="timeline panel">
      <h2>개발 일정</h2>
      <div class="timeline-row"><b>11월 9일</b><strong>2차 중간점검</strong><span>UI 구조 및 주요 화면 시연</span></div>
      <div class="timeline-row"><b>11월 말</b><strong>최종 발표</strong><span>기능 연동 및 사용성 개선</span></div>
    </section>
    ${note('※ 실제 공공데이터 출처: 행정안전부 재해연보, 기상청 ASOS 관측망, 산림청 산사태정보, 공공데이터포털(data.go.kr, odcloud.kr).')}
  </div>`;
}

const NDVM_INQUIRIES_KEY = 'ndvm_user_inquiries_v1';

function getSavedInquiries() {
  try {
    const raw = localStorage.getItem(NDVM_INQUIRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveInquiries(list) {
  try {
    localStorage.setItem(NDVM_INQUIRIES_KEY, JSON.stringify(list));
  } catch (_) {}
}

function helpPage() {
  const faqs = [
    ['다른 재해 유형 및 분석 지도는 어떻게 확인하나요?', '상단 헤더의 [전체 메뉴] 버튼 또는 화면 상단의 재해 칩을 선택하면 침수·홍수, 산사태, 태풍, 폭염, 폭설, 가뭄, 지진 등 7개 재해별 취약도 지도로 즉시 전환됩니다.'],
    ['지도에 표시되는 취약도 등급의 기준은 무엇인가요?', '행정안전부 재해연보의 과거 시·군·구별 인명·재산 피해 통계와 기상청 관측망 데이터를 종합하여 0~100점의 정량화 지수로 산출한 등급(낮음/보통/높음/매우높음)입니다.'],
    ['대피시설 위치와 상세 정보는 어디서 찾나요?', '메뉴의 [대피시설 조회]에서 현재 위치나 지역명(예: 종로, 해운대)을 검색하면 인근 지진옥외대피소, 민방위 대피시설, 무더위쉼터를 확인하고 길찾기 안내를 받을 수 있습니다.'],
    ['인터넷 연결이 불안정하거나 끊겨도 실행되나요?', '네. NDVM은 서비스 워커(PWA) 오프라인 캐시와 내장 데이터베이스(Fallback Engine)를 탑재하고 있어 오프라인 상태에서도 지도, 행동요령, 비상용품 관리함 등이 100% 동작합니다.'],
    ['재난문자 펄스 기능은 어떻게 사용하나요?', '상단 속보 티커 바 및 지도 화면에서 실시간 긴급재난문자 발생지를 파동 애니메이션으로 시각화합니다. 확인한 재난문자는 [✓ 확인] 버튼을 누르면 더 이상 중복 팝업되지 않습니다.'],
    ['작성한 비상 연락 카드나 위험 신고서는 저장되나요?', '[안전동행 5대 도구]에서 작성한 위험요소 신고서는 TXT 파일 저장 및 인쇄가 가능하며, 비상 연락 카드는 스마트폰 저장용 PNG 이미지로 즉시 내려받을 수 있습니다.']
  ];

  return `
    <div class="page">
      ${head('08 / HELP & INQUIRY', '문의 / 도움말', 'NDVM 서비스 이용 방법 안내, 자주 묻는 질문(FAQ) 및 1:1 온라인 문의 접수처입니다.')}

      <div class="help-layout-grid">
        <!-- 1. 좌측: 1:1 온라인 문의 접수 폼 -->
        <section class="help-inquiry-box panel" aria-labelledby="inquiry-form-heading">
          <div class="inquiry-header" style="margin-bottom:16px;">
            <span class="eyebrow">ONLINE INQUIRY</span>
            <h2 id="inquiry-form-heading" style="font-size:18px;margin:4px 0 6px;">1:1 문의 및 개선 의견 접수</h2>
            <p style="font-size:13px;color:#64748b;line-height:1.5;">시스템 이용 중 불편한 점이나 공공데이터 오류, 새로운 기능 제안을 남겨주시면 검토하여 반영하겠습니다.</p>
          </div>

          <form id="help-inquiry-form" class="help-inquiry-form" novalidate>
            <div>
              <label for="inquiry-category">문의 유형 <span style="color:#ef4444;">*</span></label>
              <select id="inquiry-category" required>
                <option value="시스템 이용 문의">시스템 이용 문의</option>
                <option value="재해·대피소 데이터 오류 제보">재해·대피소 데이터 오류 제보</option>
                <option value="신규 기능 및 데이터 제안">신규 기능 및 데이터 제안</option>
                <option value="기타 의견 및 피드백">기타 의견 및 피드백</option>
              </select>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label for="inquiry-name">작성자 성함 / 닉네임 <span style="color:#ef4444;">*</span></label>
                <input type="text" id="inquiry-name" placeholder="홍길동" required maxlength="30">
              </div>
              <div>
                <label for="inquiry-contact">답변 받을 연락처 / 이메일</label>
                <input type="text" id="inquiry-contact" placeholder="example@email.com" maxlength="60">
              </div>
            </div>

            <div>
              <label for="inquiry-title">문의 제목 <span style="color:#ef4444;">*</span></label>
              <input type="text" id="inquiry-title" placeholder="문의하실 내용을 요약해 주세요" required maxlength="100">
            </div>

            <div>
              <label for="inquiry-message">문의 상세 내용 <span style="color:#ef4444;">*</span></label>
              <textarea id="inquiry-message" rows="5" placeholder="문의하시거나 건의할 내용을 구체적으로 작성해 주세요. (최대 1,000자)" required maxlength="1000"></textarea>
            </div>

            <div class="help-inquiry-actions">
              <button type="submit" class="btn primary" id="btn-submit-inquiry">📨 문의 접수하기</button>
              <button type="button" class="btn" id="btn-copy-inquiry">📋 내용 복사</button>
              <button type="button" class="btn" id="btn-mail-inquiry">✉️ 이메일로 발송</button>
            </div>

            <div id="help-inquiry-feedback" class="help-feedback-box" hidden></div>
          </form>
        </section>

        <!-- 2. 우측: 자주 묻는 질문 (FAQ) -->
        <section class="help-faq-box panel" aria-labelledby="faq-heading">
          <div class="faq-header" style="margin-bottom:16px;">
            <span class="eyebrow">FREQUENTLY ASKED QUESTIONS</span>
            <h2 id="faq-heading" style="font-size:18px;margin:4px 0 6px;">자주 묻는 질문 (FAQ)</h2>
            <p style="font-size:13px;color:#64748b;line-height:1.5;">질문을 클릭하시면 상세한 답변을 바로 확인하실 수 있습니다.</p>
          </div>

          <div class="faq-accordion-list" style="display:flex;flex-direction:column;gap:10px;">
            ${faqs.map(([q, a], idx) => `
              <details class="faq-detail-item" ${idx === 0 ? 'open' : ''} style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;transition:background 0.2s ease;">
                <summary style="font-size:13px;font-weight:700;color:#1e293b;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;">
                  <span>Q. ${esc(q)}</span>
                  <span class="faq-arrow" style="font-size:11px;color:#94a3b8;">▼</span>
                </summary>
                <div style="font-size:12px;color:#475569;line-height:1.7;margin-top:10px;padding-top:8px;border-top:1px dashed #cbd5e1;">
                  ${esc(a)}
                </div>
              </details>
            `).join('')}
          </div>
        </section>
      </div>

      <!-- 3. 하단: 나의 문의 접수 내역 보관함 -->
      <section class="my-inquiries-panel panel" aria-labelledby="my-inquiries-heading">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
          <div>
            <span class="eyebrow">INQUIRY HISTORY</span>
            <h2 id="my-inquiries-heading" style="font-size:17px;margin:4px 0 0;">나의 문의 접수 내역</h2>
          </div>
          <button type="button" class="btn" id="btn-clear-inquiries" style="font-size:11px;padding:4px 10px;">전체 내역 삭제</button>
        </div>
        <div id="my-inquiries-container"></div>
      </section>

      ${note('※ 접수된 문의는 브라우저 저장소에 안전하게 보관되며, 시스템 관리자 및 프로젝트 검토용으로 활용됩니다.')}
    </div>
  `;
}

function initHelpPage() {
  const form = document.getElementById('help-inquiry-form');
  const feedback = document.getElementById('help-inquiry-feedback');
  const copyBtn = document.getElementById('btn-copy-inquiry');
  const mailBtn = document.getElementById('btn-mail-inquiry');
  const clearBtn = document.getElementById('btn-clear-inquiries');

  function renderMyInquiries() {
    const container = document.getElementById('my-inquiries-container');
    if (!container) return;
    const items = getSavedInquiries();
    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:32px 16px;color:#94a3b8;background:#f8fafc;border-radius:8px;border:1px dashed #cbd5e1;">
          <p style="font-size:14px;font-weight:600;margin:0 0 4px;">아직 접수된 문의 내역이 없습니다.</p>
          <small>위 1:1 문의 폼에서 질문이나 개선 의견을 남겨보세요.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="my-inquiries-grid">
        ${items.map(item => `
          <article class="my-inquiry-card">
            <div class="my-inquiry-top">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="badge" style="background:#0284c7;color:#fff;font-size:10px;padding:2px 7px;border-radius:4px;">${esc(item.category)}</span>
                <strong style="font-size:11px;color:#64748b;">${esc(item.inquiryNo)}</strong>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="badge" style="background:#10b981;color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;">접수 완료</span>
                <button type="button" class="btn-delete-inquiry" data-id="${esc(item.id)}" style="background:transparent;border:none;color:#94a3b8;font-size:14px;cursor:pointer;padding:0 4px;" title="삭제">×</button>
              </div>
            </div>
            <div class="my-inquiry-title">${esc(item.title)}</div>
            <div class="my-inquiry-msg">${esc(item.message)}</div>
            <div class="my-inquiry-foot">
              <span>작성자: <b>${esc(item.name)}</b> ${item.contact ? `· 회신처: ${esc(item.contact)}` : ''}</span>
              <span>접수일시: ${esc(item.createdAt)}</span>
            </div>
          </article>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.btn-delete-inquiry').forEach(b => {
      b.onclick = () => {
        const id = b.dataset.id;
        const current = getSavedInquiries().filter(x => x.id !== id);
        saveInquiries(current);
        renderMyInquiries();
      };
    });
  }

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const cat = document.getElementById('inquiry-category')?.value || '시스템 이용 문의';
      const name = document.getElementById('inquiry-name')?.value.trim();
      const contact = document.getElementById('inquiry-contact')?.value.trim();
      const title = document.getElementById('inquiry-title')?.value.trim();
      const msg = document.getElementById('inquiry-message')?.value.trim();

      if (!name || !title || !msg) {
        if (feedback) {
          feedback.hidden = false;
          feedback.className = 'help-feedback-box error';
          feedback.textContent = '작성자 성함, 문의 제목, 상세 내용을 모두 입력해 주세요.';
        }
        return;
      }

      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const timeStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const inquiryNo = `#NDVM-${now.getTime().toString(36).toUpperCase()}`;

      const newInquiry = {
        id: `inquiry_${Date.now()}`,
        inquiryNo: inquiryNo,
        category: cat,
        name: name,
        contact: contact,
        title: title,
        message: msg,
        createdAt: timeStr
      };

      const list = [newInquiry, ...getSavedInquiries()].slice(0, 50);
      saveInquiries(list);

      if (feedback) {
        feedback.hidden = false;
        feedback.className = 'help-feedback-box success';
        feedback.innerHTML = `✓ 문의가 성공적으로 접수되었습니다! <strong>(접수번호: ${inquiryNo})</strong>`;
      }

      form.reset();
      renderMyInquiries();

      setTimeout(() => {
        if (feedback) feedback.hidden = true;
      }, 7000);
    };
  }

  if (copyBtn) {
    copyBtn.onclick = async () => {
      const cat = document.getElementById('inquiry-category')?.value || '';
      const name = document.getElementById('inquiry-name')?.value.trim() || '익명';
      const title = document.getElementById('inquiry-title')?.value.trim() || '';
      const msg = document.getElementById('inquiry-message')?.value.trim() || '';
      const contact = document.getElementById('inquiry-contact')?.value.trim() || '';

      if (!title && !msg) {
        if (feedback) {
          feedback.hidden = false;
          feedback.className = 'help-feedback-box error';
          feedback.textContent = '복사할 문의 내용을 먼저 작성해 주세요.';
        }
        return;
      }

      const textToCopy = `[NDVM 1:1 온라인 문의]\n- 분류: ${cat}\n- 작성자: ${name} (${contact || '연락처 미입력'})\n- 제목: ${title}\n- 내용:\n${msg}`;
      let ok = false;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
          ok = true;
        }
      } catch (_) {}

      if (!ok) {
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        ta.remove();
      }

      if (feedback) {
        feedback.hidden = false;
        feedback.className = 'help-feedback-box success';
        feedback.textContent = ok ? '문의 내용이 클립보드에 복사되었습니다! 메신저나 이메일에 붙여넣으세요.' : '복사에 실패했습니다. 직접 내용을 선택하여 복사해 주세요.';
        setTimeout(() => feedback.hidden = true, 4000);
      }
    };
  }

  if (mailBtn) {
    mailBtn.onclick = () => {
      const cat = document.getElementById('inquiry-category')?.value || '';
      const title = document.getElementById('inquiry-title')?.value.trim() || 'NDVM 문의';
      const msg = document.getElementById('inquiry-message')?.value.trim() || '';
      const name = document.getElementById('inquiry-name')?.value.trim() || '';
      const contact = document.getElementById('inquiry-contact')?.value.trim() || '';

      const subject = encodeURIComponent(`[NDVM 문의] ${cat}: ${title}`);
      const body = encodeURIComponent(`- 작성자: ${name}\n- 연락처: ${contact}\n- 문의 분류: ${cat}\n\n[문의 내용]\n${msg}`);
      window.open(`mailto:support@ndvm.local?subject=${subject}&body=${body}`, '_blank');
    };
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      if (confirm('접수된 모든 문의 내역을 삭제하시겠습니까?')) {
        saveInquiries([]);
        renderMyInquiries();
      }
    };
  }

  renderMyInquiries();
}

window.helpPage = helpPage;
window.initHelpPage = initHelpPage;

