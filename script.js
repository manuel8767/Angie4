/* script.js - lógica de Mente y Gol (todas las páginas)
   Usa localStorage:
   - "saldo" : number (float)
   - "hasDeposited" : "true"/"false"
   - "betAmount" : number (float) - monto usado en la apuesta actual
   - "selectedMatch" : "m1"|"m2"
   - "selectedOutcome" : "gana"|"empata"|"pierde" (cuando aplica)
*/
console.log("script.js cargado correctamente");

document.addEventListener("DOMContentLoaded", function() {

  // --- helpers ---
  function $(id){return document.getElementById(id)}
  function toNumber(v){ const n = parseFloat(v); return isNaN(n)? null : n; }
  function randFloat(min,max,dec=2){ return parseFloat((Math.random()*(max-min)+min).toFixed(dec)); }
  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

  // localStorage wrappers
  function getSaldo(){ return parseFloat(localStorage.getItem('saldo')) || 0; }
  function setSaldo(v){ localStorage.setItem('saldo', parseFloat(v).toFixed(2)); }
  function hasDeposited(){ return localStorage.getItem('hasDeposited') === 'true'; }
  function setHasDeposited(){ localStorage.setItem('hasDeposited','true'); }

  // inicializar saldo si no existe
  if(localStorage.getItem('saldo')===null){ setSaldo(0); }

  // ----- INDEX.HTML -----
  if ($('btnIngresar') || $('btnApostar') || $('btnSalir') || $('saldoIndex') || $('msgIndex')) {

    // If index.html exists with our elements:
    const start = $('startBtn');
    const ingresoBtn = $('btnIngresar');
    const apostarBtn = $('btnApostar');
    const salirBtn = $('btnSalir');
    const saldoSpan = $('saldoIndex');
    const mensaje = $('msgIndex');

    // fallbacks if ids aren't present (older versions) - try basic layout
    if(!saldoSpan){
      // create minimal index UI if not present
    } else {
      function refreshSaldoDisplay(){
        saldoSpan.textContent = getSaldo().toFixed(2);
      }
      refreshSaldoDisplay();

      if(ingresoBtn) ingresoBtn.addEventListener('click', ()=> window.location.href = 'dinero.html');

      if(apostarBtn){
        apostarBtn.addEventListener('click', ()=>{
          const s = getSaldo();
          if(s <= 0){
            if(mensaje){ mensaje.textContent = '❌ No puedes apostar: tu saldo es 0. Recarga dinero.'; mensaje.className='msg error' }
            return;
          }
          // si tiene saldo >0, preguntar cuánto usar (muestra prompt-like UI inline)
          // generamos un pequeño prompt dentro del index
          if($('betPrompt')) return; // already open
          const container = document.createElement('div');
          container.id = 'betPrompt';
          container.style.marginTop = '12px';
          container.innerHTML = `
            <div class="small-muted">¿Cuánto del saldo quieres usar para esta apuesta?</div>
            <input id="betAmountInput" type="number" min="1" placeholder="Monto a usar">
            <div style="margin-top:8px">
              <button class="btn" id="btnUse">Usar y apostar</button>
              <button class="btn btn-ghost" id="btnCancel">Cancelar</button>
            </div>
            <div id="betErr" class="msg"></div>
          `;
          (document.querySelector('.container') || document.body).appendChild(container);
          $('btnCancel').addEventListener('click', ()=>{ container.remove(); });
          $('btnUse').addEventListener('click', ()=>{
            const val = toNumber($('betAmountInput').value);
            const err = $('betErr');
            if(val===null || val<=0){ err.textContent='No se aceptan números negativos o texto. Ingresa un monto válido.'; err.className='msg error'; return; }
            if(val > getSaldo()){ err.textContent='No tienes suficiente saldo para usar ese monto.'; err.className='msg error'; return; }
            // save betAmount and go to apostar.html
            localStorage.setItem('betAmount', val);
            window.location.href = 'apostar.html';
          });
        });
      }

      if(salirBtn){
        salirBtn.addEventListener('click', ()=>{
          const s = getSaldo().toFixed(2);
          if(mensaje){
            mensaje.innerHTML = `Muchas gracias por habernos visitado Mister Wota, saliste con <b>$${s}</b> en tu bolsillo.`;
            mensaje.className='msg small-muted';
          }
          // disable buttons
          [ingresoBtn, apostarBtn, salirBtn].forEach(b=>{ if(b) { b.classList.add('disabled'); b.disabled = true }});
        });
      }
    }
  }

  // ----- DINERO.HTML -----
  if($('monto') && $('btnAceptar')) {
    const input = $('monto');
    const btn = $('btnAceptar');
    const msg = $('msgDinero');
    // If it's a deposit page that possibly was called from "loan mode"
    const modoPrestamo = localStorage.getItem('modoPrestamo') === 'true';
    const titulo = $('tituloDinero');
    if(titulo){
      titulo.textContent = modoPrestamo ? '¿Cuánto dinero quieres pedir prestado?' : '¿Cuánto dinero deseas ingresar?';
    }

    btn.addEventListener('click', ()=>{
      const val = toNumber(input.value);
      if(val === null){ msg.textContent = 'No se aceptan textos. Ingresa un número.'; msg.className='msg error'; return; }
      if(val <= 0){ msg.textContent = 'No se aceptan números negativos, vuelve a intentarlo.'; msg.className='msg error'; return; }
      // if loan mode maybe we want to mark differently. But per spec, just add to saldo and set hasDeposited
      const current = getSaldo();
      const newSaldo = current + val;
      setSaldo(newSaldo);
      setHasDeposited();
      localStorage.setItem('modoPrestamo','false'); // reset
      msg.textContent = '✅ Dinero guardado correctamente.';
      msg.className='msg success';
      setTimeout(()=> window.location.href = 'index.html', 1200);
    });
  }

  // ----- PRESTAMO.HTML -----
  if($('montoPrestamo') && $('btnAceptarPrestamo')) {
    const input = $('montoPrestamo');
    const btn = $('btnAceptarPrestamo');
    const msg = $('msgPrestamo');
    // require that user has deposited before requesting loan (as you requested earlier)
    btn.addEventListener('click', ()=>{
      if(!hasDeposited()){
        msg.textContent = 'Debes ingresar dinero propio primero.';
        msg.className='msg error';
        return;
      }
      const val = toNumber(input.value);
      if(val===null){ msg.textContent='No se aceptan textos. Ingresa un número.'; msg.className='msg error'; return; }
      if(val<=0){ msg.textContent='No se aceptan números negativos, vuelve a intentarlo.'; msg.className='msg error'; return; }
      // add loan to saldo (we could apply interest, but you didn't require it now)
      const newSaldo = getSaldo() + val;
      setSaldo(newSaldo);
      msg.textContent = `✅ Préstamo acreditado: $${val.toFixed(2)}.`;
      msg.className='msg success';
      setTimeout(()=> window.location.href = 'index.html', 1200);
    });
  }

  // ----- APOSTAR.HTML -----
  if($('match1') || $('match2') || $('saldoApostar')) {
    const saldoSpan = $('saldoApostar');
    if(saldoSpan) saldoSpan.textContent = getSaldo().toFixed(2);
    // Buttons to choose match
    const m1 = $('match1'), m2 = $('match2');
    if(m1) m1.addEventListener('click', ()=>{
      localStorage.setItem('selectedMatch','m1'); window.location.href='marcador.html';
    });
    if(m2) m2.addEventListener('click', ()=>{
      localStorage.setItem('selectedMatch','m2'); window.location.href='marcador.html';
    });
    // a back or home btn possibly
    const back = $('btnBackApostar');
    if(back) back.addEventListener('click', ()=> window.location.href='index.html');
  }

  // ----- MARCADOR.HTML -----
  if($('labelTeams') || $('btnElegirMarcador') || $('btnElegirDesenlace')) {
    // elements
    const labelTeams = $('labelTeams'); // where we will show match teams
    const btnMarc = $('btnElegirMarcador');
    const btnDes = $('btnElegirDesenlace');
    const resultBox = $('resultadoMarcador');
    const betAmount = toNumber(localStorage.getItem('betAmount')) || toNumber(localStorage.getItem('betAmount')) || 0;
    const currentSaldo = getSaldo();

    // assign team names by selectedMatch
    const sel = localStorage.getItem('selectedMatch') || 'm1';
    const matchNames = {
      m1: ['Imperio Blanco','Leones Catalanes'],
      m2: ['Titanes Azules','Verdes de la Montaña']
    };
    const teams = matchNames[sel] || ['Equipo A','Equipo B'];
    if(labelTeams) labelTeams.textContent = `${teams[0]} vs ${teams[1]}`;

    // ----- elegir marcador (inputs respectivos 0-6)
    if(btnMarc){
      btnMarc.addEventListener('click', ()=>{
        // show UI for entering exact goals
        const container = $('marcadorContainer');
        container.innerHTML = `
          <div class="small-muted">Si aciertas te damos <b id="multDisp">${randFloat(1.2,10,2)}</b> veces lo apostado</div>
          <div class="marcador" style="margin-top:10px">
            <div>
              <div class="small-muted">${teams[0]}</div>
              <input id="predLocal" type="number" min="0" max="6" placeholder="0-6">
            </div>
            <div style="align-self:center">—</div>
            <div>
              <div class="small-muted">${teams[1]}</div>
              <input id="predVisit" type="number" min="0" max="6" placeholder="0-6">
            </div>
          </div>
          <div style="margin-top:10px">
            <button class="btn" id="btnAceptarPred">Aceptar</button>
          </div>
          <div id="errPred" class="msg"></div>
          <div id="finalResult" class="msg"></div>
        `;
        // handler
        $('btnAceptarPred').addEventListener('click', ()=>{
          const predL = toNumber($('predLocal').value);
          const predV = toNumber($('predVisit').value);
          const err = $('errPred'); const final = $('finalResult');
          final.textContent=''; err.textContent='';
          if(predL===null || predV===null || predL<0 || predL>6 || predV<0 || predV>6){
            err.textContent='❌ Valores incorrectos. Ingresa números entre 0 y 6.';
            err.className='msg error'; return;
          }
          // read multiplier shown
          const mult = parseFloat($('multDisp').textContent) || randFloat(1.2,10,2);
          // generate real result
          const realL = randInt(0,6), realV = randInt(0,6);
          final.innerHTML = `El marcador final fue: <b>${teams[0]} ${realL} - ${realV} ${teams[1]}</b>`;
          // decide win: exact match both numbers
          if(predL === realL && predV === realV){
            // win: newSaldo = (currentSaldo - betAmount) already subtracted earlier? Per spec: when pressing bet from index we stored betAmount and didn't remove from saldo? In our earlier flow, index decreased saldo only when set? To be safe: previous flow saved betAmount and didn't subtract. We'll implement now consistent: at the moment of placing bet from index we stored betAmount but did not deduct. So compute remaining = getSaldo() - betAmount
            const s = getSaldo();
            const b = parseFloat(localStorage.getItem('betAmount')) || 0;
            const remaining = Math.max(0, s - b);
            const winnings = b * mult;
            const newSaldo = remaining + winnings;
            setSaldo(newSaldo);
            final.innerHTML += `<div class="msg success">Has ganado! tu apuesta multiplicada x${mult.toFixed(2)} produjo $${winnings.toFixed(2)}</div>`;
          } else {
            // lose: subtract bet amount from saldo (remaining)
            const s = getSaldo();
            const b = parseFloat(localStorage.getItem('betAmount')) || 0;
            const remaining = Math.max(0, s - b);
            setSaldo(remaining);
            final.innerHTML += `<div class="msg error">Perdiste la apuesta. Se ha deducido $${b.toFixed(2)} de tu saldo.</div>`;
          }
          // clear stored bet and selectedMatch after brief pause and go index
          setTimeout(()=>{ localStorage.removeItem('betAmount'); localStorage.removeItem('selectedMatch'); window.location.href='index.html' }, 2200);
        });
      });
    }

    // ----- elegir desenlace (gana/empata/pierde) -----
    if(btnDes){
      btnDes.addEventListener('click', ()=>{
        const container = $('marcadorContainer');
        // generate three random multipliers for gana, empata, pierde
        const multG = randFloat(1.2,10,2);
        const multE = randFloat(1.2,10,2);
        const multP = randFloat(1.2,10,2);
        container.innerHTML = `
          <div class="small-muted">¿A cuál equipo le vas a apostar?</div>
          <select id="selEquipo" style="margin-top:8px">
            <option value="local">${teams[0]}</option>
            <option value="visitante">${teams[1]}</option>
          </select>

          <div style="margin-top:10px" id="multipliersBlock">
            <div>Si gana (x): <b id="xVal">${multG}</b> veces lo apostado</div>
            <div>Si empata (k): <b id="kVal">${multE}</b> veces lo apostado</div>
            <div>Si pierde (z): <b id="zVal">${multP}</b> veces lo apostado</div>
          </div>

          <div style="margin-top:10px">Elige tu opción</div>
          <select id="selResultado" style="margin-top:8px">
            <option value="pierde">Pierde</option>
            <option value="empata">Empata</option>
            <option value="gana">Gana</option>
          </select>

          <div style="margin-top:10px">
            <button class="btn" id="btnAceptarDes">Aceptar</button>
          </div>
          <div id="errDes" class="msg"></div>
          <div id="finalDes" class="msg"></div>
        `;
        $('btnAceptarDes').addEventListener('click', ()=>{
          const choice = $('selResultado').value; // 'pierde'|'empata'|'gana'
          const err = $('errDes'), final = $('finalDes');
          err.textContent=''; final.textContent='';
          // pick random 1..3
          const outcomeRand = randInt(1,3); // 1->pierde,2->empata,3->gana
          const map = {1:'pierde',2:'empata',3:'gana'};
          const actual = map[outcomeRand];
          // get multiplier according to what was displayed
          const x = parseFloat($('xVal').textContent);
          const k = parseFloat($('kVal').textContent);
          const z = parseFloat($('zVal').textContent);
          const b = parseFloat(localStorage.getItem('betAmount')) || 0;
          if(!b || b<=0){ err.textContent='No se encontró el monto a apostar. Regresa e indica cuánto vas a usar.'; err.className='msg error'; return; }
          if(choice === actual){
            // win with appropriate multiplier
            let usedMult = 1.0;
            if(actual==='gana') usedMult = x;
            if(actual==='empata') usedMult = k;
            if(actual==='pierde') usedMult = z;
            const s = getSaldo();
            const remaining = Math.max(0, s - b);
            const winnings = b * usedMult;
            const newSaldo = remaining + winnings;
            setSaldo(newSaldo);
            final.innerHTML = `<div class="msg success">Has ganado! Resultado: ${actual}. Tu premio: $${winnings.toFixed(2)} (x${usedMult.toFixed(2)})</div>`;
          } else {
            // lose
            const s = getSaldo();
            const remaining = Math.max(0, s - b);
            setSaldo(remaining);
            final.innerHTML = `<div class="msg error">Perdiste. Resultado real: ${actual}. Se dedujo $${b.toFixed(2)}.</div>`;
          }
          setTimeout(()=>{ localStorage.removeItem('betAmount'); localStorage.removeItem('selectedMatch'); window.location.href='index.html' }, 2000);
        });
      });
    }
  }

  // ----- on index page update display if element present -----
  if($('saldoIndex')){ $('saldoIndex').textContent = getSaldo().toFixed(2); }

});
