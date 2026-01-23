const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logEvent } = require('../utils/auditLogger');

// Reusing checkFacultyAccess logic
const checkFacultyAccess = async (user, offerId) => {
    if (!['Faculty', 'Admin', 'Master Admin'].includes(user.role)) return true;

    const offer = await prisma.internshipOffer.findUnique({
        where: { id: offerId },
        include: { recruiter: true },
    });

    if (!offer || (user.role === 'Faculty' && offer.recruiter.department !== user.department)) {
        return false;
    }
    return true;
};

const handleCommand = async (command, args, user) => {
    switch (command) {
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

const approveOffer = async (offerId, user) => {
    if (!offerId) return "Please provide an offer ID.";

    const hasAccess = await checkFacultyAccess(user, offerId);
    if (!hasAccess) {
        return 'Forbidden: You can only approve offers for your department.';
    }

    try {
        const offer = await prisma.internshipOffer.update({
            where: { id: offerId },
            data: {
                faculty_approval_status: 'approved',
                status: 'pending_admin',
                faculty_approved_at: new Date(),
            },
        });
        await logEvent(user.id, 'faculty_approve_offer_bot', offerId, 'InternshipOffer');
        return `Offer "${offer.title}" (ID: ${offer.id}) has been approved by Faculty and is now pending Admin approval.`;
    } catch (error) {
        console.error("Error approving offer via bot:", error);
        return `Error approving offer: ${error.message}`;
    }
};

const rejectOffer = async (offerId, reason, user) => {
    if (!offerId) return "Please provide an offer ID.";
    if (!reason) return "Please provide a reason for rejection.";

    const hasAccess = await checkFacultyAccess(user, offerId);
    if (!hasAccess) {
        return 'Forbidden: You can only reject offers for your department.';
    }

    try {
        const offer = await prisma.internshipOffer.update({
            where: { id: offerId },
            data: {
                status: 'rejected',
                rejection_reason: reason,
                faculty_approval_status: 'rejected',
            },
        });
        await logEvent(user.id, 'faculty_reject_offer_bot', offerId, 'InternshipOffer', { reason });
        return `Offer "${offer.title}" (ID: ${offer.id}) has been rejected by Faculty. Reason: ${reason}`;
    } catch (error) {
        console.error("Error rejecting offer via bot:", error);
        return `Error rejecting offer: ${error.message}`;
    }
};

module.exports = { handleCommand };
