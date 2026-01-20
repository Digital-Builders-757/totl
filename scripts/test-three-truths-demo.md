# Three Truths Testing Demo Script

## ✅ What We've Implemented

1. **AuthProvider signIn() logging** - Proves signInWithPassword result + cookies
2. **AuthProvider onAuthStateChange logging** - Proves SIGNED_IN fires + cookies exist
3. **Middleware cookie logging** - Proves middleware receives cookies

## 🧪 Test Script (Playwright MCP)

Here's how to test using Playwright MCP:

### Step 1: Navigate to Login
```javascript
await page.goto('http://localhost:3000/login');
await page.waitForSelector('[data-testid="login-hydrated"]');
```

### Step 2: Set up Console Log Capture
```javascript
const consoleMessages = [];
page.on('console', msg => {
  if (msg.text().includes('[auth.signIn]') || 
      msg.text().includes('[auth.onAuthStateChange]')) {
    consoleMessages.push(msg.text());
  }
});
```

### Step 3: Fill and Submit Login Form
```javascript
await page.fill('[data-testid="email"]', 'test@example.com');
await page.fill('[data-testid="password"]', 'password123');
await page.click('[data-testid="login-button"]');
```

### Step 4: Wait for Redirect
```javascript
await page.waitForURL(/\/talent\/dashboard/, { timeout: 10000 });
```

### Step 5: Verify Three Truths in Console Logs
```javascript
// TRUTH #1: SIGNED_IN fires
const signedInLog = consoleMessages.find(msg => 
  msg.includes('SIGNED_IN') && msg.includes('cookieSb')
);
console.assert(signedInLog, 'SIGNED_IN event should fire');

// TRUTH #2: Cookies exist
const cookieLog = consoleMessages.find(msg => 
  msg.includes('document.cookie sb*')
);
console.assert(cookieLog, 'Cookies should exist in browser');

// TRUTH #3: Check cookies in browser
const cookies = await page.context().cookies();
const sbCookies = cookies.filter(c => c.name.startsWith('sb-'));
console.assert(sbCookies.length > 0, 'sb-* cookies should exist');
```

## 📊 Expected Console Output

### Browser Console (After Login)
```
[auth.signIn] signInWithPassword result {
  hasError: false,
  error: null,
  hasSession: true,
  userId: "abc-123-def-456"
}

[auth.signIn] document.cookie sb* ["sb-project-ref-auth-token=..."]

[auth.onAuthStateChange] {
  event: "SIGNED_IN",
  hasSession: true,
  userId: "abc-123-def-456",
  pathname: "/login",
  cookieSb: true
}
```

### Server Console (With DEBUG_ROUTING=1)
```
[totl][middleware] cookie names {
  path: "/talent/dashboard",
  cookies: ["sb-project-ref-auth-token", ...],
  hasSb: true
}

[totl][middleware] auth.getUser() {
  path: "/talent/dashboard",
  userId: "abc-123-def-456",
  email: "test@example.com"
}
```

## ✅ Success Criteria

All three truths proven:
1. ✅ SIGNED_IN fires → `event: "SIGNED_IN"` in logs
2. ✅ Cookies exist → `cookieSb: true` + cookie array
3. ✅ Middleware receives → `hasSb: true` + cookies array

If all three are true → Redirect works, no loops! 🎉
