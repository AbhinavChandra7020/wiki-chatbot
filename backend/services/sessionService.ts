
export function generateSessionId(articleTitle: string): string {
  const now = new Date();
  
  // mm-dd-yy format
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  
  // hh-mm format
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  // random string for session id
  const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  return `${articleTitle}-${month}-${day}-${year}-${hours}:${minutes}-${randomString}`;
}