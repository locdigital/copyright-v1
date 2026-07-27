import { prisma } from '../prisma.js'

export async function writeAuditLog({ adminId, action, entityType, entityId, previousData, newData, ipAddress }) {
  return prisma.auditLog.create({
    data: {
      adminId,
      action,
      entityType,
      entityId,
      previousData,
      newData,
      ipAddress,
    },
  })
}
