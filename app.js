const toast = document.querySelector('.toast');
let toastTimer;
const promptCache = new Map();

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Some iOS and in-app browsers expose the Clipboard API but deny writes.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  textarea.style.top = `${window.scrollY}px`;
  textarea.style.fontSize = '16px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus({ preventScroll: true });
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

function showManualCopy(text) {
  const overlay = document.createElement('div');
  overlay.className = 'copy-fallback';
  overlay.innerHTML = `
    <div class="copy-fallback-panel" role="dialog" aria-modal="true" aria-labelledby="copy-fallback-title">
      <p class="eyebrow">MANUAL COPY</p>
      <h2 id="copy-fallback-title">브라우저가 자동 복사를 막았어요</h2>
      <p>아래 텍스트를 길게 눌러 전체 선택한 뒤 복사해 주세요. Safari나 Chrome에서 다시 열면 자동 복사가 더 잘 작동합니다.</p>
      <textarea class="copy-fallback-text" readonly aria-label="복사할 프롬프트"></textarea>
      <button class="copy-fallback-close" type="button">닫기</button>
    </div>
  `;

  const textarea = overlay.querySelector('.copy-fallback-text');
  const closeButton = overlay.querySelector('.copy-fallback-close');
  textarea.value = text;
  document.body.appendChild(overlay);
  document.body.classList.add('copy-fallback-open');
  textarea.focus({ preventScroll: true });
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const close = () => {
    overlay.remove();
    document.body.classList.remove('copy-fallback-open');
  };
  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
}

document.querySelectorAll('[data-prompt]').forEach(async (button) => {
  const promptUrl = button.dataset.prompt;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');

  try {
    const response = await fetch(promptUrl, { cache: 'force-cache' });
    if (!response.ok) throw new Error('Prompt load failed');
    promptCache.set(promptUrl, await response.text());
    button.disabled = false;
    button.removeAttribute('aria-busy');
  } catch (error) {
    button.textContent = '프롬프트를 불러오지 못했어요';
    showToast('페이지를 새로고침해 주세요.');
    return;
  }

  button.addEventListener('click', async () => {
    const original = button.innerHTML;
    button.disabled = true;
    try {
      const text = promptCache.get(promptUrl);
      const copied = await copyText(text);
      if (!copied) {
        showManualCopy(text);
        showToast('수동 복사 화면을 열었어요.');
        return;
      }
      button.classList.add('copied');
      button.textContent = '복사됐어요';
      showToast('프롬프트를 복사했어요. 편한 AI에 붙여넣어 보세요.');
      setTimeout(() => {
        button.innerHTML = original;
        button.classList.remove('copied');
      }, 2200);
    } catch (error) {
      showManualCopy(promptCache.get(promptUrl));
      showToast('수동 복사 화면을 열었어요.');
    } finally {
      button.disabled = false;
    }
  });
});
