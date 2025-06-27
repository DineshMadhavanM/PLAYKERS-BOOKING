// script.js

// --- Utility functions ---
function saveToLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function loadFromLS(key) {
  return JSON.parse(localStorage.getItem(key) || 'null');
}
function clearMatchSetup() {
  localStorage.removeItem('matchSetup');
  localStorage.removeItem('matchState');
}

// --- Step Navigation ---
function showStep(stepNum) {
  document.querySelectorAll('.setup-step').forEach((el, i) => {
    el.style.display = (i === stepNum - 1) ? 'block' : 'none';
    el.classList.toggle('active', i === stepNum - 1);
  });
}

// --- Match Setup Wizard ---
let matchSetup = loadFromLS('matchSetup') || {};

// Step 1: Squad Entry
const step1Btn = document.getElementById('toStep2');
step1Btn.onclick = function () {
  const teamAName = document.getElementById('teamAName').value.trim();
  const teamBName = document.getElementById('teamBName').value.trim();
  const teamASquad = Array.from(document.querySelectorAll('.teamASquad')).map(i => i.value.trim()).filter(Boolean);
  const teamBSquad = Array.from(document.querySelectorAll('.teamBSquad')).map(i => i.value.trim()).filter(Boolean);
  if (!teamAName || !teamBName || teamASquad.length !== 15 || teamBSquad.length !== 15) {
    alert('Please enter 15 players for each team and both team names.');
    return;
  }
  matchSetup.teamA = { name: teamAName, squad: teamASquad };
  matchSetup.teamB = { name: teamBName, squad: teamBSquad };
  saveToLS('matchSetup', matchSetup);
  // Populate toss options
  const tossWinner = document.getElementById('tossWinner');
  tossWinner.innerHTML = `<option value="${teamAName}">${teamAName}</option><option value="${teamBName}">${teamBName}</option>`;
  showStep(2);
};

// Step 2: Toss and Choice
const step2Btn = document.getElementById('toStep3');
step2Btn.onclick = function () {
  const tossWinner = document.getElementById('tossWinner').value;
  const tossDecision = document.getElementById('tossDecision').value;
  if (!tossWinner || !tossDecision) {
    alert('Please select toss winner and decision.');
    return;
  }
  matchSetup.toss = { winner: tossWinner, decision: tossDecision };
  // Determine 1st innings batting/bowling
  if (tossDecision === 'bat') {
    matchSetup.firstBat = tossWinner;
    matchSetup.firstBowl = (tossWinner === matchSetup.teamA.name) ? matchSetup.teamB.name : matchSetup.teamA.name;
  } else {
    matchSetup.firstBowl = tossWinner;
    matchSetup.firstBat = (tossWinner === matchSetup.teamA.name) ? matchSetup.teamB.name : matchSetup.teamA.name;
  }
  saveToLS('matchSetup', matchSetup);
  renderXISelection();
  showStep(3);
};

// Step 3: Select Playing XI
function renderXISelection() {
  const teamA = matchSetup.teamA;
  const teamB = matchSetup.teamB;
  const teamA_XI = document.getElementById('teamA_XI_select');
  const teamB_XI = document.getElementById('teamB_XI_select');
  teamA_XI.innerHTML = '<div class="xi-list">' + teamA.squad.map((p, i) =>
    `<label class="xi-item"><input type="checkbox" class="teamAxi" value="${p}">${p}</label>`
  ).join('') + '</div>';
  teamB_XI.innerHTML = '<div class="xi-list">' + teamB.squad.map((p, i) =>
    `<label class="xi-item"><input type="checkbox" class="teamBxi" value="${p}">${p}</label>`
  ).join('') + '</div>';
}
const step3Btn = document.getElementById('toStep4');
step3Btn.onclick = function () {
  const teamAxi = Array.from(document.querySelectorAll('.teamAxi:checked')).map(i => i.value);
  const teamBxi = Array.from(document.querySelectorAll('.teamBxi:checked')).map(i => i.value);
  if (teamAxi.length !== 11 || teamBxi.length !== 11) {
    alert('Select exactly 11 players for each Playing XI.');
    return;
  }
  matchSetup.teamA.xi = teamAxi;
  matchSetup.teamB.xi = teamBxi;
  saveToLS('matchSetup', matchSetup);
  showStep(4);
};

// Step 4: Match Config
const step4Btn = document.getElementById('toStep5');
const oversInput = document.getElementById('totalOvers');
const bowlerLimitInfo = document.getElementById('bowlerLimitInfo');
const ballTypeInput = document.getElementById('ballType');

