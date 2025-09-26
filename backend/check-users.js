const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        googleId: true,
        name: true
      }
    })

    console.log(`Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`- ${user.email}: googleId = ${user.googleId}`)
    })
  } catch (error) {
    console.error('Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
