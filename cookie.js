/* Cookie-плашка: показывается один раз, выбор хранится в localStorage (cookieOk) */
(function () {
  var KEY = 'cookieOk';
  try { if (localStorage.getItem(KEY)) return; } catch (e) {}
  var src = document.currentScript && document.currentScript.src;
  var base = src ? src.replace(/cookie\.js(\?.*)?$/, '') : '/';
  var st = document.createElement('style');
  st.textContent = '.cookieBar{position:fixed;left:12px;right:12px;bottom:12px;z-index:200;max-width:700px;margin:0 auto;display:flex;gap:16px;align-items:center;background:#F8F8F5;color:#16222B;border:2px solid #16222B;padding:14px 18px;font:15px/1.4 Onest,system-ui,sans-serif;box-shadow:0 10px 30px -12px rgba(22,34,43,.35)}.cookieBar p{margin:0;flex:1;min-width:0}.cookieBar a{color:#16222B;font-weight:600}.cookieBar button{flex:none;font:600 15px/1 Onest,system-ui,sans-serif;background:#16222B;color:#F8F8F5;border:0;padding:13px 20px;min-height:44px;cursor:pointer}.cookieBar button:hover{background:#B21F15}@media(max-width:560px){.cookieBar{flex-direction:column;align-items:stretch}}';
  document.head.appendChild(st);
  var bar = document.createElement('div');
  bar.className = 'cookieBar';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Cookie');
  bar.innerHTML = '<p>Сайт использует cookie и может использовать сервис «Яндекс Метрика», чтобы понимать, откуда приходят посетители. Продолжая пользоваться сайтом, вы соглашаетесь с этим. <a href="' + base + 'privacy.html#cookie">Подробнее</a></p><button type="button">Понятно</button>';
  bar.querySelector('button').addEventListener('click', function () {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
    bar.remove();
  });
  document.body.appendChild(bar);
})();
