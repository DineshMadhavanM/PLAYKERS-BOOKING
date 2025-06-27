document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');

  if (registerForm) {
    registerForm.addEventListener('submit', async function(event) {
      event.preventDefault();

      const username = document.getElementById('regUsername')?.value?.trim() || '';
      const email = document.getElementById('regEmail')?.value?.trim() || '';
      const phoneNumber = document.getElementById('regPhoneNumber')?.value?.trim() || '';
      const password = document.getElementById('regPassword')?.value || '';
      const dob = document.getElementById('regDob')?.value || '';
      const location = document.getElementById('regLocation')?.value?.trim() || '';

      const registerError = document.getElementById('registerError');
      const registerSuccess = document.getElementById('registerSuccess');

      if (!username || !email || !phoneNumber || !password || !dob || !location) {
        if (registerError) registerError.textContent = 'Please fill in all required fields';
        return;
      }

      try {
        const res = await fetch('http://localhost:5001/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username,
            email,
            phoneNumber,
            password,
            dob,
            location
          })
        });

        let data;
        try {
          data = await res.json();
        } catch (e) {
          throw new Error('Invalid response from server');
        }

        if (!res.ok) {
          if (registerError) registerError.textContent = data.msg || 'Registration failed';
          if (registerSuccess) registerSuccess.textContent = '';
          return;
        }

        if (registerSuccess) registerSuccess.textContent = 'Registration successful! Redirecting...';
        if (registerError) registerError.textContent = '';

        // Store user data
        localStorage.setItem('userEmail', email);

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);

      } catch (err) {
        console.error('Error:', err);
        if (registerError) registerError.textContent = 'An error occurred. Please try again.';
        if (registerSuccess) registerSuccess.textContent = '';
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
      event.preventDefault();

      const email = document.getElementById('loginEmail')?.value?.trim() || '';
      const password = document.getElementById('loginPassword')?.value || '';
      const loginError = document.getElementById('loginError');

      if (!email || !password) {
        if (loginError) loginError.textContent = 'Please fill in all required fields';
        return;
      }

      try {
        const res = await fetch('http://localhost:5001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        });

        let data;
        try {
          data = await res.json();
        } catch (e) {
          throw new Error('Invalid response from server');
        }

        if (!res.ok) {
          if (loginError) loginError.textContent = data.msg || 'Login failed';
          return;
        }

        if (loginError) loginError.textContent = '';
        
        // Store user data
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('username', data.user.username);

        alert('Login successful! Redirecting...');
        window.location.href = 'index.html';

      } catch (err) {
        console.error('Error:', err);
        if (loginError) loginError.textContent = 'An error occurred. Please try again.';
      }
    });
  }
});