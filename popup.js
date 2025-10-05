const exportBtn = document.getElementById('exportBtn');
const statusEl = document.getElementById('status');
const preview = document.getElementById('preview');
const downloadBtn = document.getElementById('downloadBtn');
const countEl = document.getElementById('count');

function setStatus(s){ statusEl.textContent = s; }

exportBtn.addEventListener('click', async () => {
  setStatus('Exporting...');
  preview.value = '';
  downloadBtn.disabled = true;
  countEl.textContent = '0';

  try {
    const [tab] = await chrome.tabs.query({active:true,lastFocusedWindow:true});
    if(!tab) throw new Error('No active tab');

    const format = document.getElementById('format').value || 'qna-csv';
    await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: (f) => { window.__quizletExporterFormat = f; },
      args: [format]
    });

    await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['content-script.js']
    });
  } catch (err) {
    setStatus('Error: ' + err.message);
  }
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || !msg.type) return;

  if (msg.type === 'csv-result') {
    // enable download and show CSV preview and counts
    statusEl.textContent = 'Ready';
    downloadBtn.disabled = false;
    downloadBtn.dataset.csv = msg.csv;
    // include format in filename if provided
    const fmt = msg.format ? `-${msg.format}` : '';
    downloadBtn.dataset.filename = (msg.filename ? msg.filename : 'quizlet-export') + fmt + '.csv';
    countEl.textContent = msg.count || 0;
    // show chosen format in the status area
    const formatLabel = (msg.format === 'qna-csv') ? 'Question & Answer CSV' : (msg.format || 'unknown');
    statusEl.textContent = `Ready — ${formatLabel}`;
    preview.value = msg.csv;
    return;
  }

  if (msg.type === 'csv-error') {
    setStatus('Error: ' + msg.error);
    return;
  }
});

downloadBtn.addEventListener('click', ()=>{
  const csv = downloadBtn.dataset.csv || preview.value;
  const filename = downloadBtn.dataset.filename || 'quizlet-export.csv';
  if(!csv){ setStatus('No CSV to download'); return; }
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  setStatus('Download started');
});