oversInput.oninput = function () {
  const overs = parseInt(oversInput.value);
  if (overs >= 1 && overs <= 50) {
    const limit = Math.floor(overs / 5) || 1;
    bowlerLimitInfo.textContent = `Each bowler can bowl a maximum of ${limit} over(s).`;
  } else {
    bowlerLimitInfo.textContent = '';
  }
};
step4Btn.onclick = function () {
  const overs = parseInt(oversInput.value);
  const ballType = ballTypeInput.value;
  if (!overs || overs < 1 || overs > 50) {
    alert('Enter total overs (1-50).');
    return;
  }
  if (!ballType) {
    alert('Select ball type.');
    return;
  }
  matchSetup.overs = overs;
  matchSetup.bowlerLimit = Math.floor(overs / 5) || 1;
  matchSetup.ballType = ballType;
  saveToLS('matchSetup', matchSetup);
  renderStartMatchSelects();
  showStep(5);
};

// Step 5: Select Striker, Non-striker, Bowler
function renderStartMatchSelects() {
  const batTeam = (matchSetup.firstBat === matchSetup.teamA.name) ? matchSetup.teamA : matchSetup.teamB;
  const bowlTeam = (matchSetup.firstBowl === matchSetup.teamA.name) ? matchSetup.teamA : matchSetup.teamB;
  const strikerSel = document.getElementById('strikerSelect');
  const nonStrikerSel = document.getElementById('nonStrikerSelect');
  const bowlerSel = document.getElementById('firstBowlerSelect');
  strikerSel.innerHTML = batTeam.xi.map(p => `<option value="${p}">${p}</option>`).join('');
  nonStrikerSel.innerHTML = batTeam.xi.map(p => `<option value="${p}">${p}</option>`).join('');
  bowlerSel.innerHTML = bowlTeam.xi.map(p => `<option value="${p}">${p}</option>`).join('');
  strikerSel.onchange = function () {
    const s = strikerSel.value;
    nonStrikerSel.innerHTML = batTeam.xi.filter(p => p !== s).map(p => `<option value="${p}">${p}</option>`).join('');
  };
  nonStrikerSel.onchange = function () {
    const ns = nonStrikerSel.value;
    strikerSel.innerHTML = batTeam.xi.filter(p => p !== ns).map(p => `<option value="${p}">${p}</option>`).join('');
  };
  strikerSel.dispatchEvent(new Event('change'));
}

const setupForm = document.getElementById('setupForm');
setupForm.onsubmit = function (e) {
  e.preventDefault();
  const striker = document.getElementById('strikerSelect').value;
  const nonStriker = document.getElementById('nonStrikerSelect').value;
  const bowler = document.getElementById('firstBowlerSelect').value;
  if (!striker || !nonStriker || !bowler || striker === nonStriker) {
    alert('Select valid striker, non-striker, and bowler.');
    return;
  }
  matchSetup.striker = striker;
  matchSetup.nonStriker = nonStriker;
  matchSetup.bowler = bowler;
  saveToLS('matchSetup', matchSetup);
  setupForm.style.display = 'none';
  document.getElementById('scorerSection').style.display = '';
  startScoring();
};

// --- Scoring Engine ---
let matchState = null;
let undoStack = [];

function saveForUndo() {
  undoStack.push(JSON.stringify(matchState));
}

function startScoring() {
  const setup = matchSetup;
  const battingTeam = (setup.firstBat === setup.teamA.name) ? setup.teamA : setup.teamB;
  const bowlingTeam = (setup.firstBowl === setup.teamA.name) ? setup.teamA : setup.teamB;
  matchState = {
    teamA: setup.teamA,
    teamB: setup.teamB,
    battingTeam: battingTeam.name,
    bowlingTeam: bowlingTeam.name,
    battingXI: battingTeam.xi,
    bowlingXI: bowlingTeam.xi,
    striker: setup.striker,
    nonStriker: setup.nonStriker,
    bowler: setup.bowler,
    overs: setup.overs,
    bowlerLimit: setup.bowlerLimit,
    ballType: setup.ballType,
    balls: [],
    batsmen: battingTeam.xi.map(name => ({ name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissal: null })),
    bowlers: bowlingTeam.xi.map(name => ({ name, balls: 0, runs: 0, wickets: 0 })),
    total: 0,
    totalBalls: 0,
    wickets: 0,
    over: 0,
    ballInOver: 0,
    currentOverBalls: [],
    prevBowler: null,
    completed: false,
    history: [],
    innings: 1,
    nextBatsmen: battingTeam.xi.filter(n => n !== setup.striker && n !== setup.nonStriker),
    nextBowlers: bowlingTeam.xi.filter(n => n !== setup.bowler),
    overHistory: [],
    target: null,
    matchSetup: setup
  };
  saveToLS('matchState', matchState);
  renderScoringUI();
}

