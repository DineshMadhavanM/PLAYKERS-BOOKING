// Assume username is stored in localStorage after login
const username = localStorage.getItem('username');
const profileInfo = document.getElementById('profileInfo');
const recentDiv = document.getElementById('recentPerformances');

if (!username) {
  profileInfo.textContent = 'Not logged in.';
} else {
  fetch(`/api/users/${encodeURIComponent(username)}`)
    .then(res => res.json())
    .then(user => {
      if (!user || user.error) {
        profileInfo.textContent = 'User not found.';
        return;
      }
      profileInfo.innerHTML = `
        <b>Username:</b> ${user.username}<br>
        <b>Email:</b> ${user.email}<br>
        <b>Total Runs:</b> ${user.userStats?.runs || 0}<br>
        <b>Total Wickets:</b> ${user.userStats?.wickets || 0}<br>
        <b>Matches Played:</b> ${user.userStats?.matches || 0}<br>
      `;
      // Recent performances (array of last 5 matches)
      if (user.userStats?.recent && user.userStats.recent.length) {
        recentDiv.innerHTML = '<ul>' + user.userStats.recent.map(
          perf => `<li>${perf}</li>`
        ).join('') + '</ul>';
      } else {
        recentDiv.textContent = 'No recent performances.';
      }
    })
    .catch(() => {
      profileInfo.textContent = 'Error loading profile.';
    });
}
