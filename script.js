// Cookie 管理工具
const CookieManager = {
    set: function(name, value, days = 365) {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        const cookieString = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
        document.cookie = cookieString;
    },
    
    get: function(name) {
        const nameEQ = name + '=';
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.indexOf(nameEQ) === 0) {
                return decodeURIComponent(cookie.substring(nameEQ.length));
            }
        }
        return null;
    },
    
    remove: function(name) {
        this.set(name, '', -1);
    }
};

// 深色模式管理
const ThemeManager = {
    COOKIE_NAME: 'theme-preference',
    DEFAULT_THEME: 'system',
    THEMES: ['system', 'light', 'dark'],
    
    init: function() {
        this.loadTheme();
        this.updateSystemThemeDisplay();
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.getCurrentTheme() === 'system') {
                this.applyTheme('system');
            }
            this.updateSystemThemeDisplay();
        });
    },
    
    getCurrentTheme: function() {
        return CookieManager.get(this.COOKIE_NAME) || this.DEFAULT_THEME;
    },
    
    setTheme: function(theme) {
        if (this.THEMES.includes(theme)) {
            CookieManager.set(this.COOKIE_NAME, theme);
            this.applyTheme(theme);
            return true;
        }
        return false;
    },
    
    applyTheme: function(theme) {
        let isDark = false;
        
        if (theme === 'system') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        } else if (theme === 'dark') {
            isDark = true;
        }
        
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    },
    
    loadTheme: function() {
        const theme = this.getCurrentTheme();
        this.applyTheme(theme);
    },
    
    reset: function() {
        CookieManager.remove(this.COOKIE_NAME);
        this.loadTheme();
    },
    
    getSystemTheme: function() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? '深色' : '亮色';
    },
    
    updateSystemThemeDisplay: function() {
        const element = document.getElementById('system-theme');
        if (element) {
            element.textContent = this.getSystemTheme();
        }
    }
};

// 初始化主题
ThemeManager.init();

// 动态生成页脚内容
document.addEventListener('DOMContentLoaded', function() {
    const footer = document.querySelector('footer');
    
    // 动态创建页脚内容
    const footerContainer = document.createElement('div');
    footerContainer.style.display = 'flex';
    footerContainer.style.justifyContent = 'center';
    footerContainer.style.alignItems = 'center';
    footerContainer.style.gap = '20px';
    footerContainer.style.flexWrap = 'wrap';
    
    // 版权信息
    const copyrightP = document.createElement('p');
    copyrightP.textContent = 'Modori-love-Momoi©2026';
    
    // Github Pages链接
    const poweredP = document.createElement('p');
    const link = document.createElement('a');
    link.href = 'https://pages.github.com/';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Powered by Github Pages';
    link.style.color = 'inherit';
    link.style.textDecoration = 'underline';
    poweredP.appendChild(link);
    
    footerContainer.appendChild(copyrightP);
    footerContainer.appendChild(poweredP);
    footer.appendChild(footerContainer);
    // 添加右下角齿轮，点击跳转到 setting 页面
    (function addFooterGear(){
        if (document.getElementById('footer-gear')) return;
        const gearLink = document.createElement('a');
        gearLink.id = 'footer-gear';
        gearLink.className = 'footer-gear';
        gearLink.href = 'setting.html';
        gearLink.title = '设置';
        gearLink.setAttribute('aria-label', '设置');
        // 在同页打开设置（不强制新标签），如果需要新标签可改为 target='_blank'
        const span = document.createElement('span');
        span.className = 'gear-icon';
        span.textContent = '⚙️';
        gearLink.appendChild(span);
        // 将齿轮添加到 footer 中，使其相对于页脚定位
        if (footer) footer.appendChild(gearLink);
        else document.body.appendChild(gearLink);
    })();
    
    // 平滑滚动到页脚的函数
    window.scrollToFooter = function() {
        footer.scrollIntoView({ behavior: 'smooth' });
    };
});

// 兼容页面渲染前插入弹窗
function safeAppendToBody(node) {
  if (document.body) {
    document.body.appendChild(node);
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(node);
    });
  }
}

