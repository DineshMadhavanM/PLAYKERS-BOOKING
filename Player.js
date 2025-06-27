const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  matchesPlayed: { 
    type: Number, 
    default: 0,
    min: 0,
    set: v => Math.max(0, parseInt(v) || 0)
  },

  // Batting Stats
  batting: {
    totalRuns: { type: Number, default: 0, min: 0 },
    ballsFaced: { type: Number, default: 0, min: 0 },
    fours: { type: Number, default: 0, min: 0 },
    sixes: { type: Number, default: 0, min: 0 },
    ducks: { type: Number, default: 0, min: 0, set: parseToInt },
    bestScore: {
      runs: { type: Number, default: 0, min: 0, set: parseToInt },
      balls: { type: Number, default: 0, min: 0, set: parseToInt },
      isOut: { type: Boolean, default: true }
    },
  },

  // Bowling Stats
  bowling: {
    totalWickets: { type: Number, default: 0, min: 0, set: parseToInt },
    ballsBowled: { type: Number, default: 0, min: 0, set: parseToInt },
    runsConceded: { type: Number, default: 0, min: 0, set: parseToInt },
    threeWicketHauls: { type: Number, default: 0, min: 0, set: parseToInt },
    fiveWicketHauls: { type: Number, default: 0, min: 0, set: parseToInt },
    bestBowling: {
      wickets: { type: Number, default: 0, min: 0, set: parseToInt },
      runs: { type: Number, default: 0, min: 0, set: parseToInt },
    },
  },

  // Fielding Stats
  fielding: {
    catches: { type: Number, default: 0, min: 0, set: parseToInt },
    runOuts: { type: Number, default: 0, min: 0, set: parseToInt },
  },
  
  manOfTheMatchAwards: { type: Number, default: 0, min: 0, set: parseToInt }
});

// --------- Utility Setter Function ---------
function parseToInt(v) {
  return Math.max(0, parseInt(v) || 0);
}

// --------- Virtuals ---------

// Batting Average
playerSchema.virtual('batting.average').get(function() {
  if (this.batting.ballsFaced === 0) return '0.00';
  const dismissals = this.matchesPlayed - this.batting.ducks; // Simplified assumption
  return dismissals > 0 ? (this.batting.totalRuns / dismissals).toFixed(2) : 'N/A';
});

// Strike Rate
playerSchema.virtual('batting.strikeRate').get(function() {
  if (this.batting.ballsFaced === 0) return '0.00';
  return ((this.batting.totalRuns / this.batting.ballsFaced) * 100).toFixed(2);
});

// Bowling Average
playerSchema.virtual('bowling.average').get(function() {
  if (this.bowling.totalWickets === 0) return '0.00';
  return (this.bowling.runsConceded / this.bowling.totalWickets).toFixed(2);
});

// Economy Rate
playerSchema.virtual('bowling.economyRate').get(function() {
  if (this.bowling.ballsBowled === 0) return '0.00';
  return ((this.bowling.runsConceded / this.bowling.ballsBowled) * 6).toFixed(2);
});

// Overs
playerSchema.virtual('bowling.overs').get(function() {
  if (this.bowling.ballsBowled === 0) return '0.0';
  const overs = Math.floor(this.bowling.ballsBowled / 6);
  const balls = this.bowling.ballsBowled % 6;
  return `${overs}.${balls}`;
});

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;
