import { PrismaClient, NotificationType } from '@prisma/client'
import logger from '../utils/logger'

const prisma = new PrismaClient()

export class NotificationService {
  async createNotification(userId: string, type: NotificationType, payload: any) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        payload,
      },
    })

    logger.info('Notification created', { notificationId: notification.id, userId, type })

    return notification
  }

  async getUserNotifications(userId: string, limit = 50, offset = 0) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.notification.count({
      where: { userId },
    })

    return { notifications, total, limit, offset }
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      throw new Error('Notification not found')
    }

    if (notification.userId !== userId) {
      throw new Error('Access denied')
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })
  }

  async notifyBoardMembers(boardId: string, excludeUserId: string, type: NotificationType, payload: any) {
    const members = await prisma.boardMember.findMany({
      where: {
        boardId,
        userId: { not: excludeUserId },
      },
      select: { userId: true },
    })

    const notifications = await Promise.all(
      members.map(member =>
        this.createNotification(member.userId, type, payload)
      )
    )

    return notifications
  }

  async notifyMentionedUsers(content: string, boardId: string, excludeUserId: string, cardId: string) {
    const mentionRegex = /@(\w+)/g
    const mentions = content.match(mentionRegex)

    if (!mentions) return []

    const usernames = mentions.map(mention => mention.substring(1))

    const users = await prisma.user.findMany({
      where: {
        OR: usernames.map(name => ({ name })),
        boardMembers: {
          some: { boardId },
        },
      },
      select: { id: true, name: true },
    })

    const notifications = await Promise.all(
      users
        .filter(user => user.id !== excludeUserId)
        .map(user =>
          this.createNotification(user.id, NotificationType.MENTION, {
            cardId,
            boardId,
            mentionedBy: excludeUserId,
            content: content.substring(0, 100),
          })
        )
    )

    return notifications
  }

  async notifyAssignment(cardId: string, assigneeId: string, assignedBy: string) {
    if (assigneeId === assignedBy) return null

    return this.createNotification(assigneeId, NotificationType.ASSIGNMENT, {
      cardId,
      assignedBy,
    })
  }
}

export const notificationService = new NotificationService()
