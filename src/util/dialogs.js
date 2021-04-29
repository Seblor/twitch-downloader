import { remote } from 'electron'

/**
 *
 * @param {string} message
 * @param {import('electron').Dialog} dialog
 * @returns {Promise<Boolean>}
 */
export function confirmAction (message, dialog = remote.dialog) {
  return new Promise(resolve => {
    dialog.showMessageBox(
      {
        message,
        buttons: ['Confirm', 'Cancel'],
        defaultId: 0,
        cancelId: 1
      })
      .then(result => {
        resolve(result.response === 0)
      })
  })
}
