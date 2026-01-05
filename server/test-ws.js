const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');
ws.on('open', () => {
  console.log('connected');
  ws.send('node -v');
  ws.send('npm -v');
  ws.send('python3 --version');
  ws.send('pip --version');
  setTimeout(()=>ws.close(),5000);
});
ws.on('message', (data)=>console.log('MSG:', String(data)));
ws.on('close', ()=>console.log('closed'));
ws.on('error', (e)=>console.error('err', e));
