/**
 * Simple toast notification composable
 * Provides methods for showing success and error notifications
 */
export function useToast() {
  /**
   * Show a success toast notification
   * @param {string} message - The message to display
   */
  const success = (message) => {
    console.log('✅ ' + message)
    alert(message)
  }

  /**
   * Show an error toast notification
   * @param {string} message - The error message to display
   */
  const error = (message) => {
    console.error('❌ ' + message)
    alert(message)
  }

  return {
    success,
    error
  }
} 