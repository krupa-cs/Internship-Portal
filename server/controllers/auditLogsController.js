const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getLogs = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query; // Pagination
        const logs = await prisma.auditLog.findMany({
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: {
                created_at: 'desc',
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true }
                }
            }
        });
        const total = await prisma.auditLog.count();
        res.json({ logs, total });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ error: "Failed to fetch audit logs" });
    }
};