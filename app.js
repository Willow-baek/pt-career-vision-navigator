const toast = document.querySelector('.toast');
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

document.querySelectorAll('[data-prompt]').forEach((button) => {
  button.addEventListener('click', async () => {
    const original = button.innerHTML;
    button.disabled = true;
    try {
      const response = await fetch(button.dataset.prompt);
      if (!response.ok) throw new Error('Prompt load failed');
      await copyText(await response.text());
      button.classList.add('copied');
      button.textContent = '복사됐어요';
      showToast('프롬프트를 복사했어요. 편한 AI에 붙여넣어 보세요.');
      setTimeout(() => {
        button.innerHTML = original;
        button.classList.remove('copied');
      }, 2200);
    } catch (error) {
      showToast('복사하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      button.disabled = false;
    }
  });
});
