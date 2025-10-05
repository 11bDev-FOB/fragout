# FragOut Share Integration Guide

## URL Prefill Feature for External Applications

FragOut supports receiving content from external applications via URL query parameters. This allows other apps to share links, text, and titles directly to FragOut's compose interface.

---

## 🎯 **Quick Start**

### **Basic Usage**

To share content with FragOut, construct a URL with query parameters:

```
https://fragout.11b.dev/compose?url=https://example.com&text=Check%20this%20out
```

**Note:** Both `/compose` and `/dashboard` routes are supported and will work identically.

### **Supported Parameters**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `url` | A URL to share | `url=https://example.com` |
| `text` | Descriptive text or comment | `text=Check%20this%20out` |
| `title` | Title for the shared content | `title=Amazing%20Article` |

---

## 📝 **How It Works**

### **1. Content Prefilling**

When a user visits the dashboard with query parameters:

1. FragOut reads the `url`, `text`, and `title` parameters
2. Constructs a prefilled message in the compose textarea
3. Shows a status message indicating the content was prefilled
4. User can edit, select platforms, and deploy the mission

**Priority Order for Building Message:**
- If `title` exists: Uses title as main text
- Else if `text` exists: Uses text as main text
- If `url` exists: Appends URL (with line breaks if there's text/title)

**Example Output:**
```
url=https://11b.dev&title=Check out 11b.dev

// Produces:
Check out 11b.dev

https://11b.dev
```

### **2. Authentication Flow**

If the user is not authenticated:

1. Middleware captures the dashboard request with query params
2. Redirects to `/auth?returnUrl=/dashboard?url=...&text=...`
3. After successful login, user is redirected back to dashboard
4. Query parameters are preserved and content is prefilled

---

## 🔗 **Integration Examples**

### **JavaScript/TypeScript**

```javascript
// Simple share function
function shareToFragOut(url, text = '', title = '') {
  const params = new URLSearchParams();
  if (url) params.append('url', url);
  if (text) params.append('text', text);
  if (title) params.append('title', title);
  
  const fragoutUrl = `https://fragout.11b.dev/dashboard?${params.toString()}`;
  window.open(fragoutUrl, '_blank');
}

// Usage
shareToFragOut(
  'https://github.com/11bDev-FOB/fragout',
  'Check out this tactical social media tool!',
  'FragOut by 11b.dev'
);
```

### **React Component**

```jsx
import { useState } from 'react';