function renderScoringUI() {
  const el = document.getElementById('scoringUI');
  if (!matchState) return;
  let targetHTML = '';
  if (matchState.innings === 2 && matchState.target) {
    targetHTML = `<div class="score-summary" style="background:#fffbe6;color:#b7791f;"><b>Target: ${matchState.target}</b></div>`;
  }
  let winnerHTML = '';
  if (matchState.completed && matchState.winner) {
    winnerHTML = `<div class="score-summary" style="background:#e6fffa;color:#225ea8;"><b>Match Over: ${matchState.winner}</b></div>`;
  }

  // --- SAVE & NEW MATCH BUTTON LOGIC ---
  let actionButtons = '';
  if (matchState.completed) {
      actionButtons = `
        <button class='btn' id='saveMatchBtn'>Save Match</button>
        <button class='btn' id='newMatchBtn' style='margin-top:1.5rem;'>Start New Match</button>
      `;
  }

  const teamOvers = `${matchState.over}.${matchState.ballInOver}`;
  const bowlerStats = getBowlerStats(matchState.bowler);

  el.innerHTML = `
    ${targetHTML}
    ${winnerHTML}
    <div class="score-summary">
      <span><b>${matchState.battingTeam}</b>: ${matchState.total}/${matchState.wickets} (${teamOvers})</span>
    </div>
    <div class="scorer-cards">
       <div class="batsman-card active">
         <span>Striker: ${matchState.striker}*</span>
         <span>${getBatsmanStats(matchState.striker)}</span>
       </div>
       <div class="batsman-card">
         <span>Non-Striker: ${matchState.nonStriker}</span>
         <span>${getBatsmanStats(matchState.nonStriker)}</span>
       </div>
       <div class="bowler-card active">
         <span>Bowler: ${matchState.bowler}</span>
         <span>${bowlerStats}</span>
       </div>
     </div>
    <div class="ball-inputs" id="ballInputs">
       <button class="ball-btn" data-run="0">0</button>
       <button class="ball-btn" data-run="1">1</button>
       <button class="ball-btn" data-run="2">2</button>
       <button class="ball-btn" data-run="3">3</button>
       <button class="ball-btn" data-run="4">4</button>
       <button class="ball-btn" data-run="5">5</button>
       <button class="ball-btn" data-run="6">6</button>
       <button class="ball-btn" data-type="lb" data-lb="1">lb1</button>
       <button class="ball-btn" data-type="wd">wd</button>
       <button class="ball-btn" data-type="nb">nb</button>
    </div>
    <div class="top-wicket-btns"><button class="ball-btn wicket-btn" id="topWicketBtn">Wicket</button></div>
    <div id="overHistory"></div>
    <div id="scorecardTables"></div>
    <div id="scoringModals"></div>
    <button class="undo-btn" id="undoBtn">Undo</button>
    <div id="action-buttons">${actionButtons}</div>
  `;
  
  if (matchState.completed) {
    document.getElementById('ballInputs').style.display = 'none';
    document.getElementById('topWicketBtn').style.display = 'none';
    document.getElementById('undoBtn').style.display = 'none';

    if (document.getElementById('newMatchBtn')) {
        document.getElementById('newMatchBtn').onclick = () => {
            clearMatchSetup();
            location.reload();
        };
    }
    if (document.getElementById('saveMatchBtn')) {
        // This should be wired to the function that saves to backend
        // For now, it can just show an alert or save to a different LS key
        document.getElementById('saveMatchBtn').onclick = saveMatch;
    }
  } else {
    // Re-attach listeners for an active match
    document.querySelectorAll('.ball-btn').forEach(btn => {
        if (btn.id === 'topWicketBtn') {
            btn.onclick = handleWicket;
        } else {
            btn.onclick = function() {
                if (isModalActive()) return;
                if (btn.dataset.run) handleBall({ run: parseInt(btn.dataset.run) });
                else if (btn.dataset.type === 'lb') handleBall({ type: 'lb', lb: parseInt(btn.dataset.lb) });
                else if (btn.dataset.type === 'wd') handleBall({ type: 'wd' });
                else if (btn.dataset.type === 'nb') handleBall({ type: 'nb' });
            };
        }
    });
    document.getElementById('undoBtn').onclick = undoLastBall;
  }

  renderScorecardTables();
  renderOverHistory();
    if (matchState.completed) {
        const saveBox = document.getElementById('saveMatchBox');
        if (saveBox) saveBox.style.display = 'block';
        const saveBtn = document.getElementById('saveMatchBtn');
        if (saveBtn) saveBtn.onclick = saveMatch;
    } else {
        const saveBox = document.getElementById('saveMatchBox');
        if (saveBox) saveBox.style.display = 'none';
    }
}

