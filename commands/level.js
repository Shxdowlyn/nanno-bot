const growth = Math.pow(Math.PI / Math.E, 1.618) * Math.E * 0.75

function xpRange(level, multiplier = 2) {
  if (level < 0) throw new TypeError('Level no puede ser negativo')

  level = Math.floor(level)

  const min = level === 0
    ? 0
    : Math.round(Math.pow(level, growth) * multiplier) + 1

  const max = Math.round(Math.pow(level + 1, growth) * multiplier)

  return {
    min,
    max,
    xp: max - min
  }
}

function findLevel(xp, multiplier = 2) {
  if (!Number.isFinite(xp)) return 0
  if (xp <= 0) return 0

  let level = 0
  while (xpRange(level + 1, multiplier).min <= xp) {
    level++
  }
  return level
}

function canLevelUp(level, xp, multiplier = 2) {
  if (level < 0) return false
  if (!Number.isFinite(xp)) return false
  if (xp <= 0) return false

  return level < findLevel(xp, multiplier)
}

export default async function levelSystem(m, global) {
  const user = global.db?.data?.users?.[m.sender]
  const chatUser = global.db?.data?.chats?.[m.chat]?.users?.[m.sender]

  if (!user || !chatUser) return

  const oldLevel = user.level || 0

  while (canLevelUp(user.level || 0, user.exp || 0, global.multiplier || 2)) {
    user.level = (user.level || 0) + 1
  }

  if (user.level !== oldLevel) {
    const coinBonus = Math.floor(Math.random() * 3000) + 1000
    const expBonus = Math.floor(Math.random() * 200) + 50

    if (user.level % 5 === 0) {
      chatUser.coins = (chatUser.coins || 0) + coinBonus
      user.exp = (user.exp || 0) + expBonus
    }

    const { min, max } = xpRange(user.level, global.multiplier || 2)

    user.minxp = min
    user.maxxp = max
  }
}