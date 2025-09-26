const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupGoogleId() {
  try {
    // Update all users with null googleId to have a unique placeholder
    const users = await prisma.user.findMany({
      where: { 
        OR: [
          { googleId: null },
          { googleId: undefined }
        ]
      }
    })

    console.log(`Found ${users.length} users with null googleId`)

    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const placeholderId = `placeholder_${user.id}_${Date.now()}`
      
      await prisma.user.update({
        where: { id: user.id },
        data: { googleId: placeholderId }
      })
      
      console.log(`Updated user ${user.email} with placeholder googleId`)
    }

    console.log('Cleanup completed successfully')
  } catch (error) {
    console.error('Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupGoogleId()