function ShareButton({ url, title, text }) {
  const handleShare = () => {
    const params = new URLSearchParams({
      url: url || '',
      title: title || '',
      text: text || ''
    });
    
    const shareUrl = `https://fragout.11b.dev/dashboard?${params}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <button onClick={handleShare}>
      💣 Share to FragOut
    </button>
  );
}
```

### **HTML Link**

```html
<!-- Static share link -->
<a href="https://fragout.11b.dev/dashboard?url=https://example.com&text=Check%20this%20out" 
   target="_blank">
  Share to FragOut
</a>
```

### **Browser Bookmarklet**

```javascript
// Create a bookmarklet to share current page
javascript:(function(){
  const params = new URLSearchParams({
    url: window.location.href,
    title: document.title,
    text: window.getSelection().toString() || ''
  });
  window.open('https://fragout.11b.dev/dashboard?' + params, '_blank');
})();
```

### **Native Mobile Integration**

#### **iOS Share Sheet (Swift)**

```swift
import UIKit

func shareToFragOut(url: String, title: String, text: String) {
    var components = URLComponents(string: "https://fragout.11b.dev/dashboard")
    components?.queryItems = [
        URLQueryItem(name: "url", value: url),
        URLQueryItem(name: "title", value: title),
        URLQueryItem(name: "text", value: text)
    ]
    
    if let shareUrl = components?.url {
        UIApplication.shared.open(shareUrl)
    }
}
```

#### **Android Intent**

```kotlin
fun shareToFragOut(url: String, title: String, text: String) {
    val params = "url=${Uri.encode(url)}&title=${Uri.encode(title)}&text=${Uri.encode(text)}"
    val intent = Intent(Intent.ACTION_VIEW).apply {
        data = Uri.parse("https://fragout.11b.dev/dashboard?$params")
    }
    context.startActivity(intent)
}
```

---

## 🔐 **Security Considerations**

### **URL Encoding**

Always properly encode parameters to prevent XSS or injection attacks:

```javascript
// ✅ GOOD - Properly encoded
const params = new URLSearchParams({
  text: userInput // Automatically encoded
});

// ❌ BAD - Manual string concatenation (vulnerable)
const url = `https://fragout.11b.dev/dashboard?text=${userInput}`;
```

### **Parameter Validation**

FragOut performs basic validation on the client side:
- Parameters are read using `URLSearchParams` (browser-safe)
- Content is set using React state (DOM-safe)
- No direct HTML injection

### **Authentication Required**

- Users must be authenticated to access the dashboard
- Query parameters are preserved through the login flow
- No sensitive data should be passed in URL parameters

---

## 🎨 **User Experience**

### **Visual Feedback**

When content is prefilled from external sources:
- Status message appears: "📝 Mission briefing prefilled from external source"
- Message automatically disappears after 5 seconds
- Textarea is populated and ready to edit
- User can immediately select platforms and deploy

### **Editing Prefilled Content**

Users can:
- Edit the prefilled text freely
- Clear and start over
- Add images (if supported by selected platforms)
- Select target platforms before posting

---

## 🧪 **Testing**

### **Manual Testing**

Test the feature with these URLs:

```bash
# Test URL only
https://fragout.11b.dev/dashboard?url=https://github.com/11bDev-FOB/fragout

# Test text + URL
https://fragout.11b.dev/dashboard?url=https://11b.dev&text=Check%20out%20this%20site

# Test title + URL
https://fragout.11b.dev/dashboard?url=https://11b.dev&title=11b.dev%20-%20Forward%20Operating%20Base

# Test all parameters
https://fragout.11b.dev/dashboard?url=https://11b.dev&title=Check%20this%20out&text=Great%20tactical%20tools

# Test with authentication redirect
# (Visit while logged out to test returnUrl preservation)
```

### **Automated Testing**

```javascript
// Example test case
describe('URL Prefill Feature', () => {
  it('should prefill message from URL parameters', () => {
    const params = {
      url: 'https://example.com',
      text: 'Test message',
      title: 'Test Title'
    };
    
    // Navigate to dashboard with params
    // Verify textarea contains expected content
    // Verify status message appears
  });
});
```

---

## 📱 **Common Use Cases**

### **1. Blog/CMS Integration**

Add a "Share to FragOut" button to blog posts:

```javascript
// WordPress plugin example
function addFragOutShareButton() {
  const shareButton = document.createElement('a');
  shareButton.href = `https://fragout.11b.dev/dashboard?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(document.title)}`;
  shareButton.textContent = '💣 Share to FragOut';
  shareButton.target = '_blank';
  document.querySelector('.entry-content').appendChild(shareButton);
}
```

### **2. Browser Extension**

Create a browser extension to share any page:

```javascript
// manifest.json
{
  "manifest_version": 3,
  "name": "Share to FragOut",
  "permissions": ["activeTab"],
  "action": {
    "default_title": "Share to FragOut"
  },
  "background": {
    "service_worker": "background.js"
  }
}

// background.js
chrome.action.onClicked.addListener((tab) => {
  const params = new URLSearchParams({
    url: tab.url,
    title: tab.title
  });
  chrome.tabs.create({
    url: `https://fragout.11b.dev/dashboard?${params}`
  });
});
```

### **3. RSS Reader Integration**

Share RSS items to FragOut:

```javascript
function shareRssItem(item) {
  const params = new URLSearchParams({
    url: item.link,
    title: item.title,
    text: item.description || ''
  });
  window.open(`https://fragout.11b.dev/dashboard?${params}`, '_blank');
}
```

---

## 🚀 **Advanced Features**

### **Deep Linking**

For mobile apps, you can implement deep linking:

```
fragout://dashboard?url=https://example.com&text=Message
```

*(Requires additional mobile app configuration)*

### **Platform Pre-selection**

Future enhancement - allow pre-selecting platforms:

```
# Not yet implemented
https://fragout.11b.dev/dashboard?url=...&platforms=twitter,mastodon
```

### **Scheduled Posts**

Future enhancement - support scheduling:

```
# Not yet implemented
https://fragout.11b.dev/dashboard?url=...&schedule=2025-10-06T14:00:00Z
```

---

## 📚 **API Reference**

### **Query Parameters**

```typescript
interface ShareParameters {
  url?: string;      // URL to share (optional)
  text?: string;     // Descriptive text (optional)
  title?: string;    // Title for the content (optional)
}
```

### **Message Construction Logic**

```typescript
function buildPrefilledMessage(params: ShareParameters): string {
  let message = '';
  
  // Priority: title > text
  if (params.title) {
    message = params.title;
  } else if (params.text) {
    message = params.text;
  }
  
  // Append URL if provided
  if (params.url) {
    message = message 
      ? `${message}\n\n${params.url}` 
      : params.url;
  }
  
  return message.trim();
}
```

---

## 🐛 **Troubleshooting**

### **Content Not Prefilling**

1. Check URL encoding - special characters must be encoded
2. Verify parameter names (case-sensitive: `url`, `text`, `title`)
3. Check browser console for JavaScript errors
4. Ensure you're navigating to `/dashboard` not other pages

### **Authentication Loop**

1. Clear browser cookies and try again
2. Verify the `returnUrl` parameter is preserved
3. Check middleware logs for redirect issues

### **Special Characters Issues**

```javascript
// Always use URLSearchParams or encodeURIComponent
const text = "Check this: https://example.com & more!";

// ✅ GOOD
const params = new URLSearchParams({ text });

// ❌ BAD
const url = `?text=${text}`; // Will break with special chars
```

---

## 📞 **Support**

For issues or questions:
- **GitHub Issues:** https://github.com/11bDev-FOB/fragout/issues
- **Documentation:** https://github.com/11bDev-FOB/fragout
- **Security:** See SECURITY_REVIEW.md

---

## 📄 **License**

This feature is part of FragOut, licensed under the MIT License.

---

**Built with 💣 by 11b.dev**  
*Forward Operating Base for Tactical Development*
