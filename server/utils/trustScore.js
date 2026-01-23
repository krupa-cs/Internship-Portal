const axios = require('axios');

const checkSsl = async (domain) => {
    try {
        await axios.get(`https://${domain}`);
        return true;
    } catch (error) {
        return false;
    }
};

const getDomainAgeInDays = async (domain) => {
    try {
        const response = await axios.get(`https://ipwhois.app/json/${domain}`);
        const whoisDate = new Date(response.data.whois_date);
        const today = new Date();
        const ageInMs = today - whoisDate;
        return Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    } catch (error) {
        console.error("Error fetching domain age:", error.message);
        return 0;
    }
};

const checkLinkedInPresence = async (companyName) => {
    try {
        const searchQuery = `"${companyName}" site:linkedin.com/company`;
        const response = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
        // A simple check to see if any results were returned.
        // A more sophisticated check might look for a specific pattern in the search results.
        return response.data.includes('linkedin.com/company');
    } catch (error) {
        console.error("Error checking LinkedIn presence:", error.message);
        return false;
    }
};

const calculateTrustScore = async (company) => {
    let score = 0;
    const { company_website, company_name } = company;

    if (!company_website) return 0;

    const domain = company_website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    const hasSsl = await checkSsl(domain);
    if (hasSsl) score += 20;

    const domainAge = await getDomainAgeInDays(domain);
    if (domainAge > 365) score += 20;
    else if (domainAge > 180) score += 10;

    const hasLinkedIn = await checkLinkedInPresence(company_name);
    if (hasLinkedIn) score += 10;
    
    // Other checks can be added here, e.g., email verification services, etc.

    return Math.min(score, 100); // Cap the score at 100
};

module.exports = { calculateTrustScore };