function getBatsmanStats(name) {
  const b = matchState.batsmen.find(x => x.name === name);
  if (!b) return '';
  const sr = b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
  return `${b.runs} (${b.balls}) 4s:${b.fours} 6s:${b.sixes} SR:${sr}`;
}

function getBowlerStats(name) {
  if (!name) return '';
  const b = matchState.bowlers.find(p => p.name === name);
  if (!b) return '0.0-0-0-0';
  const overs = Math.floor(b.balls / 6);
  const ballsInOver = b.balls % 6;
  return `${overs}.${ballsInOver} Overs, ${b.maidens} Maidens, ${b.runs} Runs, ${b.wickets} Wickets`;
}

function handleBall({ run = 0, type = null, lb = 0 }) {
  if (matchState.completed || isModalActive()) return;
  saveForUndo();

  const s = matchState.striker;
  const ns = matchState.nonStriker;
  const b = matchState.bowler;
  const event = { run, type, lb, striker: s, nonStriker: ns, bowler: b };
  
  // --- STATS LOGIC ---
  const batsman = matchState.batsmen.find(p => p.name === s);
  const bowler = matchState.bowlers.find(p => p.name === b);

  let isLegalBall = true;
  if (type === 'Wd' || type === 'Nb') {
    isLegalBall = false;
    matchState.total += 1 + run; // Extra run for wide/no-ball + any runs
    bowler.runs += 1 + run;
  } else {
    matchState.total += run + lb;
    batsman.runs += run;
    bowler.runs += run + lb;
  }
  
  if (run === 4 && type !== 'Wd' && type !== 'Nb') batsman.fours++;
  if (run === 6 && type !== 'Wd' && type !== 'Nb') batsman.sixes++;
  
  // Only increment balls for legal deliveries
  if (isLegalBall) {
    matchState.totalBalls++;
    matchState.ballInOver++;
    batsman.balls++;
    bowler.balls++;
  }

  matchState.balls.push(event);
  matchState.currentOverBalls.push(event);
  
  // Rotate strike
  if ((run % 2 !== 0 && type !== 'Wd' && type !== 'Nb') || (run % 2 === 0 && (type === 'Wd' || type === 'Nb'))) {
      matchState.striker = ns;
      matchState.nonStriker = s;
  }
  
  // End of Over
  if (matchState.ballInOver === 6) {
    // Check for maiden over
    const runsInOver = matchState.currentOverBalls.reduce((acc, ball) => {
        // A maiden over is one where no runs are scored off the bat or from wides/no-balls.
        if (ball.type === 'Wd' || ball.type === 'Nb') {
          return acc + 1 + ball.run;
        }
        return acc + ball.run;
    }, 0);

    if (runsInOver === 0) {
        bowler.maidens++;
    }

    matchState.over++;
    matchState.ballInOver = 0;
    matchState.currentOverBalls = [];
    matchState.overHistory.push({ bowler: matchState.bowler, over: matchState.over, runs: runsInOver });
    matchState.prevBowler = matchState.bowler;
    
    // Rotate strike for new over
    matchState.striker = ns;
    matchState.nonStriker = s;
    
    if (checkMatchCompletion()) {
      renderScoringUI();
      return;
    }

    promptNewBowler();
    return;
  }
  
  saveToLS('matchState', matchState);
  renderScoringUI();
}

function handleWicket() {
  if (isModalActive()) return;
  showWicketModal((dismissal) => {
    saveForUndo();

    const bowler = matchState.bowlers.find(p => p.name === matchState.bowler);
    const outBatsmanState = matchState.batsmen.find(p => p.name === dismissal.batsman);
    
    // 1. Process as a legal delivery
    outBatsmanState.balls++;
    bowler.balls++;
    matchState.totalBalls++;
    matchState.ballInOver++;

    // 2. Update wicket stats
    outBatsmanState.out = true;
    outBatsmanState.dismissal = dismissal;
    bowler.wickets++;
    matchState.wickets++;
    
    const event = { run: 0, type: 'Wkt', striker: outBatsmanState.name, dismissal };
    matchState.balls.push(event);
    matchState.currentOverBalls.push(event);

    // 3. Check if innings or match is over
    if (matchState.wickets === 10 || matchState.over === matchState.overs) {
      endInnings();
      return;
    }

    const isEndOfOver = matchState.ballInOver === 6;

    // 4. Prompt for next batsman
    promptNewBatsman(dismissal.batsman, () => {
      // 5. Handle end of over logic AFTER new batsman is selected
      if (isEndOfOver) {
        const runsInOver = matchState.currentOverBalls.reduce((acc, b) => acc + (b.run || 0) + (b.lb || 0) + (b.type === 'Wd' || b.type === 'Nb' ? 1 : 0), 0);
        if (runsInOver === 0) bowler.maidens++;
        
        matchState.over++;
        matchState.ballInOver = 0;
        matchState.currentOverBalls = [];
        matchState.prevBowler = matchState.bowler;

        // Swap strike for the new over
        [matchState.striker, matchState.nonStriker] = [matchState.nonStriker, matchState.striker];
        
        promptNewBowler();
      } else {
        // Not end of over, just save and re-render
        saveToLS('matchState', matchState);
        renderScoringUI();
      }
    });
  });
}

