
(function(){
  const SUPABASE_URL = 'https://ijzywhrnhvldkjdwfdyy.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_6aY1-VEvimuV1K4FzURO2Q_inVt-ZKL';
  let ENTERPRISE_LINE_URL = 'https://line.me/ti/p/@987apocu';
  let ENTERPRISE_LINE_ID = '@987apocu';
  let currentStep = 1;
  const annualRate = 3.88;
  const state = {
    amountNumber: 300000,
    term: 36,
    purpose: '週轉理財',
    amountChoice: '30萬 - 50萬',
    is_warning: '',
    has_foreign: '',
    has_loan: '',
    has_debt: ''
  };

  function money(value){
    return 'NT$ ' + Math.round(value).toLocaleString('en-US');
  }

  function compactWan(value){
    return 'NT$' + (value / 10000).toFixed(1).replace(/\.0$/, '') + '萬';
  }

  function amountChoiceFromNumber(value){
    if(value < 200000) return '10萬 - 20萬';
    if(value < 300000) return '20萬 - 30萬';
    if(value < 500000) return '30萬 - 50萬';
    if(value < 1000000) return '50萬 - 100萬';
    return '100萬以上';
  }

  function updateCalculator(){
    const monthlyRate = annualRate / 100 / 12;
    const payment = state.amountNumber * monthlyRate / (1 - Math.pow(1 + monthlyRate, -state.term));
    const total = payment * state.term;
    const interest = total - state.amountNumber;
    document.getElementById('amountDisplay').textContent = money(state.amountNumber);
    document.getElementById('monthlyPayment').textContent = money(payment);
    document.getElementById('rateText').textContent = annualRate.toFixed(2) + '%';
    document.getElementById('interestText').textContent = compactWan(interest);
    document.getElementById('totalText').textContent = compactWan(total);
    state.amountChoice = amountChoiceFromNumber(state.amountNumber);
    syncAmountChoice();
  }

  function syncAmountChoice(){
    document.querySelectorAll('#formAmountOptions .choice').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.value === state.amountChoice);
    });
  }

  function normalizeLineUrl(lineUrl, lineId){
    const url = String(lineUrl || '').trim();
    const id = String(lineId || '').trim();
    if(/^https?:\/\//i.test(url)) return url;
    if(id.startsWith('@')) return 'https://line.me/ti/p/' + id;
    return ENTERPRISE_LINE_URL;
  }

  function applyCPageConfig(config){
    config = config || {};
    ENTERPRISE_LINE_ID = config.line_id || ENTERPRISE_LINE_ID;
    ENTERPRISE_LINE_URL = normalizeLineUrl(config.line_url, ENTERPRISE_LINE_ID);
    document.getElementById('lineBtn').href = ENTERPRISE_LINE_URL;
    if(config.company_name){
      document.querySelectorAll('[data-company-name]').forEach(el => el.textContent = config.company_name);
    }
  }

  Promise.resolve(window.PAGE_CONFIG_READY)
    .then(applyCPageConfig)
    .catch(error => console.warn('Page config load failed:', error));

  function createLeadId(){
    if(window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async function submitLeadPayload(payload){
    const requestOptions = {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: 'Bearer ' + SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    };
    let response = await fetch(SUPABASE_URL + '/rest/v1/leads', requestOptions);
    if(!response.ok && payload.traffic_source){
      const errorText = await response.clone().text();
      if(errorText.includes('traffic_source')){
        const fallbackPayload = { ...payload };
        delete fallbackPayload.traffic_source;
        requestOptions.body = JSON.stringify(fallbackPayload);
        response = await fetch(SUPABASE_URL + '/rest/v1/leads', requestOptions);
      }
    }
    return response;
  }

  function trackLineClick(){
    if(!window.__lastLeadId) return;
    fetch(SUPABASE_URL + '/rest/v1/rpc/mark_line_clicked', {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: 'Bearer ' + SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lead_id: window.__lastLeadId })
    }).catch(error => console.warn('Line click update error:', error));
  }

  const counties = ['基隆市','台北市','新北市','桃園市','新竹市','新竹縣','苗栗縣','台中市','彰化縣','南投縣','雲林縣','嘉義市','嘉義縣','台南市','高雄市','屏東縣','宜蘭縣','花蓮縣','台東縣','澎湖縣','金門縣','連江縣'];
  const countySelect = document.getElementById('county');
  counties.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    countySelect.appendChild(option);
  });

  document.getElementById('amountRange').addEventListener('input', event => {
    state.amountNumber = Number(event.target.value);
    updateCalculator();
  });

  document.querySelectorAll('#termOptions .option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#termOptions .option').forEach(item => item.classList.remove('selected'));
      btn.classList.add('selected');
      state.term = Number(btn.dataset.term);
      updateCalculator();
    });
  });

  document.querySelectorAll('#purposeOptions .option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#purposeOptions .option').forEach(item => item.classList.remove('selected'));
      btn.classList.add('selected');
      state.purpose = btn.dataset.purpose;
    });
  });

  document.querySelectorAll('#formAmountOptions .choice').forEach(btn => {
    btn.addEventListener('click', () => {
      state.amountChoice = btn.dataset.value;
      syncAmountChoice();
      document.getElementById('amountError').style.display = 'none';
      if(!window.__kAmountEventFired){
        window.__kAmountEventFired = true;
        window.trackPageEvent?.('AddToCart', { content_name: '2026安心周轉專案', content_category: '貸款引流' });
      }
    });
  });

  document.querySelectorAll('.yn').forEach(group => {
    group.querySelectorAll('.choice').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.choice').forEach(item => item.classList.remove('selected'));
        btn.classList.add('selected');
        state[group.dataset.group] = btn.dataset.value;
        document.getElementById('ynError').style.display = 'none';
        if(group.dataset.group === 'is_warning'){
          document.getElementById('warningError').style.display = btn.dataset.value === '是' ? 'block' : 'none';
        }
      });
    });
  });

  document.getElementById('applyNow').addEventListener('click', () => {
    window.stopLoanNotify && window.stopLoanNotify();
    if(typeof window.fbq === 'function'){
      window.fbq('trackCustom', 'ClickFloatCTA', { page_slug: window.PAGE_SLUG || 'main', content_name: '2026安心周轉專案', content_category: '貸款引流' });
    }
    Promise.resolve(window.PAGE_CONFIG_READY)
      .then(() => window.trackTikTokEvent?.('ClickButton', {
        content_type: 'loan_application',
        content_name: 'K版立即申請貸款'
      }))
      .catch(error => console.warn('TikTok ClickButton event error:', error));
    window.trackPageEvent?.('InitiateCheckout', {
      content_name: 'K版試算後申請',
      content_category: '貸款試算'
    });
    showScreen('formScreen');
    currentStep = 1;
    updateStepUI();
  });

  document.getElementById('backBtn').addEventListener('click', () => {
    if(currentStep > 1){
      currentStep--;
      updateStepUI();
      return;
    }
    showScreen('estimateScreen');
    window.resumeLoanNotify && window.resumeLoanNotify();
  });

  document.getElementById('nextBtn').addEventListener('click', async () => {
    if(!validateStep()) return;
    if(currentStep < 3){
      currentStep++;
      updateStepUI();
      return;
    }
    await submitForm();
  });

  function showScreen(id){
    document.querySelectorAll('.screen').forEach(screen => screen.classList.toggle('active', screen.id === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateStepUI(){
    document.querySelectorAll('.panel').forEach(panel => panel.classList.toggle('active', Number(panel.dataset.step) === currentStep));
    for(let i = 1; i <= 3; i++){
      const dot = document.getElementById('stepDot' + i);
      dot.classList.toggle('active', i === currentStep);
      dot.classList.toggle('done', i < currentStep);
    }
    document.getElementById('stepLine1').classList.toggle('done', currentStep > 1);
    document.getElementById('stepLine2').classList.toggle('done', currentStep > 2);
    document.getElementById('backBtn').style.display = currentStep > 1 ? '' : 'none';
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.textContent = currentStep < 3 ? '下一步' : '送出貸款評估申請';
    nextBtn.classList.toggle('gold', currentStep === 3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateStep(){
    document.getElementById('amountError').style.display = 'none';
    document.getElementById('ynError').style.display = 'none';
    document.getElementById('warningError').style.display = 'none';
    document.getElementById('submitError').style.display = 'none';
    const form = document.getElementById('loanForm');
    if(currentStep === 1){
      if(!state.amountChoice){
        document.getElementById('amountError').style.display = 'block';
        return false;
      }
      return true;
    }
    if(currentStep === 2){
      const required = ['name','age','phone','lineId','id_card','county'];
      for(const name of required){
        const input = form.elements[name];
        if(!String(input.value || '').trim()){
          input.focus();
          return false;
        }
      }
      return true;
    }
    const requiredYn = ['is_warning','has_foreign','has_loan','has_debt'];
    const ok = requiredYn.every(key => state[key]);
    if(!ok) document.getElementById('ynError').style.display = 'block';
    if(state.is_warning === '是'){
      document.getElementById('warningError').style.display = 'block';
      return false;
    }
    return ok;
  }

  async function submitForm(){
    await Promise.resolve(window.PAGE_CONFIG_READY).catch(() => null);
    const form = document.getElementById('loanForm');
    const data = Object.fromEntries(new FormData(form).entries());
    if(state.is_warning === '是'){
      document.getElementById('warningError').style.display = 'block';
      return;
    }
    const leadId = createLeadId();
    const pageConfig = window.PAGE_CONFIG || {};
    const payload = {
      id: leadId,
      page_id: pageConfig.id || null,
      page_slug: window.PAGE_SLUG || 'main',
      name: String(data.name || '').trim(),
      age: data.age ? Number(data.age) : null,
      city: data.county || '',
      id_number: String(data.id_card || '').trim().toUpperCase(),
      phone: String(data.phone || '').trim(),
      line_id: String(data.lineId || '').trim(),
      q1_existing_loan: '是否有信貸/房貸/車貸/機貸：' + (state.has_loan || '') + '；銀行協商或呆帳：' + (state.has_debt || ''),
      q2_bank_status: '銀行是否為警示戶：' + (state.is_warning || ''),
      q3_amount_needed: state.amountChoice || '',
      q4_foreign_currency_account: '是否有個人外幣帳戶：' + (state.has_foreign || ''),
      source_url: window.location.href,
      traffic_source: window.TRAFFIC_SOURCE || null,
      user_agent: navigator.userAgent,
      status: 'new',
      line_clicked: false
    };

    const loading = document.getElementById('loading');
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.disabled = true;
    loading.classList.add('show');
    try{
      const response = await submitLeadPayload(payload);
      if(!response.ok) throw new Error('Supabase insert failed: ' + response.status);
      window.__lastLeadId = leadId;
      window.trackPageEvent?.('Lead', {
        content_name: 'K版貸款試算申請',
        content_category: '貸款引流',
        value: 0,
        currency: 'TWD'
      });
      window.trackPageEvent?.('CompleteRegistration', {
        content_name: 'K版貸款試算申請',
        status: 'submitted'
      });
      window.trackTikTokEvent?.('SubmitForm', { content_type: 'loan_application' });
      setTimeout(() => showResult(payload), 500);
    }catch(error){
      console.error('Lead submit error:', error);
      document.getElementById('submitError').textContent = '送出失敗，請檢查網路後再試一次。';
      document.getElementById('submitError').style.display = 'block';
      nextBtn.disabled = false;
      loading.classList.remove('show');
    }
  }

  function showResult(payload){
    document.getElementById('loading').classList.remove('show');
    showScreen('finishScreen');
    document.getElementById('finishTop').classList.remove('blocked');
    document.getElementById('finishIcon').textContent = '✓';
    document.getElementById('finishTitle').textContent = '初步資料已送出';
    document.getElementById('finishSub').textContent = '請加入 LINE 完成最後申請';
    document.getElementById('finishDesc').innerHTML = '<b>' + escapeHtml(payload.name || '您好') + '</b>，您的資料已送出。下一步請加入官方 LINE，由專員確認可申請方案與額度。';
    document.getElementById('summaryAmount').textContent = payload.q3_amount_needed || '評估中';
    document.getElementById('summaryPurpose').textContent = state.purpose;
    document.getElementById('lineBtn').href = ENTERPRISE_LINE_URL;
    document.getElementById('lineBtn').style.display = 'flex';
    document.getElementById('lineHint').style.display = '';
  }

  function showBlockedResult(name){
    document.getElementById('loading').classList.remove('show');
    showScreen('finishScreen');
    document.getElementById('finishTop').classList.add('blocked');
    document.getElementById('finishIcon').textContent = '!';
    document.getElementById('finishTitle').textContent = '暫時無法申請';
    document.getElementById('finishSub').textContent = '警示戶不符合本頁申請條件';
    document.getElementById('finishDesc').innerHTML = '<b>' + escapeHtml(name || '您好') + '</b>，目前系統判定暫時無法送出申請。建議先向銀行確認警示戶狀態，解除後再重新評估。';
    document.getElementById('summaryAmount').textContent = state.amountChoice || '未送出';
    document.getElementById('summaryPurpose').textContent = state.purpose;
    document.getElementById('lineBtn').style.display = 'none';
    document.getElementById('lineHint').style.display = 'none';
  }

  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  document.getElementById('lineBtn').addEventListener('click', () => {
    trackLineClick();
    window.trackPageEvent?.('Contact', { content_name: 'K版加入LINE' });
    window.trackPageEvent?.('LineAddFriend', { content_name: 'K版加入LINE', content_category: '貸款引流' });
    if(typeof window.fbq === 'function'){
      window.fbq('trackCustom', 'LineAddFriend', { page_slug: window.PAGE_SLUG || 'main', content_name: '企業LINE加好友', content_category: '貸款引流' });
    }
    window.trackTikTokEvent?.('Contact', { content_type: 'line_click' });
  });

  updateCalculator();
  const kViewObserver = new IntersectionObserver(entries => {
    if(entries.some(entry => entry.isIntersecting)){
      window.trackPageEvent?.('ViewContent', { content_name: '2026安心周轉專案', content_category: '貸款引流' });
      kViewObserver.disconnect();
    }
  }, { threshold: .25 });
  kViewObserver.observe(document.getElementById('estimateScreen'));
})();
