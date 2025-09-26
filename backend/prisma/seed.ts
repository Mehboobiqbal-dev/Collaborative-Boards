import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const hashedPassword = await hashPassword('AdminPass123!')

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: hashedPassword,
      verified: true,
    },
  })

  console.log('Created admin user:', admin.email)

  const board = await prisma.board.upsert({
    where: { id: 'demo-board-1' },
    update: {},
    create: {
      id: 'demo-board-1',
      title: 'Demo Project Board',
      ownerId: admin.id,
      members: {
        create: {
          userId: admin.id,
          role: 'ADMIN',
        },
      },
    },
  })

  console.log('Created demo board:', board.title)

  const todoList = await prisma.list.upsert({
    where: { id: 'demo-list-todo' },
    update: {},
    create: {
      id: 'demo-list-todo',
      boardId: board.id,
      title: 'To Do',
      position: 0,
    },
  })

  const inProgressList = await prisma.list.upsert({
    where: { id: 'demo-list-inprogress' },
    update: {},
    create: {
      id: 'demo-list-inprogress',
      boardId: board.id,
      title: 'In Progress',
      position: 1,
    },
  })

  const doneList = await prisma.list.upsert({
    where: { id: 'demo-list-done' },
    update: {},
    create: {
      id: 'demo-list-done',
      boardId: board.id,
      title: 'Done',
      position: 2,
    },
  })

  console.log('Created demo lists')

  const card1 = await prisma.card.upsert({
    where: { id: 'demo-card-1' },
    update: {},
    create: {
      id: 'demo-card-1',
      listId: todoList.id,
      title: 'Set up project structure',
      description: 'Create the basic folder structure and configuration files for the collaborative boards app.',
      labels: JSON.stringify(['setup', 'backend']),
      position: 0,
    },
  })

  const card2 = await prisma.card.upsert({
    where: { id: 'demo-card-2' },
    update: {},
    create: {
      id: 'demo-card-2',
      listId: todoList.id,
      title: 'Implement user authentication',
      description: 'Add signup, login, and JWT token management with email verification.',
      labels: JSON.stringify(['auth', 'backend']),
      position: 1,
    },
  })

  const card3 = await prisma.card.upsert({
    where: { id: 'demo-card-3' },
    update: {},
    create: {
      id: 'demo-card-3',
      listId: inProgressList.id,
      title: 'Create board CRUD operations',
      description: 'Implement create, read, update, delete operations for boards with proper authorization.',
      labels: JSON.stringify(['boards', 'backend']),
      position: 0,
    },
  })

  const card4 = await prisma.card.upsert({
    where: { id: 'demo-card-4' },
    update: {},
    create: {
      id: 'demo-card-4',
      listId: doneList.id,
      title: 'Design database schema',
      description: 'Create Prisma schema with all necessary models and relationships.',
      labels: JSON.stringify(['database', 'design']),
      position: 0,
    },
  })

  console.log('Created demo cards')

  await prisma.comment.createMany({
    data: [
      {
        id: 'demo-comment-1',
        cardId: card1.id,
        authorId: admin.id,
        content: 'This is a sample comment on the first card.',
      },
      {
        id: 'demo-comment-2',
        cardId: card3.id,
        authorId: admin.id,
        content: 'Working on implementing the board functionality. @admin please review when done.',
      },
    ],
  })

  console.log('Created demo comments')

  console.log('Seeding completed!')
  console.log('Admin user: admin@example.com')
  console.log('Password: AdminPass123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })