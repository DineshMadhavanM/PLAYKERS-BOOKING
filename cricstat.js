/**
 * cricstat.js
 * Fetches and displays a player's career statistics from the backend API.
 */

document.addEventListener('DOMContentLoaded', () => {
    const statsDisplay = document.getElementById('player-stats-display');
    const playerSelect = document.getElementById('player-select');
    const profileContainer = document.getElementById('player-profile-container');
    
    // Function to fetch and display a single player's stats
    async function fetchPlayerStats(playerName) {
        if (!playerName) {
            statsDisplay.style.display = 'none';
            return;
        }
        
        statsDisplay.style.display = 'block';
        statsDisplay.innerHTML = `<p>Loading stats for ${playerName}...</p>`;

        try {
            const response = await fetch(`http://localhost:5001/api/players/${encodeURIComponent(playerName)}`);
            if (!response.ok) {
                statsDisplay.innerHTML = `<p class="error">Could not find stats for ${playerName}.</p>`;
                throw new Error('Player not found');
            }
            const stats = await response.json();

            const bestScore = stats.batting.bestScore.isOut ? 
                `${stats.batting.bestScore.runs} (${stats.batting.bestScore.balls})` : 
                `${stats.batting.bestScore.runs}* (${stats.batting.bestScore.balls})`;

            const bestBowling = stats.bowling.bestBowling.wickets > 0 ?
                `${stats.bowling.bestBowling.wickets}/${stats.bowling.bestBowling.runs}` : 'N/A';

            statsDisplay.innerHTML = `
                <h3>${stats.name}</h3>
                <div class="stats-grid">
                    <div class="stat-box">
                        <h4>Batting Career</h4>
                        <p><strong>Matches:</strong> ${stats.matchesPlayed}</p>
                        <p><strong>Runs:</strong> ${stats.batting.totalRuns}</p>
                        <p><strong>Balls:</strong> ${stats.batting.ballsFaced}</p>
                        <p><strong>Best Score:</strong> ${bestScore}</p>
                        <p><strong>Average:</strong> ${stats.batting.average}</p>
                        <p><strong>Strike Rate:</strong> ${stats.batting.strikeRate}</p>
                        <p><strong>4s:</strong> ${stats.batting.fours}</p>
                        <p><strong>6s:</strong> ${stats.batting.sixes}</p>
                        <p><strong>Ducks:</strong> ${stats.batting.ducks}</p>
                    </div>
                    <div class="stat-box">
                        <h4>Bowling Career</h4>
                        <p><strong>Overs:</strong> ${stats.bowling.overs}</p>
                        <p><strong>Wickets:</strong> ${stats.bowling.totalWickets}</p>
                        <p><strong>Runs:</strong> ${stats.bowling.runsConceded}</p>
                        <p><strong>Best Bowling:</strong> ${bestBowling}</p>
                        <p><strong>Average:</strong> ${stats.bowling.average}</p>
                        <p><strong>Economy:</strong> ${stats.bowling.economyRate}</p>
                        <p><strong>3W Hauls:</strong> ${stats.bowling.threeWicketHauls}</p>
                        <p><strong>5W Hauls:</strong> ${stats.bowling.fiveWicketHauls}</p>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error fetching player stats:', error);
            statsDisplay.innerHTML = `<p class="error">An error occurred while fetching player data.</p>`;
        }
    }
    
    // Check URL for a player name on page load
    const params = new URLSearchParams(window.location.search);
    const playerNameFromUrl = params.get('player');
    if (playerNameFromUrl) {
        playerSelect.style.display = 'none'; // Hide dropdown if showing specific player
        document.querySelector('label[for="player-select"]').style.display = 'none';
        fetchPlayerStats(playerNameFromUrl);
    } else {
        // Populate dropdown if no specific player is requested
        populatePlayerDropdown();
    }

    async function populatePlayerDropdown() {
         try {
            const response = await fetch('http://localhost:5001/api/players');
            const players = await response.json();
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.name;
                option.textContent = player.name;
                playerSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching players list:', error);
        }
    }

    // Display stats on selection from dropdown
    playerSelect.addEventListener('change', (e) => {
        fetchPlayerStats(e.target.value);
    });
});

async function fetchPlayerStats(playerId) {
    try {
        const response = await fetch(`${API_URL}/players/${playerId}`);
        if (!response.ok) throw new Error('Player not found');
        const player = await response.json();
        renderPlayerProfile(player);
    } catch (error) {
        profileContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        console.error('Error fetching player stats:', error);
    }
}

function renderPlayerProfile(player) {
    if (!player) {
        profileContainer.innerHTML = '<p class="error">Could not load player data.</p>';
        return;
    }

    const stats = player.stats || {};

    profileContainer.innerHTML = `
        <header class="profile-header">
            <img src="image/p.jpg" alt="Player" class="profile-pic"> <!-- Placeholder Image -->
            <div class="player-info">
                <h1>${player.name}</h1>
                <p>${player.teamName || 'Team not specified'}</p>
            </div>
        </header>

        <div class="stats-container">
            <div class="stats-card">
                <h2>Batting Career</h2>
                <div class="stats-grid">
                    ${createStatItem('Matches', stats.matches)}
                    ${createStatItem('Innings', stats.innings)}
                    ${createStatItem('Runs', stats.runs)}
                    ${createStatItem('Not Outs', stats.notOuts)}
                    ${createStatItem('Average', stats.average)}
                    ${createStatItem('Strike Rate', stats.strikeRate)}
                    ${createStatItem('Highest Score', stats.highestScore)}
                    ${createStatItem('Fours', stats.fours)}
                    ${createStatItem('Sixes', stats.sixes)}
                    ${createStatItem('Ducks', stats.ducks)}
                </div>
            </div>

            <div class="stats-card">
                <h2>Bowling Career</h2>
                <div class="stats-grid">
                    ${createStatItem('Matches', stats.matches)}
                    ${createStatItem('Innings', stats.innings)}
                    ${createStatItem('Wickets', stats.wickets)}
                    ${createStatItem('Bowling Avg', stats.bowlingAverage)}
                    ${createStatItem('Economy', stats.economy)}
                    ${createStatItem('Best Bowling', stats.bestBowling)}
                    ${createStatItem('Maidens', stats.maidens)}
                    ${createStatItem('3W Hauls', stats.threeWicketHauls)}
                    ${createStatItem('5W Hauls', stats.fiveWicketHauls)}
                </div>
            </div>
            
            <div class="stats-card">
                <h2>Fielding & Awards</h2>
                <div class="stats-grid">
                    ${createStatItem('Catches', stats.catches)}
                    ${createStatItem('Run Outs', stats.runOuts)}
                    ${createStatItem('Man of the Match', stats.manOfTheMatch)}
                </div>
            </div>
        </div>
    `;
}

function createStatItem(label, value) {
    return `
        <div class="stat-item">
            <p class="stat-value">${value !== undefined ? value : 'N/A'}</p>
            <span class="stat-label">${label}</span>
        </div>
    `;
}