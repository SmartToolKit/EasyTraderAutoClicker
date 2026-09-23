const btn = document.getElementById('btn');
const stopBtn = document.getElementById('stopBtn');
const result = document.getElementById('result');
const currentTimeEl = document.getElementById('currentTime');

let injectedRunId = null;

function updateCurrentTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  currentTimeEl.textContent = `${h}:${m}:${s}`;
}
setInterval(updateCurrentTime, 1000);
updateCurrentTime();

btn.addEventListener('click', async () => {
  const startTime = document.getElementById('startTime').value;
  const waitMs = parseInt(document.getElementById('waitMs').value, 10);
  const loopCount = parseInt(document.getElementById('loopCount').value, 10);

  if (!startTime) {
    result.textContent = 'Please select a time';
    result.className = 'error';
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.startsWith('https://d.easytrader.ir/')) {
    result.textContent = 'Only works on d.easytrader.ir';
    result.className = 'error';
    return;
  }

  btn.disabled = true;
  stopBtn.disabled = false;
  result.textContent = 'Injecting...';
  result.className = 'status';

  injectedRunId = Date.now();

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: runAutoClicker,
      args: [startTime, waitMs, loopCount, injectedRunId]
    });
    result.textContent = `Started (runId: ${injectedRunId})`;
    result.className = 'status';
  } catch (e) {
    result.textContent = 'Error: ' + e.message;
    result.className = 'error';
    btn.disabled = false;
    stopBtn.disabled = true;
  }
});

stopBtn.addEventListener('click', async () => {
  if (!injectedRunId) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: stopAutoClicker,
      args: [injectedRunId]
    });
    result.textContent = 'Stop signal sent';
    result.className = 'status';
  } catch (e) {
    result.textContent = 'Error stopping: ' + e.message;
    result.className = 'error';
  }

  btn.disabled = false;
  stopBtn.disabled = true;
});

function runAutoClicker(START_TIME, WAIT_MS, LOOP, runId) {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


  async function waitUntil(time, runId) {
    while (true) {
      if (window.myRunId !== runId) return false;

      const now = new Date();
      const [hour, minute, second = 0] = time.split(":").map(Number);

      const target = new Date();
      target.setHours(hour, minute, second, 0);

      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target - now;

      if (diff <= 1000) {
        await sleep(diff);
        return true;
      }

      await sleep(1000);
    }
  }

  window.myRunId = runId;

  waitUntil(START_TIME, runId).then(async (started) => {
    if (!started || window.myRunId !== runId) return;

    console.log("شروع شد!");

    for (let i = 0; i < LOOP; i++) {
      if (window.myRunId !== runId) {
        console.log("اجرای قبلی لغو شد.");
        return;
      }

      try {
        const elements = document.querySelectorAll('[d="M9.45899 5C8.04318 5 6.65672 5.40374 5.46225 6.16385L4.34334 6.87589C3.72935 7.26661 3.65051 8.13229 4.18381 8.6275L8.57332 12.7035L19.0212 5H9.45899ZM19.9857 6.77367L9.61737 14.4185L10.7951 19.7182C10.9662 20.4885 11.8634 20.8398 12.5122 20.3907L14.1561 19.2525C15.4589 18.3506 16.4399 17.0566 16.9565 15.5586L19.9857 6.77367ZM7.59133 14.5209L2.82291 10.0931C1.32965 8.70649 1.55041 6.28259 3.26959 5.18856L4.3885 4.47653C5.90387 3.51221 7.66281 3 9.45899 3H20.5194C21.9314 3 22.923 4.39082 22.4627 5.72565L18.8472 16.2106C18.1919 18.111 16.9473 19.7527 15.2946 20.8969L13.6506 22.0351C11.834 23.2927 9.32199 22.3089 8.84269 20.152L7.59133 14.5209Z"]');

        elements.forEach(element => {
          element.parentElement.parentElement.click();
        });
      } catch (error) { }



      await sleep(WAIT_MS);
    }
  });
}

function stopAutoClicker(runId) {
  if (window.myRunId === runId) {
    window.myRunId = null;
    console.log("Stopped by user");
  }
}