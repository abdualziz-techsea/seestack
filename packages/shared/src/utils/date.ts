import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/ar'

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)

export const timeAgo = (date: string, lang: 'en' | 'ar' = 'en') => {
  dayjs.locale(lang)
  return dayjs(date).fromNow()
}

export const formatTimestamp = (date: string, tz = 'Asia/Riyadh') =>
  dayjs(date).tz(tz).format('MMM D, YYYY HH:mm:ss')

export const formatDate = (date: string) =>
  dayjs(date).format('MMM D, YYYY')
