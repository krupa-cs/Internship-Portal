const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logEvent } = require('../utils/auditLogger');

const handleCommand = async (command, args, user) => {
    switch (command) {
        case 'list_pending_users':
            return listPendingUsers(user);
        case 'approve_user':
            return approveUser(args[0], user);
        case 'approve_offer':
            return approveOffer(args[0], user);
        case 'reject_offer':
            const offerId = args[0];
            const reason = args.slice(1).join(' ');
            return rejectOffer(offerId, reason, user);
        default:
            return `Unknown command: ${command}`;
    }
};

const listPendingUsers = async (adminUser) => {
    if (!['Admin', 'Master Admin'].includes(adminUser.role)) {
        return "You are not authorized to view pending users.";
    }

    const pendingUsers = await prisma.user.findMany({
        where: { accountStatus: 'pending_approval' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            company_name: true,
            trustScore: true,
            created_at: true,
        },
    });

    if (pendingUsers.length === 0) {
        return "No users are pending approval.";
    }

    const userList = pendingUsers.map(u => 
        `ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Company: ${u.company_name || 'N/A'}, Trust Score: ${u.trustScore}, Created: ${u.created_at.toDateString()}`
    ).join('\n');

    return `Pending Users:\n${userList}`;
};

const approveUser = async (userId, adminUser) => {
    if (!['Admin', 'Master Admin'].includes(adminUser.role)) {
        return "You are not authorized to approve users.";
    }
    if (!userId) return "Please provide a user ID.";

    try {
        const user = await prisma.user.update({
            where: { id: userId, accountStatus: 'pending_approval' },
            data: { accountStatus: 'active' },
        });
        await logEvent(adminUser.id, 'admin_approve_user_bot', userId, 'User');
        return `User "${user.name}" (ID: ${user.id}) has been approved.`;
    } catch (error) {
        console.error("Error approving user via bot:", error);
        return `Error approving user: ${error.message}`;
    }
};

const approveOffer = async (offerId, adminUser) => {
    if (!['Admin', 'Master Admin'].includes(adminUser.role)) {
        return "You are not authorized to approve offers.";
    }
    if (!offerId) return "Please provide an offer ID.";

    try {
        const offer = await prisma.internshipOffer.update({
            where: { id: offerId },
            data: {
                admin_approval_status: 'approved',
                status: 'approved',
                admin_approved_at: new Date(),
            },
        });
        await logEvent(adminUser.id, 'admin_approve_offer_bot', offerId, 'InternshipOffer');
        return `Offer "${offer.title}" (ID: ${offer.id}) has been fully approved.`;
    } catch (error) {
        console.error("Error approving offer via bot:", error);
        return `Error approving offer: ${error.message}`;
    }
};

const rejectOffer = async (offerId, reason, adminUser) => {
    if (!['Admin', 'Master Admin'].includes(adminUser.role)) {
        return "You are not authorized to reject offers.";
    }
    if (!offerId) return "Please provide an offer ID.";
    if (!reason) return "Please provide a reason for rejection.";

    try {
        const offer = await prisma.internshipOffer.update({
            where: { id: offerId },
            data: {
                status: 'rejected',
                rejection_reason: reason,
                admin_approval_status: 'rejected',
            },
        });
        await logEvent(adminUser.id, 'admin_reject_offer_bot', offerId, 'InternshipOffer', { reason });
        return `Offer "${offer.title}" (ID: ${offer.id}) has been rejected by Admin. Reason: ${reason}`;
    } catch (error) {
        console.error("Error rejecting offer via bot:", error);
        return `Error rejecting offer: ${error.message}`;
    }
};

module.exports = { handleCommand };
