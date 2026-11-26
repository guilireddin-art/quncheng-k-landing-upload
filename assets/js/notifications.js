
(function(){
  var surnames = ['陳','林','黃','張','李','王','吳','劉','蔡','楊','許','鄭','謝','洪','郭','邱','曾','廖','賴','徐','周','葉','蘇','莊','江','呂','何','羅','高','蕭'];
  var areas = ['台北市','新北市','台中市','高雄市','桃園市','新竹市','台南市','基隆市','嘉義市','宜蘭縣','花蓮縣','苗栗縣','彰化縣','雲林縣','屏東縣'];
  var amounts = ['10萬','15萬','20萬','25萬','30萬','35萬','40萬','50萬','60萬','70萬','80萬','100萬'];
  var timeAgo = ['剛剛','1分鐘前','2分鐘前','3分鐘前','5分鐘前','6分鐘前','8分鐘前','10分鐘前'];
  var actions = ['申請成功','完成申請','核准通過','送件成功'];

  var notifyActive = true;

  function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function maskName(s){ return s + '○○'; }

  function hideNotifyNow(){
    var el = document.getElementById('loanNotify');
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(-20px)';
    el.style.pointerEvents = 'none';
  }

  // 暴露暂停/恢復通知的方法給主頁面調用
  window.stopLoanNotify = function(){
    notifyActive = false;
    hideNotifyNow();
  };
  window.resumeLoanNotify = function(){
    if(notifyActive) return; // 已經在運行中則不重複啟動
    notifyActive = true;
    showNotify();
    scheduleNext();
  };

  function showNotify(){
    if(!notifyActive) return;
    var el = document.getElementById('loanNotify');
    var textEl = document.getElementById('loanNotifyText');
    var amtEl = document.getElementById('loanNotifyAmount');
    var area = rand(areas);
    var name = maskName(rand(surnames));
    var amount = rand(amounts);
    var time = rand(timeAgo);
    var action = rand(actions);
    textEl.textContent = area + '　' + name + '　' + time + action + ' ' + amount;
    amtEl.textContent = 'NT$' + amount;
    // 顯示
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
    el.style.pointerEvents = 'auto';
    // 4秒後隱藏
    setTimeout(function(){
      if(!notifyActive) return;
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(-20px)';
      el.style.pointerEvents = 'none';
    }, 4000);
  }

  // 頁面載入後 2 秒顯示第一條，之後每 6~10 秒隨機顯示一條
  function scheduleNext(){
    var delay = 6000 + Math.floor(Math.random() * 4000);
    setTimeout(function(){
      if(!notifyActive) return;
      showNotify();
      scheduleNext();
    }, delay);
  }

  setTimeout(function(){
    showNotify();
    scheduleNext();
  }, 2000);
})();
