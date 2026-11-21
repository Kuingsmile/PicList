import { clipboard, Notification } from 'electron'

/**
 * show notification
 * @param options
 */
export const showNotification = (
  options: IPrivateShowNotificationOption = {
    title: '',
    body: '',
    clickToCopy: false,
    copyContent: '',
    clickFn: () => {},
  },
) => {
  const notification = new Notification({
    title: options.title,
    body: options.body,
  })
  const handleClick = async () => {
    if (options.clickToCopy) {
      await clipboard
        .writeText(options.copyContent || options.body)
        .catch(error => console.warn('Failed to copy notification', error))
    }
    if (options.clickFn) {
      options.clickFn()
    }
  }
  notification.once('click', handleClick)
  notification.once('close', () => {
    notification.removeListener('click', handleClick)
  })
  notification.show()
}

export const notificationList: IAppNotification[] = []