const dialogStack = [];
const BASE_Z_INDEX = 1000;

function createDialog(options) {
  return new Promise((resolve) => {
    const zIndex = BASE_Z_INDEX + dialogStack.length * 2;
    const mask = document.createElement('div');
    mask.className = 'dialog-mask';
    mask.style.zIndex = zIndex;

    const dialog = document.createElement('div');
    dialog.className = 'dialog-box';
    dialog.style.zIndex = zIndex + 1;

    if (options.title) {
      const title = document.createElement('h3');
      title.style.marginTop = '0';
      title.textContent = options.title;
      dialog.appendChild(title);
    }

    if (options.content) {
      const content = document.createElement('p');
      content.textContent = options.content;
      dialog.appendChild(content);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'dialog-buttons';

    let timers = [];
    const buttons = Array.isArray(options.buttons) ? options.buttons : [];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = 'dialog-button';
      button.textContent = btn.text;
      button.style.backgroundColor = btn.color || '#f0f0f0';

      // 倒计时逻辑
      if (typeof btn.delay === 'number' && btn.delay > 0) {
        button.disabled = true;
        const originalText = btn.text;
        let countdown = btn.delay;

        const update = () => {
          button.textContent = `${originalText} (${countdown}s)`;
          if (countdown <= 0) {
            clearInterval(timer);
            button.disabled = false;
            button.textContent = originalText;
            return;
          }
          countdown--;
        };

        const timer = setInterval(update, 1000);
        timers.push(timer);
        update();
      }

      // 按钮点击事件
  if (typeof btn.onClick === 'function') {
    button.onclick = (e) => {
      btn.onClick(e, button, dialog, mask);
      // 只有 keep 不为 true 时才关闭弹窗
      if (!btn.keep) {
        cleanup();
        resolve(btn.value);
      }
    };
  } else {
    button.onclick = () => {
      // 只有 keep 不为 true 时才关闭弹窗
      if (!btn.keep) {
        cleanup();
        resolve(btn.value);
      }
    };
  }

      buttonContainer.appendChild(button);
    });

    dialog.appendChild(buttonContainer);
    mask.appendChild(dialog);
    safeAppendToBody(mask);
    dialogStack.push({ mask, timers });

    mask.onclick = (e) => {
      if (e.target === mask && options.backgroundClose !== false) {
        cleanup();
        resolve(options.backgroundValue || 'background');
      }
    };

    const cleanup = () => {
      timers.forEach(clearInterval);
      mask.remove();
      const index = dialogStack.findIndex(d => d.mask === mask);
      if (index > -1) dialogStack.splice(index, 1);
    };
  });
}


let notificationQueue = [];
let nightmode = false; // true为夜间模式，false为白天模式

function safeAppendToInbody(node) {
    // 通知应该插入到body而不是inbody，因为使用了position: fixed定位
    if (document.body) {
        document.body.appendChild(node);
    } else {
        window.addEventListener('DOMContentLoaded', function () {
            document.body.appendChild(node);
        });
    }
}

function safeAppendToBody(node) {
  if (document.body) {
    document.body.appendChild(node);
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(node);
    });
  }
}

