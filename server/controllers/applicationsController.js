const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to check faculty access
const checkFacultyAccess = async (user, offerId) => {
    if (user.role !== 'Faculty') return true; // Not a faculty, so skip check

    const offer = await prisma.internshipOffer.findUnique({
        where: { id: offerId },
        include: { recruiter: true },
    });

    if (!offer || offer.recruiter.department !== user.department) {
        return false;
    }
    return true;
};

exports.createApplication = async (req, res) => {
    try {
        const { offer_id, student_id } = req.body;
        const application = await prisma.application.create({
            data: { offer_id, student_id },
        });
        res.status(201).json(application);
    } catch (error) {
        res.status(400).json({ error: 'Error submitting application' });
    }
};

exports.getApplicationsByOffer = async (req, res) => {
    try {
        const offerId = req.params.offerId;
        if (req.user.role === 'Faculty') {
            const hasAccess = await checkFacultyAccess(req.user, offerId);
            if (!hasAccess) {
                return res.status(403).json({ error: 'Forbidden: You can only view applications for your department.' });
            }
        }

        const applications = await prisma.application.findMany({
            where: { offer_id: offerId },
            include: { student: true }, // Include student details
        });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Approval Workflow Controllers ---

exports.facultyApprove = async (req, res) => {
    try {
        const application = await prisma.application.findUnique({
            where: { id: req.params.id },
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found.' });
        }

        const hasAccess = await checkFacultyAccess(req.user, application.offer_id);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Forbidden: You can only approve applications for your department.' });
        }

        const updatedApplication = await prisma.application.update({
            where: { id: req.params.id },
            data: { status_faculty: 'Approved' },
        });
        res.json(updatedApplication);
    } catch (error) {
        res.status(400).json({ error: 'Error updating application status' });
    }
};

exports.adminApprove = async (req, res) => {
    try {
        // You might want to add a check here to ensure faculty has approved first
        const application = await prisma.application.update({
            where: { id: req.params.id },
            data: { status_admin: 'Approved' },
        });
        res.json(application);
    } catch (error) {
        res.status(400).json({ error: 'Error updating application status' });
    }
};

exports.rejectApplication = async (req, res) => {
    try {
        const application = await prisma.application.findUnique({
            where: { id: req.params.id },
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found.' });
        }
        
        if (req.user.role === 'Faculty') {
            const hasAccess = await checkFacultyAccess(req.user, application.offer_id);
            if (!hasAccess) {
                return res.status(403).json({ error: 'Forbidden: You can only reject applications for your department.' });
            }
        }

        const updatedApplication = await prisma.application.update({
            where: { id: req.params.id },
            data: { is_rejected: true },
        });
        res.json(updatedApplication);
    } catch (error) {
        res.status(400).json({ error: 'Error updating application status' });
    }
};