function promptNewBatsman(outBatsmanName, onConfirmCallback) {
  const availableBatsmen = matchState.battingXI.filter(p => {
    const p_state = matchState.batsmen.find(b => b.name === p);
    return p_state && !p_state.out && p !== matchState.striker && p !== matchState.nonStriker;
  });

  if (availableBatsmen.length === 0) {
    endInnings();
    return;
  }

  const modalContent = `
    <div class="modal-bg">
        <div class="modal">
            <h3>Select Next Batsman</h3>
            <select id="newBatsmanSelect" class="input">
                ${availableBatsmen.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
            <button id="confirmNewBatsman" class="btn">Confirm</button>
        </div>
    </div>`;
  document.getElementById('scoringModals').innerHTML = modalContent;

  document.getElementById('confirmNewBatsman').onclick = () => {
    const newBatsmanName = document.getElementById('newBatsmanSelect').value;
    if (newBatsmanName) {
      // The new batsman replaces the one who got out
      if (matchState.striker === outBatsmanName) {
          matchState.striker = newBatsmanName;
      } else {
          matchState.nonStriker = newBatsmanName;
      }
      document.getElementById('scoringModals').innerHTML = '';
      if (onConfirmCallback) onConfirmCallback();
    }
  };
}

function promptNewBowler() {
  const bowlingTeam = (matchState.bowlingTeam === matchState.teamA.name) ? matchState.teamA : matchState.teamB;
  
  // Bowlers can be selected from the entire 15-player squad
  const eligibleBowlers = bowlingTeam.squad.filter(p => {
    // Cannot be the same as the previous bowler
    if (p === matchState.prevBowler) return false;
    
    // Check if bowler has reached their over limit
    const bowlerStats = matchState.bowlers.find(b => b.name === p);
    if (bowlerStats && Math.floor(bowlerStats.balls / 6) >= matchState.bowlerLimit) {
      return false;
    }
    return true;
  });

  const modal = document.getElementById('scoringModals');
  modal.innerHTML = `<div class="modal-bg"><div class="modal">
    <h3>Select Next Bowler</h3>
    <select id="nextBowlerSel">${eligibleBowlers.map(n => `<option value="${n}">${n}</option>`).join('')}</select>
    <button id="confirmNextBowler">Confirm</button>
  </div></div>`;

  document.getElementById('confirmNextBowler').onclick = function() {
    const newBowlerName = document.getElementById('nextBowlerSel').value;
    matchState.bowler = newBowlerName;

    // If the selected bowler is not already in the matchState.bowlers array, add them.
    if (!matchState.bowlers.find(b => b.name === newBowlerName)) {
        matchState.bowlers.push({ name: newBowlerName, balls: 0, runs: 0, wickets: 0 });
    }

    modal.innerHTML = '';
    saveToLS('matchState', matchState);
    renderScoringUI();
  };
}

