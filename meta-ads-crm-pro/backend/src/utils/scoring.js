function calculateLeadScore(lead) {
  let score = 40;

  if (lead.email) score += 20;
  if (lead.phone) score += 15;
  if (lead.campaign_name) score += 5;
  if (lead.utm_campaign) score += 5;
  if (lead.utm_source) score += 3;

  const source = String(lead.source || '').toLowerCase();
  if (source.includes('instagram')) score += 6;
  if (source.includes('facebook')) score += 4;
  if (source.includes('whatsapp')) score += 8;

  const campaignName = String(lead.campaign_name || '').toLowerCase();
  if (campaignName.includes('lançamento') || campaignName.includes('launch')) score += 10;
  if (campaignName.includes('remarketing')) score += 8;
  if (campaignName.includes('lead')) score += 4;

  return Math.max(0, Math.min(100, score));
}

module.exports = { calculateLeadScore };
