// Helper function to parse social links and handle full URLs or usernames
export function parseSocialLink(input: string, platform: 'github' | 'linkedin' | 'instagram' | 'twitter' | 'portfolio'): string {
  if (!input) return '';
  
  const trimmed = input.trim();
  
  // If it's already a full URL, return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Remove @ prefix if present
  const cleaned = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  
  // Build the full URL based on platform
  switch (platform) {
    case 'github':
      return `https://github.com/${cleaned}`;
    case 'linkedin':
      return `https://linkedin.com/in/${cleaned}`;
    case 'instagram':
      return `https://instagram.com/${cleaned}`;
    case 'twitter':
      return `https://x.com/${cleaned}`;
    case 'portfolio':
      // For portfolio, add https if not a full URL
      return trimmed.startsWith('http') ? trimmed : `https://${cleaned}`;
    default:
      return trimmed;
  }
}

// Extract username from a social link URL
export function extractUsername(url: string): string {
  if (!url) return '';
  
  try {
    // If it's just a username, return it
    if (!url.includes('/') && !url.includes('.')) {
      return url.startsWith('@') ? url.slice(1) : url;
    }
    
    // Try to parse as URL
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    
    // Return the last meaningful path segment
    return pathParts[pathParts.length - 1] || url;
  } catch {
    return url;
  }
}