function showWicketModal(callback) {
  const bowlingTeamXI = matchState.bowlingXI;
  const modalContent = `
    <div class="modal-backdrop">
      <div class="modal-content">
        <h3>Wicket Details</h3>
        <select id="wicketTypeSel" class="input">
          <option value="bowled">Bowled</option>
          <option value="caught">Caught</option>
          <option value="lbw">LBW</option>
          <option value="runout">Run Out</option>
          <option value="stumped">Stumped</option>
          <option value="hitwicket">Hit Wicket</option>
          <option value="retired">Retired Hurt</option>
        </select>
        <div id="wicketExtraFields" style="margin-top: 1rem;"></div>
        <button id="confirmWicket" class="btn" style="margin-top: 1rem;">Confirm Wicket</button>
      </div>
    </div>
  `;
  document.getElementById('scoringModals').innerHTML = modalContent;

  const wicketTypeSel = document.getElementById('wicketTypeSel');
  const extraFields = document.getElementById('wicketExtraFields');

  wicketTypeSel.onchange = function () {
    const type = this.value;
    extraFields.innerHTML = ''; // Clear previous fields

    if (type === 'caught') {
      extraFields.innerHTML = `
        <label>Fielder:</label>
        <select id="fielderSel" class="input">
          ${bowlingTeamXI.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>`;
    } else if (type === 'runout') {
      extraFields.innerHTML = `
        <label>Batsman Out:</label>
        <select id="outBatsmanSel" class="input">
          <option value="striker">${matchState.striker} (Striker)</option>
          <option value="non-striker">${matchState.nonStriker} (Non-Striker)</option>
        </select>
        <label style="margin-top:0.5rem;display:block;">Fielder:</label>
        <select id="fielderSel" class="input">
          ${bowlingTeamXI.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>`;
    } else if (type === 'stumped') {
      const keeper = bowlingTeamXI.find(p => p !== matchState.bowler) || bowlingTeamXI[0];
      extraFields.innerHTML = `
        <label>Wicketkeeper:</label>
        <select id="keeperSel" class="input">
          ${bowlingTeamXI.map(p => `<option value="${p}" ${p === keeper ? 'selected' : ''}>${p}</option>`).join('')}
        </select>`;
    }
  };
  
  // Trigger change to show default fields if any
  wicketTypeSel.dispatchEvent(new Event('change'));

  document.getElementById('confirmWicket').onclick = function () {
    const type = wicketTypeSel.value;
    let dismissal = { type: type, batsman: matchState.striker };

    if (type === 'caught') {
      dismissal.fielder = document.getElementById('fielderSel').value;
    } else if (type === 'runout') {
      dismissal.fielder = document.getElementById('fielderSel').value;
      const outRole = document.getElementById('outBatsmanSel').value;
      dismissal.batsman = (outRole === 'striker') ? matchState.striker : matchState.nonStriker;
    } else if (type === 'stumped') {
      dismissal.keeper = document.getElementById('keeperSel').value;
    }

    document.getElementById('scoringModals').innerHTML = ''; // Clear modal
    callback(dismissal);
  };
}

function endInnings() {
  const firstInningsData = {
    battingTeam: matchState.battingTeam,
    bowlingTeam: matchState.bowlingTeam,
    score: matchState.total,
    wickets: matchState.wickets,
    overs: `${matchState.over}.${matchState.ballInOver}`,
    batsmen: matchState.batsmen.filter(b => b.balls > 0 || b.out),
    bowlers: matchState.bowlers.filter(b => b.balls > 0)
  };

  if (!matchState.firstInnings) {
    // --- Starting Second Innings ---
    matchState.firstInnings = firstInningsData;
    matchState.target = matchState.total + 1;

    // Swap teams
    const oldBattingTeam = matchState.battingTeam;
    matchState.battingTeam = matchState.bowlingTeam;
    matchState.bowlingTeam = oldBattingTeam;

    matchState.battingXI = (matchState.battingTeam === matchState.teamA.name) ? matchState.teamA.xi : matchState.teamB.xi;
    matchState.bowlingXI = (matchState.bowlingTeam === matchState.teamA.name) ? matchState.teamA.xi : matchState.teamB.xi;
    
    // Reset match state for second innings
    matchState.total = 0;
    matchState.wickets = 0;
    matchState.over = 0;
    matchState.ballInOver = 0;
    matchState.totalBalls = 0;
    matchState.balls = [];
    matchState.currentOverBalls = [];
    matchState.overHistory = [];
    matchState.batsmen = matchState.battingXI.map(name => ({ name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissal: null }));
    matchState.bowlers = matchState.bowlingXI.map(name => ({ name, balls: 0, maidens: 0, runs: 0, wickets: 0 }));

    promptSecondInningsStart();
  } else {
    // --- Ending Match ---
    matchState.secondInnings = firstInningsData;
    matchState.completed = true;
    checkMatchCompletion(); // To declare winner
    saveToLS('matchState', matchState);
    renderScoringUI();
  }
}

function promptSecondInningsStart() {
  const modalContent = `
    <div class="modal-bg">
      <div class="modal">
        <h3>Second Innings</h3>
        <p>Target: <strong>${matchState.target}</strong></p>
        <label>Striker:</label>
        <select id="strikerSelect" class="input">
          ${matchState.battingXI.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
        <label>Non-Striker:</label>
        <select id="nonStrikerSelect" class="input"></select>
        <label>Opening Bowler:</label>
        <select id="bowlerSelect" class="input">
           ${matchState.bowlingXI.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
        <button id="startSecondInningsBtn" class="btn">Start Innings</button>
      </div>
    </div>`;
  document.getElementById('scoringModals').innerHTML = modalContent;

  const strikerSel = document.getElementById('strikerSelect');
  const nonStrikerSel = document.getElementById('nonStrikerSelect');
  
  const updateNonStrikerOptions = () => {
    const s = strikerSel.value;
    nonStrikerSel.innerHTML = matchState.battingXI.filter(p => p !== s).map(p => `<option value="${p}">${p}</option>`).join('');
  };
  strikerSel.onchange = updateNonStrikerOptions;
  updateNonStrikerOptions(); // Initial population

  document.getElementById('startSecondInningsBtn').onclick = () => {
    matchState.striker = strikerSel.value;
    matchState.nonStriker = nonStrikerSel.value;
    matchState.bowler = document.getElementById('bowlerSelect').value;

    if (matchState.striker === matchState.nonStriker) {
      alert('Striker and Non-Striker must be different players.');
      return;
    }
    
    document.getElementById('scoringModals').innerHTML = '';
    saveToLS('matchState', matchState);
    renderScoringUI();
  };
}

