const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logEvent = async (userId, action, targetId = null, targetType = null, details = null) => {
    try {
        await prisma.auditLog.create({
            data: {
                user_id: userId,
                action,
                target_id: targetId,
                target_type: targetType,
                details,
            },
        });
    } catch (error) {
        console.error("Failed to write to audit log:", error);
        // Depending on the severity, you might want to add more robust error handling,
        // like sending an alert to an admin. For now, we'll just log it.
    }
};

module.exports = { logEvent };
