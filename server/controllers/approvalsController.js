const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logEvent } = require('../utils/auditLogger');

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

exports.facultyApproveOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const hasAccess = await checkFacultyAccess(req.user, id);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Forbidden: You can only approve offers for your department.' });
        }

        const offer = await prisma.internshipOffer.update({
            where: { id },
            data: {
                faculty_approval_status: 'approved',
                status: 'pending_admin',
                faculty_approved_at: new Date(),
            },
        });

        await logEvent(req.user.id, 'faculty_approve_offer', id, 'InternshipOffer');

        res.json(offer);
    } catch (error) {
        res.status(400).json({ error: 'Error approving offer' });
    }
};

exports.adminApproveOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await prisma.internshipOffer.findUnique({ where: { id } });
        
        if (offer.faculty_approval_status !== 'approved') {
            return res.status(400).json({ error: 'Faculty must approve before admin.' });
        }

        const updatedOffer = await prisma.internshipOffer.update({
            where: { id },
            data: {
                admin_approval_status: 'approved',
                status: 'approved',
                admin_approved_at: new Date(),
            },
        });

        await logEvent(req.user.id, 'admin_approve_offer', id, 'InternshipOffer');

        res.json(updatedOffer);
    } catch (error) {
        res.status(400).json({ error: 'Error approving offer' });
    }
};

exports.rejectOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const hasAccess = await checkFacultyAccess(req.user, id);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Forbidden: You can only reject offers for your department.' });
        }

        const offer = await prisma.internshipOffer.update({
            where: { id },
            data: {
                status: 'rejected',
                rejection_reason: reason,
                ...(req.user.role === 'Faculty' && { faculty_approval_status: 'rejected' }),
                ...(req.user.role === 'Admin' && { admin_approval_status: 'rejected' }),
            },
        });

        await logEvent(req.user.id, 'reject_offer', id, 'InternshipOffer', { reason });

        res.json(offer);
    } catch (error) {
        res.status(400).json({ error: 'Error rejecting offer' });
    }
};