function checkMatchCompletion() {
    if (matchState.innings === 2 && matchState.total >= matchState.target) {
        matchState.completed = true;
        matchState.winner = `${matchState.battingTeam} won by ${10 - matchState.wickets} wickets`;
    } else if (matchState.wickets === 10 || matchState.over === matchState.overs) {
        if (matchState.innings === 2) {
             matchState.completed = true;
             if(matchState.total < matchState.target - 1) {
                matchState.winner = `${matchState.bowlingTeam} won by ${matchState.target - 1 - matchState.total} runs`;
             } else {
                matchState.winner = "Match Tied";
             }
        }
    }
}

function isModalActive() {
  const modal = document.getElementById('scoringModals');
  return modal && modal.innerHTML.trim() !== '';
}

function renderScorecardTables() {
  let bats = matchState.batsmen.map(b =>
    `<tr>
      <td>${b.name}</td>
      <td>${b.runs}</td>
      <td>${b.balls}</td>
      <td>${b.fours}</td>
      <td>${b.sixes}</td>
      <td>${b.out ? 'Out' : 'Not Out'}</td>
      <td>${b.dismissal ? formatDismissal(b.dismissal) : ''}</td>
    </tr>`
  ).join('');
  let bowl = matchState.bowlers.map(b => {
    let overs = `${Math.floor(b.balls / 6)}.${b.balls % 6}`;
    let econ = b.balls ? (b.runs / (b.balls / 6)).toFixed(2) : '0.00';
    return `<tr>
      <td>${b.name}</td>
      <td>${overs}</td>
      <td>${b.runs}</td>
      <td>${b.wickets}</td>
      <td>${econ}</td>
    </tr>`;
  }).join('');
  document.getElementById('scorecardTables').innerHTML = `
    <h5>Batting</h5>
    <table class="scorecard-table"><thead><tr><th>Name</th><th>Runs</th><th>Balls</th><th>4s</th><th>6s</th><th>Status</th><th>Dismissal</th></tr></thead><tbody>${bats}</tbody></table>
    <h5>Bowling</h5>
    <table class="scorecard-table"><thead><tr><th>Name</th><th>Overs</th><th>Runs</th><th>Wickets</th><th>Economy</th></tr></thead><tbody>${bowl}</tbody></table>
  `;
}

function formatDismissal(d) {
  if (!d) return '';
  if (d.type === 'caught') return `Caught by ${d.fielder} b. ${d.bowler}`;
  if (d.type === 'runout') return `Run Out by ${d.fielder}`;
  if (d.type === 'stumped') return `Stumped by ${d.keeper} b. ${d.bowler}`;
  if (d.type === 'bowled') return `Bowled by ${d.bowler}`;
  if (d.type === 'lbw') return `LBW b. ${d.bowler}`;
  if (d.type === 'hitwicket') return `Hit Wicket b. ${d.bowler}`;
  if (d.type === 'retired') return `Retired Hurt`;
  return d.type;
}

function renderOverHistory() {
  const el = document.getElementById('overHistory');
  if (!el || !matchState.overHistory) return;
  
  let html = '<h4>Over History</h4>';
  matchState.overHistory.forEach(over => {
    html += `<div class="over-summary"><b>Over ${over.over}:</b> ${over.runs} runs (Bowler: ${over.bowler})</div>`;
  });
  el.innerHTML = html;
}

function undoLastBall() {
  if (undoStack.length > 0) {
    matchState = JSON.parse(undoStack.pop());
    saveToLS('matchState', matchState);
    renderScoringUI();
  }
}

