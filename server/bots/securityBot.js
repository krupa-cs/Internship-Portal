const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const handleCommand = async (command, args, user) => {
    if (!['Admin', 'Master Admin'].includes(user.role)) {
        return "You are not authorized to use the security bot.";
    }

    switch (command) {
        case 'view_logs':
            const limit = parseInt(args[0]) || 5;
            return viewLogs(limit);
        default:
            return `Unknown command: ${command}`;
    }
};

const viewLogs = async (limit) => {
    try {
        const logs = await prisma.auditLog.findMany({
            take: limit,
            orderBy: {
                created_at: 'desc',
            },
            include: {
                user: {
                    select: { name: true, email: true, role: true }
                }
            }
        });

        if (logs.length === 0) {
            return "No audit logs found.";
        }

        const logList = logs.map(log => 
            `[${log.created_at.toLocaleString()}] User: ${log.user ? log.user.email : 'N/A'} (${log.user ? log.user.role : 'N/A'}) Action: ${log.action} Target: ${log.target_type || 'N/A'}:${log.target_id || 'N/A'} Details: ${JSON.stringify(log.details || {})}`
        ).join('\n');

        return `Latest Audit Logs (${limit}):\n${logList}`;
    } catch (error) {
        console.error("Error fetching audit logs via bot:", error);
        return `Error fetching audit logs: ${error.message}`;
    }
};

module.exports = { handleCommand };
