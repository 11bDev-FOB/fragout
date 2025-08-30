// Error logging utility
const errorLogs: Array<{timestamp: string, error: string, platform?: string}> = [];

// Function to add error log (call this from other parts of your app)
export function logError(error: string, platform?: string) {
  errorLogs.unshift({
    timestamp: new Date().toISOString(),
    error,
    platform
  });
  
  // Keep only last 50 errors
  if (errorLogs.length > 50) {
    errorLogs.splice(50);
  }
}

// Function to get error logs
export function getErrorLogs() {
  return [...errorLogs];
}
