document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('id');
    const display = document.getElementById('scorecard-display');
    const title = document.getElementById('match-title');

    if (!matchId) {
        display.innerHTML = '<p class="error">No match ID provided.</p>';
        return;
    }

    fetch(`http://localhost:5001/api/matches/${matchId}`)
        .then(res => {
            if (!res.ok) {
                throw new Error('Match not found');
            }
            return res.json();
        })
        .then(match => {
            title.textContent = `${match.teamA.name} vs ${match.teamB.name}`;
            display.innerHTML = renderScorecard(match);
        })
        .catch(err => {
            console.error('Error fetching scorecard:', err);
            display.innerHTML = `<p class="error">${err.message}</p>`;
        });
});

function renderScorecard(match) {
    let html = `
        <div class="stat-card">
            <h2>Match Summary</h2>
            <p><strong>Result:</strong> ${match.result}</p>
            <p><strong>Overs:</strong> ${match.overs} | <strong>Ball Type:</strong> ${match.ballType}</p>
        </div>
    `;

    match.innings.forEach((inning, index) => {
        html += `
            <div class="stat-card">
                <h2>Innings ${index + 1}: ${inning.battingTeam}</h2>
                <p><strong>Score: ${inning.score}/${inning.wickets} (${inning.overs} Overs)</strong></p>
                
                <h3>Batting</h3>
                <table class="stat-table">
                    <thead>
                        <tr>
                            <th>Batsman</th>
                            <th>Status</th>
                            <th>Runs</th>
                            <th>Balls</th>
                            <th>4s</th>
                            <th>6s</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inning.batsmen.map(b => `
                            <tr>
                                <td>${b.name}</td>
                                <td>${b.status}</td>
                                <td>${b.runs}</td>
                                <td>${b.balls}</td>
                                <td>${b.fours}</td>
                                <td>${b.sixes}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h3>Bowling</h3>
                <table class="stat-table">
                    <thead>
                        <tr>
                            <th>Bowler</th>
                            <th>Overs</th>
                            <th>Maidens</th>
                            <th>Runs</th>
                            <th>Wickets</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inning.bowlers.map(b => `
                            <tr>
                                <td>${b.name}</td>
                                <td>${b.overs}</td>
                                <td>${b.maidens}</td>
                                <td>${b.runs}</td>
                                <td>${b.wickets}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    });

    return html;
} 