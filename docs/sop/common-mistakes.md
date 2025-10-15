# Common Mistakes
-e 
### Next.js: Don't import database client in client components (Added: 2025-10-09)

**Problem:** Importing database client in client components ('use client')

**Solution:** Always pass data as props from server components.

**Example:**
```javascript
// ❌ Wrong
import { db } from './db'; // in client component

// ✓ Correct
// Pass data from server component as props
```

**Prevention:** Always check if the component truly needs client-side interactivity before adding 'use client'.

