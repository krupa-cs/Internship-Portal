const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logEvent } = require('../utils/auditLogger');

// 1. Get Offers (Handles different roles)
exports.getMyOffers = async (req, res) => {
  try {
    let whereClause = {};

    // ROLE-BASED FILTERING
    if (req.user.role === 'Faculty') {
      // Faculty see all offers from their department
      whereClause = {
        recruiter: {
          department: req.user.department,
        },
      };
    } else if (req.user.role === 'Recruiter') {
      // Recruiters see their own offers
      whereClause = {
        recruiterId: req.user.id,
      };
    } // Admins/Masters can see everything (no filter)

    const offers = await prisma.internshipOffer.findMany({
      where: whereClause,
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(offers);
  } catch (error)
{
    console.error(error);
    res.status(500).json({ error: 'Error fetching offers' });
  }
};

// 2. Create Offer (With Data Cleaning)
exports.createOffer = async (req, res) => {
  try {
    // Destructure specifically so we can clean the data
    const {
      company_name, sector, address, contact_info, email, hr_contact,
      title, description, required_skills, duration, work_mode, location,
      stipend, remuneration, eligible_for_credits,
      application_date, joining_date, completion_date
    } = req.body;

    // Add the recruiterId from the token AND convert types
    const newOffer = await prisma.internshipOffer.create({
      data: {
        company_name, sector, address, contact_info, email, hr_contact,
        title, description, required_skills, duration, work_mode, location,
        stipend, remuneration,
        
        eligible_for_credits: eligible_for_credits === 'true' || eligible_for_credits === true,

        application_date: new Date(application_date),
        joining_date: new Date(joining_date),
        completion_date: new Date(completion_date),

        recruiterId: req.user.id,

        // Set initial status for the workflow
        status: 'pending_faculty',
      }
    });
    
    await logEvent(req.user.id, 'create_offer', newOffer.id, 'InternshipOffer', { title: newOffer.title, company_name: newOffer.company_name });

    res.json(newOffer);
  } catch (error) {
    console.error("Error creating offer:", error); // This prints the REAL error to the terminal
    res.status(500).json({ error: "Error creating offer. Check server terminal for details." });
  }
};

// 3. Get Single Offer
exports.getOfferById = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await prisma.internshipOffer.findUnique({
      where: { id },
      include: { recruiter: true } // Include recruiter to check department
    });
    
    if (!offer) return res.status(404).json({ error: "Not found" });
    
    // Authorization Check
    const isOwner = offer.recruiterId === req.user.id;
    const isFacultyInDepartment = req.user.role === 'Faculty' && offer.recruiter.department === req.user.department;
    const isAdmin = ['Admin', 'Master Admin'].includes(req.user.role);

    if (!isOwner && !isFacultyInDepartment && !isAdmin) {
       return res.status(403).json({ error: "Unauthorized access to this offer" });
    }

    res.json(offer);
  } catch (error) {
    res.status(500).json({ error: "Error fetching offer" });
  }
};