function showWindowsNotification(opt) {
  const config = Object.assign({title:'',content:'',duration:5000,buttons:[]}, opt);
  if (!config.content.trim()) return;
  if (notificationQueue.length >= 10) {
    const oldest = notificationQueue.shift();
    if (oldest.dom) oldest.dom.classList.remove('show');
    setTimeout(()=>{if(oldest.dom.parentNode)oldest.dom.parentNode.removeChild(oldest.dom);},250);
  }
  const n = document.createElement('div');
  n.className = 'windows-notification';
  if(nightmode) n.classList.add('night');
  n.innerHTML = `<div class="notification-title">${config.title}</div>
      <div>${config.content}</div>
      <div class="notification-buttons"></div>`;
  let progressBar, timeTip;
  if (config.duration > 0) {
    progressBar = document.createElement('div');
    progressBar.className = 'notification-progress';
    progressBar.innerHTML = `<div class="progress-fill"></div>`;
    timeTip = document.createElement('div');
    timeTip.className = 'notification-timetip';
    timeTip.textContent = `剩余 ${Math.ceil(config.duration/1000)} 秒关闭`;
    n.appendChild(progressBar); n.appendChild(timeTip);
  }
  const btns = n.querySelector('.notification-buttons');
  config.buttons.forEach(btn=>{
    const b = document.createElement('button');
    b.className = 'trigger-btn'; b.textContent = btn.text;
    b.onclick = ()=>{clearTimeout(timer);removeNotification();};
    btns.appendChild(b);
  });
  safeAppendToInbody(n); // 修改为插入到 .inbody 容器
  setTimeout(()=>n.classList.add('show'),10);
  let timer, start=Date.now();
  if(config.duration>0){
    timer=setTimeout(removeNotification,config.duration);
    function updateProgress(){
      if(progressBar){
        const elapsed=Date.now()-start,progress=Math.min(elapsed/config.duration,1);
        progressBar.querySelector('.progress-fill').style.width=`${(1-progress)*100}%`;
        timeTip.textContent=`剩余 ${Math.max(0,Math.ceil((config.duration-elapsed)/1000))} 秒关闭`;
        if(progress<1)requestAnimationFrame(updateProgress);
      }
    }
    updateProgress();
  }
  function removeNotification(){
    n.classList.remove('show');
    setTimeout(()=>{
      if(n.parentNode)n.parentNode.removeChild(n);
      notificationQueue=notificationQueue.filter(item=>item.dom!==n);
      updateStackedStyles();
    },250);
  }
  notificationQueue.push({dom:n});
  updateStackedStyles();
}

function updateStackedStyles(){
  const len = notificationQueue.length;
  notificationQueue.forEach((item, idx) => {
    const dom = item.dom;
    if (idx < 3) {
      dom.style.display = '';
      dom.classList.remove('stacked', 'stacked-bottom');
      dom.style.right = '20px';
      dom.style.bottom = `${20 + idx * 110}px`;
      dom.style.top = '';
      dom.style.zIndex = 10000 - idx;
    } else {
      dom.style.display = '';
      dom.classList.add('stacked');
      dom.classList.toggle('stacked-bottom', idx >= 10);
      dom.style.right = '20px';
      dom.style.bottom = `${20 + 2 * 110 + (idx - 2) * 10}px`;
      dom.style.top = '';
      dom.style.zIndex = 9990;
    }
  });
  if (notificationQueue.length > 10) {
    notificationQueue.slice(10).forEach(item => item.dom.style.display = 'none');
  }
}

var cookieName = 'offlineNoticeShown';
var match = document.cookie.match(new RegExp('(^| )' + cookieName + '=([^;]+)'));
var hasNotice = match ? match[2] : null;
if (!hasNotice) {
  createDialog({
    title: "提示",
    content: "我们是离线网站，不会在云端储存您的任何信息\n但会使用Cookie在本地储存信息，如果您清除浏览器数据会导致网页设置被重置\n使用工具修改Cookie或跳过本提示默认同意\n本提示确认后在365天内不会再显示",
    buttons: [
      { text: "接受", value: "yes", color: "#4CAF50" },
      { text: "拒绝", value: "no", color: "#f44336", keep:true,
        onClick: function(e, button, dialog, mask) {
        showWindowsNotification({
          title: "您已拒绝本网站",
          content: "如果不同意，恕我们无法向您提供服务"
        });}
      }
    ]
  }).then(result => {
    if (result === 'no') {
      showWindowsNotification({
        title: `您已拒绝本网站`,
        content: `如果不同意，恕我们无法向您提供服务`,
      });
      // 不关闭弹窗，用户可以继续选择
      return;
    }
    if (result === 'yes') {
      var expires = '';
      var days = 365;
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = ";expires=" + date.toUTCString();
      document.cookie = cookieName + "=1" + expires + ";path=/";
    }
  });
}