function exportCSV() {
  let csv = `Team,${matchState.battingTeam}\nScore,${matchState.total}/${matchState.wickets} (${matchState.over})\n\nBatting\nName,Runs,Balls,4s,6s,Status,Dismissal\n`;
  csv += matchState.batsmen.map(b =>
    `${b.name},${b.runs},${b.balls},${b.fours},${b.sixes},${b.out ? 'Out' : 'Not Out'},${b.dismissal ? formatDismissal(b.dismissal) : ''}`
  ).join('\n');
  csv += `\n\nBowling\nName,Overs,Runs,Wickets,Economy\n`;
  csv += matchState.bowlers.map(b => {
    let overs = `${Math.floor(b.balls / 6)}.${b.balls % 6}`;
    let econ = b.balls ? (b.runs / (b.balls / 6)).toFixed(2) : '0.00';
    return `${b.name},${overs},${b.runs},${b.wickets},${econ}`;
  }).join('\n');
  let blob = new Blob([csv], { type: 'text/csv' });
  let a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'scorecard.csv';
  a.click();
}

function exportPDF() {
  if (typeof html2pdf === 'undefined') {
    alert('PDF export requires html2pdf.js to be included.');
    return;
  }
  const el = document.getElementById('scoringUI');
  html2pdf().from(el).save('scorecard.pdf');
}

// --- Resume match on page load ---
window.addEventListener('DOMContentLoaded', () => {
  if (matchSetup && matchSetup.striker && matchSetup.nonStriker && matchSetup.bowler) {
    document.getElementById('setupForm').style.display = 'none';
    document.getElementById('scorerSection').style.display = '';
    matchState = loadFromLS('matchState');
    if (matchState) {
      renderScoringUI();
    } else {
      startScoring();
    }
  } else {
    showStep(1);
  }
});

// Helper function to sanitize numeric values
function sanitizeNumber(value) {
    const num = Number(value);
    return isNaN(num) ? 0 : Math.max(0, num);
}

// Helper function to validate player stats
function validatePlayerStats(player) {
    return {
        name: player.name,
        runs: sanitizeNumber(player.runs),
        balls: sanitizeNumber(player.balls),
        fours: sanitizeNumber(player.fours),
        sixes: sanitizeNumber(player.sixes),
        status: player.status || 'not out'
    };
}

// Helper function to validate bowler stats
function validateBowlerStats(bowler) {
    const [overs = '0', balls = '0'] = (bowler.overs || '0.0').split('.');
    return {
        name: bowler.name,
        overs: `${sanitizeNumber(overs)}.${sanitizeNumber(balls)}`,
        maidens: sanitizeNumber(bowler.maidens),
        runs: sanitizeNumber(bowler.runs),
        wickets: sanitizeNumber(bowler.wickets)
    };
}

// Helper function to sanitize player stats before sending to backend
function sanitizePlayerStats(player) {
    player.batting = {
        runs: Number(player.batting?.runs) || 0,
        ballsFaced: Number(player.batting?.ballsFaced) || 0,
        fours: Number(player.batting?.fours) || 0,
        sixes: Number(player.batting?.sixes) || 0,
    };
    player.bowling = {
        overs: Number(player.bowling?.overs) || 0,
        runsConceded: Number(player.bowling?.runsConceded) || 0,
        wickets: Number(player.bowling?.wickets) || 0,
    };
    return player;
}

// Save match to backend database
async function saveMatch() {
  if (!matchState || !matchState.completed) {
    alert('Match is not completed yet!');
    return;
  }

  // Ensure second innings data is captured correctly
  if (!matchState.secondInnings) {
      matchState.secondInnings = {
        battingTeam: matchState.battingTeam,
        bowlingTeam: matchState.bowlingTeam,
        score: matchState.total,
        wickets: matchState.wickets,
        overs: `${matchState.over}.${matchState.ballInOver}`,
        batsmen: matchState.batsmen.filter(b => b.balls > 0 || b.out),
        bowlers: matchState.bowlers.filter(b => b.balls > 0)
      };
  }
  
  const matchData = {
    teamA: matchState.teamA,
    teamB: matchState.teamB,
    ballType: matchState.ballType,
    overs: matchState.overs,
    result: matchState.result || 'Match completed',
    winner: matchState.winner,
    manOfTheMatch: calculateManOfTheMatch({ innings: [matchState.firstInnings, matchState.secondInnings] }),
    innings: [matchState.firstInnings, matchState.secondInnings].filter(Boolean)
  };

  console.log("Sending matchData:", matchData);

  try {
    const response = await fetch('http://localhost:5001/api/matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(matchData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      throw new Error(errorData.error || 'Network response was not ok');
    }

    const result = await response.json();
    console.log('Match saved successfully:', result);
    alert('Match saved successfully!');
    
    // Clear local storage for the next match
    localStorage.removeItem('matchState');
    localStorage.removeItem('matchSetup');

  } catch (error) {
    console.error('Error saving match:', error);
    alert('Failed to save match. Please check the console for details.');
  }
}


