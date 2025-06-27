/**
 * cricmatch.js
 * Fetches and displays match data from the backend API.
 * Handles routing between match list and full scorecard views.
 */

const API_URL = 'http://localhost:5001/api';
const mainContent = document.getElementById('main-content');

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('id');

    if (matchId) {
        fetchFullScorecard(matchId);
    } else {
        fetchAllMatches();
    }

    const matchList = document.getElementById('match-list');
    const modal = document.getElementById('match-details-modal');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');

    async function fetchAllMatches() {
        try {
            const response = await fetch('http://localhost:5001/api/matches');
            const matches = await response.json();

            if (matches.length === 0) {
                matchList.innerHTML = '<p>No saved matches found.</p>';
                return;
            }
            
            matchList.innerHTML = ''; // Clear existing
            matches.forEach(match => {
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';
                const ballTypeDisplay = match.ballType ? match.ballType.charAt(0).toUpperCase() + match.ballType.slice(1) + ' Ball' : 'N/A';

                matchCard.innerHTML = `
                    <h3>${match.teamA.name} vs ${match.teamB.name}</h3>
                    <p><strong>Date:</strong> ${new Date(match.date).toLocaleDateString()}</p>
                    <p><strong>Ball Type:</strong> ${ballTypeDisplay}</p>
                    <p><strong>Result:</strong> ${match.result}</p>
                `;
                
                matchCard.addEventListener('click', () => {
                    displayMatchDetails(match);
                });

                matchList.appendChild(matchCard);
            });
        } catch (error) {
            console.error('Error fetching matches:', error);
            matchList.innerHTML = '<p>Error loading matches. Is the backend server running?</p>';
        }
    }

    function displayMatchDetails(match) {
        if (!match.innings || match.innings.length === 0) {
            modalBody.innerHTML = '<h2>Scorecard not available</h2>';
            modal.style.display = 'block';
            return;
        }

        let inningsHTML = '';
        match.innings.forEach((inning, index) => {
            let battingDetails = '<h4>Batting</h4><div class="table-container"><table><thead><tr><th>Batsman</th><th>Status</th><th>R</th><th>B</th><th>4s</th><th>6s</th></tr></thead><tbody>';
            inning.batsmen.forEach(b => {
                const playerLink = `<a href="cricstat.html?player=${encodeURIComponent(b.name)}">${b.name}</a>`;
                battingDetails += `
                    <tr>
                        <td>${playerLink}</td>
                        <td>${b.status || 'not out'}</td>
                        <td>${b.runs}</td>
                        <td>${b.balls}</td>
                        <td>${b.fours}</td>
                        <td>${b.sixes}</td>
                    </tr>
                `;
            });
            battingDetails += '</tbody></table></div>';
            
            let bowlingDetails = '<h4>Bowling</h4><div class="table-container"><table><thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th></tr></thead><tbody>';
            inning.bowlers.forEach(b => {
                if (b.balls > 0 || b.overs) {
                    const playerLink = `<a href="cricstat.html?player=${encodeURIComponent(b.name)}">${b.name}</a>`;
                    bowlingDetails += `
                        <tr>
                            <td>${playerLink}</td>
                            <td>${b.overs}</td>
                            <td>${b.maidens}</td>
                            <td>${b.runs}</td>
                            <td>${b.wickets}</td>
                        </tr>
                    `;
                }
            });
            bowlingDetails += '</tbody></table></div>';

            inningsHTML += `
                <div class="innings-card">
                    <h3>Innings ${index + 1}: ${inning.battingTeam}</h3>
                    <p><strong>Score: ${inning.score}/${inning.wickets} (${inning.overs} Overs)</strong></p>
                    ${battingDetails}
                    <br>
                    ${bowlingDetails}
                </div>
            `;
        });

        modalBody.innerHTML = `
            <h2>${match.teamA.name} vs ${match.teamB.name}</h2>
            <p><strong>Result:</strong> ${match.result}</p>
            <hr>
            ${inningsHTML}
        `;
        modal.style.display = 'block';
    }

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

async function fetchFullScorecard(matchId) {
    try {
        const response = await fetch(`${API_URL}/matches/${matchId}`);
        if (!response.ok) throw new Error('Failed to fetch scorecard');
        const match = await response.json();
        renderFullScorecard(match);
    } catch (error) {
        mainContent.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        console.error('Error fetching scorecard:', error);
    }
}

function renderMatchList(matches) {
    if (!matches || matches.length === 0) {
        mainContent.innerHTML = '<h2 class="match-list-title">No Matches Found</h2><p>Go score a match to see it here!</p>';
        return;
    }

    mainContent.innerHTML = `
        <h2 class="match-list-title">Completed Matches</h2>
        <div id="match-cards-container">
            ${matches.map(match => `
                <div class="match-card" onclick="window.location.href='?id=${match._id}'">
                    <div class="match-header">
                        <span class="match-teams">${match.teamA} vs ${match.teamB}</span>
                        <span class="match-date">${new Date(match.date).toLocaleDateString()}</span>
                    </div>
                    <div class="match-result">${match.result}</div>
                    <div class="match-scores">
                        <div class="score-team">
                            <span class="team-name">${match.innings1.battingTeam}</span>
                            <span>${match.innings1.score}/${match.innings1.wickets} (${match.innings1.overs})</span>
                        </div>
                        <div class="score-team">
                            <span class="team-name">${match.innings2.battingTeam}</span>
                            <span>${match.innings2.score}/${match.innings2.wickets} (${match.innings2.overs})</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderFullScorecard(match) {
    mainContent.innerHTML = `
        <h2 class="scorecard-title">${match.teamA} vs ${match.teamB}</h2>
        <div class="scorecard-container">
            <p><strong>Result:</strong> ${match.result}</p>
            <p><strong>Man of the Match:</strong> <a href="cricstat.html?player=${match.manOfTheMatch.playerId}" class="player-link">${match.manOfTheMatch.name}</a></p>
            
            ${renderInningsTable(match.innings1)}
            ${renderInningsTable(match.innings2)}
        </div>
    `;
}

function renderInningsTable(innings) {
    if (!innings) return '';
    return `
        <h3 class="innings-title">${innings.battingTeam} Innings (${innings.score}/${innings.wickets})</h3>
        
        <h4>Batting</h4>
        <table class="scorecard-table">
            <thead>
                <tr>
                    <th>Batsman</th><th>Status</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th>
                </tr>
            </thead>
            <tbody>
                ${innings.batting.map(b => `
                    <tr>
                        <td><a href="cricstat.html?player=${b.playerId}" class="player-link">${b.name}</a></td>
                        <td>${b.status}</td>
                        <td>${b.runs}</td>
                        <td>${b.balls}</td>
                        <td>${b.fours}</td>
                        <td>${b.sixes}</td>
                        <td>${b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(2) : '0.00'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h4>Bowling</h4>
        <table class="scorecard-table">
            <thead>
                <tr>
                    <th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th>
                </tr>
            </thead>
            <tbody>
                ${innings.bowling.map(b => `
                    <tr>
                        <td><a href="cricstat.html?player=${b.playerId}" class="player-link">${b.name}</a></td>
                        <td>${b.overs}</td>
                        <td>${b.runs}</td>
                        <td>${b.wickets}</td>
                        <td>${b.economy}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}